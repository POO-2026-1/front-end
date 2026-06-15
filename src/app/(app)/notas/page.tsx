"use client";

import { useMemo, useState } from "react";
import { useApi } from "@/lib/useApi";
import { atividadesApi, frequenciasApi, notasApi } from "@/lib/api/endpoints";
import { useToast } from "@/context/ToastContext";
import { RoleGate } from "@/components/RoleGate";
import { ContestarModal } from "@/components/ContestarModal";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  PageHeader,
  Spinner,
} from "@/components/ui";
import { formatDateTime, formatNota, formatPercent } from "@/lib/format";
import type { NotaResponse } from "@/lib/api/types";

/** RF11 — Visualização de notas e frequência por disciplina; RF12 contestar. */
export default function NotasPage() {
  return (
    <RoleGate roles={["ALUNO"]}>
      <NotasAluno />
    </RoleGate>
  );
}

function NotasAluno() {
  const toast = useToast();
  const notas = useApi(() => notasApi.minhas(), []);
  const frequencias = useApi(() => frequenciasApi.minhas(), []);
  const [contestar, setContestar] = useState<{ nota: NotaResponse; disciplinaId: string } | null>(
    null,
  );

  // A nota não traz o id da disciplina; resolvemos via a atividade.
  async function abrirContestacao(nota: NotaResponse) {
    try {
      const atividade = await atividadesApi.porId(nota.atividade.id);
      setContestar({ nota, disciplinaId: atividade.disciplina.id });
    } catch {
      toast.error("Não foi possível abrir a contestação. Tente novamente.");
    }
  }

  const freqPorDisciplina = useMemo(() => {
    const mapa: Record<string, { nome: string; presencas: number; faltas: number }> = {};
    frequencias.data?.forEach((f) => {
      const d = (mapa[f.disciplina.id] ??= { nome: f.disciplina.nome, presencas: 0, faltas: 0 });
      if (f.status === "PRESENCA") d.presencas += 1;
      else d.faltas += 1;
    });
    return mapa;
  }, [frequencias.data]);

  if (notas.loading || frequencias.loading) return <Spinner />;
  if (notas.error) return <ErrorState message={notas.error} onRetry={notas.reload} />;

  const publicadas = (notas.data ?? []).filter((n) => n.publicada);

  return (
    <div>
      <PageHeader title="Notas e frequência" description="Acompanhe seu desempenho acadêmico." />

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-bold text-text">Notas</h2>
        {publicadas.length === 0 ? (
          <EmptyState title="Nenhuma nota publicada ainda." />
        ) : (
          <Card>
            <ul className="divide-y divide-border">
              {publicadas.map((n) => {
                const baixa = n.valor < 6;
                return (
                  <li key={n.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <div>
                      <p className="font-medium text-text">{n.atividade.titulo}</p>
                      <p className="text-sm text-text-muted">
                        Atualizada em {formatDateTime(n.atualizadoEm)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xl font-bold text-text">{formatNota(n.valor)}</span>
                      {/* Não depende só de cor: ícone + rótulo textual (RNF13/RNF19) */}
                      {baixa ? (
                        <Badge tone="danger">Abaixo da média</Badge>
                      ) : (
                        <Badge tone="success">Satisfatória</Badge>
                      )}
                      <Button variant="secondary" onClick={() => abrirContestacao(n)}>
                        Contestar
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold text-text">Frequência por disciplina</h2>
        {Object.keys(freqPorDisciplina).length === 0 ? (
          <EmptyState title="Nenhum registro de frequência." />
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {Object.entries(freqPorDisciplina).map(([id, d]) => {
              const total = d.presencas + d.faltas;
              const pct = total > 0 ? (d.presencas / total) * 100 : 0;
              const baixa = pct < 75;
              return (
                <Card as="li" key={id}>
                  <p className="font-semibold text-text">{d.nome}</p>
                  <p className="mt-1 text-2xl font-bold text-text">{formatPercent(pct)}</p>
                  <p className="text-sm text-text-muted">
                    {d.presencas} presença(s) · {d.faltas} falta(s)
                  </p>
                  <div className="mt-2">
                    {baixa ? (
                      <Badge tone="danger">Atenção: frequência baixa</Badge>
                    ) : (
                      <Badge tone="success">Frequência adequada</Badge>
                    )}
                  </div>
                </Card>
              );
            })}
          </ul>
        )}
      </section>

      {contestar && (
        <ContestarModal
          open
          tipo="NOTA"
          disciplinaId={contestar.disciplinaId}
          registroId={contestar.nota.id}
          descricaoAlvo={`Nota ${formatNota(contestar.nota.valor)} em "${contestar.nota.atividade.titulo}".`}
          onClose={() => setContestar(null)}
        />
      )}
    </div>
  );
}
