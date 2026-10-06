import { Router, Request, Response } from "express";
import { userService } from "../userService";
import { authenticateJWT, AuthenticatedRequest } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";

export const authRouter = Router();

/**
 * POST /api/auth/login
 * Public endpoint to authenticate with username/email & password and retrieve JWT
 */
authRouter.post("/login", async (req: Request, res: Response, next) => {
  try {
    const { username, email, identifier, password } = req.body;
    const loginId = identifier || username || email;

    if (!loginId || !password) {
      throw new AppError("Usuário e senha são obrigatórios.", 400);
    }

    const result = await userService.login(String(loginId), String(password), req.ip);

    res.json({
      success: true,
      message: "Autenticação realizada com sucesso no console.",
      token: result.token,
      user: result.user,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/auth/me
 * Protected endpoint returning current user profile from JWT
 */
authRouter.get("/me", authenticateJWT, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    if (!req.user) {
      throw new AppError("Usuário não autenticado.", 401);
    }

    const userId = parseInt(req.user.userId, 10);
    const user = !isNaN(userId) ? await userService.getUserById(userId) : null;

    if (!user) {
      throw new AppError("Usuário não encontrado.", 404);
    }

    res.json({
      success: true,
      user,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/logout
 * Informative endpoint to record logout
 */
authRouter.post("/logout", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  res.json({
    success: true,
    message: "Sessão do console encerrada com sucesso.",
  });
});
