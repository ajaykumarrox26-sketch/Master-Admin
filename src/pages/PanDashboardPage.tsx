import { useState, type FormEvent } from 'react';
import {
  ClipboardCheck,
  CreditCard,
  FileText,
  Headphones,
  LogOut,
  Trash2,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { adminApi } from '@/lib/api';
import { useLoader } from '@/lib/useLoader';
import { formatDateTime } from '@/lib/format';
import { Button, Card, Field, Notice, PageHeader, Spinner, Badge } from '@/components/ui';
import { PanApplicationForm } from '@/components/PanApplicationForm';
import { HelplineForm } from '@/components/HelplineForm';
import { ServiceApplicationSection } from '@/components/ServiceApplicationSection';
import type { PanApplication, PanApplicationStatus } from '@/lib/types';

type PanTab = 'panForm' | 'myApplications' | 'helpline' | 'applyServices';

function panStatusTone(status: PanApplicationStatus): 'amber' | 'sky' | 'emerald' | 'rose' {
  if (status === 'submitted') return 'amber';
  if (status === 'in_review') return 'sky';
  if (status === 'completed') return 'emerald';
  return 'rose';
}

async function loadPanApplications() {
  return adminApi.panApplications();
}

function PanSignInGate() {
  const { t } = useI18n();
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const runAction = async (action: () => Promise<void>, onSuccess?: () => void) => {
    setBusy(true);
    setError(null);
    try {
      await action();
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.common.error);
    } finally {
      setBusy(false);
    }
  };

  const handleSignIn = (e: FormEvent) => {
    e.preventDefault();
    void runAction(() => signIn(email.trim(), password));
  };

  const handleSignUp = (e: FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) { setError(t.passwordMismatch); return; }
    if (password.length < 10) { setError(t.passwordTooShort); return; }
    void runAction(
      () => signUp(email.trim(), password),
      () => {
        setPassword('');
        setConfirmPassword('');
        setInfo(t.accountCreated);
      },
    );
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-teal-50 to-slate-100 px-4 py-10">
      <div className="w-full max-w-md animate-fade-up">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 text-teal-300 shadow-lg">
            <CreditCard className="h-8 w-8" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{t.pan.portalTitle}</h1>
          <p className="mt-2 text-sm text-slate-600">{t.pan.signInPrompt}</p>
        </div>

        <div className="card-surface p-6 sm:p-8">
          {mode === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-5">
              <Field label={t.email}>
                <input className="field-input" type="email" autoComplete="username" required
                  value={email} onChange={(e) => setEmail(e.target.value)} />
              </Field>
              <Field label={t.password}>
                <input className="field-input" type="password" autoComplete="current-password" required
                  value={password} onChange={(e) => setPassword(e.target.value)} />
              </Field>
              {error && <Notice tone="rose">{error}</Notice>}
              <Button type="submit" loading={busy} className="w-full">
                {busy ? t.signingIn : t.signIn}
              </Button>
              <button type="button"
                onClick={() => { setMode('signup'); setError(null); setInfo(null); }}
                className="w-full text-center text-sm font-medium text-teal-800 hover:underline">
                {t.launcher.noAccount} {t.launcher.goCreateAccount}
              </button>
            </form>
          )}

          {mode === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-5">
              <Field label={t.email}>
                <input className="field-input" type="email" autoComplete="username" required
                  value={email} onChange={(e) => setEmail(e.target.value)} />
              </Field>
              <Field label={t.password}>
                <input className="field-input" type="password" autoComplete="new-password" required
                  value={password} onChange={(e) => setPassword(e.target.value)} />
              </Field>
              <Field label={t.confirmPassword}>
                <input className="field-input" type="password" autoComplete="new-password" required
                  value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              </Field>
              {error && <Notice tone="rose">{error}</Notice>}
              {info && <Notice tone="emerald">{info}</Notice>}
              {!info && (
                <Button type="submit" loading={busy} className="w-full">
                  {busy ? t.creatingAccount : t.createAccount}
                </Button>
              )}
              <button type="button"
                onClick={() => { setMode('signin'); setError(null); setInfo(null); }}
                className="w-full text-center text-sm font-medium text-slate-700 hover:underline">
                {t.backToSignIn}
              </button>
            </form>
          )}
        </div>

        <p className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
          {t.pan.portalSubtitle}
        </p>
      </div>
    </div>
  );
}

