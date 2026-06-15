"use client";

import { useState } from "react";
import { useToast } from "@/context/ToastContext";
import { useApi } from "@/lib/useApi";
import { atividadesApoioApi, disciplinasApi } from "@/lib/api/endpoints";
import { RoleGate } from "@/components/RoleGate";
import { Modal } from "@/components/Modal";
import {
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
import { formatDateTime } from "@/lib/format";
import { ApiError } from "@/lib/api/client";

/** RF35 — Agendamento de atividades de acolhimento e nivelamento. */
export default function AtividadesApoioPage() {
  return (
    <RoleGate roles={["GESTOR"]}>
      <AtividadesApoio />
    </RoleGate>
  );
}

function AtividadesApoio() {
  const toast = useToast();
  const { data, loading, error, reload } = useApi(() => atividadesApoioApi.listar(), []);
  const [modal, setModal] = useState(false);

  if (loading) return <Spinner />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <div>
      <PageHeader
        title="Atividades de apoio"
        description="Acolhimento e nivelamento para turmas e alunos em risco."
        actions={<Button onClick={() => setModal(true)}>+ Agendar</Button>}
      />

      {!data || data.length === 0 ? (
        <EmptyState title="Nenhuma atividade de apoio agendada." />
      ) : (
        <ul className="space-y-3">
          {data.map((a) => (
            <Card as="li" key={a.id}>
              <p className="font-semibold text-text">{a.titulo}</p>
              {a.descricao && <p className="text-sm text-text-muted">{a.descricao}</p>}
              <p className="mt-1 text-sm text-text-muted">
                {a.disciplina ? `${a.disciplina.nome} · ` : ""}
                {a.publicoAlvo ? `${a.publicoAlvo} · ` : ""}
                Agendada para {formatDateTime(a.agendadaPara)}
              </p>
            </Card>
          ))}
        </ul>
      )}

      {modal && (
        <ApoioFormModal
          onClose={() => setModal(false)}
          onSaved={() => {
            setModal(false);
            reload();
            toast.success("Atividade de apoio agendada.");
          }}
        />
      )}
    </div>
  );
}

function ApoioFormModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const disciplinas = useApi(() => disciplinasApi.listar({ size: 200 }), []);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [disciplinaId, setDisciplinaId] = useState("");
  const [publicoAlvo, setPublicoAlvo] = useState("");
  const [agendadaPara, setAgendadaPara] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    try {
      await atividadesApoioApi.criar({
        titulo,
        descricao,
        disciplinaId: disciplinaId || undefined,
        publicoAlvo: publicoAlvo || undefined,
        agendadaPara: new Date(agendadaPara).toISOString(),
      });
      onSaved();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Falha ao agendar.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Modal open title="Agendar atividade de apoio" onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Input label="Título" value={titulo} onChange={(e) => setTitulo(e.target.value)} required />
        <Textarea
          label="Descrição"
          rows={2}
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
        />
        <Select
          label="Disciplina (opcional)"
          value={disciplinaId}
          onChange={(e) => setDisciplinaId(e.target.value)}
        >
          <option value="">Todas / não específica</option>
          {disciplinas.data?.content.map((d) => (
            <option key={d.id} value={d.id}>
              {d.nome}
            </option>
          ))}
        </Select>
        <Input
          label="Público-alvo"
          hint="Ex.: alunos com média abaixo de 6,0."
          value={publicoAlvo}
          onChange={(e) => setPublicoAlvo(e.target.value)}
        />
        <Input
          label="Data/hora"
          type="datetime-local"
          value={agendadaPara}
          onChange={(e) => setAgendadaPara(e.target.value)}
          required
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={salvando}>
            Agendar
          </Button>
        </div>
      </form>
    </Modal>
  );
}
