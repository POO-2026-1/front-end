"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Button, Card, Input } from "@/components/ui";
import { ApiError } from "@/lib/api/client";

/** RF01 — Autenticação por credenciais institucionais. */
export default function LoginPage() {
  const router = useRouter();
  const { login, status } = useAuth();

  const [credencial, setCredencial] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (status === "authenticated") router.replace("/painel");
  }, [status, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      await login({ credencial, senha });
      router.replace("/painel");
    } catch (err) {
      setErro(
        err instanceof ApiError
          ? err.message
          : "Não foi possível entrar. Tente novamente.",
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Card as="section">
      <h1 className="text-2xl font-bold text-text">Entrar</h1>
      <p className="mt-1 text-text-muted">
        Acesse com suas credenciais institucionais.
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
          label="Matrícula, CPF ou e-mail"
          autoComplete="username"
          value={credencial}
          onChange={(e) => setCredencial(e.target.value)}
          required
        />
        <Input
          label="Senha"
          type="password"
          autoComplete="current-password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required
        />
        <Button type="submit" loading={enviando}>
          Entrar
        </Button>
      </form>

      <div className="mt-4 flex flex-col gap-1 text-sm">
        <Link href="/recuperar-senha" className="text-primary underline">
          Esqueci minha senha
        </Link>
        <span className="text-text-muted">
          Não tem conta?{" "}
          <Link href="/cadastro" className="text-primary underline">
            Cadastre-se
          </Link>
        </span>
      </div>
    </Card>
  );
}
