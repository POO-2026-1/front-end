"use client";

import { useApi } from "@/lib/useApi";
import { recomendacoesApi } from "@/lib/api/endpoints";
import { downloadFile } from "@/lib/api/client";
import { RoleGate } from "@/components/RoleGate";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  PageHeader,
  Spinner,
} from "@/components/ui";

/** RF14 — Recomendações de conteúdo baseadas no desempenho (regras). */
export default function RecomendacoesPage() {
  return (
    <RoleGate roles={["ALUNO"]}>
      <Recomendacoes />
    </RoleGate>
  );
}

function Recomendacoes() {
  const { data, loading, error, reload } = useApi(() => recomendacoesApi.minhas(), []);

  if (loading) return <Spinner />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <div>
      <PageHeader
        title="Recomendações de estudo"
        description="Conteúdos complementares sugeridos com base no seu desempenho."
      />

      {!data || data.length === 0 ? (
        <EmptyState
          title="Nenhuma recomendação no momento."
          description="As recomendações aparecem quando seu desempenho indica necessidade de reforço."
        />
      ) : (
        <div className="space-y-6">
          {data.map((rec, i) => (
            <Card key={`${rec.disciplina.id}-${i}`} as="section">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-text">{rec.disciplina.nome}</h2>
                <Badge tone="info">Reforço sugerido</Badge>
              </div>
              <p className="mt-1 text-sm text-text-muted">{rec.motivo}</p>

              {rec.materiais.length > 0 ? (
                <ul className="mt-3 space-y-2">
                  {rec.materiais.map((m) => (
                    <li
                      key={m.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3"
                    >
                      <div>
                        <p className="font-medium text-text">{m.titulo}</p>
                        {m.textoAlternativo && (
                          <p className="text-sm text-text-muted">{m.textoAlternativo}</p>
                        )}
                      </div>
                      <Button
                        variant="secondary"
                        onClick={() =>
                          m.urlExterna && !m.arquivoId
                            ? window.open(m.urlExterna, "_blank", "noopener")
                            : downloadFile(`/api/materiais/${m.id}/download`, m.nomeArquivo ?? m.titulo)
                        }
                      >
                        {m.urlExterna && !m.arquivoId ? "Abrir" : "Baixar"}
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-text-muted">
                  Nenhum material complementar disponível ainda.
                </p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
