"use client";

/**
 * Autenticação e sessão (RF01, RF03, RF04).
 *
 *  - Guarda o usuário autenticado e o token JWT (stateless no back-end).
 *  - Restaura a sessão ao recarregar a página consultando GET /api/usuarios/me.
 *  - Encerra a sessão automaticamente após 1 hora de inatividade, com aviso
 *    prévio (RF03).
 *  - Reage a respostas 401 da API encerrando a sessão.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  clearToken,
  setToken,
  setUnauthorizedHandler,
  getToken,
} from "@/lib/api/client";
import { authApi, usuariosApi } from "@/lib/api/endpoints";
import type { LoginRequest, RegisterRequest, UsuarioResponse } from "@/lib/api/types";
import { usePreferences } from "./PreferencesContext";
import { useToast } from "./ToastContext";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthContextValue {
  user: UsuarioResponse | null;
  status: AuthStatus;
  login: (body: LoginRequest) => Promise<UsuarioResponse>;
  register: (body: RegisterRequest) => Promise<void>;
  logout: (motivo?: string) => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const INATIVIDADE_MS = 60 * 60 * 1000; // 1 hora (RF03)
const AVISO_ANTES_MS = 2 * 60 * 1000; // aviso 2 min antes

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { hydrateFromUser } = usePreferences();
  const toast = useToast();

  const [user, setUser] = useState<UsuarioResponse | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  const logoutTimer = useRef<number | null>(null);
  const avisoTimer = useRef<number | null>(null);

  const clearTimers = useCallback(() => {
    if (logoutTimer.current) window.clearTimeout(logoutTimer.current);
    if (avisoTimer.current) window.clearTimeout(avisoTimer.current);
  }, []);

  const logout = useCallback(
    (motivo?: string) => {
      clearTimers();
      clearToken();
      setUser(null);
      setStatus("unauthenticated");
      if (motivo) toast.info(motivo);
      router.replace("/login");
    },
    [clearTimers, router, toast],
  );

  // Programação dos temporizadores de inatividade.
  const armarInatividade = useCallback(() => {
    clearTimers();
    avisoTimer.current = window.setTimeout(() => {
      toast.notify(
        "Sua sessão expirará em 2 minutos por inatividade. Interaja para continuar.",
        "warning",
      );
    }, INATIVIDADE_MS - AVISO_ANTES_MS);
    logoutTimer.current = window.setTimeout(() => {
      logout("Sessão encerrada por inatividade. Faça login novamente.");
    }, INATIVIDADE_MS);
  }, [clearTimers, logout, toast]);

  const loadUser = useCallback(async () => {
    const me = await usuariosApi.me();
    setUser(me);
    hydrateFromUser(me);
    setStatus("authenticated");
    armarInatividade();
    return me;
  }, [hydrateFromUser, armarInatividade]);

  // Restaura a sessão ao montar.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearToken();
      setUser(null);
      setStatus("unauthenticated");
    });

    if (!getToken()) {
      setStatus("unauthenticated");
      return;
    }
    loadUser().catch(() => {
      clearToken();
      setStatus("unauthenticated");
    });

    return () => setUnauthorizedHandler(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reinicia o contador de inatividade conforme a atividade do usuário.
  useEffect(() => {
    if (status !== "authenticated") return;
    const reset = () => armarInatividade();
    const eventos = ["mousedown", "keydown", "scroll", "touchstart", "click"];
    eventos.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    return () => {
      eventos.forEach((e) => window.removeEventListener(e, reset));
      clearTimers();
    };
  }, [status, armarInatividade, clearTimers]);

  const login = useCallback(
    async (body: LoginRequest) => {
      const resp = await authApi.login(body);
      setToken(resp.token);
      setUser(resp.usuario);
      hydrateFromUser(resp.usuario);
      setStatus("authenticated");
      armarInatividade();
      return resp.usuario;
    },
    [hydrateFromUser, armarInatividade],
  );

  const register = useCallback(async (body: RegisterRequest) => {
    await authApi.register(body);
  }, []);

  const refresh = useCallback(async () => {
    await loadUser();
  }, [loadUser]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, status, login, register, logout, refresh }),
    [user, status, login, register, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
