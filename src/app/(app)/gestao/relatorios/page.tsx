"use client";

import { useState } from "react";
import { useApi } from "@/lib/useApi";
import { disciplinasApi, gestaoApi } from "@/lib/api/endpoints";
import { RoleGate } from "@/components/RoleGate";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  PageHeader,
  Select,
  Spinner,
} from "@/components/ui";
import { formatNota, formatPercent } from "@/lib/format";

/** RF29 — Relatórios personalizados; RNF16 — exportação semântica (PDF). */
export default function RelatoriosPage() {
  return (
    <RoleGate roles={["GESTOR"]}>
      <Relatorios />
    </RoleGate>
  );
}

function Relatorios() {
  const disciplinas = useApi(() => disciplinasApi.listar({ size: 200 }), []);
  const [disciplinaId, setDisciplinaId] = useState("");
  const relatorio = useApi(
    () => (disciplinaId ? gestaoApi.relatorioDisciplina(disciplinaId) : Promise.resolve(null)),
    [disciplinaId],
  );

  return (
    <div>
      <PageHeader
        title="Relatórios"
        description="Gere relatórios de desempenho por disciplina."
        actions={
          relatorio.data ? (
            <Button variant="secondary" onClick={() => window.print()}>
              Exportar (PDF)
            </Button>
          ) : undefined
        }
      />

      <Card className="mb-4" data-no-print>
        <div className="w-72">
          <Select
            label="Disciplina"
            value={disciplinaId}
            onChange={(e) => setDisciplinaId(e.target.value)}
          >
            <option value="">Selecione…</option>
            {disciplinas.data?.content.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nome} ({d.codigo})
              </option>
            ))}
          </Select>
        </div>
      </Card>

      {!disciplinaId ? (
        <EmptyState title="Selecione uma disciplina para gerar o relatório." />
      ) : relatorio.loading ? (
        <Spinner />
      ) : relatorio.error ? (
        <ErrorState message={relatorio.error} onRetry={relatorio.reload} />
      ) : relatorio.data ? (
        <Card as="section">
          <h2 className="text-lg font-bold text-text">
            Relatório — {relatorio.data.disciplina.nome}
          </h2>
          <p className="text-sm text-text-muted">
            {relatorio.data.disciplina.codigo} · {relatorio.data.disciplina.periodo}
          </p>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">
                Desempenho dos alunos em {relatorio.data.disciplina.nome}
              </caption>
              <thead>
                <tr className="border-b border-border text-text-muted">
                  <th scope="col" className="py-2 pr-4">Aluno</th>
                  <th scope="col" className="py-2 pr-4">Média</th>
                  <th scope="col" className="py-2 pr-4">Frequência</th>
                  <th scope="col" className="py-2">Situação</th>
                </tr>
              </thead>
              <tbody>
                {relatorio.data.itens.map((it, i) => (
                  <tr key={`${it.aluno.id}-${i}`} className="border-b border-border">
                    <td className="py-2 pr-4 text-text">{it.aluno.nome}</td>
                    <td className="py-2 pr-4 text-text">{formatNota(it.mediaNotas)}</td>
                    <td className="py-2 pr-4 text-text">{formatPercent(it.percentualPresenca)}</td>
                    <td className="py-2">
                      <Badge tone={/aprov/i.test(it.situacao) ? "success" : "warning"} withIcon={false}>
                        {it.situacao}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {relatorio.data.itens.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-3 text-text-muted">
                      Sem dados para esta disciplina.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