function MyApplicationsSection() {
  const { t } = useI18n();
  const { data, error, loading, reload } = useLoader(loadPanApplications);
  const applications = data ?? [];

  const typeLabel = (type: string) => {
    if (type === 'new') return t.pan.typeNew;
    if (type === 'correction') return t.pan.typeCorrection;
    return t.pan.typeReprint;
  };

  const handleRemove = async (app: PanApplication) => {
    if (!window.confirm(t.pan.removeConfirm)) return;
    setRemoveError(null);
    try {
      await adminApi.removePanApplication(app.id);
      reload();
    } catch (err) {
      setRemoveError(err instanceof Error ? err.message : t.common.error);
    }
  };

  const [removeError, setRemoveError] = useState<string | null>(null);

  return (
    <div>
      <PageHeader title={t.pan.myApplicationsTitle} subtitle={t.pan.myApplicationsSubtitle} />

      {error && <Notice tone="rose">{error}</Notice>}
      {removeError && <Notice tone="rose">{removeError}</Notice>}
      {loading && <Spinner />}

      {!loading && applications.length === 0 && !error && (
        <Card className="p-10 text-center text-sm text-slate-500">{t.pan.empty}</Card>
      )}

      {applications.length > 0 && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="table-cell font-semibold text-slate-700">{t.pan.refNo}</th>
                  <th className="table-cell font-semibold text-slate-700">{t.pan.applicantName}</th>
                  <th className="table-cell font-semibold text-slate-700">{t.pan.appType}</th>
                  <th className="table-cell font-semibold text-slate-700">{t.pan.appStatus}</th>
                  <th className="table-cell font-semibold text-slate-700">{t.pan.submittedOn}</th>
                  <th className="table-cell" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {applications.map((app) => (
                  <tr key={app.id} className="transition hover:bg-slate-50">
                    <td className="table-cell font-mono text-xs font-semibold text-slate-900">
                      {app.reference_number}
                    </td>
                    <td className="table-cell text-slate-700">
                      {app.first_name} {app.last_name}
                    </td>
                    <td className="table-cell text-slate-600">{typeLabel(app.application_type)}</td>
                    <td className="table-cell">
                      <Badge tone={panStatusTone(app.status)}>
                        {t.pan.statusLabels[app.status]}
                      </Badge>
                    </td>
                    <td className="table-cell whitespace-nowrap text-slate-600">
                      {formatDateTime(app.created_at)}
                    </td>
                    <td className="table-cell">
                      <button
                        onClick={() => void handleRemove(app)}
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                        aria-label={t.pan.remove}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

export function PanDashboardPage() {
  const { t, lang, setLang } = useI18n();
  const { profile, status, signOut } = useAuth();
  const [tab, setTab] = useState<PanTab>('panForm');

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50 text-sm text-slate-600">
        <Spinner />
        <p>{t.common.loading}</p>
      </div>
    );
  }

  if (status !== 'admin') {
    return <PanSignInGate />;
  }

  const tabs: { key: PanTab; label: string; icon: typeof CreditCard }[] = [
    { key: 'panForm', label: t.pan.tabs.panForm, icon: CreditCard },
    { key: 'myApplications', label: t.pan.tabs.myApplications, icon: FileText },
    { key: 'helpline', label: t.pan.tabs.helpline, icon: Headphones },
    { key: 'applyServices', label: t.pan.tabs.applyServices, icon: ClipboardCheck },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-teal-300">
              <CreditCard className="h-6 w-6" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-bold text-slate-900">{t.pan.portalTitle}</p>
              <p className="text-xs text-slate-500">{t.pan.portalSubtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
              className="flex min-h-[44px] items-center gap-2 rounded-lg border border-slate-300 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              {t.common.language}
            </button>
            <div className="hidden text-right sm:block">
              <p className="text-xs font-medium text-slate-700">{profile?.displayName || profile?.email}</p>
              <p className="text-xs text-slate-500">{profile?.email}</p>
            </div>
            <button
              onClick={() => void signOut()}
              className="flex min-h-[44px] items-center gap-2 rounded-lg px-3 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">{t.signOut}</span>
            </button>
          </div>
        </div>

        <div className="mx-auto max-w-6xl overflow-x-auto px-4 sm:px-6">
          <div role="tablist" className="flex gap-1 pb-2">
            {tabs.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                role="tab"
                type="button"
                aria-selected={tab === key}
                onClick={() => setTab(key)}
                className={`flex min-h-[44px] items-center gap-2 rounded-lg px-4 text-sm font-semibold transition duration-200 ${
                  tab === key
                    ? 'bg-teal-700 text-white shadow-sm'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-900">
          {t.pan.demoNotice}
        </div>

        {tab === 'panForm' && (
          <div className="card-surface p-6 sm:p-8 animate-fade-up">
            <PanApplicationForm />
          </div>
        )}

        {tab === 'myApplications' && (
          <div className="animate-fade-up">
            <MyApplicationsSection />
          </div>
        )}

        {tab === 'helpline' && (
          <div className="animate-fade-up">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-900">{t.site.helplineTitle}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{t.site.helplineBody}</p>
            </div>
            <div className="card-surface p-6 sm:p-8">
              <HelplineForm />
            </div>
          </div>
        )}

        {tab === 'applyServices' && (
          <div className="animate-fade-up">
            <ServiceApplicationSection />
          </div>
        )}
      </main>
    </div>
  );
}
