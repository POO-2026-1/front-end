import type { Role } from "./api/types";

export interface NavItem {
  href: string;
  label: string;
  /** Ícone textual (emoji) — sempre acompanhado de rótulo (RNF18). */
  icon: string;
}

const COMUM: NavItem[] = [
  { href: "/painel", label: "Painel", icon: "🏠" },
  { href: "/disciplinas", label: "Disciplinas", icon: "📚" },
  { href: "/mensagens", label: "Mensagens", icon: "✉️" },
];

const ALUNO: NavItem[] = [
  ...COMUM,
  { href: "/notas", label: "Notas e frequência", icon: "📊" },
  { href: "/contestacoes", label: "Contestações", icon: "⚖️" },
  { href: "/provas-substitutivas", label: "Provas substitutivas", icon: "📝" },
  { href: "/recomendacoes", label: "Recomendações", icon: "💡" },
];

const PROFESSOR: NavItem[] = [
  ...COMUM,
  { href: "/contestacoes", label: "Contestações", icon: "⚖️" },
  { href: "/provas-substitutivas", label: "Provas substitutivas", icon: "📝" },
];

const GESTOR: NavItem[] = [
  { href: "/painel", label: "Painel", icon: "🏠" },
  { href: "/gestao/alertas-risco", label: "Alertas de risco", icon: "🚨" },
  { href: "/gestao/monitoramento-notas", label: "Monitorar notas", icon: "⏱️" },
  { href: "/gestao/relatorios", label: "Relatórios", icon: "📈" },
  { href: "/gestao/atividades-apoio", label: "Atividades de apoio", icon: "🤝" },
  { href: "/contestacoes", label: "Contestações", icon: "⚖️" },
  { href: "/usuarios", label: "Usuários", icon: "👥" },
  { href: "/disciplinas", label: "Disciplinas", icon: "📚" },
  { href: "/auditoria", label: "Auditoria", icon: "🗒️" },
  { href: "/mensagens", label: "Mensagens", icon: "✉️" },
];

export function navForRole(role: Role): NavItem[] {
  switch (role) {
    case "ALUNO":
      return ALUNO;
    case "PROFESSOR":
      return PROFESSOR;
    case "GESTOR":
      return GESTOR;
    default:
      return COMUM;
  }
}
