'use client';
import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/stores';
import { Button, Input, Spinner } from '@/components/ui';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isLoading } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<any>({});

  const validate = () => {
    const e: any = {};
    if (!form.email) e.email = 'El email es requerido';
    if (!form.password) e.password = 'La contraseña es requerida';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      await login(form.email, form.password);
      const redirect = searchParams.get('redirect') || '/home';
      router.push(redirect);
    } catch (error: any) {
      toast.error(error.message || 'Credenciales incorrectas');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Input
        label="Email"
        type="email"
        placeholder="juan@empresa.com"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        error={errors.email}
        autoComplete="email"
      />
      <Input
        label="Contraseña"
        type="password"
        placeholder="••••••••"
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
        error={errors.password}
        autoComplete="current-password"
      />
      <div className="flex justify-end -mt-2">
        <Link
          href="/auth/forgot-password"
          className="text-[13px] font-medium text-[var(--primary)] hover:text-[var(--primary-dark)] underline-offset-4 hover:underline"
        >
          ¿Olvidaste tu contraseña?
        </Link>
      </div>
      <Button type="submit" size="lg" fullWidth loading={isLoading} className="mt-6">
        Ingresar
      </Button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="bg-[var(--surface)] rounded-2xl shadow-medium border border-[var(--border)] p-8 md:p-10">
      <div className="mb-8">
        <p className="font-display text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--cta-dark)]">
          Bienvenido de vuelta
        </p>
        <h1 className="mt-2 font-display text-[28px] font-bold tracking-tight text-[var(--text-strong)]">
          Ingresá a tu cuenta
        </h1>
        <p className="mt-1.5 text-sm text-[var(--text-medium)]">
          Y volvé a charlar con tus 6 asesores.
        </p>
      </div>

      <Suspense fallback={<div className="flex justify-center py-8"><Spinner /></div>}>
        <LoginForm />
      </Suspense>

      <p className="text-center text-sm text-[var(--text-medium)] mt-7">
        ¿No tenés cuenta?{' '}
        <Link href="/auth/register" className="font-semibold text-[var(--primary)] hover:text-[var(--primary-dark)] underline-offset-4 hover:underline">
          Registrate gratis
        </Link>
      </p>
    </div>
  );
}
