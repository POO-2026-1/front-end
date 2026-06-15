"use client";

import { useState } from "react";
import { useToast } from "@/context/ToastContext";
import { contestacoesApi } from "@/lib/api/endpoints";
import { Modal } from "./Modal";
import { Button, Textarea } from "./ui";
import { ApiError } from "@/lib/api/client";
import type { ContestacaoTipo } from "@/lib/api/types";

/**
 * Modal de contestação de nota ou falta (RF12). Gera protocolo rastreável
 * no back-end e exige justificativa obrigatória.
 */
export function ContestarModal({
  open,
  tipo,
  disciplinaId,
  registroId,
  descricaoAlvo,
  onClose,
  onSubmitted,
}: {
  open: boolean;
  tipo: ContestacaoTipo;
  disciplinaId: string;
  registroId: string;
  descricaoAlvo: string;
  onClose: () => void;
  onSubmitted?: () => void;
}) {
  const toast = useToast();
  const [justificativa, setJustificativa] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    try {
      const resp = await contestacoesApi.criar({ tipo, disciplinaId, registroId, justificativa });
      toast.success(`Contestação registrada. Protocolo: ${resp.protocolo}`);
      setJustificativa("");
      onSubmitted?.();
      onClose();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Falha ao registrar contestação.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Modal open={open} title={`Contestar ${tipo === "NOTA" ? "nota" : "falta"}`} onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <p className="text-sm text-text-muted">{descricaoAlvo}</p>
        <Textarea
          label="Justificativa"
          hint="Explique o motivo da contestação."
          rows={4}
          value={justificativa}
          onChange={(e) => setJustificativa(e.target.value)}
          required
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={enviando}>
            Enviar contestação
          </Button>
        </div>
      </form>
    </Modal>
  );
}
