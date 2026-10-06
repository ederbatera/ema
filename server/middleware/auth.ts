import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "meteo-pulse-pro-secret-jwt-key-2026";

export interface TokenPayload {
  userId: string;
  email: string;
  role: "ADMIN" | "OPERATOR" | "VIEWER";
}

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

/**
 * Sign JWT token for user
 */
export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });
}

/**
 * Authenticate JWT Bearer Token middleware
 */
export function authenticateJWT(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      success: false,
      error: "Acesso não autorizado: Token Bearer ausente ou inválido.",
    });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({
      success: false,
      code: "TOKEN_EXPIRED",
      error: "Token expirado ou inválido. Por favor, autentique-se novamente no console.",
    });
    return;
  }
}

/**
 * Role-based Authorization Guard
 */
export function requireRole(allowedRoles: Array<"ADMIN" | "OPERATOR" | "VIEWER">) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      res.status(401).json({
        success: false,
        code: "ROLE_UNAUTHORIZED",
        error: `Permissão negada. Requer papel: ${allowedRoles.join(" ou ")}.`,
      });
      return;
    }
    next();
  };
}
