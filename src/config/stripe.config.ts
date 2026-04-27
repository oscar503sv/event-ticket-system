// src/config/stripe.config.ts
import Stripe from "stripe";
import { logger } from "./logger";

// Validar que las variables de entorno están configuradas
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY no está configurada en las variables de entorno");
}

if (!process.env.STRIPE_WEBHOOK_SECRET) {
  throw new Error("STRIPE_WEBHOOK_SECRET no está configurada en las variables de entorno");
}

/**
 * Cliente de Stripe inicializado con la API key
 * IMPORTANTE: En producción, usar Restricted API Key (RAK) con permisos mínimos
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16", // Última versión soportada por stripe@14.8.0
  typescript: true,
  appInfo: {
    name: "Event Ticket System",
    version: "1.0.0",
  },
});

/**
 * Secret para verificar firmas de webhooks
 * CRÍTICO: Nunca compartir este secret
 */
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

logger.info("Cliente Stripe inicializado correctamente");
