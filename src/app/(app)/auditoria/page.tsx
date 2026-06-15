"use client";

import { useState } from "react";
import { useApi } from "@/lib/useApi";
import { auditoriaApi } from "@/lib/api/endpoints";
import { RoleGate } from "@/components/RoleGate";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Input,
  PageHeader,
  Spinner,
} from "@/components/ui";
import { formatDateTime } from "@/lib/format";
import type { AuditoriaAcao } from "@/lib/api/types";

const ACAO_TONE: Record<AuditoriaAcao, "success" | "info" | "danger" | "warning"> = {
  CRIACAO: "success",
  ATUALIZACAO: "info",
  EXCLUSAO: "danger",
  ACESSO_NEGADO: "warning",
};

const ACAO_LABEL: Record<AuditoriaAcao, string> = {
  CRIACAO: "Criação",
  ATUALIZACAO: "Atualização",
  EXCLUSAO: "Exclusão",
  ACESSO_NEGADO: "Acesso negado",
};

/** RNF01 — Trilha de auditoria de alterações em dados sensíveis. */
export default function AuditoriaPage() {
  return (
    <RoleGate roles={["GESTOR"]}>
      <Auditoria />
    </RoleGate>
  );
}

function Auditoria() {
  const [entidade, setEntidade] = useState("");
  const [busca, setBusca] = useState("");
  const [page, setPage] = useState(0);
  const { data, loading, error, reload } = useApi(
    () => auditoriaApi.listar({ entidade: busca || undefined, page, size: 30 }),
    [busca, page],
  );

  return (
    <div>
      <PageHeader
        title="Trilha de auditoria"
        description="Histórico de alterações em dados sensíveis (notas, frequência, perfis, contestações)."
      />

      <Card className="mb-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setPage(0);
            setBusca(entidade);
          }}
          className="flex items-end gap-2"
        >
          <div className="flex-1">
            <Input
              label="Filtrar por entidade"
              hint="Ex.: Nota, Frequencia, Usuario, Contestacao."
              value={entidade}
              onChange={(e) => setEntidade(e.target.value)}
            />
          </div>
          <Button type="submit" variant="secondary">
            Filtrar
          </Button>
        </form>
      </Card>

      {loading ? (
        <Spinner />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : !data || data.content.length === 0 ? (
        <EmptyState title="Nenhum registro de auditoria encontrado." />
      ) : (
        <>
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">Registros de auditoria</caption>
                <thead>
                  <tr className="border-b border-border text-text-muted">
                    <th scope="col" className="py-2 pr-4">Momento</th>
                    <th scope="col" className="py-2 pr-4">Ação</th>
                    <th scope="col" className="py-2 pr-4">Entidade</th>
                    <th scope="col" className="py-2 pr-4">Responsável</th>
                    <th scope="col" className="py-2">Detalhe</th>
                  </tr>
                </thead>
                <tbody>
                  {data.content.map((log) => (
                    <tr key={log.id} className="border-b border-border">
                      <td className="py-2 pr-4 text-text-muted">{formatDateTime(log.momento)}</td>
                      <td className="py-2 pr-4">
                        <Badge tone={ACAO_TONE[log.acao]} withIcon={false}>
                          {ACAO_LABEL[log.acao]}
                        </Badge>
                      </td>
                      <td className="py-2 pr-4 text-text">{log.entidade}</td>
                      <td className="py-2 pr-4 text-text-muted">{log.responsavelNome}</td>
                      <td className="py-2 text-text-muted">{log.detalhe ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="mt-4 flex items-center justify-between">
            <Button
              variant="secondary"
              disabled={data.first}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              ← Anterior
            </Button>
            <span className="text-sm text-text-muted">
              Página {data.page + 1} de {Math.max(1, data.totalPages)}
            </span>
            <Button
              variant="secondary"
              disabled={data.last}
              onClick={() => setPage((p) => p + 1)}
            >
              Próxima →
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
