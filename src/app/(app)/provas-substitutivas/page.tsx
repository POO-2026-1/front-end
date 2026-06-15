"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useApi } from "@/lib/useApi";
import {
  disciplinasApi,
  matriculasApi,
  provasSubstitutivasApi,
} from "@/lib/api/endpoints";
import { Modal } from "@/components/Modal";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Input,
  PageHeader,
  Select,
  Spinner,
  Textarea,
} from "@/components/ui";
import { PROVA_SUBST_STATUS_LABEL, formatDateTime } from "@/lib/format";
import { ApiError } from "@/lib/api/client";
import type {
  ProvaSubstitutivaResponse,
  ProvaSubstitutivaStatus,
} from "@/lib/api/types";

const TONE: Record<ProvaSubstitutivaStatus, "info" | "success" | "danger" | "neutral"> = {
  SOLICITADA: "info",
  APROVADA: "success",
  REJEITADA: "danger",
  AGENDADA: "neutral",
};

export default function ProvasSubstitutivasPage() {
  const { user } = useAuth();
  if (!user) return null;
  return user.role === "ALUNO" ? <ProvasAluno /> : <ProvasProfessor />;
}

// ---------------------------------------------------------------------------
// Aluno: solicitar + acompanhar (RF17)
// ---------------------------------------------------------------------------

function ProvasAluno() {
  const toast = useToast();
  const minhas = useApi(() => provasSubstitutivasApi.minhas({ size: 100 }), []);
  const matriculas = useApi(() => matriculasApi.minhas({ size: 100 }), []);
  const [modal, setModal] = useState(false);

  if (minhas.loading) return <Spinner />;
  if (minhas.error) return <ErrorState message={minhas.error} onRetry={minhas.reload} />;

  const disciplinasAtivas =
    matriculas.data?.content.filter((m) => m.status === "ATIVA").map((m) => m.disciplina) ?? [];

  return (
    <div>
      <PageHeader
        title="Provas substitutivas"
        description="Solicite e acompanhe suas provas substitutivas."
        actions={<Button onClick={() => setModal(true)}>+ Solicitar</Button>}
      />

      {!minhas.data || minhas.data.content.length === 0 ? (
        <EmptyState title="Você não possui solicitações de prova substitutiva." />
      ) : (
        <ul className="space-y-3">
          {minhas.data.content.map((p) => (
            <ProvaCard key={p.id} p={p} />
          ))}
        </ul>
      )}

      {modal && (
        <SolicitarModal
          disciplinas={disciplinasAtivas}
          onClose={() => setModal(false)}
          onSaved={() => {
            setModal(false);
            minhas.reload();
            toast.success("Solicitação enviada ao professor.");
          }}
        />
      )}
    </div>
  );
}

