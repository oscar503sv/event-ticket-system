import type { JWTPayload } from './jwt';
import '@elysiajs/jwt';

declare module 'elysia' {
  interface ElysiaContext {
    jwt: {
      sign: (payload: JWTPayload) => Promise<string>;
      verify: (token: string) => Promise<JWTPayload | null>;
    };
    auth?: (token: string) => Promise<JWTPayload>;
    user?: JWTPayload;
  }
}