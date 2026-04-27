# Event Ticket Management System

Complete backend system for event management, ticket sales, and payment processing with Stripe.

## Features

- User authentication with JWT
- Complete event management (CRUD)
- Ticket creation and validation with QR codes
- **Stripe Checkout Sessions integration (Hosted UI)**
- **Payment processing via webhooks**
- API documentation with Swagger
- Winston logger for activity tracking
- PostgreSQL database with Drizzle ORM
- TypeScript for robust development

## Requirements

- Node.js (v18 or higher)
- Bun (v1.0.0 or higher)
- PostgreSQL (v14 or higher)
- Stripe account (test or production)
- Stripe CLI (for local webhook testing)

## Setup

### 1. Basic Configuration

1. Clone the repository
2. Install dependencies:
   ```bash
   bun install
   ```

### 2. Database Configuration

1. Create a PostgreSQL database
2. Copy `.env.example` to `.env`
3. Configure `DATABASE_URL` in `.env`:
   ```
   DATABASE_URL=postgresql://user:password@localhost:5432/database_name
   ```
4. Run migrations:
   ```bash
   bun migrate
   ```

### 3. Stripe Configuration

#### Get API Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. In Test mode, get your keys from **Developers > API Keys**:
   - **Publishable key** (pk_test_...)
   - **Secret key** (sk_test_...)

#### Configure Environment Variables

Add to your `.env` file:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Frontend URL (for post-payment redirects)
FRONTEND_URL=http://localhost:5173
```

#### Configure Webhook Secret (Local Testing)

1. Install Stripe CLI:
   ```bash
   # macOS
   brew install stripe/stripe-cli/stripe

   # Linux
   wget https://github.com/stripe/stripe-cli/releases/download/v1.19.0/stripe_1.19.0_linux_x86_64.tar.gz
   tar -xvf stripe_1.19.0_linux_x86_64.tar.gz
   sudo mv stripe /usr/local/bin/
   ```

2. Authenticate Stripe CLI:
   ```bash
   stripe login
   ```

3. Start the server:
   ```bash
   bun dev
   ```

4. In another terminal, start webhook forwarding:
   ```bash
   stripe listen --forward-to localhost:3000/webhooks/stripe
   ```

5. Copy the **webhook signing secret** (whsec_...) shown and add it to `.env`

#### Configure Webhook in Production

1. In [Stripe Dashboard](https://dashboard.stripe.com/) go to **Developers > Webhooks**
2. Click **Add endpoint**
3. Configure:
   - **Endpoint URL**: `https://your-domain.com/webhooks/stripe`
   - **Events to send**: 
     - `checkout.session.completed`
     - `checkout.session.expired`
     - `checkout.session.async_payment_succeeded`
     - `checkout.session.async_payment_failed`
4. Copy the **Signing secret** (whsec_...) and add it to your production `.env`

### 4. JWT Configuration

Generate a secure secret for JWT:

```bash
openssl rand -base64 32
```

Add it to `.env`:

```env
JWT_SECRET=your_generated_secret_here
JWT_EXPIRES_IN=24h
```

### 5. Start the Server

```bash
# Development (with hot reload)
bun dev

# Production
bun start
```

The server will be available at `http://localhost:3000`

## Testing Payment Flow

### Option 1: Automated Script

Run the E2E testing script:

```bash
./scripts/test-payment-flow.sh
```

This script:
- Registers a test user
- Creates a checkout session
- Shows instructions to simulate payment
- Verifies the ticket was created correctly

### Option 2: Manual Testing

1. **Register user**:
   ```bash
   curl -X POST http://localhost:3000/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"Test123456","firstName":"Test","lastName":"User"}'
   ```

2. **Login**:
   ```bash
   curl -X POST http://localhost:3000/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"Test123456"}'
   ```

3. **Create checkout session**:
   ```bash
   curl -X POST http://localhost:3000/payments/create-checkout-session \
     -H "Authorization: Bearer YOUR_TOKEN_HERE" \
     -H "Content-Type: application/json" \
     -d '{"eventId":1}'
   ```

4. **Complete payment**: Open the returned Stripe Checkout URL in a browser and use test card `4242 4242 4242 4242`

5. **Verify tickets**:
   ```bash
   curl -X GET http://localhost:3000/tickets/my-tickets \
     -H "Authorization: Bearer YOUR_TOKEN_HERE"
   ```

### Stripe Test Cards

In test mode, use these cards:

- **Successful payment**: `4242 4242 4242 4242`
- **Payment declined**: `4000 0000 0000 0002`
- **Requires 3D Secure authentication**: `4000 0025 0000 3155`
- **Expiration date**: Any future date
- **CVV**: Any 3 digits

## Documentation

### API Documentation (Swagger)

Interactive API documentation is available at:

```
http://localhost:3000/docs
```

### Additional Documentation

- [Stripe Security Best Practices](./docs/stripe-security.md)
- [Stripe Testing Guide](./docs/stripe-testing.md)

## Project Structure

