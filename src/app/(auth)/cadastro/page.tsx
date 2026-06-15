"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { Button, Card, Input, Select } from "@/components/ui";
import { ApiError } from "@/lib/api/client";
import type { Role } from "@/lib/api/types";

/** RF04 — Cadastro de novos usuários (aluno, professor, gestor). */
export default function CadastroPage() {
  const router = useRouter();
  const { register } = useAuth();
  const toast = useToast();

  const [form, setForm] = useState({
    nome: "",
    email: "",
    senha: "",
    confirmarSenha: "",
    role: "ALUNO" as Role,
    matricula: "",
    cpf: "",
    telefone: "",
  });
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    if (form.senha !== form.confirmarSenha) {
      setErro("As senhas não coincidem.");
      return;
    }
    setEnviando(true);
    try {
      await register({
        nome: form.nome,
        email: form.email,
        senha: form.senha,
        role: form.role,
        matricula: form.matricula || undefined,
        cpf: form.cpf || undefined,
        telefone: form.telefone || undefined,
      });
      toast.success("Cadastro realizado! Faça login para continuar.");
      router.replace("/login");
    } catch (err) {
      setErro(
        err instanceof ApiError ? err.message : "Não foi possível concluir o cadastro.",
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Card as="section">
      <h1 className="text-2xl font-bold text-text">Criar conta</h1>
      <p className="mt-1 text-text-muted">Preencha seus dados institucionais.</p>

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
          label="Nome completo"
          value={form.nome}
          onChange={(e) => update("nome", e.target.value)}
          required
        />
        <Input
          label="E-mail institucional"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
          required
        />
        <Select
          label="Perfil"
          value={form.role}
          onChange={(e) => update("role", e.target.value as Role)}
          required
        >
          <option value="ALUNO">Aluno</option>
          <option value="PROFESSOR">Professor</option>
          <option value="GESTOR">Gestor</option>
        </Select>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Matrícula"
            value={form.matricula}
            onChange={(e) => update("matricula", e.target.value)}
          />
          <Input
            label="CPF"
            value={form.cpf}
            onChange={(e) => update("cpf", e.target.value)}
          />
        </div>
        <Input
          label="Telefone"
          type="tel"
          value={form.telefone}
          onChange={(e) => update("telefone", e.target.value)}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Senha"
            type="password"
            autoComplete="new-password"
            value={form.senha}
            onChange={(e) => update("senha", e.target.value)}
            required
          />
          <Input
            label="Confirmar senha"
            type="password"
            autoComplete="new-password"
            value={form.confirmarSenha}
            onChange={(e) => update("confirmarSenha", e.target.value)}
            required
          />
        </div>
        <Button type="submit" loading={enviando}>
          Cadastrar
        </Button>
      </form>

      <p className="mt-4 text-sm text-text-muted">
        Já tem conta?{" "}
        <Link href="/login" className="text-primary underline">
          Entrar
        </Link>
      </p>
    </Card>
  );
}
