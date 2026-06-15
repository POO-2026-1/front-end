"use client";

import type { ReactNode } from "react";
import { PreferencesProvider } from "./PreferencesContext";
import { ToastProvider } from "./ToastContext";
import { AuthProvider } from "./AuthContext";

/**
 * Compõe os provedores globais na ordem correta de dependência:
 * Preferences → Toast → Auth (Auth depende dos dois anteriores).
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <PreferencesProvider>
      <ToastProvider>
        <AuthProvider>{children}</AuthProvider>
      </ToastProvider>
    </PreferencesProvider>
  );
}
