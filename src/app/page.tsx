"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Spinner } from "@/components/ui";

/** Encaminha o usuário para o painel (autenticado) ou para o login. */
export default function Home() {
  const router = useRouter();
  const { status } = useAuth();

  useEffect(() => {
    if (status === "authenticated") router.replace("/painel");
    else if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  return (
    <main id="conteudo-principal" className="flex min-h-screen items-center justify-center">
      <Spinner label="Carregando Campus Virtual…" />
    </main>
  );
}