function SolicitarModal({
  disciplinas,
  onClose,
  onSaved,
}: {
  disciplinas: { id: string; nome: string }[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [disciplinaId, setDisciplinaId] = useState("");
  const [justificativa, setJustificativa] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    try {
      await provasSubstitutivasApi.solicitar({ disciplinaId, justificativa });
      onSaved();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Falha ao solicitar.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Modal open title="Solicitar prova substitutiva" onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Select
          label="Disciplina"
          value={disciplinaId}
          onChange={(e) => setDisciplinaId(e.target.value)}
          required
        >
          <option value="">Selecione…</option>
          {disciplinas.map((d) => (
            <option key={d.id} value={d.id}>
              {d.nome}
            </option>
          ))}
        </Select>
        <Textarea
          label="Justificativa"
          hint="Explique o motivo da ausência."
          rows={4}
          value={justificativa}
          onChange={(e) => setJustificativa(e.target.value)}
          required
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={salvando}>
            Solicitar
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Professor/Gestor: avaliar e agendar (RF26)
// ---------------------------------------------------------------------------

function ProvasProfessor() {
  const disciplinas = useApi(() => disciplinasApi.listar({ size: 100 }), []);
  const [disciplinaId, setDisciplinaId] = useState("");
  const provas = useApi(
    () =>
      disciplinaId
        ? provasSubstitutivasApi.porDisciplina(disciplinaId)
        : Promise.resolve([]),
    [disciplinaId],
  );
  const [decidir, setDecidir] = useState<ProvaSubstitutivaResponse | null>(null);

  return (
    <div>
      <PageHeader
        title="Provas substitutivas"
        description="Avalie, aprove ou agende as solicitações dos alunos."
      />

      <Card className="mb-4">
        <div className="w-72">
          <Select
            label="Disciplina"
            value={disciplinaId}
            onChange={(e) => setDisciplinaId(e.target.value)}
          >
            <option value="">Selecione uma disciplina…</option>
            {disciplinas.data?.content.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nome}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      {!disciplinaId ? (
        <EmptyState title="Selecione uma disciplina para ver as solicitações." />
      ) : provas.loading ? (
        <Spinner />
      ) : provas.error ? (
        <ErrorState message={provas.error} onRetry={provas.reload} />
      ) : !provas.data || provas.data.length === 0 ? (
        <EmptyState title="Nenhuma solicitação para esta disciplina." />
      ) : (
        <ul className="space-y-3">
          {provas.data.map((p) => (
            <ProvaCard
              key={p.id}
              p={p}
              mostrarAluno
              acao={
                <Button variant="secondary" onClick={() => setDecidir(p)}>
                  Avaliar
                </Button>
              }
            />
          ))}
        </ul>
      )}

      {decidir && (
        <DecidirModal
          prova={decidir}
          onClose={() => setDecidir(null)}
          onSaved={() => {
            setDecidir(null);
            provas.reload();
          }}
        />
      )}
    </div>
  );
}

function ProvaCard({
  p,
  mostrarAluno,
  acao,
}: {
  p: ProvaSubstitutivaResponse;
  mostrarAluno?: boolean;
  acao?: React.ReactNode;
}) {
  return (
    <Card as="li">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-text">{p.disciplina.nome}</span>
            <Badge tone={TONE[p.status]}>{PROVA_SUBST_STATUS_LABEL[p.status]}</Badge>
          </div>
          {mostrarAluno && <p className="text-sm text-text-muted">Aluno: {p.aluno.nome}</p>}
          <p className="mt-1 text-sm text-text-muted">
            <span className="font-medium">Justificativa: </span>
            {p.justificativa}
          </p>
          {p.agendadaPara && (
            <p className="mt-1 text-sm text-text-muted">
              Agendada para {formatDateTime(p.agendadaPara)}
            </p>
          )}
          {p.parecer && (
            <p className="mt-1 text-sm text-text-muted">
              <span className="font-medium">Parecer: </span>
              {p.parecer}
            </p>
          )}
        </div>
        {acao}
      </div>
    </Card>
  );
}

function DecidirModal({
  prova,
  onClose,
  onSaved,
}: {
  prova: ProvaSubstitutivaResponse;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [status, setStatus] = useState<ProvaSubstitutivaStatus>(prova.status);
  const [parecer, setParecer] = useState(prova.parecer ?? "");
  const [agendadaPara, setAgendadaPara] = useState(
    prova.agendadaPara ? prova.agendadaPara.slice(0, 16) : "",
  );
  const [salvando, setSalvando] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    try {
      await provasSubstitutivasApi.decidir(prova.id, {
        status,
        parecer,
        agendadaPara: agendadaPara ? new Date(agendadaPara).toISOString() : undefined,
      });
      toast.success("Decisão registrada.");
      onSaved();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Falha ao registrar decisão.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Modal open title="Avaliar prova substitutiva" onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Select
          label="Decisão"
          value={status}
          onChange={(e) => setStatus(e.target.value as ProvaSubstitutivaStatus)}
        >
          <option value="SOLICITADA">Solicitada</option>
          <option value="APROVADA">Aprovar</option>
          <option value="REJEITADA">Rejeitar</option>
          <option value="AGENDADA">Agendar</option>
        </Select>
        <Input
          label="Data/hora do agendamento"
          type="datetime-local"
          value={agendadaPara}
          onChange={(e) => setAgendadaPara(e.target.value)}
        />
        <Textarea
          label="Parecer"
          rows={3}
          value={parecer}
          onChange={(e) => setParecer(e.target.value)}
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={salvando}>
            Salvar
          </Button>
        </div>
      </form>
    </Modal>
  );
}
