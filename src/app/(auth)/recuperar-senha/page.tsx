"use client";

import { useState } from "react";
import Link from "next/link";
import { authApi } from "@/lib/api/endpoints";
import { Button, Card, Input } from "@/components/ui";
import { ApiError } from "@/lib/api/client";

/** RF02 — Solicitação de redefinição de senha por e-mail institucional. */
export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      await authApi.recuperarSenha({ email });
      setEnviado(true);
    } catch (err) {
      setErro(
        err instanceof ApiError ? err.message : "Não foi possível enviar a solicitação.",
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Card as="section">
      <h1 className="text-2xl font-bold text-text">Recuperar senha</h1>

      {enviado ? (
        <div
          role="status"
          className="mt-4 flex items-start gap-2 rounded-lg border border-success bg-success-bg px-3 py-3 text-sm text-success"
        >
          <span aria-hidden className="text-base font-bold">
            ✓
          </span>
          <p>
            Se o e-mail estiver cadastrado, enviamos um link de redefinição válido por 24
            horas. Verifique sua caixa de entrada.
          </p>
        </div>
      ) : (
        <>
          <p className="mt-1 text-text-muted">
            Informe seu e-mail institucional para receber o link de redefinição.
          </p>

          {erro && (
            <p
              role="alert"
              className="mt-4 flex items-center gap-2 rounded-lg border border-danger bg-danger-bg px-3 py-2 text-sm text-danger"
            >
              <span aria-hidden className="text-base font-bold">
                ⚠
              </span>
              {erro}
            </p>
          )}

          <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4" noValidate>
            <Input
              label="E-mail institucional"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Button type="submit" loading={enviando}>
              Enviar link de redefinição
            </Button>
          </form>
        </>
      )}

      <p className="mt-4 text-sm">
        <Link href="/login" className="text-primary underline">
          Voltar para o login
        </Link>
      </p>
    </Card>
  );
}
