'use client';
import { useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Button, Input } from '@/components/ui';
import { api } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('El email es requerido');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await api.auth.forgotPassword(email);
      setSent(true);
      toast.success('Si el email existe, recibirás un link de recuperación');
    } catch (err: any) {
      toast.error(err.message || 'No se pudo enviar el email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[var(--surface)] rounded-2xl shadow-medium border border-[var(--border)] p-8 md:p-10">
      <div className="mb-8">
        <p className="font-display text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--cta-dark)]">
          Recuperar acceso
        </p>
        <h1 className="mt-2 font-display text-[28px] font-bold tracking-tight text-[var(--text-strong)]">
          ¿Olvidaste tu contraseña?
        </h1>
        <p className="mt-1.5 text-sm text-[var(--text-medium)]">
          Te enviamos un link a tu email para crear una nueva.
        </p>
      </div>

      {sent ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-5 text-sm text-[var(--text-medium)]">
          <p>Si <strong className="text-[var(--text-strong)]">{email}</strong> está registrado, recibirás un email con instrucciones para crear una nueva contraseña. Revisá tu bandeja de entrada y spam.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Email"
            type="email"
            placeholder="juan@empresa.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={error}
            autoComplete="email"
          />
          <Button type="submit" size="lg" fullWidth loading={loading} className="mt-6">
            Enviar link de recuperación
          </Button>
        </form>
      )}

      <p className="text-center text-sm text-[var(--text-medium)] mt-7">
        <Link href="/auth/login" className="font-semibold text-[var(--primary)] hover:text-[var(--primary-dark)] underline-offset-4 hover:underline">
          Volver a ingresar
        </Link>
      </p>
    </div>
  );
}
