"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useApi } from "@/lib/useApi";
import { contestacoesApi } from "@/lib/api/endpoints";
import { Modal } from "@/components/Modal";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  PageHeader,
  Select,
  Spinner,
  Textarea,
} from "@/components/ui";
import {
  CONTESTACAO_STATUS_LABEL,
  CONTESTACAO_TIPO_LABEL,
  formatDateTime,
} from "@/lib/format";
import { ApiError } from "@/lib/api/client";
import type { ContestacaoResponse, ContestacaoStatus } from "@/lib/api/types";

const STATUS_TONE: Record<ContestacaoStatus, "neutral" | "info" | "success" | "danger"> = {
  ABERTA: "info",
  EM_ANALISE: "neutral",
  DEFERIDA: "success",
  INDEFERIDA: "danger",
};

export default function ContestacoesPage() {
  const { user } = useAuth();
  if (!user) return null;
  return user.role === "ALUNO" ? <ContestacoesAluno /> : <ContestacoesGestao />;
}

// ---------------------------------------------------------------------------
// Aluno: acompanhar suas contestações (RF12)
// ---------------------------------------------------------------------------

function ContestacoesAluno() {
  const { data, loading, error, reload } = useApi(
    () => contestacoesApi.minhas({ size: 100 }),
    [],
  );

  if (loading) return <Spinner />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <div>
      <PageHeader
        title="Minhas contestações"
        description="Acompanhe o andamento das suas solicitações de revisão."
      />
      {!data || data.content.length === 0 ? (
        <EmptyState title="Você ainda não abriu contestações." />
      ) : (
        <ul className="space-y-3">
          {data.content.map((c) => (
            <ContestacaoCard key={c.id} c={c} />
          ))}
        </ul>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Professor/Gestor: analisar e dar parecer (RF32)
// ---------------------------------------------------------------------------

function ContestacoesGestao() {
  const [status, setStatus] = useState<ContestacaoStatus | "">("");
  const { data, loading, error, reload } = useApi(
    () => contestacoesApi.listar({ status: status || undefined, size: 100 }),
    [status],
  );
  const [parecer, setParecer] = useState<ContestacaoResponse | null>(null);

  return (
    <div>
      <PageHeader
        title="Gestão de contestações"
        description="Analise, encaminhe e registre o parecer das contestações."
      />

      <Card className="mb-4">
        <div className="w-60">
          <Select
            label="Filtrar por status"
            value={status}
            onChange={(e) => setStatus(e.target.value as ContestacaoStatus | "")}
          >
            <option value="">Todas</option>
            <option value="ABERTA">Aberta</option>
            <option value="EM_ANALISE">Em análise</option>
            <option value="DEFERIDA">Deferida</option>
            <option value="INDEFERIDA">Indeferida</option>
          </Select>
        </div>
      </Card>

      {loading ? (
        <Spinner />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : !data || data.content.length === 0 ? (
        <EmptyState title="Nenhuma contestação encontrada." />
      ) : (
        <ul className="space-y-3">
          {data.content.map((c) => (
            <ContestacaoCard
              key={c.id}
              c={c}
              acao={
                <Button variant="secondary" onClick={() => setParecer(c)}>
                  Dar parecer
                </Button>
              }
            />
          ))}
        </ul>
      )}

      {parecer && (
        <ParecerModal
          contestacao={parecer}
          onClose={() => setParecer(null)}
          onSaved={() => {
            setParecer(null);
            reload();
          }}
        />
      )}
    </div>
  );
}

function ContestacaoCard({
  c,
  acao,
}: {
  c: ContestacaoResponse;
  acao?: React.ReactNode;
}) {
  return (
    <Card as="li">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm text-text-muted">{c.protocolo}</span>
            <Badge tone="neutral" withIcon={false}>
              {CONTESTACAO_TIPO_LABEL[c.tipo]}
            </Badge>
            <Badge tone={STATUS_TONE[c.status]}>{CONTESTACAO_STATUS_LABEL[c.status]}</Badge>
          </div>
          <p className="mt-1 text-text">{c.disciplina.nome}</p>
          <p className="mt-1 text-sm text-text-muted">
            <span className="font-medium">Justificativa: </span>
            {c.justificativa}
          </p>
          {c.parecer && (
            <p className="mt-1 text-sm text-text-muted">
              <span className="font-medium">Parecer: </span>
              {c.parecer}
            </p>
          )}
          <p className="mt-1 text-xs text-text-muted">
            Aberta em {formatDateTime(c.criadoEm)}
            {c.encaminhadoPara ? ` · Encaminhada para ${c.encaminhadoPara.nome}` : ""}
          </p>
        </div>
        {acao}
      </div>
    </Card>
  );
}

function ParecerModal({
  contestacao,
  onClose,
  onSaved,
}: {
  contestacao: ContestacaoResponse;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [status, setStatus] = useState<ContestacaoStatus>(contestacao.status);
  const [parecer, setParecer] = useState(contestacao.parecer ?? "");
  const [salvando, setSalvando] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    try {
      await contestacoesApi.parecer(contestacao.id, { status, parecer });
      toast.success("Parecer registrado.");
      onSaved();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Falha ao registrar parecer.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Modal open title={`Parecer — ${contestacao.protocolo}`} onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Select
          label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value as ContestacaoStatus)}
        >
          <option value="ABERTA">Aberta</option>
          <option value="EM_ANALISE">Em análise</option>
          <option value="DEFERIDA">Deferida</option>
          <option value="INDEFERIDA">Indeferida</option>
        </Select>
        <Textarea
          label="Parecer"
          rows={4}
          value={parecer}
          onChange={(e) => setParecer(e.target.value)}
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={salvando}>
            Salvar parecer
          </Button>
        </div>
      </form>
    </Modal>
  );
}
