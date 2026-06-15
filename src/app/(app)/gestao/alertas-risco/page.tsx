"use client";

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
import { formatNota, formatPercent } from "@/lib/format";

/** RF28 — Alertas de risco acadêmico (cruzamento de notas e frequência). */
export default function AlertasRiscoPage() {
  return (
    <RoleGate roles={["GESTOR"]}>
      <AlertasRisco />
    </RoleGate>
  );
}

function AlertasRisco() {
  const { data, loading, error, reload } = useApi(() => gestaoApi.alertasRisco(), []);

  if (loading) return <Spinner />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <div>
      <PageHeader
        title="Alertas de risco acadêmico"
        description="Alunos com risco de reprovação ou evasão, por disciplina."
      />

      {!data || data.length === 0 ? (
        <EmptyState title="Nenhum aluno em situação de risco no momento." />
      ) : (
        <ul className="space-y-3">
          {data.map((a, i) => (
            <Card as="li" key={`${a.aluno.id}-${a.disciplina.id}-${i}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/gestao/alunos/${a.aluno.id}/historico`}
                      className="font-semibold text-primary underline"
                    >
                      {a.aluno.nome}
                    </Link>
                    {/* Ícone + texto, não apenas cor (RNF13/RNF19) */}
                    <Badge tone="danger">Em risco</Badge>
                  </div>
                  <p className="text-sm text-text-muted">{a.disciplina.nome}</p>
                  <ul className="mt-2 list-inside list-disc text-sm text-text-muted">
                    {a.motivos.map((m, j) => (
                      <li key={j}>{m}</li>
                    ))}
                  </ul>
                </div>
                <dl className="text-right text-sm">
                  <dt className="text-text-muted">Média</dt>
                  <dd className="text-lg font-bold text-text">{formatNota(a.mediaNotas)}</dd>
                  <dt className="mt-1 text-text-muted">Frequência</dt>
                  <dd className="text-lg font-bold text-text">
                    {formatPercent(a.percentualPresenca)}
                  </dd>
                </dl>
              </div>
            </Card>
          ))}
        </ul>
      )}
    </div>
  );
}
