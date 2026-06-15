"use client";

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
import { formatDateTime } from "@/lib/format";

/** RF30 — Monitoramento de docentes com lançamento de notas pendente. */
export default function MonitoramentoNotasPage() {
  return (
    <RoleGate roles={["GESTOR"]}>
      <MonitoramentoNotas />
    </RoleGate>
  );
}

function MonitoramentoNotas() {
  const { data, loading, error, reload } = useApi(() => gestaoApi.monitoramentoNotas(), []);

  if (loading) return <Spinner />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <div>
      <PageHeader
        title="Monitoramento de notas"
        description="Atividades com lançamento de notas pendente, por docente."
      />

      {!data || data.length === 0 ? (
        <EmptyState title="Nenhuma pendência de lançamento de notas." />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">
                Docentes com lançamento de notas pendente
              </caption>
              <thead>
                <tr className="border-b border-border text-text-muted">
                  <th scope="col" className="py-2 pr-4">Docente</th>
                  <th scope="col" className="py-2 pr-4">Disciplina</th>
                  <th scope="col" className="py-2 pr-4">Atividade</th>
                  <th scope="col" className="py-2 pr-4">Prazo</th>
                  <th scope="col" className="py-2 pr-4">Pendentes</th>
                  <th scope="col" className="py-2">Situação</th>
                </tr>
              </thead>
              <tbody>
                {data.map((d, i) => (
                  <tr key={`${d.atividadeId}-${i}`} className="border-b border-border">
                    <td className="py-2 pr-4 text-text">{d.professor.nome}</td>
                    <td className="py-2 pr-4 text-text-muted">{d.disciplina.nome}</td>
                    <td className="py-2 pr-4 text-text-muted">{d.atividadeTitulo}</td>
                    <td className="py-2 pr-4 text-text-muted">{formatDateTime(d.prazo)}</td>
                    <td className="py-2 pr-4 text-text">
                      {d.notasPendentes}/{d.totalAlunos}
                    </td>
                    <td className="py-2">
                      {d.notasPendentes > 0 ? (
                        <Badge tone="warning">Pendente</Badge>
                      ) : (
                        <Badge tone="success">Em dia</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
