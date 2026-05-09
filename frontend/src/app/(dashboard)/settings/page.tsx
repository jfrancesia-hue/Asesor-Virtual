'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores';
import { Button, Card, Input, Badge, Spinner } from '@/components/ui';
import { clsx } from 'clsx';

const TABS = ['perfil', 'billing', 'equipo'] as const;
type Tab = typeof TABS[number];

const CREDIT_PACKS = [
  { id: 'credits_10', label: '10 créditos', price: '$4.900', icon: '⚡' },
  { id: 'credits_30', label: '30 créditos', price: '$9.900', icon: '⚡⚡' },
  { id: 'credits_100', label: '100 créditos', price: '$24.900', icon: '⚡⚡⚡' },
];

const PLANS = [
  { id: 'free', label: 'Gratis', price: '$0', users: '1 usuario', contracts: '1 contrato', queries: '2 consultas', credits: '1 crédito', free: true },
  { id: 'start', label: 'Start', price: '$7.900/mes', users: '1 usuario', contracts: '5 contratos', queries: '20 consultas', credits: '2 créditos' },
  { id: 'pro', label: 'Pro', price: '$19.900/mes', users: '5 usuarios', contracts: '25 contratos', queries: '100 consultas', credits: '10 créditos', popular: true },
  { id: 'enterprise', label: 'Enterprise', price: '$59.900/mes', users: 'Ilimitados', contracts: 'Ilimitados', queries: '1.000 consultas', credits: '30 créditos' },
];

