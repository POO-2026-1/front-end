"use client";

/**
 * Sistema de avisos (toasts) acessível.
 *
 * Mensagens de erro/sucesso combinam ícone + texto descritivo, sem depender
 * apenas de cor (RNF18, RNF19). A região é anunciada por leitores de tela
 * via aria-live.
 */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type ToastVariant = "success" | "error" | "info" | "warning";

interface Toast {
  id: number;
  variant: ToastVariant;
  message: string;
}

interface ToastContextValue {
  notify: (message: string, variant?: ToastVariant) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const ICONS: Record<ToastVariant, string> = {
  success: "✓",
  error: "✕",
  info: "ℹ",
  warning: "⚠",
};

const STYLES: Record<ToastVariant, string> = {
  success: "bg-success-bg text-success border-success",
  error: "bg-danger-bg text-danger border-danger",
  info: "bg-info-bg text-info border-info",
  warning: "bg-warning-bg text-warning border-warning",
};

const ROLE: Record<ToastVariant, "alert" | "status"> = {
  success: "status",
  error: "alert",
  info: "status",
  warning: "alert",
};

let counter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const notify = useCallback(
    (message: string, variant: ToastVariant = "info") => {
      const id = ++counter;
      setToasts((prev) => [...prev, { id, variant, message }]);
      window.setTimeout(() => remove(id), 6000);
    },
    [remove],
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      notify,
      success: (m) => notify(m, "success"),
      error: (m) => notify(m, "error"),
      info: (m) => notify(m, "info"),
    }),
    [notify],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="assertive"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-2 p-4 sm:items-end"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role={ROLE[t.variant]}
            className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border-l-4 px-4 py-3 shadow-lg ${STYLES[t.variant]}`}
          >
            <span aria-hidden className="text-lg font-bold leading-5">
              {ICONS[t.variant]}
            </span>
            <p className="flex-1 text-sm font-medium">{t.message}</p>
            <button
              type="button"
              onClick={() => remove(t.id)}
              className="text-sm font-bold"
              aria-label="Fechar aviso"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast deve ser usado dentro de ToastProvider");
  return ctx;
}
