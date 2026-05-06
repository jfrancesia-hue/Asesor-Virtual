'use client';
import React from 'react';
import { clsx } from 'clsx';
import { Loader2 } from 'lucide-react';

// ============================================================
// BUTTON
// ============================================================
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'subtle' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
}

export function Button({
  children, variant = 'primary', size = 'md', loading, fullWidth, className, disabled, ...props
}: ButtonProps) {
  const base = 'inline-flex items-center justify-center gap-2 font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--accent)] disabled:opacity-50 disabled:cursor-not-allowed';

  // primary = CTA terracota con magnetic effect (el botón estrella)
  // secondary = azul de marca, sólido
  // subtle = surface con border, acción terciaria
  // ghost = texto, sin bg
  // outline = borde, transparente
  // danger = rojo, destructivo
  const variants = {
    primary: 'magnetic-btn bg-[var(--cta)] text-white shadow-[0_8px_24px_rgba(230,126,34,0.35)] hover:bg-[var(--cta-dark)]',
    secondary: 'bg-[var(--primary)] text-white shadow-[0_4px_16px_rgba(46,134,193,0.25)] hover:bg-[var(--primary-dark)]',
    subtle: 'bg-[var(--surface)] text-[var(--text-strong)] border border-[var(--border)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-subtle)]',
    ghost: 'text-[var(--text-medium)] hover:text-[var(--text-strong)] hover:bg-[var(--surface-subtle)]',
    danger: 'bg-red-600 text-white hover:bg-red-700 shadow-[0_4px_16px_rgba(220,38,38,0.25)]',
    outline: 'border border-[var(--border-strong)] text-[var(--text-strong)] hover:bg-[var(--surface-subtle)]',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm rounded-[10px]',
    md: 'px-5 py-2.5 text-sm rounded-xl',
    lg: 'px-7 py-3.5 text-base rounded-[14px]',
  };

  return (
    <button
      className={clsx(base, variants[variant], sizes[size], fullWidth && 'w-full', className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}

// ============================================================
// INPUT
// ============================================================
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export function Input({ label, error, helperText, className, id, ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="field-label">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={clsx(
          'field-input',
          error && '!border-red-400 focus:!border-red-500 focus:!shadow-[0_0_0_4px_rgba(239,68,68,0.12)]',
          className,
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-600 mt-0.5">{error}</p>}
      {helperText && !error && <p className="field-help">{helperText}</p>}
    </div>
  );
}

// ============================================================
// TEXTAREA
// ============================================================
interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function TextArea({ label, error, className, ...props }: TextAreaProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="field-label">{label}</label>}
      <textarea
        className={clsx(
          'field-textarea resize-none',
          error && '!border-red-400 focus:!border-red-500 focus:!shadow-[0_0_0_4px_rgba(239,68,68,0.12)]',
          className,
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-600 mt-0.5">{error}</p>}
    </div>
  );
}

// ============================================================
// CARD
// ============================================================
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  bento?: boolean;
}

export function Card({ children, className, bento = false, ...props }: CardProps) {
  return (
    <div
      className={clsx(
        'bg-[var(--surface)] rounded-2xl border border-[var(--border)]',
        bento ? 'bento-card' : 'shadow-soft',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// ============================================================
// BADGE
// ============================================================
const badgeColors = {
  blue: 'bg-[var(--primary-bg)] text-[var(--primary-dark)]',
  green: 'bg-[var(--accent-bg)] text-[var(--accent-dark)]',
  yellow: 'bg-[var(--brand-yellow-bg)] text-[#92400E]',
  red: 'bg-red-100 text-red-800',
  purple: 'bg-[var(--brand-lavender-bg)] text-[#6B21A8]',
  orange: 'bg-[var(--cta-bg)] text-[var(--cta-dark)]',
  slate: 'bg-[var(--surface-subtle)] text-[var(--text-medium)] border border-[var(--border)]',
};

interface BadgeProps {
  children: React.ReactNode;
  color?: keyof typeof badgeColors;
  className?: string;
}

export function Badge({ children, color = 'slate', className }: BadgeProps) {
  return (
    <span className={clsx('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold', badgeColors[color], className)}>
      {children}
    </span>
  );
}

// ============================================================
// SPINNER
// ============================================================
export function Spinner({ size = 'md', className }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' };
  return <Loader2 className={clsx('animate-spin text-[var(--primary)]', sizes[size], className)} />;
}

// ============================================================
// EMPTY STATE
// ============================================================
export function EmptyState({
  icon, title, description, action,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && <div className="mb-4 text-4xl opacity-80">{icon}</div>}
      <h3 className="font-display text-lg font-bold text-[var(--text-strong)] mb-1">{title}</h3>
      {description && <p className="text-sm text-[var(--text-muted)] mb-5 max-w-sm">{description}</p>}
      {action}
    </div>
  );
}

// ============================================================
// STAT CARD (bento)
// ============================================================
export function StatCard({
  label, value, sub, icon, color,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon?: React.ReactNode;
  color?: string;
}) {
  const iconColor = color || 'var(--primary)';
  return (
    <Card bento className="p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-[0.07em]">{label}</p>
          <p className="font-display text-3xl font-bold text-[var(--text-strong)] mt-1.5 tracking-tight">{value}</p>
          {sub && <p className="text-xs text-[var(--text-muted)] mt-1">{sub}</p>}
        </div>
        {icon && (
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-lg flex-shrink-0 shadow-soft"
            style={{ backgroundColor: iconColor }}
            aria-hidden="true"
          >
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}

// ============================================================
// RISK BADGE
// ============================================================
export function RiskBadge({ risk }: { risk: 'low' | 'medium' | 'high' | 'critical' }) {
  const config = {
    low: { label: 'Bajo', color: 'green' as const },
    medium: { label: 'Medio', color: 'yellow' as const },
    high: { label: 'Alto', color: 'orange' as const },
    critical: { label: 'Crítico', color: 'red' as const },
  };
  const { label, color } = config[risk] || config.low;
  return <Badge color={color}>{label}</Badge>;
}

// ============================================================
// SELECT
// ============================================================
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
  error?: string;
}

export function Select({ label, options, error, className, ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="field-label">{label}</label>}
      <select
        className={clsx(
          'field-select',
          error && '!border-red-400 focus:!border-red-500',
          className,
        )}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {error && <p className="text-xs text-red-600 mt-0.5">{error}</p>}
    </div>
  );
}

// ============================================================
// MODAL
// ============================================================
export function Modal({
  open, onClose, title, children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[var(--text-strong)]/45 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[var(--surface)] rounded-2xl shadow-strong border border-[var(--border)] max-w-lg w-full max-h-[90vh] overflow-auto animate-fade-in">
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
            <h2 className="font-display font-bold text-lg text-[var(--text-strong)]">{title}</h2>
            <button
              onClick={onClose}
              aria-label="Cerrar"
              className="text-[var(--text-muted)] hover:text-[var(--text-strong)] text-xl leading-none rounded-md w-8 h-8 inline-flex items-center justify-center hover:bg-[var(--surface-subtle)] transition-colors"
            >✕</button>
          </div>
        )}
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
