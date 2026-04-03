'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Scale } from 'lucide-react';
import { useAuthStore } from '@/stores';
import { Button, Input, Select, Card } from '@/components/ui';

const COUNTRIES = [
  { value: 'AR', label: 'Argentina' },
  { value: 'MX', label: 'México' },
  { value: 'CO', label: 'Colombia' },
  { value: 'CL', label: 'Chile' },
  { value: 'PE', label: 'Perú' },
];

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading } = useAuthStore();
  const [form, setForm] = useState({
    fullName: '', email: '', password: '', companyName: '', country: 'AR',
  });
  const [errors, setErrors] = useState<any>({});

  const validate = () => {
    const e: any = {};
    if (!form.fullName || form.fullName.length < 2) e.fullName = 'Nombre requerido (mínimo 2 caracteres)';
    if (!form.email) e.email = 'Email requerido';
    if (!form.password || form.password.length < 8) e.password = 'Mínimo 8 caracteres';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await register(form);
      toast.success('¡Cuenta creada! Bienvenido a Asesor Virtual');
      router.push('/home');
    } catch (error: any) {
      toast.error(error.message || 'Error al registrar');
    }
  };

  return (
    <Card className="w-full max-w-sm p-8">
      <div className="text-center mb-6">
        <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3">
          <Scale className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">Crear cuenta gratis</h1>
        <p className="text-xs text-slate-500 mt-1">5 asesores IA — Plan Start gratuito</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <Input
          label="Tu nombre"
          placeholder="Juan Pérez"
          value={form.fullName}
          onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          error={errors.fullName}
        />
        <Input
          label="Email"
          type="email"
          placeholder="juan@empresa.com"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          error={errors.email}
        />
        <Input
          label="Contraseña"
          type="password"
          placeholder="Mínimo 8 caracteres"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          error={errors.password}
        />
        <Input
          label="Empresa (opcional)"
          placeholder="Mi Empresa S.A."
          value={form.companyName}
          onChange={(e) => setForm({ ...form, companyName: e.target.value })}
        />
        <Select
          label="País"
          value={form.country}
          onChange={(e) => setForm({ ...form, country: e.target.value })}
          options={COUNTRIES}
        />

        <Button type="submit" fullWidth loading={isLoading} className="mt-2">
          Crear cuenta gratis
        </Button>
      </form>

      <p className="text-center text-xs text-slate-400 mt-4">
        Al registrarte aceptás los términos de uso y política de privacidad.
      </p>
      <p className="text-center text-sm text-slate-500 mt-3">
        ¿Ya tenés cuenta?{' '}
        <Link href="/auth/login" className="text-blue-600 hover:underline font-medium">Ingresá</Link>
      </p>
    </Card>
  );
}
