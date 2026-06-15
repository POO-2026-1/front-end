"use client";

import { use, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useToast } from "@/context/ToastContext";
import { useApi } from "@/lib/useApi";
import { atividadesApi, matriculasApi } from "@/lib/api/endpoints";
import { downloadFile, ApiError } from "@/lib/api/client";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  PageHeader,
  Spinner,
} from "@/components/ui";
import { formatDateTime, formatNota } from "@/lib/format";
import { RoleGate } from "@/components/RoleGate";

type EstadoSalvamento = "idle" | "saving" | "saved" | "error";

export default function LancarNotasPage({
  params,
}: {
  params: Promise<{ id: string; atividadeId: string }>;
}) {
  const { id, atividadeId } = use(params);

  return (
    <RoleGate roles={["PROFESSOR", "GESTOR"]}>
      <LancarNotas disciplinaId={id} atividadeId={atividadeId} />
    </RoleGate>
  );
}

function LancarNotas({
  disciplinaId,
  atividadeId,
}: {
  disciplinaId: string;
  atividadeId: string;
}) {
  const toast = useToast();
  const atividade = useApi(() => atividadesApi.porId(atividadeId), [atividadeId]);
  const matriculas = useApi(() => matriculasApi.porDisciplina(disciplinaId), [disciplinaId]);
  const notas = useApi(() => atividadesApi.notas(atividadeId), [atividadeId]);
  const submissoes = useApi(() => atividadesApi.submissoes(atividadeId), [atividadeId]);

  const [valores, setValores] = useState<Record<string, string>>({});
  const [estados, setEstados] = useState<Record<string, EstadoSalvamento>>({});
  const timers = useRef<Record<string, number>>({});
  const [publicando, setPublicando] = useState(false);
  const [inicializado, setInicializado] = useState(false);

  // Hidrata os valores iniciais a partir das notas existentes.
  useEffect(() => {
    if (notas.data && !inicializado) {
      const mapa: Record<string, string> = {};
      notas.data.forEach((n) => {
        mapa[n.aluno.id] = String(n.valor);
      });
      setValores(mapa);
      setInicializado(true);
    }
  }, [notas.data, inicializado]);

  const submissaoPorAluno = useMemo(() => {
    const mapa: Record<string, { id: string; nome: string; foraDoPrazo: boolean; enviadoEm: string }> = {};
    submissoes.data?.forEach((s) => {
      mapa[s.aluno.id] = {
        id: s.id,
        nome: s.nomeArquivo,
        foraDoPrazo: s.foraDoPrazo,
        enviadoEm: s.enviadoEm,
      };
    });
    return mapa;
  }, [submissoes.data]);

  // Salvamento automático (RNF07) com debounce por aluno.
  const salvar = useCallback(
    (alunoId: string, valor: number) => {
      setEstados((e) => ({ ...e, [alunoId]: "saving" }));
      atividadesApi
        .lancarNota(atividadeId, { alunoId, valor })
        .then(() => setEstados((e) => ({ ...e, [alunoId]: "saved" })))
        .catch((err) => {
          setEstados((e) => ({ ...e, [alunoId]: "error" }));
          toast.error(err instanceof ApiError ? err.message : "Falha ao salvar nota.");
        });
    },
    [atividadeId, toast],
  );

  function aoDigitar(alunoId: string, texto: string) {
    setValores((v) => ({ ...v, [alunoId]: texto }));
    const valor = Number(texto.replace(",", "."));
    if (texto.trim() === "" || Number.isNaN(valor)) return;
    window.clearTimeout(timers.current[alunoId]);
    timers.current[alunoId] = window.setTimeout(() => salvar(alunoId, valor), 800);
  }

  async function publicar() {
    setPublicando(true);
    try {
      await atividadesApi.publicarNotas(atividadeId);
      toast.success("Notas publicadas para os alunos.");
      notas.reload();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Falha ao publicar notas.");
    } finally {
      setPublicando(false);
    }
  }

  if (atividade.loading || matriculas.loading || notas.loading) return <Spinner />;
  if (atividade.error || !atividade.data)
    return <ErrorState message={atividade.error ?? "Atividade não encontrada."} onRetry={atividade.reload} />;

  const ativos = (matriculas.data ?? []).filter((m) => m.status === "ATIVA");

  return (
    <div>
      <PageHeader
        title={`Notas — ${atividade.data.titulo}`}
        description={`Pontuação máxima: ${atividade.data.pontuacaoMaxima ?? "—"}. As notas são salvas automaticamente.`}
        actions={
          <>
            <Link href={`/disciplinas/${disciplinaId}`} className="text-sm text-primary underline">
              ← Voltar
            </Link>
            <Button onClick={publicar} loading={publicando}>
              Publicar notas
            </Button>
          </>
        }
      />

      {ativos.length === 0 ? (
        <EmptyState title="Nenhum aluno ativo para lançar notas." />
      ) : (
        <Card>
          <ul className="divide-y divide-border">
            {ativos.map((m) => {
              const sub = submissaoPorAluno[m.aluno.id];
              const estado = estados[m.aluno.id] ?? "idle";
              return (
                <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="min-w-40">
                    <p className="font-medium text-text">{m.aluno.nome}</p>
                    {sub ? (
                      <button
                        type="button"
                        onClick={() => downloadFile(`/api/submissoes/${sub.id}/download`, sub.nome)}
                        className="text-sm text-primary underline"
                      >
                        {sub.nome}
                      </button>
                    ) : (
                      <p className="text-sm text-text-muted">Sem submissão</p>
                    )}
                    {sub?.foraDoPrazo && (
                      <span className="ml-1">
                        <Badge tone="warning">Fora do prazo</Badge>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="sr-only" htmlFor={`nota-${m.aluno.id}`}>
                      Nota de {m.aluno.nome}
                    </label>
                    <input
                      id={`nota-${m.aluno.id}`}
                      type="number"
                      inputMode="decimal"
                      min={0}
                      max={atividade.data?.pontuacaoMaxima ?? undefined}
                      step={0.1}
                      value={valores[m.aluno.id] ?? ""}
                      onChange={(e) => aoDigitar(m.aluno.id, e.target.value)}
                      className="w-24 rounded-lg border border-border bg-surface px-3 py-2 text-text"
                    />
                    <span className="w-24 text-sm" aria-live="polite">
                      {estado === "saving" && <span className="text-text-muted">Salvando…</span>}
                      {estado === "saved" && (
                        <span className="text-success">✓ Salvo</span>
                      )}
                      {estado === "error" && <span className="text-danger">⚠ Erro</span>}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
          {submissoes.error && (
            <p className="mt-3 text-sm text-text-muted">
              Não foi possível carregar as submissões.
            </p>
          )}
        </Card>
      )}

      {notas.data && notas.data.some((n) => n.publicada) && (
        <p className="mt-4 text-sm text-text-muted">
          Última atualização das notas publicadas:{" "}
          {formatDateTime(
            notas.data.reduce(
              (max, n) => (n.atualizadoEm > max ? n.atualizadoEm : max),
              notas.data[0].atualizadoEm,
            ),
          )}{" "}
          · Média da turma:{" "}
          {formatNota(
            notas.data.reduce((s, n) => s + n.valor, 0) / notas.data.length,
          )}
        </p>
      )}
    </div>
  );
}
