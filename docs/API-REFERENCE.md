# API Reference for Frontend Development

## Base URL
```
Development: http://localhost:3000
```

## Response Format

All API endpoints return a standardized JSON response:

```typescript
{
  success: boolean;
  message: string;
  data?: any;
  statusCode?: number;
}
```

### Success Response Example
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "id": 1,
    "email": "user@example.com"
  }
}
```

### Error Response Example
```json
{
  "success": false,
  "message": "Invalid credentials",
  "statusCode": 401
}
```

## Authentication

### Register User
**POST** `/auth/register`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "USER" // Optional: USER | ORGANIZER | VALIDATOR | ADMIN
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "USER",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Login
**POST** `/auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "USER",
      "isActive": true
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Get Current User
**GET** `/auth/me`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "User retrieved successfully",
  "data": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "USER",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

## Events

### List All Events
**GET** `/events`

**Public endpoint** (no authentication required)

**Response:**
```json
{
  "success": true,
  "message": "Events retrieved successfully",
  "data": [
    {
      "id": 1,
      "name": "Rock Concert 2024",
      "type": "Concierto",
      "description": "Amazing rock concert",
      "location": "Stadium Arena",
      "startDate": "2024-12-31T20:00:00.000Z",
      "endDate": "2024-12-31T23:59:00.000Z",
      "imageUrl": "https://example.com/image.jpg",
      "capacity": 500,
      "price": "50.00",
      "isPublished": true,
      "organizerId": 5,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### Get Upcoming Events
**GET** `/events/upcoming`

**Public endpoint**

Returns only events with `startDate` in the future.

### Get Event by ID
**GET** `/events/:id`

**Public endpoint**

**Response:**
```json
{
  "success": true,
  "message": "Event retrieved successfully",
  "data": {
    "id": 1,
    "name": "Rock Concert 2024",
    "type": "Concierto",
    "description": "Amazing rock concert",
    "location": "Stadium Arena",
    "startDate": "2024-12-31T20:00:00.000Z",
    "endDate": "2024-12-31T23:59:00.000Z",
    "imageUrl": "https://example.com/image.jpg",
    "capacity": 500,
    "price": "50.00",
    "isPublished": true,
    "organizerId": 5
  }
}
```

### Create Event
**POST** `/events`

**Requires:** ORGANIZER or ADMIN role

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Rock Concert 2024",
  "type": "Concierto", // Concierto | Festival | Conferencia | Taller | Deportivo | Otro
  "description": "Amazing rock concert",
  "location": "Stadium Arena",
  "startDate": "2024-12-31T20:00:00.000Z",
  "endDate": "2024-12-31T23:59:00.000Z",
  "imageUrl": "https://example.com/image.jpg",
  "capacity": 500,
  "price": 50.00,
  "isPublished": true
}
```

### Update Event
**PUT** `/events/:id`

**Requires:** ORGANIZER or ADMIN role

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:** (all fields optional)
```json
{
  "name": "Updated Concert Name",
  "price": 60.00
}
```

### Delete Event
**DELETE** `/events/:id`

**Requires:** ORGANIZER or ADMIN role

**Headers:**
```
Authorization: Bearer <token>
```

## Tickets

### Get My Tickets
**GET** `/tickets/my-tickets`

**Requires:** Authentication

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Tickets retrieved successfully",
  "data": [
    {
      "id": 1,
      "eventId": 1,
      "userId": 1,
      "ticketCode": "EVT-ABC123-XYZ789",
      "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANS...",
      "purchaseDate": "2024-01-01T00:00:00.000Z",
      "isUsed": false,
      "usedDate": null,
      "paymentId": "pi_1234567890",
      "paymentStatus": "completed"
    }
  ]
}
```

### Get Ticket by Code
**GET** `/tickets/:code`

**Requires:** Authentication (user can only access their own tickets)

**Headers:**
```
Authorization: Bearer <token>
```

### Validate Ticket
**POST** `/tickets/validate/:code`

**Requires:** VALIDATOR or ADMIN role

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Ticket validated successfully",
  "data": {
    "id": 1,
    "ticketCode": "EVT-ABC123-XYZ789",
    "isUsed": true,
    "usedDate": "2024-01-01T00:00:00.000Z"
  }
}
```

