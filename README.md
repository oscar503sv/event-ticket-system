# Sistema de Gestión de Eventos y Tickets

Sistema backend completo para la gestión de eventos, venta de tickets y procesamiento de pagos con Stripe.

## Características

- Autenticación de usuarios con JWT
- Gestión completa de eventos (CRUD)
- Creación y validación de tickets con códigos QR
- **Integración con Stripe Checkout Sessions (Embedded UI)**
- **Procesamiento de pagos mediante webhooks**
- Documentación API con Swagger
- Logger con Winston para registro de actividades
- Base de datos PostgreSQL con Drizzle ORM
- TypeScript para desarrollo robusto

## Requisitos

- Node.js (v18 o superior)
- Bun (v1.0.0 o superior)
- PostgreSQL (v14 o superior)
- Cuenta de Stripe (test o producción)
- Stripe CLI (para testing local de webhooks)

## Configuración

### 1. Configuración Básica

1. Clonar el repositorio
2. Instalar dependencias:
   ```bash
   bun install
   ```

### 2. Configuración de Base de Datos

1. Crear una base de datos PostgreSQL
2. Copiar `.env.example` a `.env`
3. Configurar `DATABASE_URL` en `.env`:
   ```
   DATABASE_URL=postgresql://usuario:password@localhost:5432/nombre_db
   ```
4. Ejecutar migraciones:
   ```bash
   bun migrate
   ```

### 3. Configuración de Stripe

#### Obtener API Keys

