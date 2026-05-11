'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/stores';
import { Button, Input, Select } from '@/components/ui';

const COUNTRIES = [
  { value: 'AR', label: 'Argentina' },
  { value: 'MX', label: 'México' },
  { value: 'CO', label: 'Colombia' },
  { value: 'CL', label: 'Chile' },
  { value: 'PE', label: 'Perú' },
];

// Subir cuando se publique una nueva versión de /legal/terminos.
const TERMS_VERSION = '2026-04';

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading } = useAuthStore();
  const [form, setForm] = useState({
    fullName: '', email: '', password: '', companyName: '', country: 'AR',
  });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [errors, setErrors] = useState<any>({});

  const validate = () => {
    const e: any = {};
    if (!form.fullName || form.fullName.length < 2) e.fullName = 'Nombre requerido (mínimo 2 caracteres)';
    if (!form.email) e.email = 'Email requerido';
    if (!form.password || form.password.length < 6) e.password = 'Mínimo 6 caracteres';
    if (!acceptedTerms) e.acceptedTerms = 'Debés aceptar los términos y la política de privacidad';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await register({ ...form, acceptedTermsVersion: TERMS_VERSION });
      toast.success('¡Cuenta creada! Bienvenido a MiAsesor');
      router.push('/home');
    } catch (error: any) {
      toast.error(error.message || 'Error al registrar');
    }
  };

  return (
    <div className="bg-[var(--surface)] rounded-2xl shadow-medium border border-[var(--border)] p-8 md:p-10">
      <div className="mb-7">
        <p className="font-display text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--cta-dark)]">
          Plan Gratis · 2 pruebas
        </p>
        <h1 className="mt-2 font-display text-[28px] font-bold tracking-tight text-[var(--text-strong)]">
          Crear cuenta
        </h1>
        <p className="mt-1.5 text-sm text-[var(--text-medium)]">
          Empezá con el asesor legal: 2 consultas y 1 análisis inicial. Sin tarjeta.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Tu nombre"
          placeholder="Juan Pérez"
          value={form.fullName}
          onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          error={errors.fullName}
          autoComplete="name"
        />
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
          placeholder="Mínimo 6 caracteres"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          error={errors.password}
          autoComplete="new-password"
        />
        <Input
          label="Empresa (opcional)"
          placeholder="Mi Empresa S.A."
          value={form.companyName}
          onChange={(e) => setForm({ ...form, companyName: e.target.value })}
          autoComplete="organization"
        />
        <Select
          label="País"
          value={form.country}
          onChange={(e) => setForm({ ...form, country: e.target.value })}
          options={COUNTRIES}
        />

        <label className="flex items-start gap-3 mt-5 cursor-pointer rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-3.5 hover:border-[var(--border-strong)] transition-colors">
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            className="mt-0.5 w-4 h-4 accent-[var(--primary)] flex-shrink-0"
          />
          <span className="text-[13px] leading-relaxed text-[var(--text-medium)]">
            Entiendo que MiAsesor brinda <strong className="text-[var(--text-strong)]">orientación informativa generada por IA</strong>, que no reemplaza a un profesional matriculado, y acepto los{' '}
            <Link href="/legal/terminos" target="_blank" className="text-[var(--primary)] font-semibold hover:underline">términos de uso</Link>
            {' '}y la{' '}
            <Link href="/legal/privacidad" target="_blank" className="text-[var(--primary)] font-semibold hover:underline">política de privacidad</Link>.
          </span>
        </label>
        {errors.acceptedTerms && (
          <p className="text-xs text-red-600 mt-1">{errors.acceptedTerms}</p>
        )}

        <Button type="submit" size="lg" fullWidth loading={isLoading} className="mt-2">
          Crear cuenta gratis
        </Button>
      </form>

      <p className="text-center text-sm text-[var(--text-medium)] mt-7">
        ¿Ya tenés cuenta?{' '}
        <Link href="/auth/login" className="font-semibold text-[var(--primary)] hover:text-[var(--primary-dark)] underline-offset-4 hover:underline">
          Ingresá
        </Link>
      </p>
    </div>
  );
}
