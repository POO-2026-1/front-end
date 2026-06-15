"use client";

/**
 * Controles de acessibilidade: alternância de tema (RF09) e ajuste do
 * tamanho da fonte de 100% a 400% (RF08/RNF14). Cada botão tem rótulo
 * textual acessível (RNF18).
 */

import { MAX_FONTE, MIN_FONTE, usePreferences } from "@/context/PreferencesContext";

export function AccessibilityControls({ compact = false }: { compact?: boolean }) {
  const { tema, toggleTema, tamanhoFonte, ajustarFonte } = usePreferences();
  const escuro = tema === "ESCURO";

  return (
    <div
      role="group"
      aria-label="Controles de acessibilidade"
      className="flex items-center gap-2"
    >
      <div className="flex items-center gap-1 rounded-lg border border-border bg-surface p-0.5">
        <button
          type="button"
          onClick={() => ajustarFonte(-25)}
          disabled={tamanhoFonte <= MIN_FONTE}
          aria-label="Diminuir tamanho da fonte"
          className="rounded-md px-2 py-1 text-sm font-bold text-text hover:bg-surface-2 disabled:opacity-40"
        >
          A−
        </button>
        <span className="min-w-[3.5rem] text-center text-xs text-text-muted" aria-live="polite">
          {tamanhoFonte}%
        </span>
        <button
          type="button"
          onClick={() => ajustarFonte(25)}
          disabled={tamanhoFonte >= MAX_FONTE}
          aria-label="Aumentar tamanho da fonte"
          className="rounded-md px-2 py-1 text-base font-bold text-text hover:bg-surface-2 disabled:opacity-40"
        >
          A+
        </button>
      </div>

      <button
        type="button"
        onClick={toggleTema}
        aria-pressed={escuro}
        aria-label={escuro ? "Ativar tema claro" : "Ativar tema escuro"}
        className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium text-text hover:bg-surface-2"
      >
        <span aria-hidden>{escuro ? "☀" : "☾"}</span>
        {!compact && <span>{escuro ? "Tema claro" : "Tema escuro"}</span>}
      </button>
    </div>
  );
}
