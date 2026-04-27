// src/types/stripe.d.ts
import type Stripe from "stripe";

/**
 * Metadata personalizada para Checkout Sessions
 * Esta metadata se pasa a Stripe y nos es devuelta en los webhooks
 */
export interface CheckoutSessionMetadata {
  eventId: string;
  userId: string;
  eventName: string;
}

/**
 * Datos para crear un ticket desde un pago exitoso
 */
export interface CreateTicketFromPaymentData {
  eventId: number;
  userId: number;
  paymentId: string;
  paymentStatus: "completed";
}

/**
 * Respuesta al crear una sesión de checkout
 */
export interface CreateCheckoutSessionResponse {
  sessionId: string;
  clientSecret: string | null;
}

/**
 * Estado de una sesión de checkout
 */
export interface CheckoutSessionStatus {
  status: Stripe.Checkout.Session.Status;
  paymentStatus: Stripe.Checkout.Session.PaymentStatus;
  customerEmail: string | null | undefined;
}
