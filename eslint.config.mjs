import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // Usamos useEffect para sincronizar com sistemas externos (busca de
      // dados na montagem, restauração de sessão via JWT, hidratação de
      // preferências do localStorage e reset de menu na navegação) — casos
      // legítimos. Mantemos como aviso para preservar a visibilidade.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
]);

export default eslintConfig;
