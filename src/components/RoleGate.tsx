"use client";

import type { ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import type { Role } from "@/lib/api/types";
import { EmptyState } from "./ui";

/** Restringe o conteúdo a determinados papéis (RNF10, defesa em profundidade). */
export function RoleGate({
  roles,
  children,
}: {
  roles: Role[];
  children: ReactNode;
}) {
  const { user } = useAuth();
  if (!user) return null;
  if (!roles.includes(user.role)) {
    return (
      <EmptyState
        title="Acesso restrito"
        description="Você não tem permissão para acessar esta área."
      />
    );
  }
  return <>{children}</>;
}
