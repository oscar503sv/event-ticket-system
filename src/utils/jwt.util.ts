// src/utils/jwt.util.ts
import * as jsonwebtoken from "jsonwebtoken";
import type { JWTPayload } from "../types/jwt.d";

const JWT_SECRET = process.env.JWT_SECRET || "your_super_secret_key_change_in_production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

/**
 * Firma un payload y genera un token JWT
 * @param payload - Datos a incluir en el token
 * @returns Token JWT firmado
 */
export async function signToken(payload: JWTPayload): Promise<string> {
  // Calcular tiempo de expiración
  const expiresIn = parseExpiresIn(JWT_EXPIRES_IN);

  const tokenPayload = {
    ...payload,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + expiresIn,
  };

  return jsonwebtoken.sign(tokenPayload, JWT_SECRET);
}

/**
 * Verifica un token JWT y retorna el payload
 * @param token - Token JWT a verificar
 * @returns Payload del token o null si es inválido
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const decoded = jsonwebtoken.verify(token, JWT_SECRET) as unknown as JWTPayload;
    return decoded;
  } catch (_error) {
    return null;
  }
}

/**
 * Parsea el string de expiración a segundos
 * @param expiresIn - String como '7d', '24h', '60m'
 * @returns Segundos de expiración
 */
function parseExpiresIn(expiresIn: string): number {
  const unit = expiresIn.slice(-1);
  const value = Number.parseInt(expiresIn.slice(0, -1), 10);

  switch (unit) {
    case "d":
      return value * 24 * 60 * 60; // días a segundos
    case "h":
      return value * 60 * 60; // horas a segundos
    case "m":
      return value * 60; // minutos a segundos
    case "s":
      return value; // ya en segundos
    default:
      return 7 * 24 * 60 * 60; // default 7 días
  }
}
