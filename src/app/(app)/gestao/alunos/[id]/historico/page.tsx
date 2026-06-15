"use client";

import { use } from "react";
import Link from "next/link";
import { useApi } from "@/lib/useApi";
import { gestaoApi } from "@/lib/api/endpoints";
import { RoleGate } from "@/components/RoleGate";
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  PageHeader,
  Spinner,
} from "@/components/ui";
import {
  CONTESTACAO_STATUS_LABEL,
  CONTESTACAO_TIPO_LABEL,
  formatNota,
  formatPercent,
} from "@/lib/format";

/** RF34 — Consulta detalhada do histórico acadêmico de um aluno. */
export default function HistoricoAlunoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <RoleGate roles={["GESTOR"]}>
      <Historico alunoId={id} />
    </RoleGate>
  );
}

function Historico({ alunoId }: { alunoId: string }) {
  const { data, loading, error, reload } = useApi(
    () => gestaoApi.historicoAluno(alunoId),
    [alunoId],
  );

  if (loading) return <Spinner />;
  if (error || !data)
    return <ErrorState message={error ?? "Histórico não encontrado."} onRetry={reload} />;

  return (
    <div>
      <PageHeader
        title={`Histórico — ${data.aluno.nome}`}
        description={data.aluno.email}
        actions={
          <Link href="/usuarios" className="text-sm text-primary underline">
            ← Voltar
          </Link>
        }
      />

      <section className="mb-6">
        <h2 className="mb-2 text-lg font-bold text-text">Notas</h2>
        {data.notas.length === 0 ? (
          <EmptyState title="Sem notas registradas." />
        ) : (
          <Card>
            <ul className="divide-y divide-border">
              {data.notas.map((n) => (
                <li key={n.id} className="flex items-center justify-between py-2">
                  <span className="text-text">{n.atividade.titulo}</span>
                  <span className="font-bold text-text">{formatNota(n.valor)}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </section>

      <section className="mb-6">
        <h2 className="mb-2 text-lg font-bold text-text">Frequência por disciplina</h2>
        {data.frequenciaPorDisciplina.length === 0 ? (
          <EmptyState title="Sem registros de frequência." />
        ) : (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {data.frequenciaPorDisciplina.map((f, i) => (
              <Card as="li" key={`${f.disciplina.id}-${i}`}>
                <p className="font-semibold text-text">{f.disciplina.nome}</p>
                <p className="text-2xl font-bold text-text">
                  {formatPercent(f.percentualPresenca)}
                </p>
                <div className="mt-1">
                  {f.atingiuMinimo ? (
                    <Badge tone="success">Acima do mínimo</Badge>
                  ) : (
                    <Badge tone="danger">Abaixo do mínimo</Badge>
                  )}
                </div>
              </Card>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-lg font-bold text-text">Contestações</h2>
        {data.contestacoes.length === 0 ? (
          <EmptyState title="Sem contestações." />
        ) : (
          <ul className="space-y-2">
            {data.contestacoes.map((c) => (
              <Card as="li" key={c.id}>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm text-text-muted">{c.protocolo}</span>
                  <Badge tone="neutral" withIcon={false}>
                    {CONTESTACAO_TIPO_LABEL[c.tipo]}
                  </Badge>
                  <Badge
                    tone={c.status === "DEFERIDA" ? "success" : c.status === "INDEFERIDA" ? "danger" : "info"}
                  >
                    {CONTESTACAO_STATUS_LABEL[c.status]}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-text-muted">{c.justificativa}</p>
              </Card>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
