"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useApi } from "@/lib/useApi";
import {
  disciplinasApi,
  gestaoApi,
  matriculasApi,
  notasApi,
  recomendacoesApi,
} from "@/lib/api/endpoints";
import { Card, PageHeader, Spinner, Badge } from "@/components/ui";
import { formatNota } from "@/lib/format";

function StatCard({ label, value, href }: { label: string; value: ReactValue; href?: string }) {
  const inner = (
    <Card className="h-full">
      <p className="text-sm text-text-muted">{label}</p>
      <p className="mt-2 text-3xl font-bold text-text">{value}</p>
    </Card>
  );
  return href ? (
    <Link href={href} className="block focus-visible:outline-none">
      {inner}
    </Link>
  ) : (
    inner
  );
}

type ReactValue = string | number;

function PainelAluno() {
  const matriculas = useApi(() => matriculasApi.minhas({ size: 100 }), []);
  const notas = useApi(() => notasApi.minhas(), []);
  const recomendacoes = useApi(() => recomendacoesApi.minhas(), []);

  if (matriculas.loading || notas.loading) return <Spinner />;

  const ativas = matriculas.data?.content.filter((m) => m.status === "ATIVA").length ?? 0;
  const notasPublicadas = notas.data?.filter((n) => n.publicada) ?? [];
  const media =
    notasPublicadas.length > 0
      ? notasPublicadas.reduce((s, n) => s + n.valor, 0) / notasPublicadas.length
      : null;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <StatCard label="Disciplinas ativas" value={ativas} href="/disciplinas" />
      <StatCard
        label="Média das notas publicadas"
        value={media !== null ? formatNota(media) : "—"}
        href="/notas"
      />
      <StatCard
        label="Recomendações de estudo"
        value={recomendacoes.data?.length ?? 0}
        href="/recomendacoes"
      />
    </div>
  );
}

function PainelProfessor() {
  const disciplinas = useApi(() => disciplinasApi.listar({ size: 100 }), []);
  if (disciplinas.loading) return <Spinner />;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <StatCard
        label="Disciplinas"
        value={disciplinas.data?.totalElements ?? 0}
        href="/disciplinas"
      />
      <StatCard label="Mensagens" value="Ver" href="/mensagens" />
      <StatCard label="Provas substitutivas" value="Avaliar" href="/provas-substitutivas" />
    </div>
  );
}

function PainelGestor() {
  const dashboard = useApi(() => gestaoApi.dashboard(), []);
  if (dashboard.loading) return <Spinner />;
  const d = dashboard.data;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Alunos" value={d?.totalAlunos ?? 0} />
        <StatCard label="Professores" value={d?.totalProfessores ?? 0} />
        <StatCard label="Disciplinas" value={d?.totalDisciplinas ?? 0} href="/disciplinas" />
        <StatCard label="Atividades" value={d?.totalAtividades ?? 0} />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Submissões" value={d?.totalSubmissoes ?? 0} />
        <Card>
          <p className="text-sm text-text-muted">Taxa de aprovação</p>
          <p className="mt-2 text-3xl font-bold text-text">
            {d ? `${d.taxaAprovacao.toFixed(1)}%` : "—"}
          </p>
        </Card>
        <Link href="/gestao/alertas-risco" className="block">
          <Card className="h-full border-warning">
            <p className="text-sm text-text-muted">Alunos em risco</p>
            <p className="mt-2 flex items-center gap-2 text-3xl font-bold text-text">
              {d?.alunosEmRisco ?? 0}
              <Badge tone="warning">Atenção</Badge>
            </p>
          </Card>
        </Link>
      </div>
    </div>
  );
}

export default function PainelPage() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div>
      <PageHeader
        title={`Olá, ${user.nome.split(" ")[0]}`}
        description="Resumo da sua vida acadêmica no Campus Virtual."
      />
      {user.role === "ALUNO" && <PainelAluno />}
      {user.role === "PROFESSOR" && <PainelProfessor />}
      {user.role === "GESTOR" && <PainelGestor />}
    </div>
  );
}
