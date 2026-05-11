'use client';
import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Button, Input, Spinner } from '@/components/ui';
import { api } from '@/lib/api';

function ResetPasswordForm() {
  const router = useRouter();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<any>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash.replace(/^#/, '');
    const params = new URLSearchParams(hash);
    const token = params.get('access_token');
    const errDesc = params.get('error_description') || params.get('error');
    if (errDesc) {
      setTokenError(decodeURIComponent(errDesc.replace(/\+/g, ' ')));
      return;
    }
    if (!token) {
      setTokenError('Link inválido o expirado. Solicitá uno nuevo desde "Olvidé mi contraseña".');
      return;
    }
    setAccessToken(token);
  }, []);

  const validate = () => {
    const e: any = {};
    if (!password || password.length < 8) {
      e.password = 'Mínimo 8 caracteres';
    } else if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      e.password = 'Incluí al menos una mayúscula, una minúscula y un número';
    }
    if (password !== confirm) e.confirm = 'Las contraseñas no coinciden';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!accessToken) return;
    if (!validate()) return;
    setLoading(true);
    try {
      await api.auth.resetPassword(accessToken, password);
      toast.success('Contraseña actualizada. Ingresá con la nueva.');
      router.push('/auth/login');
    } catch (err: any) {
      toast.error(err.message || 'No se pudo actualizar la contraseña');
    } finally {
      setLoading(false);
    }
  };

  if (tokenError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
        <p>{tokenError}</p>
        <Link
          href="/auth/forgot-password"
          className="inline-block mt-4 font-semibold text-[var(--primary)] hover:text-[var(--primary-dark)] underline-offset-4 hover:underline"
        >
          Pedir un nuevo link
        </Link>
      </div>
    );
  }

  if (!accessToken) {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Input
        label="Nueva contraseña"
        type="password"
        placeholder="Ej: MiAsesor2026"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={errors.password}
        helperText="8 caracteres o más, con una mayúscula, una minúscula y un número."
        autoComplete="new-password"
      />
      <Input
        label="Repetir contraseña"
        type="password"
        placeholder="Volvé a escribirla"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        error={errors.confirm}
        autoComplete="new-password"
      />
      <Button type="submit" size="lg" fullWidth loading={loading} className="mt-6">
        Guardar nueva contraseña
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="bg-[var(--surface)] rounded-2xl shadow-medium border border-[var(--border)] p-8 md:p-10">
      <div className="mb-8">
        <p className="font-display text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--cta-dark)]">
          Nueva contraseña
        </p>
        <h1 className="mt-2 font-display text-[28px] font-bold tracking-tight text-[var(--text-strong)]">
          Creá tu nueva contraseña
        </h1>
        <p className="mt-1.5 text-sm text-[var(--text-medium)]">
          Después de guardarla, vas a poder ingresar normalmente.
        </p>
      </div>

      <Suspense fallback={<div className="flex justify-center py-8"><Spinner /></div>}>
        <ResetPasswordForm />
      </Suspense>

      <p className="text-center text-sm text-[var(--text-medium)] mt-7">
        <Link href="/auth/login" className="font-semibold text-[var(--primary)] hover:text-[var(--primary-dark)] underline-offset-4 hover:underline">
          Volver a ingresar
        </Link>
      </p>
    </div>
  );
}
