"use client";

import { useState } from "react";
import Link from "next/link";
import { useToast } from "@/context/ToastContext";
import { useApi } from "@/lib/useApi";
import { usuariosApi } from "@/lib/api/endpoints";
import { RoleGate } from "@/components/RoleGate";
import { ConfirmDialog } from "@/components/ConfirmDialog";
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
import { ROLE_LABEL } from "@/lib/format";
import { ApiError } from "@/lib/api/client";
import type { Role, UsuarioResponse } from "@/lib/api/types";

/** RF05/RF33 — Gestão de usuários: bloquear, reativar, remover. */
export default function UsuariosPage() {
  return (
    <RoleGate roles={["GESTOR"]}>
      <Usuarios />
    </RoleGate>
  );
}

function Usuarios() {
  const toast = useToast();
  const [role, setRole] = useState<Role | "">("");
  const { data, loading, error, reload } = useApi(
    () => usuariosApi.listar({ role: role || undefined, size: 200 }),
    [role],
  );
  const [excluir, setExcluir] = useState<UsuarioResponse | null>(null);
  const [processando, setProcessando] = useState(false);

  async function alternarBloqueio(u: UsuarioResponse) {
    try {
      await usuariosApi.bloqueio(u.id, !u.bloqueado);
      toast.success(u.bloqueado ? "Usuário desbloqueado." : "Usuário bloqueado.");
      reload();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Falha na operação.");
    }
  }

  async function reativar(u: UsuarioResponse) {
    try {
      await usuariosApi.reativar(u.id);
      toast.success("Usuário reativado.");
      reload();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Falha ao reativar.");
    }
  }

  async function confirmarExclusao() {
    if (!excluir) return;
    setProcessando(true);
    try {
      await usuariosApi.remover(excluir.id);
      toast.success("Usuário removido. Pode ser recuperado por até 7 dias.");
      setExcluir(null);
      reload();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Falha ao remover.");
    } finally {
      setProcessando(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Usuários"
        description="Gerencie perfis de alunos, professores e gestores."
      />

      <Card className="mb-4">
        <div className="w-60">
          <Select
            label="Filtrar por perfil"
            value={role}
            onChange={(e) => setRole(e.target.value as Role | "")}
          >
            <option value="">Todos</option>
            <option value="ALUNO">Alunos</option>
            <option value="PROFESSOR">Professores</option>
            <option value="GESTOR">Gestores</option>
          </Select>
        </div>
      </Card>

      {loading ? (
        <Spinner />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : !data || data.content.length === 0 ? (
        <EmptyState title="Nenhum usuário encontrado." />
      ) : (
        <Card>
          <ul className="divide-y divide-border">
            {data.content.map((u) => (
              <li key={u.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-text">{u.nome}</span>
                    <Badge tone="neutral" withIcon={false}>
                      {ROLE_LABEL[u.role]}
                    </Badge>
                    {!u.ativo && <Badge tone="danger">Inativo</Badge>}
                    {u.bloqueado && <Badge tone="warning">Bloqueado</Badge>}
                  </div>
                  <p className="text-sm text-text-muted">{u.email}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {u.role === "ALUNO" && (
                    <Link
                      href={`/gestao/alunos/${u.id}/historico`}
                      className="inline-flex items-center rounded-lg border border-border px-3 py-2 text-sm font-medium text-text hover:bg-surface-2"
                    >
                      Histórico
                    </Link>
                  )}
                  <Button variant="secondary" onClick={() => alternarBloqueio(u)}>
                    {u.bloqueado ? "Desbloquear" : "Bloquear"}
                  </Button>
                  {!u.ativo && (
                    <Button variant="secondary" onClick={() => reativar(u)}>
                      Reativar
                    </Button>
                  )}
                  <Button variant="danger" onClick={() => setExcluir(u)}>
                    Remover
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <ConfirmDialog
        open={!!excluir}
        danger
        loading={processando}
        title="Remover usuário"
        message={`Remover ${excluir?.nome}? O item poderá ser recuperado por até 7 dias (soft delete).`}
        confirmLabel="Remover"
        onConfirm={confirmarExclusao}
        onCancel={() => setExcluir(null)}
      />
    </div>
  );
}
