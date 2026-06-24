/** Funções utilitárias de formatação e rótulos legíveis (pt-BR). */

import type {
  AtividadeTipo,
  ContestacaoStatus,
  ContestacaoTipo,
  MatriculaStatus,
  ProvaSubstitutivaStatus,
  Role,
} from "./api/types";

export function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR");
}

export function formatDateTime(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

/**
 * Converte o valor de um `<input type="datetime-local">` (horário de parede,
 * sem fuso) em ISO LocalDateTime `YYYY-MM-DDTHH:mm:ss`, sem conversão de fuso.
 *
 * O back-end usa `LocalDateTime` (sem fuso); usar `new Date(v).toISOString()`
 * somava o offset do navegador (UTC), deslocando o horário em +3h (UTC-3).
 */
export function toLocalDateTime(value?: string | null): string | undefined {
  if (!value) return undefined;
  // "2026-06-24T18:52" -> "2026-06-24T18:52:00" (garante os segundos).
  return value.length === 16 ? `${value}:00` : value;
}

export function formatPercent(value?: number | null, digits = 1): string {
  if (value === undefined || value === null || Number.isNaN(value)) return "—";
  return `${value.toFixed(digits)}%`;
}

export function formatNota(value?: number | null): string {
  if (value === undefined || value === null || Number.isNaN(value)) return "—";
  return value.toFixed(1).replace(".", ",");
}

export function formatBytes(bytes?: number | null): string {
  if (!bytes && bytes !== 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const ROLE_LABEL: Record<Role, string> = {
  ALUNO: "Aluno",
  PROFESSOR: "Professor",
  GESTOR: "Gestor",
};

export const ATIVIDADE_TIPO_LABEL: Record<AtividadeTipo, string> = {
  ATIVIDADE: "Atividade",
  PROVA: "Prova",
  TESTE: "Teste",
};

export const MATRICULA_STATUS_LABEL: Record<MatriculaStatus, string> = {
  PENDENTE: "Pendente",
  ATIVA: "Ativa",
  CANCELADA: "Cancelada",
};

export const CONTESTACAO_TIPO_LABEL: Record<ContestacaoTipo, string> = {
  NOTA: "Nota",
  FALTA: "Falta",
};

export const CONTESTACAO_STATUS_LABEL: Record<ContestacaoStatus, string> = {
  ABERTA: "Aberta",
  EM_ANALISE: "Em análise",
  DEFERIDA: "Deferida",
  INDEFERIDA: "Indeferida",
};

export const PROVA_SUBST_STATUS_LABEL: Record<ProvaSubstitutivaStatus, string> = {
  SOLICITADA: "Solicitada",
  APROVADA: "Aprovada",
  REJEITADA: "Rejeitada",
  AGENDADA: "Agendada",
};

/** Iniciais para avatares (fallback acessível com aria-hidden). */
export function initials(name?: string): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
