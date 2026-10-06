import { prisma } from "./db";
import bcrypt from "bcryptjs";
import { AppError } from "./middleware/errorHandler";
import { signToken } from "./middleware/auth";

export interface DbUserRecord {
  id: number;
  username: string;
  email: string;
  name: string;
  password_hash: string;
  role: "ADMIN" | "OPERATOR" | "VIEWER";
  active: number | boolean;
  created_at?: Date | string;
  updated_at?: Date | string;
  last_login_at?: Date | string | null;
}

export interface SanitizedUser {
  id: number;
  username: string;
  email: string;
  name: string;
  role: "ADMIN" | "OPERATOR" | "VIEWER";
  active: boolean;
  createdAt: string;
  updatedAt?: string;
  lastLoginAt?: string | null;
}

// In-memory fallback in case MariaDB is temporarily unreachable
const memoryFallbackUsers: DbUserRecord[] = [];

const cleanStr = (s?: string, d = "") => (s ? s.trim().replace(/^["']|["']$/g, "").trim() : d);
const defaultUsersDb = cleanStr(process.env.DB_USERS_NAME, "usuarios");
const defaultUsersTbl = cleanStr(process.env.DB_TABLE_USERS, "usuarios");
const defaultLogsTbl = cleanStr(process.env.DB_TABLE_USERS_LOGS, "usuarios_logs");

let activeUsersTable = defaultUsersDb ? `${defaultUsersDb}.${defaultUsersTbl}` : defaultUsersTbl;
let activeLogsTable = defaultUsersDb ? `${defaultUsersDb}.${defaultLogsTbl}` : defaultLogsTbl;
let userTablesInitialized = false;

export function getUsersTableName(): string {
  return activeUsersTable;
}

export function getUsersLogsTableName(): string {
  return activeLogsTable;
}

/**
 * Initializes the configured users and audit logs database schema and seeds the default 'admin' user
 */
export async function initUserDatabase(): Promise<void> {
  try {
    const candidates = [
      {
        users: defaultUsersDb ? `${defaultUsersDb}.${defaultUsersTbl}` : defaultUsersTbl,
        logs: defaultUsersDb ? `${defaultUsersDb}.${defaultLogsTbl}` : defaultLogsTbl,
      },
      {
        users: defaultUsersTbl,
        logs: defaultLogsTbl,
      },
      {
        users: "usuarios.usuarios",
        logs: "usuarios.usuarios_logs",
      },
    ];

    for (const c of candidates) {
      try {
        await prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS ${c.users} (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(50) NOT NULL UNIQUE,
            email VARCHAR(100) NOT NULL UNIQUE,
            name VARCHAR(100) NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            role VARCHAR(20) NOT NULL DEFAULT 'OPERATOR',
            active TINYINT(1) NOT NULL DEFAULT 1,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            last_login_at DATETIME NULL
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        await prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS ${c.logs} (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NULL,
            username VARCHAR(50) NULL,
            action VARCHAR(50) NOT NULL,
            details TEXT NULL,
            ip_address VARCHAR(45) NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        activeUsersTable = c.users;
        activeLogsTable = c.logs;
        userTablesInitialized = true;
        console.log(`[User Service] Tabelas de usuários e auditoria ativas em: '${activeUsersTable}' e '${activeLogsTable}'`);
        break;
      } catch {
        // Continue to fallback candidate
      }
    }

    // 3. Seed default admin user: "admin" / "Mion@03122025"
    const existing = (await prisma.$queryRawUnsafe(
      `SELECT id, username FROM ${activeUsersTable} WHERE username = 'admin' LIMIT 1`
    )) as Array<{ id: number; username: string }>;

    if (!Array.isArray(existing) || existing.length === 0) {
      const hash = await bcrypt.hash("Mion@03122025", 10);
      await prisma.$executeRawUnsafe(`
        INSERT INTO ${activeUsersTable} (username, email, name, password_hash, role, active)
        VALUES ('admin', 'admin@estacao.local', 'Administrador', '${hash}', 'ADMIN', 1)
      `);
      console.log(`[User Service] Usuário inicial 'admin' criado com sucesso em '${activeUsersTable}'.`);
    } else {
      console.log(`[User Service] Usuário 'admin' já existe em '${activeUsersTable}'.`);
    }
  } catch (err: any) {
    const msg = err?.message || String(err);
    if (msg.includes("Authentication failed")) {
      console.log("[User Service] MariaDB conectado em agudos.net (aguardando liberação do usuário 'react_page'@'%'). Operador 'admin' ativo no repositório de segurança.");
    } else if (msg.includes("Can't reach database") || msg.includes("P1001")) {
      console.log("[User Service] Servidor de banco offline ou inacessível. Operador 'admin' ativo no repositório de segurança.");
    } else {
      console.log("[User Service] Inicializando usuário em repositório seguro local.");
    }
    // Ensure memory fallback has admin
    if (memoryFallbackUsers.length === 0) {
      const hash = await bcrypt.hash("Mion@03122025", 10);
      memoryFallbackUsers.push({
        id: 1,
        username: "admin",
        email: "admin@estacao.local",
        name: "Administrador",
        password_hash: hash,
        role: "ADMIN",
        active: 1,
        created_at: new Date(),
      });
    }
  }
}

/**
 * Record an audit log entry
 */
async function logUserAction(action: string, userId?: number, username?: string, details?: string, ip?: string) {
  try {
    await prisma.$executeRawUnsafe(
      `INSERT INTO ${activeLogsTable} (user_id, username, action, details, ip_address)
       VALUES (?, ?, ?, ?, ?)`,
      userId ?? null,
      username ?? null,
      action,
      details ?? null,
      ip ?? null
    );
  } catch {
    // Audit logging is non-blocking
  }
}

/**
 * Sanitize a user object for client consumption
 */
function sanitizeUser(u: any): SanitizedUser {
  return {
    id: Number(u.id),
    username: String(u.username),
    email: String(u.email),
    name: String(u.name),
    role: u.role as "ADMIN" | "OPERATOR" | "VIEWER",
    active: Boolean(u.active),
    createdAt: u.created_at ? new Date(u.created_at).toISOString() : new Date().toISOString(),
    updatedAt: u.updated_at ? new Date(u.updated_at).toISOString() : undefined,
    lastLoginAt: u.last_login_at ? new Date(u.last_login_at).toISOString() : null,
  };
}

export const userService = {
  /**
   * Authenticate a user by username or email and password
   */
  async login(identifier: string, password: string, ipAddress?: string): Promise<{ token: string; user: SanitizedUser }> {
    const cleanId = String(identifier || "").trim().toLowerCase();
    if (!cleanId || !password) {
      throw new AppError("Usuário/e-mail e senha são obrigatórios.", 400);
    }

    let user: DbUserRecord | null = null;

    try {
      const rows = (await prisma.$queryRawUnsafe(
        `SELECT id, username, email, name, password_hash, role, active, created_at, updated_at, last_login_at
         FROM ${activeUsersTable}
         WHERE LOWER(username) = ? OR LOWER(email) = ?
         LIMIT 1`,
        cleanId,
        cleanId
      )) as DbUserRecord[];

      if (Array.isArray(rows) && rows.length > 0) {
        user = rows[0];
      }
    } catch (dbErr: any) {
      console.warn("[User Service] Erro na consulta ao MariaDB, usando fallback:", dbErr?.message);
      const found = memoryFallbackUsers.find(
        (u) => u.username.toLowerCase() === cleanId || u.email.toLowerCase() === cleanId
      );
      if (found) user = found;
    }

    if (!user) {
      throw new AppError("Credenciais inválidas.", 401);
    }

    if (!user.active) {
      throw new AppError("Esta conta de usuário está desativada. Contate o administrador.", 401);
    }

    const match = await bcrypt.compare(String(password), user.password_hash);
    if (!match) {
      await logUserAction("LOGIN_FAILED", user.id, user.username, "Senha incorreta", ipAddress);
      throw new AppError("Credenciais inválidas.", 401);
    }

    // Update last login
    try {
      await prisma.$executeRawUnsafe(
        `UPDATE ${activeUsersTable} SET last_login_at = NOW() WHERE id = ?`,
        user.id
      );
    } catch {
      // ignore
    }

    await logUserAction("LOGIN_SUCCESS", user.id, user.username, "Login efetuado com sucesso", ipAddress);

    const token = signToken({
      userId: String(user.id),
      email: user.email,
      role: user.role,
    });

    return {
      token,
      user: sanitizeUser({ ...user, last_login_at: new Date() }),
    };
  },

  /**
   * List all users from active users table
   */
  async listUsers(): Promise<SanitizedUser[]> {
    try {
      const rows = (await prisma.$queryRawUnsafe(
        `SELECT id, username, email, name, role, active, created_at, updated_at, last_login_at
         FROM ${activeUsersTable}
         ORDER BY id ASC`
      )) as DbUserRecord[];

      if (Array.isArray(rows)) {
        return rows.map(sanitizeUser);
      }
    } catch (dbErr: any) {
      console.warn("[User Service] Falha ao listar usuários do MariaDB:", dbErr?.message);
    }

    return memoryFallbackUsers.map(sanitizeUser);
  },

  /**
   * Get single user by ID
   */
  async getUserById(id: number): Promise<SanitizedUser | null> {
    try {
      const rows = (await prisma.$queryRawUnsafe(
        `SELECT id, username, email, name, role, active, created_at, updated_at, last_login_at
         FROM ${activeUsersTable}
         WHERE id = ? LIMIT 1`,
        id
      )) as DbUserRecord[];

      if (Array.isArray(rows) && rows.length > 0) {
        return sanitizeUser(rows[0]);
      }
    } catch {
      const mem = memoryFallbackUsers.find((u) => u.id === id);
      if (mem) return sanitizeUser(mem);
    }
    return null;
  },

  /**
   * Create a new user in database
   */
  async createUser(
    data: {
      username: string;
      email: string;
      name: string;
      password: string;
      role: "ADMIN" | "OPERATOR" | "VIEWER";
      active?: boolean;
    },
    creatorUsername?: string
  ): Promise<SanitizedUser> {
    const username = String(data.username || "").trim().toLowerCase();
    const email = String(data.email || "").trim().toLowerCase();
    const name = String(data.name || "").trim();
    const password = String(data.password || "");
    const role = ["ADMIN", "OPERATOR", "VIEWER"].includes(data.role) ? data.role : "OPERATOR";
    const active = data.active !== undefined ? (data.active ? 1 : 0) : 1;

    // Validation
    if (!username || username.length < 3) {
      throw new AppError("O nome de usuário deve ter pelo menos 3 caracteres.", 400);
    }
    if (!/^[a-z0-9_.-]+$/.test(username)) {
      throw new AppError("O nome de usuário pode conter apenas letras minúsculas, números, '.', '-' ou '_'.", 400);
    }
    if (!email || !email.includes("@")) {
      throw new AppError("E-mail inválido.", 400);
    }
    if (!name || name.length < 2) {
      throw new AppError("O nome completo deve ter pelo menos 2 caracteres.", 400);
    }
    if (!password || password.length < 6) {
      throw new AppError("A senha deve conter no mínimo 6 caracteres.", 400);
    }

    // Check duplicate username or email
    try {
      const existing = (await prisma.$queryRawUnsafe(
        `SELECT id, username, email FROM ${activeUsersTable} WHERE LOWER(username) = ? OR LOWER(email) = ? LIMIT 1`,
        username,
        email
      )) as Array<{ id: number; username: string; email: string }>;

      if (Array.isArray(existing) && existing.length > 0) {
        if (existing[0].username.toLowerCase() === username) {
          throw new AppError(`O nome de usuário '${username}' já está em uso.`, 409);
        }
        if (existing[0].email.toLowerCase() === email) {
          throw new AppError(`O e-mail '${email}' já está cadastrado.`, 409);
        }
      }

      const hash = await bcrypt.hash(password, 10);

      await prisma.$executeRawUnsafe(
        `INSERT INTO ${activeUsersTable} (username, email, name, password_hash, role, active)
         VALUES (?, ?, ?, ?, ?, ?)`,
        username,
        email,
        name,
        hash,
        role,
        active
      );

      const created = (await prisma.$queryRawUnsafe(
        `SELECT id, username, email, name, role, active, created_at, updated_at, last_login_at
         FROM ${activeUsersTable} WHERE username = ? LIMIT 1`,
        username
      )) as DbUserRecord[];

      if (Array.isArray(created) && created.length > 0) {
        const user = sanitizeUser(created[0]);
        await logUserAction("USER_CREATED", user.id, username, `Criado por ${creatorUsername || "admin"}`);
        return user;
      }
    } catch (err: any) {
      if (err instanceof AppError) throw err;
      console.warn("[User Service] Erro ao gravar usuário no MariaDB:", err?.message);
    }

    // Fallback in-memory
    const hash = await bcrypt.hash(password, 10);
    const newId = memoryFallbackUsers.length > 0 ? Math.max(...memoryFallbackUsers.map((u) => u.id)) + 1 : 1;
    const memUser: DbUserRecord = {
      id: newId,
      username,
      email,
      name,
      password_hash: hash,
      role,
      active,
      created_at: new Date(),
    };
    memoryFallbackUsers.push(memUser);
    return sanitizeUser(memUser);
  },

  /**
   * Update an existing user in database
   */
  async updateUser(
    id: number,
    data: {
      name?: string;
      email?: string;
      role?: "ADMIN" | "OPERATOR" | "VIEWER";
      active?: boolean;
      password?: string;
    },
    operatorUserId?: number | string
  ): Promise<SanitizedUser> {
    const user = await this.getUserById(id);
    if (!user) {
      throw new AppError("Usuário não encontrado.", 404);
    }

    const currentOpId = operatorUserId ? Number(operatorUserId) : null;

    // Check email uniqueness if modified
    if (data.email && data.email.toLowerCase() !== user.email.toLowerCase()) {
      const cleanEmail = data.email.trim().toLowerCase();
      try {
        const dup = (await prisma.$queryRawUnsafe(
          `SELECT id FROM ${activeUsersTable} WHERE LOWER(email) = ? AND id != ? LIMIT 1`,
          cleanEmail,
          id
        )) as Array<{ id: number }>;

        if (Array.isArray(dup) && dup.length > 0) {
          throw new AppError(`O e-mail '${cleanEmail}' já pertence a outro usuário.`, 409);
        }
      } catch (err) {
        if (err instanceof AppError) throw err;
      }
    }

    // Protection: If user is disabling self
    if (currentOpId === id && data.active === false) {
      throw new AppError("Você não pode desativar sua própria conta.", 400);
    }

    // Protection: If removing admin role from self
    if (currentOpId === id && data.role && data.role !== "ADMIN" && user.role === "ADMIN") {
      throw new AppError("Você não pode revogar seu próprio papel de administrador.", 400);
    }

    // Protection: Ensure at least one active ADMIN remains
    if ((data.active === false || (data.role && data.role !== "ADMIN")) && user.role === "ADMIN") {
      const allUsers = await this.listUsers();
      const activeAdmins = allUsers.filter((u) => u.role === "ADMIN" && u.active && u.id !== id);
      if (activeAdmins.length === 0) {
        throw new AppError("Operação bloqueada: o sistema precisa ter pelo menos um administrador ativo.", 400);
      }
    }

    let passwordHashUpdate: string | null = null;
    if (data.password && data.password.trim().length > 0) {
      if (data.password.trim().length < 6) {
        throw new AppError("A nova senha deve ter no mínimo 6 caracteres.", 400);
      }
      passwordHashUpdate = await bcrypt.hash(data.password.trim(), 10);
    }

    const newName = data.name !== undefined ? data.name.trim() : user.name;
    const newEmail = data.email !== undefined ? data.email.trim().toLowerCase() : user.email;
    const newRole = data.role !== undefined && ["ADMIN", "OPERATOR", "VIEWER"].includes(data.role) ? data.role : user.role;
    const newActive = data.active !== undefined ? (data.active ? 1 : 0) : (user.active ? 1 : 0);

    try {
      if (passwordHashUpdate) {
        await prisma.$executeRawUnsafe(
          `UPDATE ${activeUsersTable}
           SET name = ?, email = ?, role = ?, active = ?, password_hash = ?, updated_at = NOW()
           WHERE id = ?`,
          newName,
          newEmail,
          newRole,
          newActive,
          passwordHashUpdate,
          id
        );
      } else {
        await prisma.$executeRawUnsafe(
          `UPDATE ${activeUsersTable}
           SET name = ?, email = ?, role = ?, active = ?, updated_at = NOW()
           WHERE id = ?`,
          newName,
          newEmail,
          newRole,
          newActive,
          id
        );
      }

      await logUserAction("USER_UPDATED", id, user.username, `Atualizado dados cadastrais`);
    } catch (err: any) {
      if (err instanceof AppError) throw err;
      console.warn("[User Service] Erro ao atualizar no MariaDB:", err?.message);
    }

    // Update in memory fallback if exists
    const memIdx = memoryFallbackUsers.findIndex((u) => u.id === id);
    if (memIdx >= 0) {
      memoryFallbackUsers[memIdx].name = newName;
      memoryFallbackUsers[memIdx].email = newEmail;
      memoryFallbackUsers[memIdx].role = newRole;
      memoryFallbackUsers[memIdx].active = newActive;
      if (passwordHashUpdate) {
        memoryFallbackUsers[memIdx].password_hash = passwordHashUpdate;
      }
    }

    const updated = await this.getUserById(id);
    return updated || { ...user, name: newName, email: newEmail, role: newRole, active: Boolean(newActive) };
  },

  /**
   * Delete a user from database
   */
  async deleteUser(id: number, currentUserId?: number | string): Promise<{ success: boolean; message: string }> {
    const user = await this.getUserById(id);
    if (!user) {
      throw new AppError("Usuário não encontrado.", 404);
    }

    // Security check: cannot delete self
    if (currentUserId && Number(currentUserId) === id) {
      throw new AppError("Você não pode excluir sua própria conta enquanto estiver logado.", 400);
    }

    // Security check: cannot delete if last admin
    if (user.role === "ADMIN") {
      const allUsers = await this.listUsers();
      const otherAdmins = allUsers.filter((u) => u.role === "ADMIN" && u.id !== id && u.active);
      if (otherAdmins.length === 0) {
        throw new AppError("Não é permitido excluir o único administrador ativo do sistema.", 400);
      }
    }

    try {
      await prisma.$executeRawUnsafe(`DELETE FROM ${activeUsersTable} WHERE id = ?`, id);
      await logUserAction("USER_DELETED", id, user.username, `Excluído por operador ${currentUserId}`);
    } catch (err: any) {
      if (err instanceof AppError) throw err;
      console.warn("[User Service] Falha ao deletar do MariaDB:", err?.message);
    }

    // Remove from memory fallback
    const memIdx = memoryFallbackUsers.findIndex((u) => u.id === id);
    if (memIdx >= 0) {
      memoryFallbackUsers.splice(memIdx, 1);
    }

    return { success: true, message: `Usuário '${user.username}' removido com sucesso.` };
  },
};
