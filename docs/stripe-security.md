# Seguridad en Integración con Stripe

Esta guía documenta las mejores prácticas de seguridad implementadas en la integración con Stripe.

## Índice

1. [Verificación de Firma de Webhooks](#verificación-de-firma-de-webhooks)
2. [API Keys y Secrets](#api-keys-y-secrets)
3. [Idempotencia](#idempotencia)
4. [Validaciones de Negocio](#validaciones-de-negocio)
5. [Manejo de Errores](#manejo-de-errores)
6. [Mejores Prácticas Adicionales](#mejores-prácticas-adicionales)

---

## Verificación de Firma de Webhooks

### ¿Por qué es Crítico?

Los webhooks de Stripe son endpoints públicos que cualquiera puede intentar llamar. Sin verificación de firma, un atacante podría:

- Crear tickets falsos sin pagar
- Marcar sesiones como pagadas fraudulentamente
- Saturar tu base de datos con eventos falsos

### Implementación

**NUNCA** aceptes un webhook sin verificar su firma:

```typescript
// ❌ INCORRECTO - Nunca hagas esto
export async function handleStripeWebhookHandler(context: any) {
  const event = context.body; // Confiamos ciegamente en el body
  // Procesar evento... PELIGROSO!
}

// ✅ CORRECTO - Siempre verifica la firma
export async function handleStripeWebhookHandler(context: any) {
  const signature = context.headers["stripe-signature"];
  const rawBody = context.body;
  
  try {
    // stripe.webhooks.constructEvent() verifica la firma
    const event = stripe.webhooks.constructEvent(
      rawBody, 
      signature, 
      STRIPE_WEBHOOK_SECRET
    );
    
    // Ahora es seguro procesar el evento
  } catch (error) {
    // Firma inválida - rechazar inmediatamente
    return { received: false, error: "Invalid signature" };
  }
}
```

### Raw Body Requerido

Stripe requiere el **raw body** (no JSON parseado) para verificar la firma:

```typescript
// El middleware preserva el raw body
export const stripeWebhookMiddleware = new Elysia({ name: "stripe-webhook" })
  .derive({ as: "scoped" }, async (context) => {
    return {
      rawBody: context.body, // Necesario para stripe.webhooks.constructEvent()
    };
  });
```

### Configurar Webhook Secret

**Desarrollo:**

```bash
# Iniciar Stripe CLI
stripe listen --forward-to localhost:3000/webhooks/stripe

# Copiar el whsec_... mostrado y agregarlo a .env
STRIPE_WEBHOOK_SECRET=whsec_tu_secret_aqui
```

**Producción:**

1. Ir a [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/webhooks)
2. Agregar endpoint: `https://tu-dominio.com/webhooks/stripe`
3. Copiar el **Signing secret** (whsec_...)
4. Agregarlo a las variables de entorno de producción

---

## API Keys y Secrets

### Tipos de Keys

| Key Type | Formato | Uso | Peligro si se expone |
|----------|---------|-----|---------------------|
| **Secret Key** | `sk_test_...` / `sk_live_...` | Backend only | ⚠️ **CRÍTICO** - Control total sobre cuenta |
| **Publishable Key** | `pk_test_...` / `pk_live_...` | Frontend | ⚠️ Bajo - Solo crea sesiones |
| **Webhook Secret** | `whsec_...` | Backend only | ⚠️ **ALTO** - Permite falsificar webhooks |

### Protección de Secrets

#### ❌ NUNCA Hagas Esto

```typescript
// Hardcoded secrets
const stripe = new Stripe("sk_test_123456789", { apiVersion: "2023-10-16" });

// Commiteado al repo
STRIPE_SECRET_KEY=sk_test_123456789  # En .env commiteado

// Expuesto en frontend
const secret = "sk_test_123456789"; // ¡NUNCA!
```

#### ✅ Implementación Correcta

```typescript
// Usar variables de entorno
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY no configurada");
}

const stripe = new Stripe(STRIPE_SECRET_KEY, { 
  apiVersion: "2023-10-16" 
});
```

**.env (nunca commitear)**

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**.gitignore**

```
.env
.env.local
.env.production
```

### Restricted API Keys (RAK) para Producción

En producción, usa **Restricted API Keys** con permisos mínimos:

1. Ir a [Dashboard > API Keys](https://dashboard.stripe.com/apikeys)
2. Click en **Create restricted key**
3. Configurar permisos:
   ```
   Write permissions:
   - Checkout Sessions (write)
   
   Read permissions:
   - Checkout Sessions (read)
   - Customers (read)
   ```
4. Guardar y usar este key en producción

Esto limita el daño si la key se expone.

---

## Idempotencia

### Problema

Los webhooks de Stripe pueden **ejecutarse múltiples veces** para el mismo evento:

- Reintentos automáticos si falla el endpoint
- Problemas de red causan duplicados
- Stripe puede enviar el mismo evento varias veces

Sin idempotencia, esto causaría:

- **Múltiples tickets** para el mismo pago
- **Cargos duplicados** al usuario
- **Inconsistencias** en la base de datos

### Solución: Verificación por paymentId

```typescript
// src/services/ticket.service.ts
export async function createTicketFromPayment(
  eventId: number,
  userId: number,
  paymentId: string
): Promise<Ticket> {
  
  // 1. Verificar si ya existe un ticket con este paymentId
  const existingTicket = await db
    .select()
    .from(tickets)
    .where(eq(tickets.paymentId, paymentId))
    .limit(1);

  if (existingTicket.length > 0) {
    logger.info(`Ticket ya existe para paymentId: ${paymentId}`);
    return existingTicket[0]; // Retornar ticket existente
  }

  // 2. Si no existe, crear el ticket
  const [ticket] = await db
    .insert(tickets)
    .values({
      eventId,
      userId,
      paymentId,
      paymentStatus: "completed",
      // ...
    })
    .returning();

  return ticket;
}
```

### Clave de Idempotencia

El `paymentId` (Stripe session ID) es único por sesión:

- **Único**: Cada sesión de Stripe tiene un ID único (`cs_test_...`)
- **Inmutable**: No cambia durante reintentos
- **Verificable**: Está en el evento de webhook

**NUNCA** uses:
- Timestamps (no son idempotentes)
- Request IDs (cambian en cada reintento)
- IDs auto-incrementales (causarían duplicados)

---

## Validaciones de Negocio

### Validación de Capacidad

**Antes** de crear la sesión de Stripe, verifica que haya capacidad:

```typescript
// src/services/payment.service.ts
export async function createCheckoutSession(eventId: number, userId: number) {
  // 1. Obtener evento
  const event = await db.select().from(events).where(eq(events.id, eventId));
  
  if (!event) {
    throw new Error("Evento no encontrado");
  }

  // 2. Verificar capacidad disponible
  if (event.availableCapacity <= 0) {
    throw new Error("No hay capacidad disponible");
  }

  // 3. Verificar que el usuario no tenga ya un ticket
  const existingTicket = await db
    .select()
    .from(tickets)
    .where(and(
      eq(tickets.eventId, eventId),
      eq(tickets.userId, userId)
    ));

  if (existingTicket.length > 0) {
    throw new Error("Ya tienes un ticket para este evento");
  }

  // 4. Ahora es seguro crear la sesión
  const session = await stripe.checkout.sessions.create({
    // ...
  });

  return session;
}
```

### Soft Reservation vs Hard Reservation

**Implementación actual: Soft Reservation**

- No reservamos capacidad al crear la sesión
- Solo creamos el ticket después del pago
- **Riesgo**: Posible overbooking en eventos muy populares

**Alternativa: Hard Reservation (más complejo)**

```typescript
// Al crear sesión
await decrementCapacity(eventId);

// En webhook
if (event.type === "checkout.session.completed") {
  await createTicket(eventId, userId);
} else if (event.type === "checkout.session.expired") {
  await incrementCapacity(eventId); // Liberar reserva
}
```

Nuestra implementación usa Soft Reservation por simplicidad.

---

## Manejo de Errores

### En Webhooks: Siempre Retornar 200

Stripe reintenta webhooks que fallan (non-200 responses):

```typescript
// ❌ INCORRECTO - Causa reintentos infinitos
export async function handleStripeWebhookHandler(context: any) {
  try {
    // ... procesar webhook
  } catch (error) {
    context.set.status = 500; // Stripe reintentará
    throw error;
  }
}

// ✅ CORRECTO - Retornar 200 incluso con errores internos
export async function handleStripeWebhookHandler(context: any) {
  try {
    // ... procesar webhook
    return { received: true };
  } catch (error) {
    logger.error("Error procesando webhook", error);
    
    // Retornar 200 para que Stripe no reintente
    // (solo reintentar si es error de Stripe, no de lógica)
    return { received: true, error: error.message };
  }
}
```

### Logging Detallado

Siempre loggea eventos de pago para debugging:

```typescript
logger.info("Webhook recibido", {
  type: event.type,
  sessionId: session.id,
  eventId: metadata.eventId,
  userId: metadata.userId,
  amount: session.amount_total,
  currency: session.currency,
});
```

Esto permite:
- Auditar pagos
- Debuggear problemas
- Detectar fraude
- Análisis de métricas

---

## Mejores Prácticas Adicionales

### 1. HTTPS Obligatorio en Producción

Stripe **requiere HTTPS** para webhooks en producción:

```nginx
# Nginx config
server {
    listen 443 ssl;
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location /webhooks/stripe {
        proxy_pass http://localhost:3000;
    }
}
```

### 2. Rate Limiting

Protege el endpoint de webhooks contra abuso:

```typescript
// Ejemplo con Elysia
import rateLimit from 'elysia-rate-limit';

export const webhookRoutes = new Elysia()
  .use(rateLimit({
    max: 100,        // Max 100 requests
    window: 60000,   // Por minuto
  }))
  .post("/webhooks/stripe", handleStripeWebhookHandler);
```

### 3. Monitoreo de Webhooks

En producción, monitorea webhooks en [Dashboard > Webhooks](https://dashboard.stripe.com/webhooks):

- ✅ **Deliveries exitosos**: Deben ser >99%
- ⚠️ **Failures**: Investigar inmediatamente
- ⏱️ **Response time**: Debe ser <5 segundos

### 4. Testing de Seguridad

Prueba estos escenarios:

```bash
# 1. Webhook sin firma (debe fallar)
curl -X POST http://localhost:3000/webhooks/stripe \
  -H "Content-Type: application/json" \
  -d '{"type":"checkout.session.completed"}'

# 2. Webhook con firma inválida (debe fallar)
curl -X POST http://localhost:3000/webhooks/stripe \
  -H "stripe-signature: invalid" \
  -d '{"type":"checkout.session.completed"}'

# 3. Doble webhook (debe crear solo 1 ticket)
stripe trigger checkout.session.completed
stripe trigger checkout.session.completed  # Mismo sessionId
```

### 5. API Keys en CI/CD

Para CI/CD, usa secrets management:

```yaml
# GitHub Actions
- name: Deploy
  env:
    STRIPE_SECRET_KEY: ${{ secrets.STRIPE_SECRET_KEY }}
    STRIPE_WEBHOOK_SECRET: ${{ secrets.STRIPE_WEBHOOK_SECRET }}
```

**NUNCA** pongas secrets en:
- Código fuente
- Commits de Git
- Logs
- Mensajes de error expuestos al usuario

---

## Checklist de Seguridad

Antes de ir a producción:

- [ ] Verificación de firma implementada en webhooks
- [ ] API keys en variables de entorno (no hardcoded)
- [ ] `.env` en `.gitignore`
- [ ] Restricted API Keys (RAKs) configuradas
- [ ] Idempotencia implementada (por `paymentId`)
- [ ] HTTPS configurado
- [ ] Webhook secret de producción configurado
- [ ] Logging de eventos de pago
- [ ] Rate limiting en webhooks
- [ ] Monitoreo de webhooks configurado
- [ ] Tests de seguridad ejecutados

---

## Recursos Adicionales

- [Stripe Security Best Practices](https://stripe.com/docs/security)
- [Webhook Signature Verification](https://stripe.com/docs/webhooks/signatures)
- [API Keys Best Practices](https://stripe.com/docs/keys)
- [Testing Webhooks](https://stripe.com/docs/webhooks/test)

---

**Última actualización**: Abril 2026
