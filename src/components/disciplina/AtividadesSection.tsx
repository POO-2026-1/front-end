"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useToast } from "@/context/ToastContext";
import { useApi } from "@/lib/useApi";
import { atividadesApi, submissoesApi } from "@/lib/api/endpoints";
import { Modal } from "@/components/Modal";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Input,
  Select,
  Spinner,
  Textarea,
} from "@/components/ui";
import { ApiError } from "@/lib/api/client";
import { ATIVIDADE_TIPO_LABEL, formatDateTime } from "@/lib/format";
import type { AtividadeRequest, AtividadeResponse, Role } from "@/lib/api/types";

const MAX_BYTES = 20 * 1024 * 1024; // 20 MB (RF10)
const FORMATOS = [".pdf", ".docx", ".zip"];

export function AtividadesSection({
  disciplinaId,
  role,
}: {
  disciplinaId: string;
  role: Role;
}) {
  const atividades = useApi(() => atividadesApi.porDisciplina(disciplinaId), [disciplinaId]);
  const minhasSubs = useApi(
    () => (role === "ALUNO" ? submissoesApi.minhas() : Promise.resolve([])),
    [role],
  );
  const podeGerir = role === "PROFESSOR" || role === "GESTOR";

  const [modal, setModal] = useState<{ aberto: boolean; editar?: AtividadeResponse }>({
    aberto: false,
  });
  const [excluir, setExcluir] = useState<AtividadeResponse | null>(null);
  const [removendo, setRemovendo] = useState(false);
  const toast = useToast();

  if (atividades.loading) return <Spinner />;
  if (atividades.error)
    return <ErrorState message={atividades.error} onRetry={atividades.reload} />;

  const lista = podeGerir
    ? atividades.data ?? []
    : (atividades.data ?? []).filter((a) => a.publicada);

  const submetidasIds = new Set(minhasSubs.data?.map((s) => s.atividade.id));

  async function confirmarExclusao() {
    if (!excluir) return;
    setRemovendo(true);
    try {
      await atividadesApi.remover(excluir.id);
      toast.success("Atividade excluída.");
      setExcluir(null);
      atividades.reload();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Falha ao excluir.");
    } finally {
      setRemovendo(false);
    }
  }

  return (
    <div className="space-y-4">
      {podeGerir && (
        <div className="flex justify-end">
          <Button onClick={() => setModal({ aberto: true })}>+ Nova atividade</Button>
        </div>
      )}

      {lista.length === 0 ? (
        <EmptyState title="Nenhuma atividade disponível nesta disciplina." />
      ) : (
        <ul className="space-y-3">
          {lista.map((a) => (
            <Card as="li" key={a.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-text">{a.titulo}</h3>
                    <Badge tone="info" withIcon={false}>
                      {ATIVIDADE_TIPO_LABEL[a.tipo]}
                    </Badge>
                    {podeGerir &&
                      (a.publicada ? (
                        <Badge tone="success">Publicada</Badge>
                      ) : (
                        <Badge tone="neutral">Rascunho</Badge>
                      ))}
                    {role === "ALUNO" && submetidasIds.has(a.id) && (
                      <Badge tone="success">Enviada</Badge>
                    )}
                  </div>
                  {a.descricao && <p className="mt-1 text-sm text-text-muted">{a.descricao}</p>}
                  <p className="mt-1 text-sm text-text-muted">
                    Prazo: {formatDateTime(a.prazo)} · Pontuação:{" "}
                    {a.pontuacaoMaxima ?? "—"}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {role === "ALUNO" && (
                    <EnvioAtividade
                      atividadeId={a.id}
                      onEnviado={() => minhasSubs.reload()}
                    />
                  )}
                  {podeGerir && (
                    <>
                      <Link
                        href={`/disciplinas/${disciplinaId}/atividades/${a.id}/notas`}
                        className="inline-flex items-center rounded-lg border border-border px-3 py-2 text-sm font-medium text-text hover:bg-surface-2"
                      >
                        Lançar notas
                      </Link>
                      <Button
                        variant="secondary"
                        onClick={() =>
                          atividadesApi
                            .publicar(a.id)
                            .then(() => {
                              toast.success(
                                a.publicada ? "Atividade ocultada." : "Atividade publicada.",
                              );
                              atividades.reload();
                            })
                            .catch((err) =>
                              toast.error(
                                err instanceof ApiError ? err.message : "Falha ao publicar.",
                              ),
                            )
                        }
                      >
                        {a.publicada ? "Despublicar" : "Publicar"}
                      </Button>
                      <Button variant="secondary" onClick={() => setModal({ aberto: true, editar: a })}>
                        Editar
                      </Button>
                      <Button variant="danger" onClick={() => setExcluir(a)}>
                        Excluir
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </ul>
      )}

      {modal.aberto && (
        <AtividadeFormModal
          disciplinaId={disciplinaId}
          atividade={modal.editar}
          onClose={() => setModal({ aberto: false })}
          onSaved={() => {
            setModal({ aberto: false });
            atividades.reload();
          }}
        />
      )}

      <ConfirmDialog
        open={!!excluir}
        danger
        loading={removendo}
        title="Excluir atividade"
        message={`Tem certeza que deseja excluir "${excluir?.titulo}"? Esta ação exige confirmação.`}
        confirmLabel="Excluir"
        onConfirm={confirmarExclusao}
        onCancel={() => setExcluir(null)}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Envio de atividade pelo aluno (RF10) com validação de formato/tamanho
// ---------------------------------------------------------------------------

function EnvioAtividade({
  atividadeId,
  onEnviado,
}: {
  atividadeId: string;
  onEnviado: () => void;
}) {
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [enviando, setEnviando] = useState(false);

  async function aoSelecionar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    if (!FORMATOS.includes(ext)) {
      toast.error("Formato inválido. Envie um arquivo PDF, DOCX ou ZIP.");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("Arquivo muito grande. O limite é de 20 MB.");
      return;
    }

    setEnviando(true);
    try {
      const sub = await atividadesApi.enviarSubmissao(atividadeId, file);
      toast.success(`Atividade enviada em ${formatDateTime(sub.enviadoEm)}.`);
      onEnviado();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Falha no envio da atividade.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={FORMATOS.join(",")}
        className="hidden"
        onChange={aoSelecionar}
      />
      <Button loading={enviando} onClick={() => inputRef.current?.click()}>
        Enviar atividade
      </Button>
    </>
  );
}

// ---------------------------------------------------------------------------
// Criação/edição de atividade (RF21, RF23 texto alternativo)
// ---------------------------------------------------------------------------

function AtividadeFormModal({
  disciplinaId,
  atividade,
  onClose,
  onSaved,
}: {
  disciplinaId: string;
  atividade?: AtividadeResponse;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const editando = !!atividade;
  const [form, setForm] = useState<AtividadeRequest>({
    disciplinaId,
    tipo: atividade?.tipo ?? "ATIVIDADE",
    titulo: atividade?.titulo ?? "",
    descricao: atividade?.descricao ?? "",
    prazo: atividade?.prazo ? atividade.prazo.slice(0, 16) : "",
    pontuacaoMaxima: atividade?.pontuacaoMaxima ?? 10,
    textoAlternativo: atividade?.textoAlternativo ?? "",
    publicada: atividade?.publicada ?? false,
  });
  const [salvando, setSalvando] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    const payload: AtividadeRequest = {
      ...form,
      prazo: form.prazo ? new Date(form.prazo).toISOString() : undefined,
    };
    try {
      if (editando) await atividadesApi.atualizar(atividade.id, payload);
      else await atividadesApi.criar(payload);
      toast.success(editando ? "Atividade atualizada." : "Atividade criada.");
      onSaved();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Falha ao salvar atividade.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Modal open title={editando ? "Editar atividade" : "Nova atividade"} onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Tipo"
            value={form.tipo}
            onChange={(e) =>
              setForm({ ...form, tipo: e.target.value as AtividadeRequest["tipo"] })
            }
          >
            <option value="ATIVIDADE">Atividade</option>
            <option value="PROVA">Prova</option>
            <option value="TESTE">Teste</option>
          </Select>
          <Input
            label="Pontuação máxima"
            type="number"
            min={0}
            step={0.5}
            value={form.pontuacaoMaxima ?? ""}
            onChange={(e) =>
              setForm({ ...form, pontuacaoMaxima: Number(e.target.value) })
            }
          />
        </div>
        <Input
          label="Título"
          value={form.titulo}
          onChange={(e) => setForm({ ...form, titulo: e.target.value })}
          required
        />
        <Textarea
          label="Descrição / instruções"
          rows={3}
          value={form.descricao}
          onChange={(e) => setForm({ ...form, descricao: e.target.value })}
        />
        <Input
          label="Prazo"
          type="datetime-local"
          value={form.prazo}
          onChange={(e) => setForm({ ...form, prazo: e.target.value })}
        />
        <Textarea
          label="Texto alternativo"
          hint="Audiodescrição de anexos/elementos visuais para leitores de tela (RF23)."
          rows={2}
          value={form.textoAlternativo}
          onChange={(e) => setForm({ ...form, textoAlternativo: e.target.value })}
        />
        <label className="flex items-center gap-2 text-sm text-text">
          <input
            type="checkbox"
            checked={form.publicada}
            onChange={(e) => setForm({ ...form, publicada: e.target.checked })}
          />
          Publicar imediatamente para os alunos
        </label>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={salvando}>
            {editando ? "Salvar" : "Criar"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
