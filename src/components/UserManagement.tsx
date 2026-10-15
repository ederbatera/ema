import React, { useState, useEffect, useCallback } from "react";
import { AuthUser, ManagedUser } from "../types";
import { safeFetchJson } from "../lib/api";

interface UserManagementProps {
  currentUser: AuthUser;
  token: string | null;
  onUserModified?: () => void;
  onUnauthorized?: () => void;
}

export const UserManagement: React.FC<UserManagementProps> = ({
  currentUser,
  token,
  onUserModified,
  onUnauthorized,
}) => {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSessionExpired, setIsSessionExpired] = useState(false);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null);

  // Form states - Create
  const [createUsername, setCreateUsername] = useState("");
  const [createName, setCreateName] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createRole, setCreateRole] = useState<"ADMIN" | "OPERATOR" | "VIEWER">("OPERATOR");
  const [createActive, setCreateActive] = useState(true);
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);

  // Form states - Edit
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState<"ADMIN" | "OPERATOR" | "VIEWER">("OPERATOR");
  const [editActive, setEditActive] = useState(true);
  const [editNewPassword, setEditNewPassword] = useState("");
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Delete state
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false);

  const showNotification = (msg: string, isError = false) => {
    if (isError) {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(null), 5000);
    } else {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  // Fetch users from API
  const fetchUsers = useCallback(async () => {
    if (!token) {
      setIsSessionExpired(true);
      return;
    }
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await safeFetchJson<{ success: boolean; data?: ManagedUser[]; error?: string }>("/api/users", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok && res.data?.success && Array.isArray(res.data.data)) {
        setUsers(res.data.data);
        setIsSessionExpired(false);
      } else {
        if (res.status === 401 || res.status === 403 || res.error?.includes("expirado") || res.error?.includes("autentique-se")) {
          setIsSessionExpired(true);
          showNotification("Sua sessão expirou. Por favor, autentique-se novamente no console.", true);
        } else {
          showNotification(res.data?.error || res.error || "Falha ao carregar lista de usuários.", true);
        }
      }
    } catch (err: any) {
      showNotification(err.message || "Erro de rede ao buscar usuários.", true);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Open Edit modal
  const handleOpenEdit = (user: ManagedUser) => {
    setSelectedUser(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditRole(user.role);
    setEditActive(user.active);
    setEditNewPassword("");
    setIsEditOpen(true);
  };

  // Open Delete modal
  const handleOpenDelete = (user: ManagedUser) => {
    setSelectedUser(user);
    setIsDeleteOpen(true);
  };

  // Handle Create User Submit
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setIsSubmittingCreate(true);
    setErrorMsg(null);

    try {
      const res = await safeFetchJson<{ success: boolean; message?: string; error?: string; data?: ManagedUser }>(
        "/api/users",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            username: createUsername,
            name: createName,
            email: createEmail,
            password: createPassword,
            role: createRole,
            active: createActive,
          }),
        }
      );

      if (res.ok && res.data?.success) {
        showNotification(`Usuário '${createUsername}' criado com sucesso no banco de dados!`);
        setIsCreateOpen(false);
        // Reset form
        setCreateUsername("");
        setCreateName("");
        setCreateEmail("");
        setCreatePassword("");
        setCreateRole("OPERATOR");
        setCreateActive(true);
        fetchUsers();
        onUserModified?.();
      } else {
        showNotification(res.data?.error || res.error || "Erro ao cadastrar usuário.", true);
      }
    } catch (err: any) {
      showNotification(err.message || "Erro inesperado ao criar usuário.", true);
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  // Handle Edit User Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedUser) return;
    setIsSubmittingEdit(true);
    setErrorMsg(null);

    try {
      const payload: any = {
        name: editName,
        email: editEmail,
        role: editRole,
        active: editActive,
      };

      if (editNewPassword.trim().length > 0) {
        payload.password = editNewPassword.trim();
      }

      const res = await safeFetchJson<{ success: boolean; message?: string; error?: string; data?: ManagedUser }>(
        `/api/users/${selectedUser.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (res.ok && res.data?.success) {
        showNotification(`Usuário '${selectedUser.username}' atualizado com sucesso!`);
        setIsEditOpen(false);
        fetchUsers();
        onUserModified?.();
      } else {
        showNotification(res.data?.error || res.error || "Erro ao atualizar usuário.", true);
      }
    } catch (err: any) {
      showNotification(err.message || "Erro inesperado ao atualizar usuário.", true);
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // Handle Delete User Submit
  const handleDeleteSubmit = async () => {
    if (!token || !selectedUser) return;
    setIsSubmittingDelete(true);
    setErrorMsg(null);

    try {
      const res = await safeFetchJson<{ success: boolean; message?: string; error?: string }>(
        `/api/users/${selectedUser.id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.ok && res.data?.success) {
        showNotification(`Usuário '${selectedUser.username}' removido do banco com sucesso.`);
        setIsDeleteOpen(false);
        fetchUsers();
        onUserModified?.();
      } else {
        showNotification(res.data?.error || res.error || "Erro ao excluir usuário.", true);
      }
    } catch (err: any) {
      showNotification(err.message || "Erro inesperado ao excluir usuário.", true);
    } finally {
      setIsSubmittingDelete(false);
    }
  };

  // Filtered list
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "Nunca";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return String(dateStr);
    }
  };

  const isCurrentUser = (user: ManagedUser) => {
    return String(user.id) === String(currentUser.id) || user.username.toLowerCase() === currentUser.username?.toLowerCase();
  };

  return (
    <div className="space-y-5">
      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-[#3e484f]/40 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400" />
            <span className="font-mono text-[11px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
              Banco de Dados: usuarios.usuarios (MariaDB)
            </span>
          </div>
          <h4 className="text-base font-semibold text-slate-800 dark:text-[#dfe2f1] mt-0.5">
            Gerenciamento de Contas e Operadores
          </h4>
          <p className="text-xs text-slate-500 dark:text-[#87929a]">
            {users.length} {users.length === 1 ? "usuário cadastrado" : "usuários cadastrados"} • Criptografia bcrypt ativa
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchUsers}
            disabled={isLoading}
            className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-[#1c2230] dark:hover:bg-[#262e40] text-slate-700 dark:text-[#dfe2f1] border border-slate-200 dark:border-[#3e484f]/40 text-xs font-mono font-medium transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Recarregar usuários do banco de dados"
          >
            <span className={`material-symbols-outlined text-base ${isLoading ? "animate-spin" : ""}`}>
              refresh
            </span>
            <span>Atualizar</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="px-3.5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">person_add</span>
            <span>Novo Usuário</span>
          </button>
        </div>
      </div>

      {/* Session Expired Banner */}
      {isSessionExpired && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 dark:bg-amber-950/50 dark:border-amber-500/50 dark:text-amber-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-100 border border-amber-300 text-amber-700 dark:bg-amber-500/20 dark:border-amber-500/30 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-xl">lock_reset</span>
            </div>
            <div>
              <p className="font-semibold text-amber-950 dark:text-amber-300">Sua sessão expirou ou o token JWT precisa ser renovado</p>
              <p className="text-[11px] text-amber-800/80 dark:text-amber-400/80 font-mono">Por segurança, realize o login novamente no console para carregar e gerenciar os usuários.</p>
            </div>
          </div>
          {onUnauthorized && (
            <button
              type="button"
              onClick={onUnauthorized}
              className="px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold font-mono text-xs flex items-center gap-1.5 transition-colors cursor-pointer flex-shrink-0"
            >
              <span className="material-symbols-outlined text-sm">login</span>
              Fazer Login Novamente
            </button>
          )}
        </div>
      )}

      {/* Notifications */}
      {errorMsg && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-900 dark:bg-red-950/50 dark:border-red-500/40 dark:text-red-200 text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-red-600 dark:text-red-400 text-base">error</span>
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 dark:bg-emerald-950/50 dark:border-emerald-500/40 dark:text-emerald-200 text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-base">check_circle</span>
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-200">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 dark:text-[#87929a] text-lg pointer-events-none">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por usuário, nome ou e-mail..."
            className="w-full bg-white dark:bg-[#0e121a] border border-slate-300 dark:border-[#3e484f]/40 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 dark:text-[#dfe2f1] placeholder:text-slate-400 dark:placeholder:text-[#525a66] focus:outline-none focus:ring-1 focus:ring-sky-500 font-mono shadow-xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-2 text-slate-400 hover:text-slate-700 dark:text-[#87929a] dark:hover:text-[#dfe2f1]"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-mono text-slate-500 dark:text-[#87929a] whitespace-nowrap">Perfil:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-white dark:bg-[#0e121a] border border-slate-300 dark:border-[#3e484f]/40 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-[#dfe2f1] focus:outline-none focus:ring-1 focus:ring-sky-500 font-mono shadow-xs"
          >
            <option value="ALL">Todos os Perfis</option>
            <option value="ADMIN">ADMIN</option>
            <option value="OPERATOR">OPERATOR</option>
            <option value="VIEWER">VIEWER</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-xl border border-slate-200 dark:border-[#3e484f]/40 bg-white dark:bg-[#0a0e18] overflow-hidden shadow-xs dark:shadow-inner">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-[#3e484f]/40 bg-slate-50 dark:bg-[#111622] font-mono text-[11px] text-slate-600 dark:text-[#87929a]">
                <th className="py-3 px-4">USUÁRIO / NOME</th>
                <th className="py-3 px-4">E-MAIL</th>
                <th className="py-3 px-4">PERFIL</th>
                <th className="py-3 px-4">STATUS</th>
                <th className="py-3 px-4 hidden md:table-cell">CADASTRO</th>
                <th className="py-3 px-4 hidden lg:table-cell">ÚLTIMO ACESSO</th>
                <th className="py-3 px-4 text-right">AÇÕES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-[#3e484f]/20">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 dark:text-[#87929a] font-mono">
                    {isLoading ? (
                      <div className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                        <span>Carregando usuários do MariaDB...</span>
                      </div>
                    ) : (
                      "Nenhum usuário encontrado com os filtros selecionados."
                    )}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isSelf = isCurrentUser(u);
                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-[#131926]/70 transition-colors group"
                    >
                      {/* Name & Username */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs font-mono uppercase ${
                            u.role === "ADMIN"
                              ? "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-400 border border-sky-200 dark:border-sky-500/30"
                              : u.role === "OPERATOR"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30"
                              : "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30"
                          }`}>
                            {u.username.slice(0, 2)}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-slate-800 dark:text-[#dfe2f1]">{u.name}</span>
                              {isSelf && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-400 border border-sky-200 dark:border-sky-500/30">
                                  Você
                                </span>
                              )}
                            </div>
                            <span className="font-mono text-[11px] text-slate-500 dark:text-[#87929a]">@{u.username}</span>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-3 px-4 font-mono text-slate-600 dark:text-[#bdc8d1]">
                        {u.email}
                      </td>

                      {/* Role */}
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-mono text-[10px] font-bold ${
                          u.role === "ADMIN"
                            ? "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400 border border-sky-200 dark:border-sky-500/30"
                            : u.role === "OPERATOR"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30"
                        }`}>
                          {u.role}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        {u.active ? (
                          <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-[11px] font-mono">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                            Ativo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-slate-400 dark:text-[#87929a] text-[11px] font-mono">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-[#87929a]" />
                            Inativo
                          </span>
                        )}
                      </td>

                      {/* Created At */}
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500 dark:text-[#87929a] hidden md:table-cell">
                        {formatDate(u.createdAt)}
                      </td>

                      {/* Last Login */}
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500 dark:text-[#87929a] hidden lg:table-cell">
                        {formatDate(u.lastLoginAt)}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(u)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-[#1c2230] dark:hover:bg-[#262e40] text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 transition-colors cursor-pointer border border-slate-200 dark:border-transparent"
                            title="Editar usuário"
                          >
                            <span className="material-symbols-outlined text-base">edit</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenDelete(u)}
                            disabled={isSelf}
                            className={`p-1.5 rounded-lg transition-colors border ${
                              isSelf
                                ? "bg-slate-100/50 dark:bg-[#1c2230]/40 text-slate-300 dark:text-[#4c5561] border-slate-200/50 dark:border-transparent cursor-not-allowed"
                                : "bg-slate-100 hover:bg-red-50 text-red-600 hover:text-red-700 dark:bg-[#1c2230] dark:hover:bg-red-950/50 dark:text-red-400 dark:hover:text-red-300 border-slate-200 dark:border-transparent cursor-pointer"
                            }`}
                            title={isSelf ? "Não é possível excluir seu próprio usuário logado" : "Excluir usuário"}
                          >
                            <span className="material-symbols-outlined text-base">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: CRIAR NOVO USUÁRIO */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md bg-white dark:bg-[#0e121a] border border-slate-200 dark:border-[#3e484f]/60 rounded-2xl p-6 shadow-2xl text-slate-800 dark:text-[#dfe2f1]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#3e484f]/40 mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-sky-600 dark:text-sky-400 text-xl">person_add</span>
                <h3 className="font-semibold text-base text-slate-800 dark:text-white">Criar Novo Usuário</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:text-[#87929a] dark:hover:text-[#dfe2f1]"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5">
              <div>
                <label className="block font-mono text-xs text-slate-700 dark:text-[#bdc8d1] mb-1">
                  Nome de Usuário (Login) *
                </label>
                <input
                  type="text"
                  value={createUsername}
                  onChange={(e) => setCreateUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, ""))}
                  placeholder="ex: joao.silva"
                  required
                  className="w-full bg-slate-50 dark:bg-[#070a10] border border-slate-300 dark:border-[#3e484f]/50 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-[#dfe2f1] focus:ring-1 focus:ring-sky-500"
                />
                <span className="text-[10px] text-slate-500 dark:text-[#87929a]">Apenas letras minúsculas, números, ponto ou underline.</span>
              </div>

              <div>
                <label className="block font-mono text-xs text-slate-700 dark:text-[#bdc8d1] mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="ex: João da Silva"
                  required
                  className="w-full bg-slate-50 dark:bg-[#070a10] border border-slate-300 dark:border-[#3e484f]/50 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-[#dfe2f1] focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block font-mono text-xs text-slate-700 dark:text-[#bdc8d1] mb-1">
                  E-mail *
                </label>
                <input
                  type="email"
                  value={createEmail}
                  onChange={(e) => setCreateEmail(e.target.value)}
                  placeholder="ex: joao@estacao.com.br"
                  required
                  className="w-full bg-slate-50 dark:bg-[#070a10] border border-slate-300 dark:border-[#3e484f]/50 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-[#dfe2f1] focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block font-mono text-xs text-slate-700 dark:text-[#bdc8d1] mb-1">
                  Senha de Acesso * (mínimo 6 caracteres)
                </label>
                <input
                  type="password"
                  value={createPassword}
                  onChange={(e) => setCreatePassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full bg-slate-50 dark:bg-[#070a10] border border-slate-300 dark:border-[#3e484f]/50 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-[#dfe2f1] focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono text-xs text-slate-700 dark:text-[#bdc8d1] mb-1">
                    Perfil de Acesso
                  </label>
                  <select
                    value={createRole}
                    onChange={(e) => setCreateRole(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-[#070a10] border border-slate-300 dark:border-[#3e484f]/50 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-[#dfe2f1] focus:ring-1 focus:ring-sky-500"
                  >
                    <option value="OPERATOR">OPERATOR</option>
                    <option value="ADMIN">ADMIN</option>
                    <option value="VIEWER">VIEWER</option>
                  </select>
                </div>

                <div>
                  <label className="block font-mono text-xs text-slate-700 dark:text-[#bdc8d1] mb-1">
                    Status da Conta
                  </label>
                  <label className="flex items-center gap-2 mt-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={createActive}
                      onChange={(e) => setCreateActive(e.target.checked)}
                      className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 bg-slate-50 dark:bg-[#070a10] border-slate-300 dark:border-[#3e484f]"
                    />
                    <span className="text-xs font-mono text-slate-800 dark:text-[#dfe2f1]">Conta Ativa</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-[#3e484f]/40">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#1c2230] text-slate-600 hover:text-slate-900 dark:text-[#87929a] dark:hover:text-[#dfe2f1] text-xs font-mono transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCreate}
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmittingCreate ? "Salvando..." : "Criar Usuário"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR USUÁRIO */}
      {isEditOpen && selectedUser && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md bg-white dark:bg-[#0e121a] border border-slate-200 dark:border-[#3e484f]/60 rounded-2xl p-6 shadow-2xl text-slate-800 dark:text-[#dfe2f1]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#3e484f]/40 mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-sky-600 dark:text-sky-400 text-xl">edit</span>
                <h3 className="font-semibold text-base text-slate-800 dark:text-white">Editar Usuário: @{selectedUser.username}</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:text-[#87929a] dark:hover:text-[#dfe2f1]"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3.5">
              <div>
                <label className="block font-mono text-xs text-slate-700 dark:text-[#bdc8d1] mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  className="w-full bg-slate-50 dark:bg-[#070a10] border border-slate-300 dark:border-[#3e484f]/50 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-[#dfe2f1] focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block font-mono text-xs text-slate-700 dark:text-[#bdc8d1] mb-1">
                  E-mail *
                </label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  required
                  className="w-full bg-slate-50 dark:bg-[#070a10] border border-slate-300 dark:border-[#3e484f]/50 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-[#dfe2f1] focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono text-xs text-slate-700 dark:text-[#bdc8d1] mb-1">
                    Perfil de Acesso
                  </label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-[#070a10] border border-slate-300 dark:border-[#3e484f]/50 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-[#dfe2f1] focus:ring-1 focus:ring-sky-500"
                  >
                    <option value="OPERATOR">OPERATOR</option>
                    <option value="ADMIN">ADMIN</option>
                    <option value="VIEWER">VIEWER</option>
                  </select>
                </div>

                <div>
                  <label className="block font-mono text-xs text-slate-700 dark:text-[#bdc8d1] mb-1">
                    Status da Conta
                  </label>
                  <label className="flex items-center gap-2 mt-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editActive}
                      onChange={(e) => setEditActive(e.target.checked)}
                      disabled={isCurrentUser(selectedUser)}
                      className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 bg-slate-50 dark:bg-[#070a10] border-slate-300 dark:border-[#3e484f] disabled:opacity-50"
                    />
                    <span className="text-xs font-mono text-slate-800 dark:text-[#dfe2f1]">
                      {editActive ? "Conta Ativa" : "Desativada"}
                    </span>
                  </label>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#070a10] border border-slate-200 dark:border-[#3e484f]/30">
                <label className="block font-mono text-xs text-slate-700 dark:text-[#bdc8d1] mb-1">
                  Redefinir Senha (opcional)
                </label>
                <input
                  type="password"
                  value={editNewPassword}
                  onChange={(e) => setEditNewPassword(e.target.value)}
                  placeholder="Deixe em branco para manter a senha atual"
                  minLength={6}
                  className="w-full bg-white dark:bg-[#0a0e18] border border-slate-300 dark:border-[#3e484f]/50 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-[#dfe2f1] focus:ring-1 focus:ring-sky-500"
                />
                <span className="text-[10px] text-slate-500 dark:text-[#87929a] mt-1 block">
                  Se preenchido, a nova senha será cifrada via bcrypt.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-[#3e484f]/40">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#1c2230] text-slate-600 hover:text-slate-900 dark:text-[#87929a] dark:hover:text-[#dfe2f1] text-xs font-mono transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit}
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmittingEdit ? "Salvando..." : "Salvar Alterações"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EXCLUIR USUÁRIO */}
      {isDeleteOpen && selectedUser && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md bg-white dark:bg-[#0e121a] border border-red-300 dark:border-red-500/40 rounded-2xl p-6 shadow-2xl text-slate-800 dark:text-[#dfe2f1]">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center border border-red-200 dark:border-red-500/30">
                <span className="material-symbols-outlined text-2xl">warning</span>
              </div>
              <div>
                <h3 className="font-semibold text-base text-red-600 dark:text-red-300">Confirmar Exclusão</h3>
                <span className="text-xs text-slate-500 dark:text-[#87929a] font-mono">Ação irreversível no banco MariaDB</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-[#bdc8d1] leading-relaxed mb-4">
              Tem certeza que deseja excluir o usuário <strong className="text-slate-900 dark:text-white">@{selectedUser.username}</strong> ({selectedUser.name}) do banco de dados <code className="text-sky-600 dark:text-sky-300">usuarios.usuarios</code>?
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-[#3e484f]/40">
              <button
                type="button"
                onClick={() => setIsDeleteOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#1c2230] text-slate-600 hover:text-slate-900 dark:text-[#87929a] dark:hover:text-[#dfe2f1] text-xs font-mono transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteSubmit}
                disabled={isSubmittingDelete}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                {isSubmittingDelete ? "Excluindo..." : "Sim, Excluir Usuário"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
