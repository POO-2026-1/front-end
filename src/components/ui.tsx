"use client";

/**
 * Primitivas de UI acessíveis e reutilizáveis.
 *
 * Todos os elementos interativos combinam texto + (quando há) ícone, com
 * rótulos ARIA explícitos (RNF18). Estados de erro usam ícone + texto
 * (RNF19). Cores vêm dos tokens de tema (RNF13/RNF20).
 */

import {
  forwardRef,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";

// --------------------------------------------------------------------------
// Botão
// --------------------------------------------------------------------------

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  loading?: boolean;
}

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-primary text-primary-fg hover:bg-primary-hover border-transparent",
  secondary: "bg-surface text-text border-border hover:bg-surface-2",
  danger: "bg-danger text-white hover:opacity-90 border-transparent",
  ghost: "bg-transparent text-text border-transparent hover:bg-surface-2",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", loading = false, disabled, className = "", children, ...rest },
  ref,
) {
  return (
    <button
      {...rest}
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${BUTTON_VARIANTS[variant]} ${className}`}
    >
      {loading && (
        <span
          aria-hidden
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      )}
      {children}
    </button>
  );
});

// --------------------------------------------------------------------------
// Campos de formulário
// --------------------------------------------------------------------------

let fieldId = 0;
function useFieldId(provided?: string): string {
  return provided ?? `field-${++fieldId}`;
}

interface FieldWrapperProps {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}

function FieldWrapper({ id, label, error, hint, required, children }: FieldWrapperProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-text">
        {label}
        {required && (
          <span className="text-danger" aria-hidden>
            {" *"}
          </span>
        )}
      </label>
      {hint && (
        <p id={`${id}-hint`} className="text-xs text-text-muted">
          {hint}
        </p>
      )}
      {children}
      {error && (
        <p id={`${id}-error`} role="alert" className="flex items-center gap-1 text-sm text-danger">
          <span aria-hidden>⚠</span>
          {error}
        </p>
      )}
    </div>
  );
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, id, required, className = "", ...rest },
  ref,
) {
  const fid = useFieldId(id);
  return (
    <FieldWrapper id={fid} label={label} error={error} hint={hint} required={required}>
      <input
        {...rest}
        id={fid}
        ref={ref}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={
          [hint ? `${fid}-hint` : null, error ? `${fid}-error` : null]
            .filter(Boolean)
            .join(" ") || undefined
        }
        className={`w-full rounded-lg border bg-surface px-3 py-2 text-text placeholder:text-text-muted ${error ? "border-danger" : "border-border"} ${className}`}
      />
    </FieldWrapper>
  );
});

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, hint, id, required, className = "", ...rest },
  ref,
) {
  const fid = useFieldId(id);
  return (
    <FieldWrapper id={fid} label={label} error={error} hint={hint} required={required}>
      <textarea
        {...rest}
        id={fid}
        ref={ref}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={
          [hint ? `${fid}-hint` : null, error ? `${fid}-error` : null]
            .filter(Boolean)
            .join(" ") || undefined
        }
        className={`w-full rounded-lg border bg-surface px-3 py-2 text-text placeholder:text-text-muted ${error ? "border-danger" : "border-border"} ${className}`}
      />
    </FieldWrapper>
  );
});

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, hint, id, required, className = "", children, ...rest },
  ref,
) {
  const fid = useFieldId(id);
  return (
    <FieldWrapper id={fid} label={label} error={error} hint={hint} required={required}>
      <select
        {...rest}
        id={fid}
        ref={ref}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${fid}-error` : undefined}
        className={`w-full rounded-lg border bg-surface px-3 py-2 text-text ${error ? "border-danger" : "border-border"} ${className}`}
      >
        {children}
      </select>
    </FieldWrapper>
  );
});

// --------------------------------------------------------------------------
// Superfícies e estados
// --------------------------------------------------------------------------

export function Card({
  children,
  className = "",
  as: As = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article" | "li";
}) {
  return (
    <As className={`rounded-xl border border-border bg-surface p-5 shadow-sm ${className}`}>
      {children}
    </As>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-text">{title}</h1>
        {description && <p className="mt-1 text-text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

type BadgeTone = "neutral" | "success" | "danger" | "warning" | "info";

const BADGE_TONES: Record<BadgeTone, string> = {
  neutral: "bg-surface-2 text-text-muted border-border",
  success: "bg-success-bg text-success border-success",
  danger: "bg-danger-bg text-danger border-danger",
  warning: "bg-warning-bg text-warning border-warning",
  info: "bg-info-bg text-info border-info",
};

const BADGE_ICONS: Record<BadgeTone, string> = {
  neutral: "•",
  success: "✓",
  danger: "✕",
  warning: "⚠",
  info: "ℹ",
};

export function Badge({
  children,
  tone = "neutral",
  withIcon = true,
}: {
  children: ReactNode;
  tone?: BadgeTone;
  withIcon?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${BADGE_TONES[tone]}`}
    >
      {withIcon && (
        <span aria-hidden className="leading-none">
          {BADGE_ICONS[tone]}
        </span>
      )}
      {children}
    </span>
  );
}

export function Spinner({ label = "Carregando…" }: { label?: string }) {
  return (
    <div role="status" className="flex items-center justify-center gap-3 py-10 text-text-muted">
      <span
        aria-hidden
        className="h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent"
      />
      <span>{label}</span>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <Card className="text-center">
      <p className="text-lg font-semibold text-text">{title}</p>
      {description && <p className="mt-1 text-text-muted">{description}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </Card>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <Card className="border-danger">
      <p role="alert" className="flex items-center gap-2 text-danger">
        <span aria-hidden className="text-lg font-bold">
          ⚠
        </span>
        {message}
      </p>
      {onRetry && (
        <div className="mt-3">
          <Button variant="secondary" onClick={onRetry}>
            Tentar novamente
          </Button>
        </div>
      )}
    </Card>
  );
}
