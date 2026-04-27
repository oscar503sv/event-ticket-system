# Frontend Integration Examples

Practical code examples for integrating with the Event Ticket Management API.

## Table of Contents
- [Setup](#setup)
- [Authentication](#authentication)
- [Events](#events)
- [Payment Flow](#payment-flow)
- [Tickets](#tickets)
- [Error Handling](#error-handling)

## Setup

### API Client Class

```typescript
// api/client.ts
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class ApiClient {
  private getHeaders(includeAuth = false): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (includeAuth) {
      const token = localStorage.getItem('token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {},
    requiresAuth = false
  ): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...this.getHeaders(requiresAuth),
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }

    return data.data;
  }
}

export const apiClient = new ApiClient();
```

## Authentication

### Register User

```typescript
// api/auth.ts
interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: 'USER' | 'ORGANIZER' | 'VALIDATOR' | 'ADMIN';
}

interface AuthResponse {
  user: User;
  token: string;
}

export async function register(data: RegisterData): Promise<AuthResponse> {
  const response = await apiClient.request<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  // Store token
  localStorage.setItem('token', response.token);
  return response;
}
```

### Login

```typescript
// api/auth.ts
interface LoginData {
  email: string;
  password: string;
}

export async function login(data: LoginData): Promise<AuthResponse> {
  const response = await apiClient.request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  // Store token
  localStorage.setItem('token', response.token);
  return response;
}
```

### Get Current User

```typescript
// api/auth.ts
interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function getCurrentUser(): Promise<User> {
  return apiClient.request<User>('/auth/me', {}, true);
}
```

### Logout

```typescript
// api/auth.ts
export function logout() {
  localStorage.removeItem('token');
}
```

### React Hook Example

```typescript
// hooks/useAuth.ts
import { useState, useEffect } from 'react';
import { getCurrentUser, login, register, logout } from '../api/auth';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      getCurrentUser()
        .then(setUser)
        .catch(() => logout())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = async (email: string, password: string) => {
    const { user } = await login({ email, password });
    setUser(user);
  };

  const handleRegister = async (data: RegisterData) => {
    const { user } = await register(data);
    setUser(user);
  };

  const handleLogout = () => {
    logout();
    setUser(null);
  };

  return {
    user,
    loading,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    isAuthenticated: !!user,
  };
}
```

## Events

### Get All Events

```typescript
// api/events.ts
interface Event {
  id: number;
  name: string;
  type: string;
  description?: string;
  location: string;
  startDate: string;
  endDate: string;
  imageUrl?: string;
  capacity: number;
  price: string;
  isPublished: boolean;
  organizerId: number;
  createdAt: string;
  updatedAt: string;
}

export async function getEvents(): Promise<Event[]> {
  return apiClient.request<Event[]>('/events');
}
```

### Get Upcoming Events

```typescript
// api/events.ts
export async function getUpcomingEvents(): Promise<Event[]> {
  return apiClient.request<Event[]>('/events/upcoming');
}
```

### Get Event by ID

```typescript
// api/events.ts
export async function getEventById(id: number): Promise<Event> {
  return apiClient.request<Event>(`/events/${id}`);
}
```

### Create Event (Organizer/Admin only)

```typescript
// api/events.ts
interface CreateEventData {
  name: string;
  type: 'Concierto' | 'Festival' | 'Conferencia' | 'Taller' | 'Deportivo' | 'Otro';
  description?: string;
  location: string;
  startDate: string; // ISO 8601 format
  endDate: string;   // ISO 8601 format
  imageUrl?: string;
  capacity: number;
  price: number;
  isPublished?: boolean;
}

export async function createEvent(data: CreateEventData): Promise<Event> {
  return apiClient.request<Event>(
    '/events',
    {
      method: 'POST',
      body: JSON.stringify(data),
    },
    true // requires auth
  );
}
```

### React Component Example

```typescript
// components/EventList.tsx
import { useState, useEffect } from 'react';
import { getUpcomingEvents } from '../api/events';

export function EventList() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getUpcomingEvents()
      .then(setEvents)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading events...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="event-list">
      {events.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
}

function EventCard({ event }: { event: Event }) {
  const date = new Date(event.startDate);
  const price = parseFloat(event.price);

  return (
    <div className="event-card">
      {event.imageUrl && <img src={event.imageUrl} alt={event.name} />}
      <h3>{event.name}</h3>
      <p>{event.description}</p>
      <p>📍 {event.location}</p>
      <p>📅 {date.toLocaleDateString()}</p>
      <p>💰 ${price.toFixed(2)}</p>
      <button>Buy Ticket</button>
    </div>
  );
}
```

## Payment Flow

### Create Checkout Session

```typescript
// api/payments.ts
interface CheckoutSession {
  sessionId: string;
  clientSecret: null;
}

export async function createCheckoutSession(
  eventId: number
): Promise<CheckoutSession> {
  return apiClient.request<CheckoutSession>(
    '/payments/create-checkout-session',
    {
      method: 'POST',
      body: JSON.stringify({ eventId }),
    },
    true
  );
}
```

### Verify Payment

```typescript
// api/payments.ts
interface PaymentStatus {
  status: string;
  payment_status: string;
  customer_email: string;
}

export async function verifyPayment(sessionId: string): Promise<PaymentStatus> {
  return apiClient.request<PaymentStatus>(
    `/payments/verify/${sessionId}`,
    {},
    true
  );
}
```

### Complete Payment Flow Component

```typescript
// components/PurchaseTicket.tsx
import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { createCheckoutSession } from '../api/payments';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export function PurchaseTicket({ eventId }: { eventId: number }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePurchase = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Create checkout session
      const { sessionId } = await createCheckoutSession(eventId);

      // 2. Redirect to Stripe Checkout
      const stripe = await stripePromise;
      if (!stripe) throw new Error('Stripe not loaded');

      const { error } = await stripe.redirectToCheckout({ sessionId });
      
      if (error) {
        throw new Error(error.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={handlePurchase} disabled={loading}>
        {loading ? 'Processing...' : 'Buy Ticket'}
      </button>
      {error && <p className="error">{error}</p>}
    </div>
  );
}
```

### Success Page

```typescript
// pages/PaymentSuccess.tsx
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { verifyPayment } from '../api/payments';

export function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (!sessionId) {
      setStatus('error');
      return;
    }

    verifyPayment(sessionId)
      .then(() => {
        setStatus('success');
        // Redirect to tickets page after 3 seconds
        setTimeout(() => navigate('/tickets'), 3000);
      })
      .catch(() => setStatus('error'));
  }, [searchParams, navigate]);

  if (status === 'loading') {
    return <div>Verifying payment...</div>;
  }

  if (status === 'error') {
    return <div>Payment verification failed</div>;
  }

  return (
    <div>
      <h1>✅ Payment Successful!</h1>
      <p>Your ticket has been created automatically.</p>
      <p>Redirecting to your tickets...</p>
    </div>
  );
}
```

## Tickets

### Get My Tickets

```typescript
// api/tickets.ts
interface Ticket {
  id: number;
  eventId: number;
  userId: number;
  ticketCode: string;
  qrCode: string; // base64 data URI
  purchaseDate: string;
  isUsed: boolean;
  usedDate: string | null;
  paymentId: string;
  paymentStatus: string;
}

export async function getMyTickets(): Promise<Ticket[]> {
  return apiClient.request<Ticket[]>('/tickets/my-tickets', {}, true);
}
```

### Get Ticket by Code

```typescript
// api/tickets.ts
export async function getTicketByCode(code: string): Promise<Ticket> {
  return apiClient.request<Ticket>(`/tickets/${code}`, {}, true);
}
```

### Validate Ticket (Validator/Admin only)

```typescript
// api/tickets.ts
export async function validateTicket(code: string): Promise<Ticket> {
  return apiClient.request<Ticket>(
    `/tickets/validate/${code}`,
    { method: 'POST' },
    true
  );
}
```

### Tickets List Component

```typescript
// components/MyTickets.tsx
import { useState, useEffect } from 'react';
import { getMyTickets } from '../api/tickets';

export function MyTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyTickets()
      .then(setTickets)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading tickets...</div>;

  if (tickets.length === 0) {
    return <div>You don't have any tickets yet.</div>;
  }

  return (
    <div className="tickets-grid">
      {tickets.map((ticket) => (
        <TicketCard key={ticket.id} ticket={ticket} />
      ))}
    </div>
  );
}

function TicketCard({ ticket }: { ticket: Ticket }) {
  return (
    <div className="ticket-card">
      <h3>Ticket #{ticket.ticketCode}</h3>
      <img src={ticket.qrCode} alt="QR Code" className="qr-code" />
      <p>Payment: {ticket.paymentStatus}</p>
      <p>Status: {ticket.isUsed ? '✅ Used' : '🎟️ Valid'}</p>
      {ticket.isUsed && ticket.usedDate && (
        <p>Used on: {new Date(ticket.usedDate).toLocaleDateString()}</p>
      )}
    </div>
  );
}
```

## Error Handling

### Global Error Handler

```typescript
// utils/errorHandler.ts
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function handleApiError(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.statusCode) {
      case 401:
        // Redirect to login
        window.location.href = '/login';
        return 'Session expired. Please login again.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return 'Resource not found.';
      case 409:
        return error.message || 'Conflict: Resource already exists.';
      case 500:
        return 'Server error. Please try again later.';
      default:
        return error.message || 'An unexpected error occurred.';
    }
  }
  
  return 'An unexpected error occurred.';
}
```

### React Error Boundary

```typescript
// components/ErrorBoundary.tsx
import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h1>Something went wrong</h1>
          <p>{this.state.error?.message}</p>
          <button onClick={() => window.location.reload()}>
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

## Environment Variables

Create a `.env` file in your frontend project:

```env
VITE_API_URL=http://localhost:3000
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51...
```

## TypeScript Types

Create a `types/api.ts` file with all your type definitions:

```typescript
// types/api.ts
export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: 'USER' | 'ORGANIZER' | 'VALIDATOR' | 'ADMIN';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Event {
  id: number;
  name: string;
  type: 'Concierto' | 'Festival' | 'Conferencia' | 'Taller' | 'Deportivo' | 'Otro';
  description?: string;
  location: string;
  startDate: string;
  endDate: string;
  imageUrl?: string;
  capacity: number;
  price: string;
  isPublished: boolean;
  organizerId: number;
  createdAt: string;
  updatedAt: string;
}

export interface Ticket {
  id: number;
  eventId: number;
  userId: number;
  ticketCode: string;
  qrCode: string;
  purchaseDate: string;
  isUsed: boolean;
  usedDate: string | null;
  paymentId: string;
  paymentStatus: 'completed' | 'pending' | 'failed';
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  statusCode?: number;
}
```

## Testing

### Example Test with Vitest

```typescript
// api/__tests__/auth.test.ts
import { describe, it, expect, vi } from 'vitest';
import { login } from '../auth';

describe('Auth API', () => {
  it('should login successfully', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: {
            user: { id: 1, email: 'test@example.com' },
            token: 'mock-token'
          }
        })
      })
    ) as any;

    const result = await login({
      email: 'test@example.com',
      password: 'password123'
    });

    expect(result.user.email).toBe('test@example.com');
    expect(result.token).toBe('mock-token');
  });
});
```
