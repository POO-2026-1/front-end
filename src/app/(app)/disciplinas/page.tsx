"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useApi } from "@/lib/useApi";
import { disciplinasApi, matriculasApi } from "@/lib/api/endpoints";
import { Modal } from "@/components/Modal";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Input,
  PageHeader,
  Spinner,
  Textarea,
} from "@/components/ui";
import { MATRICULA_STATUS_LABEL } from "@/lib/format";
import { ApiError } from "@/lib/api/client";
import type { DisciplinaRequest } from "@/lib/api/types";

export default function DisciplinasPage() {
  const { user } = useAuth();
  const podeGerir = user?.role === "PROFESSOR" || user?.role === "GESTOR";

  return (
    <div>
      <PageHeader
        title="Disciplinas"
        description={
          podeGerir
            ? "Crie e gerencie as disciplinas."
            : "Suas disciplinas e turmas disponíveis."
        }
      />
      {podeGerir ? <DisciplinasGestao /> : <DisciplinasAluno />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Visão do aluno: minhas matrículas + solicitar matrícula (RF07)
// ---------------------------------------------------------------------------

function DisciplinasAluno() {
  const toast = useToast();
  const minhas = useApi(() => matriculasApi.minhas({ size: 100 }), []);
  const disponiveis = useApi(() => disciplinasApi.listar({ size: 100 }), []);
  const [solicitando, setSolicitando] = useState<string | null>(null);

  if (minhas.loading || disponiveis.loading) return <Spinner />;
  if (minhas.error) return <ErrorState message={minhas.error} onRetry={minhas.reload} />;

  const matriculadasIds = new Set(minhas.data?.content.map((m) => m.disciplina.id));
  const naoMatriculadas =
    disponiveis.data?.content.filter((d) => !matriculadasIds.has(d.id)) ?? [];

  async function solicitar(disciplinaId: string) {
    setSolicitando(disciplinaId);
    try {
      await matriculasApi.criar({ disciplinaId });
      toast.success("Solicitação de matrícula enviada. Aguarde a aprovação.");
      minhas.reload();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Falha ao solicitar matrícula.");
    } finally {
      setSolicitando(null);
    }
  }

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-3 text-lg font-bold text-text">Minhas disciplinas</h2>
        {minhas.data && minhas.data.content.length > 0 ? (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {minhas.data.content.map((m) => (
              <Card as="li" key={m.id}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Link
                      href={`/disciplinas/${m.disciplina.id}`}
                      className="font-semibold text-primary underline"
                    >
                      {m.disciplina.nome}
                    </Link>
                    <p className="text-sm text-text-muted">
                      {m.disciplina.codigo} · {m.disciplina.periodo}
                    </p>
                  </div>
                  <Badge tone={m.status === "ATIVA" ? "success" : "warning"}>
                    {MATRICULA_STATUS_LABEL[m.status]}
                  </Badge>
                </div>
              </Card>
            ))}
          </ul>
        ) : (
          <EmptyState title="Você ainda não está matriculado em disciplinas." />
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold text-text">Disciplinas disponíveis</h2>
        {naoMatriculadas.length > 0 ? (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {naoMatriculadas.map((d) => (
              <Card as="li" key={d.id}>
                <p className="font-semibold text-text">{d.nome}</p>
                <p className="text-sm text-text-muted">
                  {d.codigo} · {d.periodo}
                  {d.professor ? ` · Prof. ${d.professor.nome}` : ""}
                </p>
                <div className="mt-3">
                  <Button
                    variant="secondary"
                    loading={solicitando === d.id}
                    onClick={() => solicitar(d.id)}
                  >
                    Solicitar matrícula
                  </Button>
                </div>
              </Card>
            ))}
          </ul>
        ) : (
          <EmptyState title="Nenhuma disciplina disponível no momento." />
        )}
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Visão do professor/gestor: listar, criar, editar, excluir (RF20)
// ---------------------------------------------------------------------------

function DisciplinasGestao() {
  const toast = useToast();
  const { data, loading, error, reload } = useApi(
    () => disciplinasApi.listar({ size: 100 }),
    [],
  );
  const [modalAberto, setModalAberto] = useState(false);

  if (loading) return <Spinner />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setModalAberto(true)}>+ Nova disciplina</Button>
      </div>

      {data && data.content.length > 0 ? (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {data.content.map((d) => (
            <Card as="li" key={d.id}>
              <Link
                href={`/disciplinas/${d.id}`}
                className="font-semibold text-primary underline"
              >
                {d.nome}
              </Link>
              <p className="text-sm text-text-muted">
                {d.codigo} · {d.periodo}
              </p>
              <p className="mt-2 text-sm text-text-muted">
                {d.totalMatriculados} matriculado(s)
              </p>
            </Card>
          ))}
        </ul>
      ) : (
        <EmptyState
          title="Nenhuma disciplina cadastrada."
          description="Crie sua primeira disciplina."
        />
      )}

      <DisciplinaFormModal
        open={modalAberto}
        onClose={() => setModalAberto(false)}
        onSaved={() => {
          setModalAberto(false);
          reload();
          toast.success("Disciplina criada com sucesso.");
        }}
      />
    </div>
  );
}

function DisciplinaFormModal({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [form, setForm] = useState<DisciplinaRequest>({
    nome: "",
    codigo: "",
    descricao: "",
    periodo: "",
  });
  const [salvando, setSalvando] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    try {
      await disciplinasApi.criar(form);
      setForm({ nome: "", codigo: "", descricao: "", periodo: "" });
      onSaved();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Falha ao criar disciplina.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Modal open={open} title="Nova disciplina" onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Input
          label="Nome"
          value={form.nome}
          onChange={(e) => setForm({ ...form, nome: e.target.value })}
          required
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Código"
            value={form.codigo}
            onChange={(e) => setForm({ ...form, codigo: e.target.value })}
            required
          />
          <Input
            label="Período"
            hint="Ex.: 2026.1"
            value={form.periodo}
            onChange={(e) => setForm({ ...form, periodo: e.target.value })}
            required
          />
        </div>
        <Textarea
          label="Descrição"
          rows={3}
          value={form.descricao}
          onChange={(e) => setForm({ ...form, descricao: e.target.value })}
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={salvando}>
            Criar
          </Button>
        </div>
      </form>
    </Modal>
  );
}
