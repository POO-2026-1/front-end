"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { authApi } from "@/lib/api/endpoints";
import { useToast } from "@/context/ToastContext";
import { Button, Card, Input } from "@/components/ui";
import { ApiError } from "@/lib/api/client";

/** RF02 — Redefinição efetiva da senha a partir do token recebido. */
function RedefinirSenhaForm() {
  const router = useRouter();
  const params = useSearchParams();
  const toast = useToast();

  const [token, setToken] = useState(params.get("token") ?? "");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    if (novaSenha !== confirmar) {
      setErro("As senhas não coincidem.");
      return;
    }
    setEnviando(true);
    try {
      await authApi.redefinirSenha({ token, novaSenha });
      toast.success("Senha redefinida com sucesso! Faça login.");
      router.replace("/login");
    } catch (err) {
      setErro(
        err instanceof ApiError ? err.message : "Não foi possível redefinir a senha.",
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Card as="section">
      <h1 className="text-2xl font-bold text-text">Redefinir senha</h1>
      <p className="mt-1 text-text-muted">Crie uma nova senha para sua conta.</p>

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
          label="Token de redefinição"
          hint="Informe o código recebido por e-mail."
          value={token}
          onChange={(e) => setToken(e.target.value)}
          required
        />
        <Input
          label="Nova senha"
          type="password"
          autoComplete="new-password"
          value={novaSenha}
          onChange={(e) => setNovaSenha(e.target.value)}
          required
        />
        <Input
          label="Confirmar nova senha"
          type="password"
          autoComplete="new-password"
          value={confirmar}
          onChange={(e) => setConfirmar(e.target.value)}
          required
        />
        <Button type="submit" loading={enviando}>
          Redefinir senha
        </Button>
      </form>

      <p className="mt-4 text-sm">
        <Link href="/login" className="text-primary underline">
          Voltar para o login
        </Link>
      </p>
    </Card>
  );
}

export default function RedefinirSenhaPage() {
  return (
    <Suspense fallback={null}>
      <RedefinirSenhaForm />
    </Suspense>
  );
}
