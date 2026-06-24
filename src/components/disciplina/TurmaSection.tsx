"use client";

import { useApi } from "@/lib/useApi";
import { matriculasApi } from "@/lib/api/endpoints";
import { Card, EmptyState, ErrorState, Spinner } from "@/components/ui";
import { initials } from "@/lib/format";
import type { UsuarioResumoResponse } from "@/lib/api/types";

/**
 * RF15/RF27 — Integrantes da turma (professor + colegas) com e-mail, para que
 * o aluno possa entrar em contato (ex.: mensagem privada por e-mail).
 * Somente leitura: nenhuma ação de gestão de matrícula.
 */
export function TurmaSection({
  disciplinaId,
  professor,
}: {
  disciplinaId: string;
  professor?: UsuarioResumoResponse;
}) {
  const matriculas = useApi(() => matriculasApi.porDisciplina(disciplinaId), [disciplinaId]);

  if (matriculas.loading) return <Spinner />;
  if (matriculas.error)
    return <ErrorState message={matriculas.error} onRetry={matriculas.reload} />;

  // Apenas matrículas ativas representam colegas de fato na turma.
  const colegas = (matriculas.data ?? []).filter((m) => m.status === "ATIVA");

  return (
    <div className="space-y-4">
      {professor && (
        <Card>
          <h2 className="mb-2 text-sm font-semibold text-text-muted">Professor</h2>
          <Pessoa nome={professor.nome} email={professor.email} />
        </Card>
      )}

      <Card>
        <h2 className="mb-2 text-sm font-semibold text-text-muted">Colegas de turma</h2>
        {colegas.length === 0 ? (
          <EmptyState title="Nenhum colega matriculado ainda." />
        ) : (
          <ul className="divide-y divide-border">
            {colegas.map((m) => (
              <li key={m.id} className="py-2">
                <Pessoa nome={m.aluno.nome} email={m.aluno.email} />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function Pessoa({ nome, email }: { nome: string; email: string }) {
  return (
    <div className="flex items-center gap-3">
      <span
        aria-hidden
        className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-2 text-xs font-bold text-text"
      >
        {initials(nome)}
      </span>
      <div className="min-w-0">
        <p className="font-medium text-text">{nome}</p>
        <a href={`mailto:${email}`} className="text-sm text-primary underline break-all">
          {email}
        </a>
      </div>
    </div>
  );
}
