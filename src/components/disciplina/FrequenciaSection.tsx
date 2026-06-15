"use client";

import { useState } from "react";
import { useToast } from "@/context/ToastContext";
import { useApi } from "@/lib/useApi";
import { frequenciasApi, matriculasApi } from "@/lib/api/endpoints";
import { ContestarModal } from "@/components/ContestarModal";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Input,
  Spinner,
} from "@/components/ui";
import { formatDate, formatPercent } from "@/lib/format";
import { ApiError } from "@/lib/api/client";
import type { FrequenciaItemRequest, Role } from "@/lib/api/types";

export function FrequenciaSection({
  disciplinaId,
  role,
}: {
  disciplinaId: string;
  role: Role;
}) {
  if (role === "ALUNO") return <FrequenciaAluno disciplinaId={disciplinaId} />;
  return <FrequenciaProfessor disciplinaId={disciplinaId} />;
}

// ---------------------------------------------------------------------------
// Aluno: resumo + histórico + contestar falta (RF11, RF12)
// ---------------------------------------------------------------------------

function FrequenciaAluno({ disciplinaId }: { disciplinaId: string }) {
  const resumo = useApi(() => frequenciasApi.meuResumo(disciplinaId), [disciplinaId]);
  const registros = useApi(() => frequenciasApi.minhas(), []);
  const [contestar, setContestar] = useState<{ id: string; data: string } | null>(null);

  if (resumo.loading || registros.loading) return <Spinner />;
  if (resumo.error) return <ErrorState message={resumo.error} onRetry={resumo.reload} />;

  const r = resumo.data;
  const faltasDaDisciplina =
    registros.data?.filter(
      (f) => f.disciplina.id === disciplinaId && f.status === "FALTA",
    ) ?? [];

  return (
    <div className="space-y-4">
      {r && (
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-text-muted">Frequência na disciplina</p>
              <p className="text-3xl font-bold text-text">
                {formatPercent(r.percentualPresenca)}
              </p>
              <p className="text-sm text-text-muted">
                {r.presencas} presença(s) · {r.faltas} falta(s) de {r.totalAulas} aula(s)
              </p>
            </div>
            {r.atingiuMinimo ? (
              <Badge tone="success">Acima do mínimo ({r.minimoExigido}%)</Badge>
            ) : (
              <Badge tone="danger">Abaixo do mínimo ({r.minimoExigido}%)</Badge>
            )}
          </div>
        </Card>
      )}

      <section>
        <h3 className="mb-2 font-semibold text-text">Minhas faltas</h3>
        {faltasDaDisciplina.length === 0 ? (
          <EmptyState title="Nenhuma falta registrada nesta disciplina." />
        ) : (
          <ul className="space-y-2">
            {faltasDaDisciplina.map((f) => (
              <Card as="li" key={f.id}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-text">
                    Falta em {formatDate(f.data)}
                    {f.justificativa ? ` — ${f.justificativa}` : ""}
                  </span>
                  <Button
                    variant="secondary"
                    onClick={() => setContestar({ id: f.id, data: f.data })}
                  >
                    Contestar
                  </Button>
                </div>
              </Card>
            ))}
          </ul>
        )}
      </section>

      {contestar && (
        <ContestarModal
          open
          tipo="FALTA"
          disciplinaId={disciplinaId}
          registroId={contestar.id}
          descricaoAlvo={`Falta registrada em ${formatDate(contestar.data)}.`}
          onClose={() => setContestar(null)}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Professor: registrar/editar frequência por data (RF25)
// ---------------------------------------------------------------------------

function FrequenciaProfessor({ disciplinaId }: { disciplinaId: string }) {
  const toast = useToast();
  const matriculas = useApi(() => matriculasApi.porDisciplina(disciplinaId), [disciplinaId]);
  const [data, setData] = useState(() => new Date().toISOString().slice(0, 10));
  const [presencas, setPresencas] = useState<Record<string, boolean>>({});
  const [salvando, setSalvando] = useState(false);

  if (matriculas.loading) return <Spinner />;
  if (matriculas.error)
    return <ErrorState message={matriculas.error} onRetry={matriculas.reload} />;

  const ativos = (matriculas.data ?? []).filter((m) => m.status === "ATIVA");

  async function carregarData() {
    try {
      const existentes = await frequenciasApi.porDisciplina(disciplinaId, data);
      const mapa: Record<string, boolean> = {};
      existentes.forEach((f) => {
        mapa[f.aluno.id] = f.status === "PRESENCA";
      });
      setPresencas(mapa);
      if (existentes.length > 0)
        toast.info("Frequência existente carregada para edição.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Falha ao carregar frequência.");
    }
  }

  async function salvar() {
    setSalvando(true);
    const itens: FrequenciaItemRequest[] = ativos.map((m) => ({
      alunoId: m.aluno.id,
      presente: presencas[m.aluno.id] ?? false,
    }));
    try {
      await frequenciasApi.registrar({ disciplinaId, data, itens });
      toast.success("Frequência registrada com sucesso.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Falha ao registrar frequência.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-48">
            <Input
              label="Data da aula"
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
            />
          </div>
          <Button variant="secondary" onClick={carregarData}>
            Carregar frequência da data
          </Button>
        </div>
      </Card>

      {ativos.length === 0 ? (
        <EmptyState title="Nenhum aluno ativo matriculado." />
      ) : (
        <Card>
          <ul className="divide-y divide-border">
            {ativos.map((m) => {
              const presente = presencas[m.aluno.id] ?? false;
              return (
                <li key={m.id} className="flex items-center justify-between gap-3 py-2">
                  <span className="text-text">{m.aluno.nome}</span>
                  <div className="flex gap-2" role="group" aria-label={`Frequência de ${m.aluno.nome}`}>
                    <button
                      type="button"
                      aria-pressed={presente}
                      onClick={() => setPresencas((p) => ({ ...p, [m.aluno.id]: true }))}
                      className={`rounded-lg border px-3 py-1 text-sm font-medium ${
                        presente
                          ? "border-success bg-success-bg text-success"
                          : "border-border text-text-muted"
                      }`}
                    >
                      ✓ Presente
                    </button>
                    <button
                      type="button"
                      aria-pressed={!presente}
                      onClick={() => setPresencas((p) => ({ ...p, [m.aluno.id]: false }))}
                      className={`rounded-lg border px-3 py-1 text-sm font-medium ${
                        !presente
                          ? "border-danger bg-danger-bg text-danger"
                          : "border-border text-text-muted"
                      }`}
                    >
                      ✕ Falta
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="mt-4 flex justify-end">
            <Button onClick={salvar} loading={salvando}>
              Salvar frequência
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
