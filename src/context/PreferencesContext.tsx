"use client";

/**
 * Preferências de interface do usuário:
 *  - tema claro/escuro (RF09, RNF20)
 *  - tamanho da fonte de 100% a 400% (RF08, RNF14)
 *  - som de notificação (RF19)
 *
 * As preferências são aplicadas ao elemento <html> e persistidas em
 * localStorage. Quando há sessão ativa, também são sincronizadas com o
 * back-end (PUT /api/usuarios/me/preferencias).
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usuariosApi } from "@/lib/api/endpoints";
import type { Tema, UsuarioResponse } from "@/lib/api/types";

export const MIN_FONTE = 100;
export const MAX_FONTE = 400;
const STORAGE_KEY = "cv.prefs";

interface Preferences {
  tema: Tema;
  tamanhoFonte: number;
  somNotificacao: boolean;
}

interface PreferencesContextValue extends Preferences {
  setTema: (tema: Tema) => void;
  toggleTema: () => void;
  setTamanhoFonte: (valor: number) => void;
  ajustarFonte: (delta: number) => void;
  setSomNotificacao: (ativo: boolean) => void;
  /** Carrega preferências vindas do perfil do usuário autenticado. */
  hydrateFromUser: (usuario: UsuarioResponse) => void;
}

const DEFAULTS: Preferences = {
  tema: "CLARO",
  tamanhoFonte: 100,
  somNotificacao: true,
};

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

function clampFonte(valor: number): number {
  return Math.min(MAX_FONTE, Math.max(MIN_FONTE, Math.round(valor)));
}

function applyToDocument(prefs: Preferences): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.setAttribute("data-theme", prefs.tema === "ESCURO" ? "escuro" : "claro");
  root.style.fontSize = `${(prefs.tamanhoFonte / 100) * 16}px`;
  root.style.colorScheme = prefs.tema === "ESCURO" ? "dark" : "light";
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<Preferences>(DEFAULTS);
  const [authenticated, setAuthenticated] = useState(false);

  // Carrega do localStorage no primeiro render (lado do cliente).
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<Preferences>;
        setPrefs({
          tema: parsed.tema === "ESCURO" ? "ESCURO" : "CLARO",
          tamanhoFonte: clampFonte(parsed.tamanhoFonte ?? DEFAULTS.tamanhoFonte),
          somNotificacao: parsed.somNotificacao ?? DEFAULTS.somNotificacao,
        });
      }
    } catch {
      /* ignora preferências corrompidas */
    }
  }, []);

  // Aplica ao documento e persiste localmente sempre que mudar.
  useEffect(() => {
    applyToDocument(prefs);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      /* armazenamento indisponível */
    }
  }, [prefs]);

  const persistRemote = useCallback(
    (next: Preferences) => {
      if (!authenticated) return;
      usuariosApi
        .atualizarPreferencias({
          tema: next.tema,
          tamanhoFonte: next.tamanhoFonte,
          somNotificacao: next.somNotificacao,
        })
        .catch(() => {
          /* silencioso: preferência segue válida localmente */
        });
    },
    [authenticated],
  );

  const update = useCallback(
    (patch: Partial<Preferences>) => {
      setPrefs((prev) => {
        const next = { ...prev, ...patch };
        next.tamanhoFonte = clampFonte(next.tamanhoFonte);
        persistRemote(next);
        return next;
      });
    },
    [persistRemote],
  );

  const value = useMemo<PreferencesContextValue>(
    () => ({
      ...prefs,
      setTema: (tema) => update({ tema }),
      toggleTema: () => update({ tema: prefs.tema === "ESCURO" ? "CLARO" : "ESCURO" }),
      setTamanhoFonte: (valor) => update({ tamanhoFonte: valor }),
      ajustarFonte: (delta) => update({ tamanhoFonte: prefs.tamanhoFonte + delta }),
      setSomNotificacao: (ativo) => update({ somNotificacao: ativo }),
      hydrateFromUser: (usuario) => {
        setAuthenticated(true);
        setPrefs({
          tema: usuario.tema === "ESCURO" ? "ESCURO" : "CLARO",
          tamanhoFonte: clampFonte(usuario.tamanhoFonte ?? DEFAULTS.tamanhoFonte),
          somNotificacao: usuario.somNotificacao ?? DEFAULTS.somNotificacao,
        });
      },
    }),
    [prefs, update],
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences(): PreferencesContextValue {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error("usePreferences deve ser usado dentro de PreferencesProvider");
  return ctx;
}
