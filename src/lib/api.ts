/**
 * Safe API communication helpers to prevent HTML fallback parse crashes
 */
export async function safeFetchJson<T = any>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<{ ok: boolean; data: T | null; status: number; error?: string }> {
  try {
    const res = await fetch(input, init);
    const contentType = res.headers.get("content-type") || "";

    if (!contentType.includes("application/json")) {
      let friendlyError = `Resposta da API não é JSON (HTTP ${res.status}): ${contentType || "Sem cabeçalho"}`;
      if (res.status === 401 || res.status === 403) {
        friendlyError = `Sessão expirada ou acesso restrito (HTTP ${res.status}). Por favor, autentique-se novamente no console.`;
      }
      return {
        ok: false,
        data: null,
        status: res.status,
        error: friendlyError,
      };
    }

    const data = (await res.json()) as T;
    return {
      ok: res.ok,
      data,
      status: res.status,
      error: res.ok ? undefined : (data as any)?.error || `HTTP ${res.status}`,
    };
  } catch (err: any) {
    return {
      ok: false,
      data: null,
      status: 0,
      error: err?.message || "Erro de conexão de rede",
    };
  }
}
