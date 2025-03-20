# Sistema de Gestión de Eventos y Tickets

Sistema backend completo para la gestión de eventos, venta de tickets y procesamiento de pagos.

## Características

- Autenticación de usuarios con JWT
- Gestión completa de eventos (CRUD)
- Creación y validación de tickets con códigos QR
- Integración con Stripe para procesamiento de pagos
- Documentación API con Swagger
- Logger con Winston para registro de actividades
- Base de datos PostgreSQL con Drizzle ORM
- TypeScript para desarrollo robusto

## Requisitos

- Node.js (v18 o superior)
- Bun (v1.0.0 o superior)
- PostgreSQL (v14 o superior)
- Cuenta de Stripe para procesamiento de pagos

## Configuración

1. Clonar el repositorio
2. Copiar `.env.example` a `.env` y configurar las variables de entorno
3. Instalar dependencias con `bun install`
4. Ejecutar migraciones de base de datos con `bun run migrate`
5. Iniciar el servidor con `bun run dev`

## Documentación

La documentación de la API está disponible en `/swagger` cuando el servidor está en ejecución.

## Estructura del Proyecto

- `/src/config`: Configuraciones del servidor, base de datos y logger
- `/src/controllers`: Controladores de la API
- `/src/middlewares`: Middlewares para autenticación, validación y manejo de errores
- `/src/models`: Modelos de datos para Drizzle ORM
- `/src/routes`: Definición de rutas de la API
- `/src/schemas`: Esquemas de validación con Zod
- `/src/services`: Lógica de negocio
- `/src/utils`: Utilidades para JWT, respuestas y validación

## Endpoints Principales

### Autenticación
- `POST /auth/register`: Registro de usuarios
- `POST /auth/login`: Inicio de sesión
- `GET /auth/me`: Obtener información del usuario actual

### Eventos
- `GET /events`: Listar eventos
- `GET /events/upcoming`: Listar eventos futuros
- `GET /events/:id`: Obtener evento por ID
- `POST /events`: Crear evento (admin)
- `PUT /events/:id`: Actualizar evento (admin)
- `DELETE /events/:id`: Eliminar evento (admin)

### Tickets
- `GET /tickets/my-tickets`: Obtener tickets del usuario
- `GET /tickets/:code`: Obtener ticket por código
- `POST /tickets`: Crear ticket manual
- `POST /tickets/validate/:code`: Validar ticket (admin)

### Pagos
- `POST /payments/create-checkout-session`: Crear sesión de pago con Stripe
- `GET /payments/verify/:sessionId`: Verificar estado de pago
- `POST /payments/webhook`: Webhook para eventos de Stripe

## Licencia

MIT