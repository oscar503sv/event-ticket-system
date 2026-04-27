# Guía de Testing con Stripe

Esta guía cubre todas las estrategias de testing para la integración con Stripe, desde desarrollo local hasta testing en producción.

## Índice

1. [Setup Inicial](#setup-inicial)
2. [Testing Local con Stripe CLI](#testing-local-con-stripe-cli)
3. [Testing Manual con cURL](#testing-manual-con-curl)
4. [Testing Automatizado con Scripts](#testing-automatizado-con-scripts)
5. [Tarjetas de Prueba](#tarjetas-de-prueba)
6. [Testing de Webhooks](#testing-de-webhooks)
7. [Testing de Escenarios de Error](#testing-de-escenarios-de-error)
8. [Testing en Staging](#testing-en-staging)

---

## Setup Inicial

### 1. Instalar Stripe CLI

**macOS:**
```bash
brew install stripe/stripe-cli/stripe
```

**Linux:**
```bash
wget https://github.com/stripe/stripe-cli/releases/download/v1.19.0/stripe_1.19.0_linux_x86_64.tar.gz
tar -xvf stripe_1.19.0_linux_x86_64.tar.gz
sudo mv stripe /usr/local/bin/
```

**Windows:**
```powershell
scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
scoop install stripe
```

### 2. Autenticar Stripe CLI

```bash
stripe login
```

Esto abrirá tu navegador para autorizar el CLI.

### 3. Verificar Instalación

```bash
stripe --version
# Debe mostrar: stripe version x.x.x
```

---

## Testing Local con Stripe CLI

### 1. Iniciar el Servidor

En una terminal:

```bash
bun dev
```

El servidor debe estar corriendo en `http://localhost:3000`

### 2. Iniciar Webhook Forwarding

En **otra terminal**:

```bash
stripe listen --forward-to localhost:3000/webhooks/stripe
```

Output esperado:
```
> Ready! Your webhook signing secret is whsec_1234567890abcdef
> Listening for events...
```

### 3. Configurar Webhook Secret

Copiar el `whsec_...` y agregarlo a `.env`:

```env
STRIPE_WEBHOOK_SECRET=whsec_1234567890abcdef
```

**Reiniciar** el servidor para que cargue el nuevo secret.

### 4. Probar Flujo Completo

#### a) Registrar Usuario

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123456",
    "firstName": "Test",
    "lastName": "User"
  }'
```

#### b) Iniciar Sesión

```bash
TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123456"
  }' | jq -r '.data.token')

echo "Token: $TOKEN"
```

#### c) Crear Sesión de Checkout

```bash
SESSION=$(curl -s -X POST http://localhost:3000/payments/create-checkout-session \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": 1,
    "quantity": 1
  }' | jq -r '.data.sessionId')

echo "Session ID: $SESSION"
```

#### d) Simular Pago Exitoso

```bash
stripe trigger checkout.session.completed --add checkout_session:id=$SESSION
```

Deberías ver en los logs del servidor:
```
✅ Webhook recibido: checkout.session.completed
✅ Ticket creado: TICK-XXXXXX
```

#### e) Verificar Tickets

```bash
curl -s -X GET http://localhost:3000/tickets/my-tickets \
  -H "Authorization: Bearer $TOKEN" | jq '.'
```

---

## Testing Manual con cURL

### Flujo Completo Paso a Paso

**1. Health Check**

```bash
curl -s http://localhost:3000/health | jq '.'
```

**2. Crear Usuario**

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "buyer@example.com",
    "password": "BuyerPass123",
    "firstName": "John",
    "lastName": "Buyer"
  }' | jq '.'
```

**3. Login y Guardar Token**

```bash
export TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "buyer@example.com",
    "password": "BuyerPass123"
  }' | jq -r '.data.token')
```

**4. Listar Eventos Disponibles**

```bash
curl -s -X GET http://localhost:3000/events \
  -H "Authorization: Bearer $TOKEN" | jq '.data[] | {id, title, price, availableCapacity}'
```

**5. Crear Checkout Session**

```bash
export SESSION_ID=$(curl -s -X POST http://localhost:3000/payments/create-checkout-session \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": 1,
    "quantity": 1,
    "successUrl": "http://localhost:3000/success",
    "cancelUrl": "http://localhost:3000/cancel"
  }' | jq -r '.data.sessionId')

echo "Session ID: $SESSION_ID"
```

**6. Simular Pago (Stripe CLI)**

```bash
stripe trigger checkout.session.completed --add checkout_session:id=$SESSION_ID
```

**7. Verificar Estado de Sesión**

```bash
curl -s -X GET "http://localhost:3000/payments/verify/$SESSION_ID" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
```

**8. Ver Mis Tickets**

```bash
curl -s -X GET http://localhost:3000/tickets/my-tickets \
  -H "Authorization: Bearer $TOKEN" | jq '.data[] | {code, status, qrCode}'
```

---

## Testing Automatizado con Scripts

### Usar el Script E2E

El repositorio incluye un script completo de testing:

```bash
./scripts/test-payment-flow.sh
```

Este script:
- ✅ Verifica que el servidor esté corriendo
- ✅ Registra un usuario único (timestamped)
- ✅ Inicia sesión y obtiene token
- ✅ Lista eventos y selecciona uno
- ✅ Crea sesión de checkout
- ✅ Muestra instrucciones para completar el pago
- ✅ Verifica tickets después del webhook

### Personalizar el Script

Puedes modificar variables al inicio del script:

```bash
#!/bin/bash
# Cambiar puerto si es necesario
API_BASE="http://localhost:3001"

# Usar evento específico
EVENT_ID=5

# Ejecutar script
./scripts/test-payment-flow.sh
```

---

## Tarjetas de Prueba

Stripe proporciona tarjetas de prueba para diferentes escenarios:

### Pagos Exitosos

| Número | Descripción |
|--------|-------------|
| `4242 4242 4242 4242` | Pago exitoso (Visa) |
| `5555 5555 5555 4444` | Pago exitoso (Mastercard) |
| `3782 822463 10005` | Pago exitoso (American Express) |

### Pagos que Fallan

| Número | Error |
|--------|-------|
| `4000 0000 0000 0002` | Tarjeta declinada (generic decline) |
| `4000 0000 0000 9995` | Fondos insuficientes |
| `4000 0000 0000 0069` | CVV incorrecto |
| `4000 0000 0000 0127` | Tarjeta expirada |

### Autenticación 3D Secure

| Número | Comportamiento |
|--------|----------------|
| `4000 0025 0000 3155` | Requiere autenticación (exitosa) |
| `4000 0000 0000 3220` | Requiere autenticación (fallida) |

### Datos de Prueba

Para todas las tarjetas:
- **Fecha de expiración**: Cualquier fecha futura (ej: 12/34)
- **CVV**: Cualquier 3 dígitos (ej: 123)
- **Código postal**: Cualquiera (ej: 12345)

---

## Testing de Webhooks

### 1. Verificar Firma de Webhook

**Test 1: Webhook sin firma (debe fallar)**

```bash
curl -X POST http://localhost:3000/webhooks/stripe \
  -H "Content-Type: application/json" \
  -d '{"type":"checkout.session.completed"}' \
  -v
```

Esperado:
```
< HTTP/1.1 200 OK
{"received":false,"error":"No se encontró la firma de Stripe"}
```

**Test 2: Webhook con firma inválida (debe fallar)**

```bash
curl -X POST http://localhost:3000/webhooks/stripe \
  -H "stripe-signature: t=12345,v1=fake_signature" \
  -H "Content-Type: application/json" \
  -d '{"type":"checkout.session.completed"}' \
  -v
```

Esperado:
```
< HTTP/1.1 200 OK
{"received":false,"error":"Error verificando firma"}
```

**Test 3: Webhook válido (debe funcionar)**

```bash
stripe trigger checkout.session.completed
```

Esperado en logs del servidor:
```
✅ Webhook recibido y verificado
✅ Ticket creado exitosamente
```

### 2. Testing de Idempotencia

Enviar el **mismo evento dos veces**:

```bash
# Primera vez - debe crear ticket
stripe trigger checkout.session.completed --add checkout_session:id=cs_test_123

# Segunda vez - NO debe crear ticket duplicado
stripe trigger checkout.session.completed --add checkout_session:id=cs_test_123
```

Verificar en logs:
```
Primera ejecución: Ticket creado: TICK-XXXXXX
Segunda ejecución: Ticket ya existe para paymentId: cs_test_123
```

### 3. Testing de Eventos Soportados

```bash
# Pago completado (debe crear ticket)
stripe trigger checkout.session.completed

# Sesión expirada (debe loggear, no crear ticket)
stripe trigger checkout.session.expired

# Pago asíncrono exitoso (debe crear ticket)
stripe trigger checkout.session.async_payment_succeeded

# Pago asíncrono fallido (debe loggear, no crear ticket)
stripe trigger checkout.session.async_payment_failed
```

---

## Testing de Escenarios de Error

### 1. Evento sin Capacidad

```bash
# Asumir que evento ID 1 tiene capacidad 0
curl -X POST http://localhost:3000/payments/create-checkout-session \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"eventId": 1, "quantity": 1}'
```

Esperado:
```json
{
  "success": false,
  "message": "No hay capacidad disponible para este evento"
}
```

### 2. Usuario ya Tiene Ticket

```bash
# Primera compra (exitosa)
curl -X POST http://localhost:3000/payments/create-checkout-session \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"eventId": 2, "quantity": 1}'

# Segunda compra del mismo evento (debe fallar)
curl -X POST http://localhost:3000/payments/create-checkout-session \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"eventId": 2, "quantity": 1}'
```

Esperado segunda llamada:
```json
{
  "success": false,
  "message": "Ya tienes un ticket para este evento"
}
```

### 3. Evento No Existe

```bash
curl -X POST http://localhost:3000/payments/create-checkout-session \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"eventId": 99999, "quantity": 1}'
```

Esperado:
```json
{
  "success": false,
  "message": "El evento no existe o no está disponible"
}
```

### 4. Token Inválido

```bash
curl -X POST http://localhost:3000/payments/create-checkout-session \
  -H "Authorization: Bearer invalid_token_123" \
  -H "Content-Type: application/json" \
  -d '{"eventId": 1, "quantity": 1}'
```

Esperado:
```json
{
  "success": false,
  "message": "Token inválido o expirado"
}
```

---

## Testing en Staging

### 1. Configurar Webhook de Staging

En [Stripe Dashboard](https://dashboard.stripe.com/test/webhooks):

1. Click en **Add endpoint**
2. URL: `https://staging.tu-dominio.com/webhooks/stripe`
3. Eventos:
   - `checkout.session.completed`
   - `checkout.session.expired`
   - `checkout.session.async_payment_succeeded`
   - `checkout.session.async_payment_failed`
4. Copiar **Signing secret** y configurarlo en staging

### 2. Monitorear Webhooks

En [Dashboard > Webhooks](https://dashboard.stripe.com/test/webhooks):

- Ver **deliveries** en tiempo real
- Verificar **response status** (debe ser 200)
- Revisar **response body**
- **Retry** deliveries fallidos manualmente

### 3. Testing E2E en Staging

```bash
# Usar API de staging
export API_BASE="https://staging.tu-dominio.com"

# Ejecutar script de testing
API_BASE=$API_BASE ./scripts/test-payment-flow.sh
```

---

## Checklist de Testing

Antes de ir a producción:

### Testing Funcional
- [ ] Flujo completo de compra exitosa
- [ ] Creación de ticket después de pago
- [ ] QR code generado correctamente
- [ ] Validación de ticket por VALIDATOR
- [ ] Verificación de capacidad de evento
- [ ] Prevención de tickets duplicados

### Testing de Seguridad
- [ ] Webhook con firma inválida rechazado
- [ ] Webhook sin firma rechazado
- [ ] API keys no expuestas en logs
- [ ] HTTPS configurado en producción

### Testing de Idempotencia
- [ ] Webhook duplicado no crea múltiples tickets
- [ ] Mismo paymentId reutilizado correctamente

### Testing de Errores
- [ ] Evento sin capacidad
- [ ] Usuario ya tiene ticket
- [ ] Evento no existe
- [ ] Token JWT inválido
- [ ] Sesión de Stripe expirada

### Testing de Monitoreo
- [ ] Logs de pagos funcionando
- [ ] Webhooks visibles en Dashboard
- [ ] Alerts configurados para fallos

---

## Troubleshooting

### Problema: "Webhook signature verification failed"

**Causa**: Webhook secret incorrecto o no configurado.

**Solución**:
```bash
# 1. Verificar que stripe listen esté corriendo
stripe listen --forward-to localhost:3000/webhooks/stripe

# 2. Copiar el whsec_... mostrado

# 3. Agregarlo a .env
STRIPE_WEBHOOK_SECRET=whsec_nuevo_secret_aqui

# 4. Reiniciar servidor
bun dev
```

### Problema: "Event not found"

**Causa**: Evento de Stripe simulado no tiene metadata correcta.

**Solución**:
```bash
# Usar --add para agregar metadata
stripe trigger checkout.session.completed \
  --add checkout_session:id=cs_test_123 \
  --add checkout_session:metadata.eventId=1 \
  --add checkout_session:metadata.userId=1
```

### Problema: "Ticket not created after payment"

**Pasos de debugging**:

1. Verificar logs del servidor
2. Verificar que el webhook fue recibido:
   ```bash
   stripe logs tail
   ```
3. Verificar metadata en sesión:
   ```bash
   stripe checkout sessions retrieve cs_test_123
   ```
4. Verificar que userId y eventId son válidos

---

## Recursos Adicionales

- [Stripe Testing Guide](https://stripe.com/docs/testing)
- [Stripe CLI Documentation](https://stripe.com/docs/stripe-cli)
- [Webhook Testing](https://stripe.com/docs/webhooks/test)
- [Test Card Numbers](https://stripe.com/docs/testing#cards)

---

**Última actualización**: Abril 2026
