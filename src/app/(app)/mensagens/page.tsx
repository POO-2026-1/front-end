"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useApi } from "@/lib/useApi";
import { mensagensApi, usuariosApi } from "@/lib/api/endpoints";
import { Modal } from "@/components/Modal";
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  Input,
  PageHeader,
  Select,
  Spinner,
  Textarea,
} from "@/components/ui";
import { formatDateTime, initials } from "@/lib/format";
import { ApiError } from "@/lib/api/client";
import type { MensagemResponse, UsuarioResumoResponse } from "@/lib/api/types";

interface Contato {
  id: string;
  nome: string;
}

/** RF15/RF27 — Mensagens privadas entre aluno e professor. */
export default function MensagensPage() {
  const { user } = useAuth();
  const inbox = useApi(() => mensagensApi.recebidas(), []);
  const [selecionado, setSelecionado] = useState<Contato | null>(null);
  const [novo, setNovo] = useState(false);

  // Conversas derivadas das mensagens recebidas (por remetente).
  const conversas = useMemo<Contato[]>(() => {
    const mapa = new Map<string, Contato>();
    inbox.data?.forEach((m) => {
      if (m.autor.id !== user?.id) mapa.set(m.autor.id, { id: m.autor.id, nome: m.autor.nome });
    });
    return [...mapa.values()];
  }, [inbox.data, user?.id]);

  if (inbox.loading) return <Spinner />;
  if (inbox.error) return <ErrorState message={inbox.error} onRetry={inbox.reload} />;

  return (
    <div>
      <PageHeader
        title="Mensagens"
        description="Converse de forma privada com professores e alunos."
        actions={<Button onClick={() => setNovo(true)}>+ Nova mensagem</Button>}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr]">
        <Card as="section" className="h-fit">
          <h2 className="mb-2 text-sm font-semibold text-text-muted">Conversas</h2>
          {conversas.length === 0 ? (
            <p className="text-sm text-text-muted">Nenhuma conversa ainda.</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {conversas.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => setSelecionado(c)}
                    aria-current={selecionado?.id === c.id}
                    className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm ${
                      selecionado?.id === c.id
                        ? "bg-primary text-primary-fg"
                        : "text-text hover:bg-surface-2"
                    }`}
                  >
                    <span
                      aria-hidden
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-2 text-xs font-bold text-text"
                    >
                      {initials(c.nome)}
                    </span>
                    {c.nome}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div>
          {selecionado ? (
            <Conversa contato={selecionado} onEnviado={() => inbox.reload()} />
          ) : (
            <EmptyState title="Selecione uma conversa ou inicie uma nova mensagem." />
          )}
        </div>
      </div>

      {novo && (
        <NovaMensagemModal
          onClose={() => setNovo(false)}
          onEnviado={(contato) => {
            setNovo(false);
            setSelecionado(contato);
            inbox.reload();
          }}
        />
      )}
    </div>
  );
}

function Conversa({ contato, onEnviado }: { contato: Contato; onEnviado: () => void }) {
  const { user } = useAuth();
  const toast = useToast();
  const conversa = useApi(() => mensagensApi.conversa(contato.id), [contato.id]);
  const [conteudo, setConteudo] = useState("");
  const [enviando, setEnviando] = useState(false);

  // Marca como lidas as mensagens recebidas não lidas.
  useEffect(() => {
    conversa.data
      ?.filter((m) => m.autor.id === contato.id && !m.lida)
      .forEach((m) => mensagensApi.marcarLida(m.id).catch(() => {}));
  }, [conversa.data, contato.id]);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!conteudo.trim()) return;
    setEnviando(true);
    try {
      await mensagensApi.enviar({ destinatarioId: contato.id, conteudo });
      setConteudo("");
      conversa.reload();
      onEnviado();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Falha ao enviar mensagem.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Card as="section">
      <h2 className="mb-3 font-bold text-text">{contato.nome}</h2>

      {conversa.loading ? (
        <Spinner />
      ) : (
        <ul className="mb-4 flex max-h-96 flex-col gap-2 overflow-y-auto" aria-live="polite">
          {(conversa.data ?? []).map((m: MensagemResponse) => {
            const meu = m.autor.id === user?.id;
            return (
              <li key={m.id} className={`flex ${meu ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                    meu
                      ? "bg-primary text-primary-fg"
                      : "border border-border bg-surface-2 text-text"
                  }`}
                >
                  <p>{m.conteudo}</p>
                  <p className={`mt-1 text-xs ${meu ? "text-primary-fg/80" : "text-text-muted"}`}>
                    {formatDateTime(m.criadoEm)}
                  </p>
                </div>
              </li>
            );
          })}
          {conversa.data?.length === 0 && (
            <li className="text-sm text-text-muted">Inicie a conversa enviando uma mensagem.</li>
          )}
        </ul>
      )}

      <form onSubmit={enviar} className="flex flex-col gap-2">
        <Textarea
          label="Mensagem"
          rows={2}
          value={conteudo}
          onChange={(e) => setConteudo(e.target.value)}
          required
        />
        <div className="flex justify-end">
          <Button type="submit" loading={enviando}>
            Enviar
          </Button>
        </div>
      </form>
    </Card>
  );
}

function NovaMensagemModal({
  onClose,
  onEnviado,
}: {
  onClose: () => void;
  onEnviado: (contato: Contato) => void;
}) {
  const toast = useToast();
  const [contatos, setContatos] = useState<UsuarioResumoResponse[]>([]);
  const [destinatarioId, setDestinatarioId] = useState("");
  const [destinatarioEmail, setDestinatarioEmail] = useState("");
  const [conteudo, setConteudo] = useState("");
  const [enviando, setEnviando] = useState(false);

  // A listagem de usuários é restrita ao GESTOR; demais papéis usam o e-mail.
  const podeListar = contatos.length > 0;

  useEffect(() => {
    // Tenta carregar a lista de usuários (permitido conforme o papel).
    usuariosApi
      .listar({ size: 200 })
      .then((p) => setContatos(p.content.map((u) => ({ id: u.id, nome: u.nome, email: u.email, role: u.role }))))
      .catch(() => setContatos([]));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    try {
      const msg = await mensagensApi.enviar(
        podeListar
          ? { destinatarioId, conteudo }
          : { destinatarioEmail: destinatarioEmail.trim(), conteudo },
      );
      // O back-end resolve o destinatário e o devolve na resposta — usamos isso
      // para abrir a conversa, já que pelo e-mail não temos o ID localmente.
      const id = msg.destinatario?.id ?? destinatarioId;
      const nome =
        msg.destinatario?.nome ??
        contatos.find((c) => c.id === destinatarioId)?.nome ??
        destinatarioEmail.trim();
      toast.success("Mensagem enviada.");
      onEnviado({ id, nome });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Falha ao enviar mensagem.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Modal open title="Nova mensagem" onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        {podeListar ? (
          <Select
            label="Destinatário"
            value={destinatarioId}
            onChange={(e) => setDestinatarioId(e.target.value)}
            required
          >
            <option value="">Selecione…</option>
            {contatos.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome} ({c.email})
              </option>
            ))}
          </Select>
        ) : (
          <Input
            label="E-mail do destinatário"
            type="email"
            hint="Informe o e-mail do professor ou aluno."
            placeholder="nome@discente.ufg.br"
            value={destinatarioEmail}
            onChange={(e) => setDestinatarioEmail(e.target.value)}
            required
          />
        )}
        <Textarea
          label="Mensagem"
          rows={4}
          value={conteudo}
          onChange={(e) => setConteudo(e.target.value)}
          required
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={enviando}>
            Enviar
          </Button>
        </div>
      </form>
    </Modal>
  );
}