1. Ir a [Stripe Dashboard](https://dashboard.stripe.com/)
2. En modo Test, obtener las claves desde **Developers > API Keys**:
   - **Publishable key** (pk_test_...)
   - **Secret key** (sk_test_...)

#### Configurar Variables de Entorno

Agregar al archivo `.env`:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_tu_clave_secreta
STRIPE_PUBLISHABLE_KEY=pk_test_tu_clave_publicable
STRIPE_WEBHOOK_SECRET=whsec_tu_webhook_secret

# Frontend URL (para redirecciones después del pago)
FRONTEND_URL=http://localhost:5173
```

#### Configurar Webhook Secret (Testing Local)

1. Instalar Stripe CLI:
   ```bash
   # macOS
   brew install stripe/stripe-cli/stripe

   # Linux
   wget https://github.com/stripe/stripe-cli/releases/download/v1.19.0/stripe_1.19.0_linux_x86_64.tar.gz
   tar -xvf stripe_1.19.0_linux_x86_64.tar.gz
   sudo mv stripe /usr/local/bin/
   ```

2. Autenticar Stripe CLI:
   ```bash
   stripe login
   ```

3. Iniciar el servidor:
   ```bash
   bun dev
   ```

4. En otra terminal, iniciar el webhook forwarding:
   ```bash
   stripe listen --forward-to localhost:3000/webhooks/stripe
   ```

5. Copiar el **webhook signing secret** (whsec_...) mostrado y agregarlo a `.env`

#### Configurar Webhook en Producción

1. En [Stripe Dashboard](https://dashboard.stripe.com/) ir a **Developers > Webhooks**
2. Click en **Add endpoint**
3. Configurar:
   - **Endpoint URL**: `https://tu-dominio.com/webhooks/stripe`
   - **Events to send**: 
     - `checkout.session.completed`
     - `checkout.session.expired`
     - `checkout.session.async_payment_succeeded`
     - `checkout.session.async_payment_failed`
4. Copiar el **Signing secret** (whsec_...) y agregarlo a `.env` de producción

### 4. Configuración JWT

Generar un secret seguro para JWT:

```bash
openssl rand -base64 32
```

Agregarlo a `.env`:

```env
JWT_SECRET=tu_secret_generado_aqui
JWT_EXPIRES_IN=24h
```

### 5. Iniciar el Servidor

```bash
# Desarrollo (con hot reload)
bun dev

# Producción
bun start
```

El servidor estará disponible en `http://localhost:3000`

## Testing del Flujo de Pagos

### Opción 1: Script Automatizado

Ejecutar el script de testing E2E:

```bash
./scripts/test-payment-flow.sh
```

Este script:
- Registra un usuario de prueba
- Crea una sesión de checkout
- Muestra instrucciones para simular el pago
- Verifica que el ticket se creó correctamente

### Opción 2: Testing Manual

1. **Registrar usuario**:
   ```bash
   curl -X POST http://localhost:3000/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"Test123456","firstName":"Test","lastName":"User"}'
   ```

2. **Iniciar sesión**:
   ```bash
   curl -X POST http://localhost:3000/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"Test123456"}'
   ```

3. **Crear sesión de checkout**:
   ```bash
   curl -X POST http://localhost:3000/payments/create-checkout-session \
     -H "Authorization: Bearer TU_TOKEN_AQUI" \
     -H "Content-Type: application/json" \
     -d '{"eventId":1,"quantity":1}'
   ```

4. **Simular pago exitoso** (requiere Stripe CLI):
   ```bash
   stripe trigger checkout.session.completed --add checkout_session:id=SESSION_ID
   ```

5. **Verificar tickets**:
   ```bash
   curl -X GET http://localhost:3000/tickets/my-tickets \
     -H "Authorization: Bearer TU_TOKEN_AQUI"
   ```

### Tarjetas de Prueba de Stripe

En modo test, usar estas tarjetas:

- **Pago exitoso**: `4242 4242 4242 4242`
- **Pago rechazado**: `4000 0000 0000 0002`
- **Requiere autenticación 3D Secure**: `4000 0025 0000 3155`
- **Fecha de expiración**: Cualquier fecha futura
- **CVV**: Cualquier 3 dígitos

## Documentación

### API Documentation (Swagger)

La documentación interactiva de la API está disponible en:

```
http://localhost:3000/docs
```

### Documentación Adicional

- [Seguridad con Stripe](./docs/stripe-security.md) - Mejores prácticas de seguridad
- [Testing con Stripe](./docs/stripe-testing.md) - Guía completa de testing

## Estructura del Proyecto

- `/src/config`: Configuraciones del servidor, logger y Stripe
- `/src/db`: Configuraciones de base de datos usando Drizzle ORM
- `/src/controllers`: Controladores de la API
- `/src/middlewares`: Middlewares para autenticación, validación y manejo de errores
- `/src/routes`: Definición de rutas de la API
- `/src/schemas`: Esquemas de validación con Zod
- `/src/services`: Lógica de negocio (eventos, tickets, pagos)
- `/src/utils`: Utilidades para JWT, QR, respuestas y validación
- `/scripts`: Scripts de testing y utilidades

## Endpoints Principales

### Autenticación
- `POST /auth/register`: Registro de usuarios
- `POST /auth/login`: Inicio de sesión
- `GET /auth/me`: Obtener información del usuario actual

### Eventos
- `GET /events`: Listar eventos
- `GET /events/upcoming`: Listar eventos futuros
- `GET /events/:id`: Obtener evento por ID
- `POST /events`: Crear evento (ORGANIZER/ADMIN)
- `PUT /events/:id`: Actualizar evento (ORGANIZER/ADMIN)
- `DELETE /events/:id`: Eliminar evento (ORGANIZER/ADMIN)

### Tickets
- `GET /tickets/my-tickets`: Obtener tickets del usuario
- `GET /tickets/:code`: Obtener ticket por código
- `POST /tickets`: ⚠️ **DEPRECADO** - Crear ticket manual (ADMIN only, usar pagos en su lugar)
- `POST /tickets/validate/:code`: Validar ticket (VALIDATOR/ADMIN)

### Pagos (Stripe)
- `POST /payments/create-checkout-session`: Crear sesión de pago con Stripe
- `GET /payments/verify/:sessionId`: Verificar estado de pago
- `POST /webhooks/stripe`: Webhook para eventos de Stripe (no requiere auth JWT)

## Arquitectura de Pagos

El sistema utiliza **Stripe Checkout Sessions** con las siguientes características:

1. **Flujo del Usuario**:
   - Usuario selecciona un evento y cantidad de tickets
   - Backend crea una sesión de Checkout con Stripe
   - Frontend muestra el formulario de pago embebido
   - Usuario completa el pago
   - Stripe envía webhook al backend
   - Backend crea el ticket automáticamente

2. **Seguridad**:
   - Verificación de firma de webhooks con `stripe-signature` header
   - Idempotencia en creación de tickets (previene duplicados)
   - Validación de capacidad del evento antes de crear la sesión
   - Los tickets se crean SOLO después de pago confirmado

3. **Eventos de Stripe Soportados**:
   - `checkout.session.completed`: Pago completado
   - `checkout.session.expired`: Sesión expiró sin pago
   - `checkout.session.async_payment_succeeded`: Pago asíncrono exitoso
   - `checkout.session.async_payment_failed`: Pago asíncrono fallido

## Roles del Sistema

- **USER**: Usuario estándar (puede comprar tickets)
- **ORGANIZER**: Puede crear y gestionar eventos
- **VALIDATOR**: Puede validar tickets en eventos
- **ADMIN**: Acceso completo al sistema

## Comandos Útiles

```bash
# Desarrollo
bun dev                  # Iniciar servidor con hot reload
bun typecheck            # Verificar tipos TypeScript
bun lint                 # Linter con Biome
bun format               # Formatear código

# Base de datos
bun migrate              # Aplicar migraciones
bun generate             # Generar migraciones

# Testing
bun test                 # Ejecutar tests
./scripts/test-payment-flow.sh  # Test E2E de pagos

# Stripe
stripe listen --forward-to localhost:3000/webhooks/stripe  # Webhook forwarding
stripe trigger checkout.session.completed                  # Simular evento
```

## Troubleshooting

### Error: "Webhook signature verification failed"

- Asegúrate de que `STRIPE_WEBHOOK_SECRET` esté configurado
- Verifica que Stripe CLI esté corriendo con `stripe listen`
- En producción, verifica que el secret coincida con el del dashboard

### Error: "No hay capacidad disponible"

- El evento tiene `availableCapacity = 0`
- Verifica la capacidad del evento con `GET /events/:id`
- Actualiza la capacidad si es necesario (ORGANIZER/ADMIN)

### Error: "Ya tienes un ticket para este evento"

- Un usuario solo puede tener un ticket por evento
- Verifica tickets existentes con `GET /tickets/my-tickets`

## Licencia

MIT