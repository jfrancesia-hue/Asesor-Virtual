'use client';
import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { Scale } from 'lucide-react';
import { useAuthStore } from '@/stores';
import { Button, Input, Card, Spinner } from '@/components/ui';

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
    <form onSubmit={handleSubmit} className="space-y-4">
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
      <Button type="submit" fullWidth loading={isLoading} className="mt-2">
        Ingresar
      </Button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <Card className="w-full max-w-sm p-8">
      <div className="text-center mb-8">
        <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3">
          <Scale className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">TuAsesor</h1>
        <p className="text-sm text-slate-500 mt-1">Ingresá a tu cuenta</p>
      </div>

      <Suspense fallback={<div className="flex justify-center py-4"><Spinner /></div>}>
        <LoginForm />
      </Suspense>

      <p className="text-center text-sm text-slate-500 mt-6">
        ¿No tenés cuenta?{' '}
        <Link href="/auth/register" className="text-blue-600 hover:underline font-medium">
          Registrate gratis
        </Link>
      </p>
    </Card>
  );
}
