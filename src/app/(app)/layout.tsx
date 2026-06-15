"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { AppShell } from "@/components/AppShell";
import { Spinner } from "@/components/ui";

/** Layout protegido: exige sessão autenticada (RNF10). */
export default function AppLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { status } = useAuth();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  if (status !== "authenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner label="Verificando sessão…" />
      </div>
    );
  }

  return <AppShell>{children}</AppShell>;
}
