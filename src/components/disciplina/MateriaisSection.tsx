"use client";

import { useState } from "react";
import { useToast } from "@/context/ToastContext";
import { useApi } from "@/lib/useApi";
import { materiaisApi } from "@/lib/api/endpoints";
import { downloadFile, ApiError } from "@/lib/api/client";
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
import { formatBytes } from "@/lib/format";
import type { MaterialResponse, Role } from "@/lib/api/types";

export function MateriaisSection({
  disciplinaId,
  role,
}: {
  disciplinaId: string;
  role: Role;
}) {
  const { data, loading, error, reload } = useApi(
    () => materiaisApi.porDisciplina(disciplinaId),
    [disciplinaId],
  );
  const podeGerir = role === "PROFESSOR" || role === "GESTOR";
  const toast = useToast();
  const [modal, setModal] = useState(false);
  const [excluir, setExcluir] = useState<MaterialResponse | null>(null);
  const [removendo, setRemovendo] = useState(false);
  const [baixando, setBaixando] = useState<string | null>(null);

  if (loading) return <Spinner />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  async function baixar(m: MaterialResponse) {
    if (m.urlExterna && !m.arquivoId) {
      window.open(m.urlExterna, "_blank", "noopener");
      return;
    }
    setBaixando(m.id);
    try {
      await downloadFile(`/api/materiais/${m.id}/download`, m.nomeArquivo ?? m.titulo);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Falha ao baixar o material.");
    } finally {
      setBaixando(null);
    }
  }

  async function confirmarExclusao() {
    if (!excluir) return;
    setRemovendo(true);
    try {
      await materiaisApi.remover(excluir.id);
      toast.success("Material excluído.");
      setExcluir(null);
      reload();
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
          <Button onClick={() => setModal(true)}>+ Novo material</Button>
        </div>
      )}

      {!data || data.length === 0 ? (
        <EmptyState title="Nenhum material disponível nesta disciplina." />
      ) : (
        <ul className="space-y-3">
          {data.map((m) => (
            <Card as="li" key={m.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-text">{m.titulo}</h3>
                    <Badge tone="neutral" withIcon={false}>
                      {m.tipo}
                    </Badge>
                    {!m.textoAlternativo && podeGerir && (
                      <Badge tone="warning">Sem texto alternativo</Badge>
                    )}
                  </div>
                  {m.descricao && <p className="mt-1 text-sm text-text-muted">{m.descricao}</p>}
                  {m.textoAlternativo && (
                    <p className="mt-1 text-sm text-text-muted">
                      <span className="font-medium">Descrição: </span>
                      {m.textoAlternativo}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-text-muted">
                    {m.nomeArquivo ?? m.urlExterna} {m.tamanho ? `· ${formatBytes(m.tamanho)}` : ""}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button loading={baixando === m.id} onClick={() => baixar(m)}>
                    {m.urlExterna && !m.arquivoId ? "Abrir" : "Baixar"}
                  </Button>
                  {podeGerir && (
                    <Button variant="danger" onClick={() => setExcluir(m)}>
                      Excluir
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </ul>
      )}

      {modal && (
        <MaterialFormModal
          disciplinaId={disciplinaId}
          onClose={() => setModal(false)}
          onSaved={() => {
            setModal(false);
            reload();
          }}
        />
      )}

      <ConfirmDialog
        open={!!excluir}
        danger
        loading={removendo}
        title="Excluir material"
        message={`Excluir "${excluir?.titulo}"? Esta ação exige confirmação.`}
        confirmLabel="Excluir"
        onConfirm={confirmarExclusao}
        onCancel={() => setExcluir(null)}
      />
    </div>
  );
}

function MaterialFormModal({
  disciplinaId,
  onClose,
  onSaved,
}: {
  disciplinaId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [tipo, setTipo] = useState("PDF");
  const [textoAlternativo, setTextoAlternativo] = useState("");
  const [urlExterna, setUrlExterna] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [salvando, setSalvando] = useState(false);

  // RNF17 — sugestão de texto alternativo ao anexar arquivo.
  const sugerirAlt = !!arquivo && !textoAlternativo;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    try {
      await materiaisApi.criar(
        { disciplinaId, titulo, descricao, tipo, textoAlternativo, urlExterna: urlExterna || undefined },
        arquivo ?? undefined,
      );
      toast.success("Material publicado.");
      onSaved();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Falha ao publicar material.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Modal open title="Novo material" onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Input label="Título" value={titulo} onChange={(e) => setTitulo(e.target.value)} required />
        <div className="grid grid-cols-2 gap-4">
          <Select label="Tipo" value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="PDF">PDF</option>
            <option value="VIDEO">Vídeo</option>
            <option value="LINK">Link</option>
            <option value="OUTRO">Outro</option>
          </Select>
        </div>
        <Textarea
          label="Descrição"
          rows={2}
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
        />
        <div>
          <label className="text-sm font-medium text-text">Arquivo (opcional)</label>
          <input
            type="file"
            className="mt-1 block w-full text-sm text-text"
            onChange={(e) => setArquivo(e.target.files?.[0] ?? null)}
          />
        </div>
        <Input
          label="URL externa (para vídeos/links)"
          value={urlExterna}
          onChange={(e) => setUrlExterna(e.target.value)}
        />
        <Textarea
          label="Texto alternativo"
          hint="Audiodescrição para leitores de tela (RF23)."
          rows={2}
          value={textoAlternativo}
          onChange={(e) => setTextoAlternativo(e.target.value)}
          error={
            sugerirAlt
              ? "Sugestão: adicione um texto alternativo para acessibilidade (você pode ignorar)."
              : undefined
          }
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={salvando}>
            Publicar
          </Button>
        </div>
      </form>
    </Modal>
  );
}
