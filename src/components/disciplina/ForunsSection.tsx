"use client";

import { useState } from "react";
import { useToast } from "@/context/ToastContext";
import { useApi } from "@/lib/useApi";
import { forunsApi } from "@/lib/api/endpoints";
import { Modal } from "@/components/Modal";
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  Input,
  Spinner,
  Textarea,
} from "@/components/ui";
import { formatDateTime } from "@/lib/format";
import { ApiError } from "@/lib/api/client";
import type { ForumResponse, TopicoResponse } from "@/lib/api/types";

export function ForunsSection({ disciplinaId }: { disciplinaId: string }) {
  const foruns = useApi(() => forunsApi.porDisciplina(disciplinaId), [disciplinaId]);
  const [forumSel, setForumSel] = useState<ForumResponse | null>(null);
  const [criarForum, setCriarForum] = useState(false);
  const toast = useToast();

  if (foruns.loading) return <Spinner />;
  if (foruns.error) return <ErrorState message={foruns.error} onRetry={foruns.reload} />;

  if (forumSel) {
    return <ForumTopicos forum={forumSel} onVoltar={() => setForumSel(null)} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setCriarForum(true)}>+ Novo fórum</Button>
      </div>

      {!foruns.data || foruns.data.length === 0 ? (
        <EmptyState title="Nenhum fórum criado nesta disciplina." />
      ) : (
        <ul className="space-y-3">
          {foruns.data.map((f) => (
            <Card as="li" key={f.id}>
              <button
                type="button"
                onClick={() => setForumSel(f)}
                className="text-left font-semibold text-primary underline"
              >
                {f.titulo}
              </button>
              {f.descricao && <p className="text-sm text-text-muted">{f.descricao}</p>}
            </Card>
          ))}
        </ul>
      )}

      {criarForum && (
        <CriarForumModal
          disciplinaId={disciplinaId}
          onClose={() => setCriarForum(false)}
          onSaved={() => {
            setCriarForum(false);
            foruns.reload();
            toast.success("Fórum criado.");
          }}
        />
      )}
    </div>
  );
}

function CriarForumModal({
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
  const [salvando, setSalvando] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    try {
      await forunsApi.criar({ disciplinaId, titulo, descricao });
      onSaved();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Falha ao criar fórum.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Modal open title="Novo fórum" onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Input label="Título" value={titulo} onChange={(e) => setTitulo(e.target.value)} required />
        <Textarea
          label="Descrição"
          rows={2}
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={salvando}>
            Criar
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Tópicos de um fórum
// ---------------------------------------------------------------------------

function ForumTopicos({ forum, onVoltar }: { forum: ForumResponse; onVoltar: () => void }) {
  const toast = useToast();
  const topicos = useApi(() => forunsApi.topicos(forum.id), [forum.id]);
  const [topicoSel, setTopicoSel] = useState<TopicoResponse | null>(null);
  const [novoTitulo, setNovoTitulo] = useState("");
  const [criando, setCriando] = useState(false);

  if (topicoSel) {
    return <TopicoMensagens topico={topicoSel} onVoltar={() => setTopicoSel(null)} />;
  }

  async function criarTopico(e: React.FormEvent) {
    e.preventDefault();
    if (!novoTitulo.trim()) return;
    setCriando(true);
    try {
      await forunsApi.criarTopico(forum.id, { titulo: novoTitulo });
      setNovoTitulo("");
      topicos.reload();
      toast.success("Tópico criado.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Falha ao criar tópico.");
    } finally {
      setCriando(false);
    }
  }

  return (
    <div className="space-y-4">
      <button type="button" onClick={onVoltar} className="text-sm text-primary underline">
        ← Voltar aos fóruns
      </button>
      <h3 className="text-lg font-bold text-text">{forum.titulo}</h3>

      <Card>
        <form onSubmit={criarTopico} className="flex items-end gap-2">
          <div className="flex-1">
            <Input
              label="Novo tópico"
              value={novoTitulo}
              onChange={(e) => setNovoTitulo(e.target.value)}
            />
          </div>
          <Button type="submit" loading={criando}>
            Criar
          </Button>
        </form>
      </Card>

      {topicos.loading ? (
        <Spinner />
      ) : !topicos.data || topicos.data.length === 0 ? (
        <EmptyState title="Nenhum tópico ainda. Crie o primeiro." />
      ) : (
        <ul className="space-y-2">
          {topicos.data.map((t) => (
            <Card as="li" key={t.id}>
              <button
                type="button"
                onClick={() => setTopicoSel(t)}
                className="text-left font-semibold text-primary underline"
              >
                {t.titulo}
              </button>
              <p className="text-xs text-text-muted">
                por {t.autor.nome} · {formatDateTime(t.criadoEm)}
              </p>
            </Card>
          ))}
        </ul>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mensagens de um tópico
// ---------------------------------------------------------------------------

function TopicoMensagens({
  topico,
  onVoltar,
}: {
  topico: TopicoResponse;
  onVoltar: () => void;
}) {
  const toast = useToast();
  const mensagens = useApi(() => forunsApi.mensagens(topico.id), [topico.id]);
  const [conteudo, setConteudo] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function responder(e: React.FormEvent) {
    e.preventDefault();
    if (!conteudo.trim()) return;
    setEnviando(true);
    try {
      await forunsApi.responder(topico.id, { conteudo });
      setConteudo("");
      mensagens.reload();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Falha ao enviar mensagem.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="space-y-4">
      <button type="button" onClick={onVoltar} className="text-sm text-primary underline">
        ← Voltar aos tópicos
      </button>
      <h3 className="text-lg font-bold text-text">{topico.titulo}</h3>

      {mensagens.loading ? (
        <Spinner />
      ) : (
        <ul className="space-y-2">
          {(mensagens.data ?? []).map((m) => (
            <Card as="li" key={m.id}>
              <p className="text-text">{m.conteudo}</p>
              <p className="mt-1 text-xs text-text-muted">
                {m.autor.nome} · {formatDateTime(m.criadoEm)}
              </p>
            </Card>
          ))}
          {mensagens.data?.length === 0 && (
            <EmptyState title="Seja o primeiro a responder." />
          )}
        </ul>
      )}

      <Card>
        <form onSubmit={responder} className="flex flex-col gap-3">
          <Textarea
            label="Sua mensagem"
            rows={3}
            value={conteudo}
            onChange={(e) => setConteudo(e.target.value)}
            required
          />
          <div className="flex justify-end">
            <Button type="submit" loading={enviando}>
              Responder
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