```
├── src/
│   ├── config/          # Server, logger, and Stripe configuration
│   ├── controllers/     # API controllers
│   ├── db/              # Database configuration with Drizzle ORM
│   │   └── tables/      # Database table schemas
│   ├── middlewares/     # Authentication, validation, and error handling
│   ├── routes/          # API route definitions
│   ├── schemas/         # Validation schemas with Zod
│   ├── services/        # Business logic (events, tickets, payments)
│   ├── types/           # TypeScript type definitions
│   └── utils/           # Utilities (JWT, QR, responses, validation)
├── scripts/             # Testing scripts and utilities
├── docs/                # Additional documentation
└── drizzle/             # Database migrations
```

## Main Endpoints

### Authentication
- `POST /auth/register`: Register new user
- `POST /auth/login`: User login
- `GET /auth/me`: Get current user information

### Events
- `GET /events`: List all events
- `GET /events/upcoming`: List upcoming events
- `GET /events/:id`: Get event by ID
- `POST /events`: Create event (ORGANIZER/ADMIN)
- `PUT /events/:id`: Update event (ORGANIZER/ADMIN)
- `DELETE /events/:id`: Delete event (ORGANIZER/ADMIN)

### Tickets
- `GET /tickets/my-tickets`: Get user's tickets
- `GET /tickets/:code`: Get ticket by code
- `POST /tickets`: ⚠️ **DEPRECATED** - Manual ticket creation (ADMIN only, use payments instead)
- `POST /tickets/validate/:code`: Validate ticket (VALIDATOR/ADMIN)

### Payments (Stripe)
- `POST /payments/create-checkout-session`: Create Stripe payment session
- `GET /payments/verify/:sessionId`: Verify payment status
- `POST /webhooks/stripe`: Webhook for Stripe events (no JWT auth required)

## Payment Architecture

The system uses **Stripe Checkout Sessions (Hosted UI)** with the following features:

### 1. User Flow:
   - User selects an event
   - Backend creates a Checkout Session with Stripe
   - User is redirected to Stripe's hosted checkout page
   - User completes payment on Stripe's secure page
   - Stripe sends webhook to backend
   - Backend automatically creates the ticket
   - User is redirected back to success page

### 2. Security:
   - Webhook signature verification with `stripe-signature` header
   - Idempotency in ticket creation (prevents duplicates)
   - Event capacity validation before creating session
   - Tickets are created ONLY after confirmed payment
   - One ticket per user per event enforcement

### 3. Supported Stripe Events:
   - `checkout.session.completed`: Payment completed successfully
   - `checkout.session.expired`: Session expired without payment
   - `checkout.session.async_payment_succeeded`: Async payment succeeded
   - `checkout.session.async_payment_failed`: Async payment failed

## System Roles

- **USER**: Standard user (can purchase tickets)
- **ORGANIZER**: Can create and manage events
- **VALIDATOR**: Can validate tickets at events
- **ADMIN**: Full system access

## Useful Commands

```bash
# Development
bun dev                  # Start server with hot reload
bun typecheck            # Check TypeScript types
bun lint                 # Lint with Biome
bun format               # Format code

# Database
bun migrate              # Apply migrations
bun generate             # Generate migrations

# Testing
bun test                 # Run tests
./scripts/test-payment-flow.sh  # E2E payment test

# Stripe
stripe listen --forward-to localhost:3000/webhooks/stripe  # Webhook forwarding
stripe trigger checkout.session.completed                  # Simulate event
```

## Troubleshooting

### Error: "Webhook signature verification failed"

- Ensure `STRIPE_WEBHOOK_SECRET` is configured
- Verify Stripe CLI is running with `stripe listen`
- In production, verify the secret matches the one in dashboard

### Error: "No capacity available"

- The event has `availableCapacity = 0`
- Check event capacity with `GET /events/:id`
- Update capacity if needed (ORGANIZER/ADMIN)

### Error: "You already have a ticket for this event"

- A user can only have one ticket per event
- Check existing tickets with `GET /tickets/my-tickets`

### Webhook not receiving events

- Verify Stripe CLI is running: `stripe listen --forward-to localhost:3000/webhooks/stripe`
- Check server logs for webhook processing
- Ensure `STRIPE_WEBHOOK_SECRET` in `.env` matches the one shown by Stripe CLI
- In production, verify webhook endpoint is publicly accessible

### Payment session creation fails

- Verify event exists and is published
- Check event has available capacity
- Ensure user doesn't already have a ticket for the event
- Verify `STRIPE_SECRET_KEY` is correctly configured

## Technology Stack

- **Runtime**: Bun 1.0+
- **Framework**: Elysia 1.4.28
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT with @elysiajs/jwt
- **Payments**: Stripe Checkout Sessions
- **Validation**: Zod schemas
- **Logging**: Winston
- **API Docs**: Swagger/OpenAPI
- **QR Codes**: qrcode library
- **Linting/Formatting**: Biome

## Environment Variables

Complete list of required environment variables:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# JWT
JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=1d

# Stripe
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_secret

# Frontend
FRONTEND_URL=http://localhost:5173

# Server
PORT=3000
NODE_ENV=development
```

## License

MIT
