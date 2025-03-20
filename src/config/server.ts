// src/config/server.ts
import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';
import { logger } from './logger';

export function createServer() {
  const app = new Elysia()
    .use(cors())
    .use(
      swagger({
        documentation: {
          info: {
            title: 'API de Gestión de Eventos y Tickets',
            version: '1.0.0',
            description: 'API para gestionar eventos, tickets y pagos',
          },
          tags: [
            { name: 'Auth', description: 'Autenticación de usuarios' },
            { name: 'Events', description: 'Gestión de eventos' },
            { name: 'Tickets', description: 'Gestión de tickets' },
            { name: 'Payments', description: 'Procesamiento de pagos' },
          ],
        },
      })
    );

  return app;
}