function SettingsContent() {
  const searchParams = useSearchParams();
  const { user, tenant, updateProfile, loadProfile } = useAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>((searchParams.get('tab') as Tab) || 'perfil');
  const [profileForm, setProfileForm] = useState({ fullName: user?.fullName || '' });
  const [saving, setSaving] = useState(false);
  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loadingBilling, setLoadingBilling] = useState(false);
  const [purchasingCredits, setPurchasingCredits] = useState<string | null>(null);

  // Mercado Pago vuelve con ?success=true | ?failure=true | ?pending=true
  // (configurado en createPreference en el backend).
  useEffect(() => {
    const success = searchParams.get('success');
    const failure = searchParams.get('failure');
    const pending = searchParams.get('pending');
    if (success === 'true') {
      toast.success('¡Pago procesado correctamente!');
      setActiveTab('billing');
      loadBilling();
      loadProfile();
    } else if (failure === 'true') {
      toast.error('El pago no se completó. Intentá nuevamente.');
      setActiveTab('billing');
    } else if (pending === 'true') {
      toast('Pago pendiente — te avisamos cuando se acredite.');
      setActiveTab('billing');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (activeTab === 'billing') loadBilling();
    if (activeTab === 'equipo') loadUsers();
  }, [activeTab]);

  const loadBilling = async () => {
    setLoadingBilling(true);
    try {
      const [w, t] = await Promise.all([api.billing.wallet(), api.billing.transactions()]);
      setWallet(w);
      setTransactions((t as any).transactions || []);
    } catch {
      toast.error('Error al cargar facturación');
    } finally {
      setLoadingBilling(false);
    }
  };

  const loadUsers = async () => {
    try {
      const u = await api.users.list();
      setUsers(u || []);
    } catch {
      toast.error('Error al cargar usuarios');
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await updateProfile(profileForm);
      toast.success('Perfil actualizado');
    } catch {
      toast.error('Error al actualizar');
    } finally {
      setSaving(false);
    }
  };

  const handleBuyCredits = async (pack: string) => {
    setPurchasingCredits(pack);
    try {
      const result = await api.billing.buyCredits(pack) as any;
      if (result.url) window.location.href = result.url;
    } catch (error: any) {
      toast.error(error.message || 'Error al procesar pago');
    } finally {
      setPurchasingCredits(null);
    }
  };

  const handleUpgradePlan = async (plan: string) => {
    try {
      const result = await api.billing.subscribe(plan) as any;
      if (result.url) window.location.href = result.url;
    } catch (error: any) {
      toast.error(error.message || 'Error al procesar suscripción');
    }
  };

  return (
    <div className="px-6 md:px-8 py-10 max-w-4xl mx-auto">
      <header className="mb-8">
        <p className="font-display text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--cta-dark)]">
          Tu cuenta
        </p>
        <h1 className="mt-2 font-display text-[clamp(24px,3.5vw,32px)] font-bold tracking-[-0.025em] text-[var(--text-strong)]">
          Configuración
        </h1>
      </header>

      {/* Tabs */}
      <div className="flex gap-1 bg-[var(--surface-subtle)] border border-[var(--border)] p-1 rounded-xl w-fit mb-6">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={clsx(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize',
              activeTab === tab ? 'bg-[var(--surface)] text-[var(--text-strong)] shadow-soft' : 'text-[var(--text-muted)] hover:text-[var(--text-medium)]',
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Perfil Tab */}
      {activeTab === 'perfil' && (
        <Card className="p-6">
          <h2 className="font-semibold text-[var(--text-strong)] mb-4">Perfil personal</h2>
          <div className="space-y-4 max-w-sm">
            <Input
              label="Nombre completo"
              value={profileForm.fullName}
              onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
            />
            <div>
              <p className="text-sm text-[var(--text-medium)] font-medium mb-1">Email</p>
              <p className="text-sm text-[var(--text-medium)]">{user?.email}</p>
            </div>
            <div>
              <p className="text-sm text-[var(--text-medium)] font-medium mb-1">Rol</p>
              <Badge color="blue" className="capitalize">{user?.role}</Badge>
            </div>
            <div>
              <p className="text-sm text-[var(--text-medium)] font-medium mb-1">Organización</p>
              <p className="text-sm text-[var(--text-medium)]">{tenant?.name}</p>
            </div>
            <Button onClick={handleSaveProfile} loading={saving}>Guardar cambios</Button>
          </div>
        </Card>
      )}

      {/* Billing Tab */}
      {activeTab === 'billing' && (
        <div className="space-y-6">
          {loadingBilling ? (
            <div className="flex justify-center py-12"><Spinner size="lg" /></div>
          ) : (
            <>
              {/* Wallet */}
              <Card className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold text-[var(--text-strong)] mb-1">Créditos de análisis</h2>
                    <p className="text-3xl font-bold text-[var(--primary)]">{wallet?.balance || 0} <span className="text-base text-[var(--text-muted)] font-normal">créditos</span></p>
                  </div>
                  <span className="text-4xl">⚡</span>
                </div>
              </Card>

              {/* Credit Packs */}
              <div>
                <h3 className="font-semibold text-[var(--text-medium)] mb-3">Comprar créditos</h3>
                <div className="grid gap-3 md:grid-cols-3">
                  {CREDIT_PACKS.map((pack) => (
                    <Card key={pack.id} className="p-4 text-center hover:border-[var(--primary)]/40 transition-colors">
                      <p className="text-2xl mb-2">{pack.icon}</p>
                      <p className="font-semibold text-[var(--text-strong)]">{pack.label}</p>
                      <p className="text-sm text-[var(--primary)] font-medium my-1">{pack.price}</p>
                      <Button
                        size="sm"
                        fullWidth
                        className="mt-2"
                        loading={purchasingCredits === pack.id}
                        onClick={() => handleBuyCredits(pack.id)}
                      >
                        Comprar
                      </Button>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Plans */}
              <div>
                <h3 className="font-semibold text-[var(--text-medium)] mb-3">
                  Plan actual: <span className="text-[var(--primary)] capitalize">{tenant?.plan}</span>
                </h3>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {PLANS.map((plan) => (
                    <Card
                      key={plan.id}
                      className={clsx(
                        'p-4 relative',
                        plan.popular && 'border-[var(--primary)]',
                        tenant?.plan === plan.id && 'bg-[var(--primary-bg)] border-[var(--primary)]/40',
                      )}
                    >
                      {plan.popular && (
                        <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-[var(--primary)] text-white text-xs px-2 py-0.5 rounded-full">
                          Popular
                        </span>
                      )}
                      <h4 className="font-bold text-[var(--text-strong)]">{plan.label}</h4>
                      <p className="text-[var(--primary)] font-semibold text-sm my-1">{plan.price}</p>
                      <ul className="text-xs text-[var(--text-medium)] space-y-1 my-3">
                        <li>👤 {plan.users}</li>
                        <li>📄 {plan.contracts}/mes</li>
                        <li>💬 {plan.queries}/mes</li>
                        <li>⚡ {plan.credits}/mes</li>
                      </ul>
                      {tenant?.plan === plan.id ? (
                        <Badge color="green" className="w-full justify-center">Plan actual</Badge>
                      ) : plan.free ? (
                        <Badge color="slate" className="w-full justify-center">Plan inicial</Badge>
                      ) : (
                        <Button
                          size="sm"
                          fullWidth
                          variant={plan.popular ? 'primary' : 'outline'}
                          onClick={() => handleUpgradePlan(plan.id)}
                        >
                          Cambiar a {plan.label}
                        </Button>
                      )}
                    </Card>
                  ))}
                </div>
              </div>

              {/* Transactions */}
              {transactions.length > 0 && (
                <Card className="p-5">
                  <h3 className="font-semibold text-[var(--text-strong)] mb-3">Historial de créditos</h3>
                  <div className="space-y-2">
                    {transactions.slice(0, 10).map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0">
                        <div>
                          <p className="text-sm text-[var(--text-medium)]">{tx.description}</p>
                          <p className="text-xs text-[var(--text-muted)]">{new Date(tx.created_at).toLocaleDateString('es-AR')}</p>
                        </div>
                        <span className={clsx('text-sm font-semibold', tx.amount > 0 ? 'text-[var(--accent-dark)]' : 'text-red-500')}>
                          {tx.amount > 0 ? '+' : ''}{tx.amount}
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </>
          )}
        </div>
      )}

      {/* Equipo Tab */}
      {activeTab === 'equipo' && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-[var(--text-strong)]">Equipo ({users.length})</h2>
          </div>
          <div className="space-y-2">
            {users.map((u) => (
              <div key={u.id} className="flex items-center gap-3 p-3 bg-[var(--surface-subtle)] rounded-lg">
                <div className="w-8 h-8 bg-[var(--primary-bg)] rounded-full flex items-center justify-center text-[var(--primary)] text-sm font-bold">
                  {u.full_name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--text-strong)] truncate">{u.full_name}</p>
                  <p className="text-xs text-[var(--text-muted)] truncate">{u.email}</p>
                </div>
                <Badge color={u.role === 'owner' ? 'blue' : 'slate'} className="capitalize">{u.role}</Badge>
                <Badge color={u.is_active ? 'green' : 'red'}>{u.is_active ? 'Activo' : 'Inactivo'}</Badge>
              </div>
            ))}
          </div>
          {(tenant?.plan === 'free' || tenant?.plan === 'start') && (
            <p className="text-xs text-[var(--text-muted)] mt-4 text-center">
              Tu plan permite 1 usuario. Actualizá a Pro para agregar más.
            </p>
          )}
        </Card>
      )}
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen"><Spinner size="lg" /></div>}>
      <SettingsContent />
    </Suspense>
  );
}
