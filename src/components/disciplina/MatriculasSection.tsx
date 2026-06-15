"use client";

import { useState } from "react";
import { useToast } from "@/context/ToastContext";
import { useApi } from "@/lib/useApi";
import { matriculasApi, usuariosApi } from "@/lib/api/endpoints";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Select,
  Spinner,
} from "@/components/ui";
import { MATRICULA_STATUS_LABEL } from "@/lib/format";
import { ApiError } from "@/lib/api/client";
import type { MatriculaResponse } from "@/lib/api/types";

/** RF07 — Aprovação e gestão de matrículas pelo professor/gestor. */
export function MatriculasSection({ disciplinaId }: { disciplinaId: string }) {
  const toast = useToast();
  const matriculas = useApi(() => matriculasApi.porDisciplina(disciplinaId), [disciplinaId]);
  const alunos = useApi(() => usuariosApi.listar({ role: "ALUNO", size: 200 }), []);
  const [remover, setRemover] = useState<MatriculaResponse | null>(null);
  const [removendo, setRemovendo] = useState(false);
  const [novoAluno, setNovoAluno] = useState("");
  const [adicionando, setAdicionando] = useState(false);

  if (matriculas.loading) return <Spinner />;
  if (matriculas.error)
    return <ErrorState message={matriculas.error} onRetry={matriculas.reload} />;

  const lista = matriculas.data ?? [];
  const matriculadosIds = new Set(lista.map((m) => m.aluno.id));
  const disponiveis = (alunos.data?.content ?? []).filter((a) => !matriculadosIds.has(a.id));

  async function aprovar(m: MatriculaResponse) {
    try {
      await matriculasApi.aprovar(m.id);
      toast.success("Matrícula aprovada.");
      matriculas.reload();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Falha ao aprovar.");
    }
  }

  async function adicionar() {
    if (!novoAluno) return;
    setAdicionando(true);
    try {
      await matriculasApi.criar({ alunoId: novoAluno, disciplinaId });
      toast.success("Aluno matriculado.");
      setNovoAluno("");
      matriculas.reload();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Falha ao matricular.");
    } finally {
      setAdicionando(false);
    }
  }

  async function confirmarRemocao() {
    if (!remover) return;
    setRemovendo(true);
    try {
      await matriculasApi.remover(remover.id);
      toast.success("Matrícula removida.");
      setRemover(null);
      matriculas.reload();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Falha ao remover.");
    } finally {
      setRemovendo(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-60 flex-1">
            <Select
              label="Matricular aluno"
              value={novoAluno}
              onChange={(e) => setNovoAluno(e.target.value)}
            >
              <option value="">Selecione um aluno…</option>
              {disponiveis.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nome} ({a.email})
                </option>
              ))}
            </Select>
          </div>
          <Button onClick={adicionar} loading={adicionando} disabled={!novoAluno}>
            Matricular
          </Button>
        </div>
      </Card>

      {lista.length === 0 ? (
        <EmptyState title="Nenhum aluno matriculado." />
      ) : (
        <Card>
          <ul className="divide-y divide-border">
            {lista.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <div>
                  <p className="font-medium text-text">{m.aluno.nome}</p>
                  <p className="text-sm text-text-muted">{m.aluno.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={m.status === "ATIVA" ? "success" : "warning"}>
                    {MATRICULA_STATUS_LABEL[m.status]}
                  </Badge>
                  {m.status === "PENDENTE" && (
                    <Button variant="secondary" onClick={() => aprovar(m)}>
                      Aprovar
                    </Button>
                  )}
                  <Button variant="danger" onClick={() => setRemover(m)}>
                    Remover
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <ConfirmDialog
        open={!!remover}
        danger
        loading={removendo}
        title="Remover matrícula"
        message={`Remover a matrícula de ${remover?.aluno.nome}?`}
        confirmLabel="Remover"
        onConfirm={confirmarRemocao}
        onCancel={() => setRemover(null)}
      />
    </div>
  );
}