## Payments (Stripe)

### Create Checkout Session
**POST** `/payments/create-checkout-session`

**Requires:** Authentication

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "eventId": 1
}
```

**Response:**
```json
{
  "success": true,
  "message": "Checkout session created successfully",
  "data": {
    "sessionId": "cs_test_a1234567890...",
    "clientSecret": null
  }
}
```

**Frontend Implementation:**
```javascript
// 1. Create checkout session
const response = await fetch('http://localhost:3000/payments/create-checkout-session', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({ eventId: 1 })
});

const { data } = await response.json();

// 2. Redirect to Stripe Checkout
const stripe = Stripe('pk_test_your_publishable_key');
await stripe.redirectToCheckout({
  sessionId: data.sessionId
});

// 3. After payment, user is redirected to success_url
// 4. Webhook automatically creates the ticket
```

### Verify Payment Session
**GET** `/payments/verify/:sessionId`

**Requires:** Authentication

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Session status retrieved",
  "data": {
    "status": "complete",
    "payment_status": "paid",
    "customer_email": "user@example.com"
  }
}
```

## Payment Flow

1. **User selects event** → GET `/events`
2. **User clicks "Buy Ticket"** → POST `/payments/create-checkout-session` with `eventId`
3. **Frontend receives** `sessionId`
4. **Frontend redirects** to Stripe Checkout using `stripe.redirectToCheckout({ sessionId })`
5. **User completes payment** on Stripe's hosted page
6. **Stripe sends webhook** to `/webhooks/stripe` (automatic)
7. **Backend creates ticket** automatically
8. **User is redirected** back to your `success_url`
9. **Frontend fetches tickets** → GET `/tickets/my-tickets`

## Error Handling

### Common Error Codes

- **400** - Bad Request (invalid input)
- **401** - Unauthorized (invalid or missing token)
- **403** - Forbidden (insufficient permissions)
- **404** - Not Found (resource doesn't exist)
- **409** - Conflict (e.g., already have ticket for event)
- **500** - Internal Server Error

### Example Error Response
```json
{
  "success": false,
  "message": "No capacity available for this event",
  "statusCode": 409
}
```

## User Roles

- **USER**: Can purchase tickets, view their own tickets
- **ORGANIZER**: Can create and manage events
- **VALIDATOR**: Can validate tickets at events
- **ADMIN**: Full system access

## Important Notes for Frontend

### 1. Token Storage
```javascript
// Store token after login/register
localStorage.setItem('token', data.token);

// Include in all authenticated requests
headers: {
  'Authorization': `Bearer ${localStorage.getItem('token')}`
}
```

### 2. Date Handling
All dates are in ISO 8601 format. Use JavaScript Date object:
```javascript
const eventDate = new Date(event.startDate);
const formatted = eventDate.toLocaleDateString('en-US', {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
});
```

### 3. Price Display
Prices are returned as strings (e.g., "50.00"). Format for display:
```javascript
const price = parseFloat(event.price);
const formatted = `$${price.toFixed(2)}`;
```

### 4. QR Code Display
QR codes are returned as base64 data URIs. Display directly:
```jsx
<img src={ticket.qrCode} alt="QR Code" />
```

### 5. Stripe Integration
```html
<!-- Add Stripe.js to your HTML -->
<script src="https://js.stripe.com/v3/"></script>
```

```javascript
// Initialize Stripe
const stripe = Stripe('pk_test_your_publishable_key');

// Redirect to checkout
const { data } = await createCheckoutSession(eventId);
await stripe.redirectToCheckout({
  sessionId: data.sessionId
});
```

## Environment Variables for Frontend

```env
VITE_API_URL=http://localhost:3000
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51...
```

## Swagger Documentation

Interactive API documentation available at:
```
http://localhost:3000/docs
```

You can test all endpoints directly from the Swagger UI.

## CORS

CORS is enabled for all origins in development. The API accepts requests from any domain.

## Rate Limiting

Currently no rate limiting implemented. Safe for development and testing.

## Webhook (Backend Only)

**POST** `/webhooks/stripe`

This endpoint is called by Stripe automatically. Your frontend should NOT call this endpoint.
The backend handles webhook signature verification and automatic ticket creation.
