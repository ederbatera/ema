import { Router, Response } from "express";
import { userService } from "../userService";
import { authenticateJWT, requireRole, AuthenticatedRequest } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";

export const usersRouter = Router();

// All user management routes require valid JWT
usersRouter.use(authenticateJWT);

/**
 * GET /api/users
 * Returns list of all registered users
 */
usersRouter.get("/", async (_req: AuthenticatedRequest, res: Response, next) => {
  try {
    const users = await userService.listUsers();
    res.json({
      success: true,
      data: users,
      total: users.length,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/users/:id
 * Returns a specific user profile
 */
usersRouter.get("/:id", async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      throw new AppError("ID de usuário inválido.", 400);
    }
    const user = await userService.getUserById(id);
    if (!user) {
      throw new AppError("Usuário não encontrado.", 404);
    }
    res.json({
      success: true,
      data: user,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/users
 * Creates a new user (ADMIN or OPERATOR only)
 */
usersRouter.post("/", requireRole(["ADMIN", "OPERATOR"]), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { username, email, name, password, role, active } = req.body;
    const operatorUsername = req.user?.email || "operador";

    const newUser = await userService.createUser(
      {
        username,
        email,
        name,
        password,
        role,
        active,
      },
      operatorUsername
    );

    res.status(201).json({
      success: true,
      message: `Usuário '${newUser.username}' criado com sucesso.`,
      data: newUser,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/users/:id
 * Updates an existing user (ADMIN or OPERATOR only)
 */
usersRouter.put("/:id", requireRole(["ADMIN", "OPERATOR"]), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      throw new AppError("ID de usuário inválido.", 400);
    }

    const { name, email, role, active, password } = req.body;
    const currentUserId = req.user?.userId;

    // Only ADMIN can change other users to ADMIN
    if (role === "ADMIN" && req.user?.role !== "ADMIN") {
      throw new AppError("Apenas administradores podem atribuir o perfil ADMIN.", 401);
    }

    const updatedUser = await userService.updateUser(
      id,
      {
        name,
        email,
        role,
        active,
        password,
      },
      currentUserId
    );

    res.json({
      success: true,
      message: `Usuário '${updatedUser.username}' atualizado com sucesso.`,
      data: updatedUser,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/users/:id
 * Deletes a user (ADMIN only)
 */
usersRouter.delete("/:id", requireRole(["ADMIN"]), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      throw new AppError("ID de usuário inválido.", 400);
    }

    const currentUserId = req.user?.userId;
    const result = await userService.deleteUser(id, currentUserId);

    res.json(result);
  } catch (err) {
    next(err);
  }
});
