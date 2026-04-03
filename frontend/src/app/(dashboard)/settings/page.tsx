'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores';
import { Button, Card, Input, Badge, Spinner, StatCard } from '@/components/ui';
import { clsx } from 'clsx';

const TABS = ['perfil', 'billing', 'equipo'] as const;
type Tab = typeof TABS[number];

const CREDIT_PACKS = [
  { id: 'credits_10', label: '10 créditos', price: 'USD 15', icon: '⚡' },
  { id: 'credits_30', label: '30 créditos', price: 'USD 35', icon: '⚡⚡' },
  { id: 'credits_100', label: '100 créditos', price: 'USD 99', icon: '⚡⚡⚡' },
];

const PLANS = [
  { id: 'start', label: 'Start', price: 'USD 29/mes', users: '1 usuario', contracts: '5 contratos', queries: '20 consultas', credits: '2 créditos' },
  { id: 'pro', label: 'Pro', price: 'USD 79/mes', users: '5 usuarios', contracts: '25 contratos', queries: '100 consultas', credits: '10 créditos', popular: true },
  { id: 'enterprise', label: 'Enterprise', price: 'USD 199/mes', users: 'Ilimitados', contracts: 'Ilimitados', queries: 'Ilimitadas', credits: '30 créditos' },
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

  const handleUpgradePlan = async (priceId: string) => {
    try {
      const result = await api.billing.checkout({ priceId, mode: 'subscription' }) as any;
      if (result.url) window.location.href = result.url;
    } catch (error: any) {
      toast.error(error.message || 'Error al procesar suscripción');
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-xl font-bold text-slate-900 mb-6">Configuración</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit mb-6">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={clsx(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize',
              activeTab === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700',
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Perfil Tab */}
      {activeTab === 'perfil' && (
        <Card className="p-6">
          <h2 className="font-semibold text-slate-800 mb-4">Perfil personal</h2>
          <div className="space-y-4 max-w-sm">
            <Input
              label="Nombre completo"
              value={profileForm.fullName}
              onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
            />
            <div>
              <p className="text-sm text-slate-500 font-medium mb-1">Email</p>
              <p className="text-sm text-slate-700">{user?.email}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium mb-1">Rol</p>
              <Badge color="blue" className="capitalize">{user?.role}</Badge>
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium mb-1">Organización</p>
              <p className="text-sm text-slate-700">{tenant?.name}</p>
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
                    <h2 className="font-semibold text-slate-800 mb-1">Créditos de análisis</h2>
                    <p className="text-3xl font-bold text-blue-600">{wallet?.balance || 0} <span className="text-base text-slate-400 font-normal">créditos</span></p>
                  </div>
                  <span className="text-4xl">⚡</span>
                </div>
              </Card>

              {/* Credit Packs */}
              <div>
                <h3 className="font-semibold text-slate-700 mb-3">Comprar créditos</h3>
                <div className="grid grid-cols-3 gap-3">
                  {CREDIT_PACKS.map((pack) => (
                    <Card key={pack.id} className="p-4 text-center hover:border-blue-300 transition-colors">
                      <p className="text-2xl mb-2">{pack.icon}</p>
                      <p className="font-semibold text-slate-800">{pack.label}</p>
                      <p className="text-sm text-blue-600 font-medium my-1">{pack.price}</p>
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
                <h3 className="font-semibold text-slate-700 mb-3">
                  Plan actual: <span className="text-blue-600 capitalize">{tenant?.plan}</span>
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {PLANS.map((plan) => (
                    <Card
                      key={plan.id}
                      className={clsx(
                        'p-4 relative',
                        plan.popular && 'border-blue-400',
                        tenant?.plan === plan.id && 'bg-blue-50 border-blue-300',
                      )}
                    >
                      {plan.popular && (
                        <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                          Popular
                        </span>
                      )}
                      <h4 className="font-bold text-slate-800">{plan.label}</h4>
                      <p className="text-blue-600 font-semibold text-sm my-1">{plan.price}</p>
                      <ul className="text-xs text-slate-500 space-y-1 my-3">
                        <li>👤 {plan.users}</li>
                        <li>📄 {plan.contracts}/mes</li>
                        <li>💬 {plan.queries}/mes</li>
                        <li>⚡ {plan.credits}/mes</li>
                      </ul>
                      {tenant?.plan === plan.id ? (
                        <Badge color="green" className="w-full justify-center">Plan actual</Badge>
                      ) : (
                        <Button size="sm" fullWidth variant={plan.popular ? 'primary' : 'outline'}>
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
                  <h3 className="font-semibold text-slate-800 mb-3">Historial de créditos</h3>
                  <div className="space-y-2">
                    {transactions.slice(0, 10).map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                        <div>
                          <p className="text-sm text-slate-700">{tx.description}</p>
                          <p className="text-xs text-slate-400">{new Date(tx.created_at).toLocaleDateString('es-AR')}</p>
                        </div>
                        <span className={clsx('text-sm font-semibold', tx.amount > 0 ? 'text-green-600' : 'text-red-500')}>
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
            <h2 className="font-semibold text-slate-800">Equipo ({users.length})</h2>
          </div>
          <div className="space-y-2">
            {users.map((u) => (
              <div key={u.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-sm font-bold">
                  {u.full_name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{u.full_name}</p>
                  <p className="text-xs text-slate-400 truncate">{u.email}</p>
                </div>
                <Badge color={u.role === 'owner' ? 'blue' : 'slate'} className="capitalize">{u.role}</Badge>
                <Badge color={u.is_active ? 'green' : 'red'}>{u.is_active ? 'Activo' : 'Inactivo'}</Badge>
              </div>
            ))}
          </div>
          {tenant?.plan === 'start' && (
            <p className="text-xs text-slate-400 mt-4 text-center">
              Plan Start permite 1 usuario. Actualizá a Pro para agregar más.
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
