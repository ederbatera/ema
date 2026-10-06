import { Request, Response, NextFunction } from "express";

export class AppError extends Error {
  public statusCode: number;
  public details?: any;

  constructor(message: string, statusCode: number = 500, details?: any) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Centralized RESTful Error Handler Middleware
 */
export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const rawStatusCode = "statusCode" in err && typeof err.statusCode === "number" ? err.statusCode : 500;
  // In Cloud Run / Nginx reverse-proxy, proxy_intercept_errors turns HTTP 403 into /forbidden.html (text/html).
  // We sanitize 403 to 401 so the API client always receives standard, parseable JSON.
  const statusCode = rawStatusCode === 403 ? 401 : rawStatusCode;
  const message = err.message || "Erro interno do servidor.";
  const details = "details" in err ? err.details : undefined;

  console.error(`[API Error] ${req.method} ${req.originalUrl} - Status ${statusCode}:`, err);

  res.status(statusCode).json({
    success: false,
    error: message,
    statusCode,
    path: req.originalUrl,
    timestamp: new Date().toISOString(),
    ...(details ? { details } : {}),
  });
}
