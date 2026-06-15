/**
 * Cliente REST do Campus Virtual.
 *
 * Responsabilidades:
 *  - Apontar para a API REST do back-end (NEXT_PUBLIC_API_URL).
 *  - Injetar o token JWT no cabeçalho Authorization (autenticação stateless).
 *  - Desempacotar o envelope { success, message, data } da API.
 *  - Normalizar erros em ApiError com mensagem legível (apoio ao RNF19).
 *  - Suportar upload multipart e download de arquivos (BLOB).
 */

import type { ApiResponse } from "./types";

const BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080"
).replace(/\/$/, "");

const TOKEN_KEY = "cv.token";

/** Callback acionado quando a API responde 401 (token ausente/expirado). */
let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler;
}

// ---------------------------------------------------------------------------
// Armazenamento do token (lado do cliente)
// ---------------------------------------------------------------------------

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
}

// ---------------------------------------------------------------------------
// Erro de API
// ---------------------------------------------------------------------------

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

// ---------------------------------------------------------------------------
// Núcleo da requisição
// ---------------------------------------------------------------------------

interface RequestOptions {
  query?: Record<string, string | number | boolean | undefined | null>;
  /** Corpo JSON. Ignorado quando `form` é informado. */
  body?: unknown;
  /** Corpo multipart (uploads). */
  form?: FormData;
  signal?: AbortSignal;
}

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  const url = new URL(BASE_URL + path);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

async function request<T>(
  method: string,
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };

  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let body: BodyInit | undefined;
  if (options.form) {
    body = options.form; // o browser define o boundary do multipart
  } else if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(options.body);
  }

  let res: Response;
  try {
    res = await fetch(buildUrl(path, options.query), {
      method,
      headers,
      body,
      signal: options.signal,
      cache: "no-store",
    });
  } catch {
    throw new ApiError(
      "Não foi possível conectar ao servidor. Verifique sua conexão.",
      0,
    );
  }

  if (res.status === 401 && onUnauthorized) onUnauthorized();

  // 204 sem corpo
  if (res.status === 204) return undefined as T;

  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    if (!res.ok) {
      throw new ApiError(`Erro ${res.status} ao processar a solicitação.`, res.status);
    }
    return (await res.text()) as unknown as T;
  }

  const payload = (await res.json()) as ApiResponse<T>;
  if (!res.ok || payload.success === false) {
    throw new ApiError(
      payload.message || `Erro ${res.status} ao processar a solicitação.`,
      res.status,
    );
  }
  return payload.data;
}

// ---------------------------------------------------------------------------
// Helpers públicos
// ---------------------------------------------------------------------------

export const api = {
  get: <T>(path: string, query?: RequestOptions["query"], signal?: AbortSignal) =>
    request<T>("GET", path, { query, signal }),

  post: <T>(path: string, body?: unknown, query?: RequestOptions["query"]) =>
    request<T>("POST", path, { body, query }),

  put: <T>(path: string, body?: unknown, query?: RequestOptions["query"]) =>
    request<T>("PUT", path, { body, query }),

  patch: <T>(path: string, body?: unknown, query?: RequestOptions["query"]) =>
    request<T>("PATCH", path, { body, query }),

  delete: <T>(path: string, query?: RequestOptions["query"]) =>
    request<T>("DELETE", path, { query }),

  upload: <T>(path: string, form: FormData, query?: RequestOptions["query"]) =>
    request<T>("POST", path, { form, query }),
};

/**
 * Faz o download de um arquivo binário (BLOB) autenticado e dispara o
 * salvamento no navegador. Usado por materiais e submissões.
 */
export async function downloadFile(path: string, fallbackName = "arquivo"): Promise<void> {
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(buildUrl(path), { headers, cache: "no-store" });
  if (!res.ok) {
    throw new ApiError(`Não foi possível baixar o arquivo (erro ${res.status}).`, res.status);
  }

  const disposition = res.headers.get("content-disposition") ?? "";
  const match = /filename\*?=(?:UTF-8''|")?([^";]+)/i.exec(disposition);
  const filename = match ? decodeURIComponent(match[1]) : fallbackName;

  const blob = await res.blob();
  const objectUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(objectUrl);
}
