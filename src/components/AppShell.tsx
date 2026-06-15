"use client";

/**
 * Casca da aplicação autenticada: navegação lateral por papel, barra
 * superior com controles de acessibilidade e menu do usuário.
 *
 * Responsiva (RNF09): em telas pequenas a navegação vira um menu retrátil.
 * Inclui marcos ARIA (banner, navigation, main) e foco gerenciável.
 */

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { AccessibilityControls } from "./AccessibilityControls";
import { navForRole } from "@/lib/navigation";
import { ROLE_LABEL, initials } from "@/lib/format";

export function AppShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [menuAberto, setMenuAberto] = useState(false);

  // Fecha o menu mobile ao navegar.
  useEffect(() => {
    setMenuAberto(false);
  }, [pathname]);

  if (!user) return null;
  const itens = navForRole(user.role);

  function isAtivo(href: string): boolean {
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-surface px-4 py-3">
        <button
          type="button"
          className="rounded-lg border border-border px-3 py-1.5 text-text lg:hidden"
          aria-expanded={menuAberto}
          aria-controls="navegacao-principal"
          onClick={() => setMenuAberto((v) => !v)}
        >
          <span aria-hidden>☰</span>
          <span className="sr-only">Abrir menu de navegação</span>
        </button>

        <Link href="/painel" className="text-lg font-bold text-text">
          Campus Virtual
        </Link>

        <div className="ml-auto flex items-center gap-3">
          <AccessibilityControls compact />
          <div className="hidden items-center gap-2 sm:flex">
            <span
              aria-hidden
              className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-fg"
            >
              {initials(user.nome)}
            </span>
            <div className="text-sm leading-tight">
              <p className="font-semibold text-text">{user.nome}</p>
              <p className="text-text-muted">{ROLE_LABEL[user.role]}</p>
            </div>
          </div>
          <Link
            href="/perfil"
            className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-text hover:bg-surface-2"
          >
            Perfil
          </Link>
          <button
            type="button"
            onClick={() => logout()}
            className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-text hover:bg-surface-2"
          >
            Sair
          </button>
        </div>
      </header>

      <div className="flex flex-1">
        <nav
          id="navegacao-principal"
          aria-label="Navegação principal"
          className={`${
            menuAberto ? "block" : "hidden"
          } w-full border-b border-border bg-surface p-3 lg:block lg:w-64 lg:shrink-0 lg:border-b-0 lg:border-r`}
        >
          <ul className="flex flex-col gap-1">
            {itens.map((item) => {
              const ativo = isAtivo(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={ativo ? "page" : undefined}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${
                      ativo
                        ? "bg-primary text-primary-fg"
                        : "text-text hover:bg-surface-2"
                    }`}
                  >
                    <span aria-hidden className="text-base">
                      {item.icon}
                    </span>
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <main id="conteudo-principal" className="min-w-0 flex-1 p-4 sm:p-6">
          <div className="mx-auto max-w-5xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
