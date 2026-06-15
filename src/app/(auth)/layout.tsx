import type { ReactNode } from "react";
import { AccessibilityControls } from "@/components/AccessibilityControls";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between p-4">
        <span className="font-bold text-text">Campus Virtual</span>
        <AccessibilityControls />
      </header>
      <main
        id="conteudo-principal"
        className="flex flex-1 items-center justify-center px-4 py-8"
      >
        <div className="w-full max-w-md">{children}</div>
      </main>
      <footer className="p-4 text-center text-xs text-text-muted">
        Universidade Federal de Goiás — Instituto de Informática
      </footer>
    </div>
  );
}
