"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePreferences, MIN_FONTE, MAX_FONTE } from "@/context/PreferencesContext";
import { useToast } from "@/context/ToastContext";
import { usuariosApi } from "@/lib/api/endpoints";
import { Button, Card, Input, PageHeader } from "@/components/ui";
import { ROLE_LABEL } from "@/lib/format";
import { ApiError } from "@/lib/api/client";

/** RF06 — Gerenciamento de perfil; RF08/RF09/RF19 — preferências. */
export default function PerfilPage() {
  const { user, refresh } = useAuth();
  const toast = useToast();
  const prefs = usePreferences();

  const [nome, setNome] = useState(user?.nome ?? "");
  const [telefone, setTelefone] = useState(user?.telefone ?? "");
  const [fotoUrl, setFotoUrl] = useState(user?.fotoUrl ?? "");
  const [salvando, setSalvando] = useState(false);

  if (!user) return null;

  async function salvarPerfil(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    try {
      await usuariosApi.atualizarPerfil({ nome, telefone, fotoUrl });
      await refresh();
      toast.success("Perfil atualizado com sucesso.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Falha ao atualizar o perfil.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div>
      <PageHeader title="Meu perfil" description="Atualize seus dados e preferências." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card as="section">
          <h2 className="text-lg font-bold text-text">Dados pessoais</h2>
          <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <dt className="text-text-muted">E-mail</dt>
            <dd className="text-text">{user.email}</dd>
            <dt className="text-text-muted">Perfil</dt>
            <dd className="text-text">{ROLE_LABEL[user.role]}</dd>
            <dt className="text-text-muted">Matrícula</dt>
            <dd className="text-text">{user.matricula || "—"}</dd>
          </dl>

          <form onSubmit={salvarPerfil} className="mt-5 flex flex-col gap-4">
            <Input label="Nome completo" value={nome} onChange={(e) => setNome(e.target.value)} required />
            <Input label="Telefone" type="tel" value={telefone} onChange={(e) => setTelefone(e.target.value)} />
            <Input
              label="URL da foto de perfil"
              hint="Endereço de uma imagem para seu avatar."
              value={fotoUrl}
              onChange={(e) => setFotoUrl(e.target.value)}
            />
            <Button type="submit" loading={salvando}>
              Salvar alterações
            </Button>
          </form>
        </Card>

        <Card as="section">
          <h2 className="text-lg font-bold text-text">Preferências de acessibilidade</h2>

          <div className="mt-4 flex flex-col gap-5">
            <fieldset>
              <legend className="text-sm font-medium text-text">Tema</legend>
              <div className="mt-2 flex gap-2">
                <Button
                  variant={prefs.tema === "CLARO" ? "primary" : "secondary"}
                  onClick={() => prefs.setTema("CLARO")}
                  aria-pressed={prefs.tema === "CLARO"}
                >
                  ☀ Claro
                </Button>
                <Button
                  variant={prefs.tema === "ESCURO" ? "primary" : "secondary"}
                  onClick={() => prefs.setTema("ESCURO")}
                  aria-pressed={prefs.tema === "ESCURO"}
                >
                  ☾ Escuro
                </Button>
              </div>
            </fieldset>

            <div>
              <label htmlFor="fonte" className="text-sm font-medium text-text">
                Tamanho da fonte: {prefs.tamanhoFonte}%
              </label>
              <input
                id="fonte"
                type="range"
                min={MIN_FONTE}
                max={MAX_FONTE}
                step={25}
                value={prefs.tamanhoFonte}
                onChange={(e) => prefs.setTamanhoFonte(Number(e.target.value))}
                className="mt-2 w-full"
                aria-valuetext={`${prefs.tamanhoFonte} por cento`}
              />
              <p className="text-xs text-text-muted">De 100% a 400% do tamanho padrão.</p>
            </div>

            <div className="flex items-center justify-between">
              <label htmlFor="som" className="text-sm font-medium text-text">
                Som de notificação
              </label>
              <button
                id="som"
                type="button"
                role="switch"
                aria-checked={prefs.somNotificacao}
                onClick={() => prefs.setSomNotificacao(!prefs.somNotificacao)}
                className={`relative h-6 w-11 rounded-full border border-border transition-colors ${
                  prefs.somNotificacao ? "bg-primary" : "bg-surface-2"
                }`}
              >
                <span
                  aria-hidden
                  className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${
                    prefs.somNotificacao ? "left-6" : "left-0.5"
                  }`}
                />
                <span className="sr-only">
                  {prefs.somNotificacao ? "Som ativado" : "Som desativado"}
                </span>
              </button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
