"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useApi } from "@/lib/useApi";
import { disciplinasApi } from "@/lib/api/endpoints";
import { ErrorState, PageHeader, Spinner } from "@/components/ui";
import { AtividadesSection } from "@/components/disciplina/AtividadesSection";
import { MateriaisSection } from "@/components/disciplina/MateriaisSection";
import { FrequenciaSection } from "@/components/disciplina/FrequenciaSection";
import { ForunsSection } from "@/components/disciplina/ForunsSection";
import { MatriculasSection } from "@/components/disciplina/MatriculasSection";
import type { Role } from "@/lib/api/types";

interface Aba {
  id: string;
  label: string;
  roles: Role[];
}

const ABAS: Aba[] = [
  { id: "atividades", label: "Atividades e provas", roles: ["ALUNO", "PROFESSOR", "GESTOR"] },
  { id: "materiais", label: "Materiais", roles: ["ALUNO", "PROFESSOR", "GESTOR"] },
  { id: "frequencia", label: "Frequência", roles: ["ALUNO", "PROFESSOR", "GESTOR"] },
  { id: "foruns", label: "Fóruns", roles: ["ALUNO", "PROFESSOR", "GESTOR"] },
  { id: "matriculas", label: "Alunos", roles: ["PROFESSOR", "GESTOR"] },
];

export default function DisciplinaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user } = useAuth();
  const { data: disciplina, loading, error, reload } = useApi(
    () => disciplinasApi.porId(id),
    [id],
  );
  const [aba, setAba] = useState("atividades");

  if (loading) return <Spinner />;
  if (error || !disciplina)
    return <ErrorState message={error ?? "Disciplina não encontrada."} onRetry={reload} />;
  if (!user) return null;

  const abasVisiveis = ABAS.filter((a) => a.roles.includes(user.role));

  return (
    <div>
      <PageHeader
        title={disciplina.nome}
        description={`${disciplina.codigo} · ${disciplina.periodo}${
          disciplina.professor ? ` · Prof. ${disciplina.professor.nome}` : ""
        }`}
        actions={
          <Link href="/disciplinas" className="text-sm text-primary underline">
            ← Voltar
          </Link>
        }
      />

      <div role="tablist" aria-label="Seções da disciplina" className="mb-6 flex flex-wrap gap-2 border-b border-border">
        {abasVisiveis.map((a) => (
          <button
            key={a.id}
            role="tab"
            id={`tab-${a.id}`}
            aria-selected={aba === a.id}
            aria-controls={`panel-${a.id}`}
            onClick={() => setAba(a.id)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium ${
              aba === a.id
                ? "border-primary text-primary"
                : "border-transparent text-text-muted hover:text-text"
            }`}
          >
            {a.label}
          </button>
        ))}
      </div>

      <div
        role="tabpanel"
        id={`panel-${aba}`}
        aria-labelledby={`tab-${aba}`}
      >
        {aba === "atividades" && (
          <AtividadesSection disciplinaId={id} role={user.role} />
        )}
        {aba === "materiais" && <MateriaisSection disciplinaId={id} role={user.role} />}
        {aba === "frequencia" && <FrequenciaSection disciplinaId={id} role={user.role} />}
        {aba === "foruns" && <ForunsSection disciplinaId={id} />}
        {aba === "matriculas" && <MatriculasSection disciplinaId={id} />}
      </div>
    </div>
  );
}
