declare module "@elysiajs/jwt" {
  interface JWT {
    sign: (payload: JWTPayload) => Promise<string>;
    verify: (token: string) => Promise<JWTPayload | null>;
  }
}

export interface JWTPayload {
  sub: number;
  role: string;
  iat?: number;
  exp?: number;
}
