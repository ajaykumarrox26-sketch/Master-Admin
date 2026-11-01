import { useState, type FormEvent } from 'react';
import {
  Activity,
  ArrowLeft,
  ClipboardCheck,
  CreditCard,
  Eye,
  EyeOff,
  FileText,
  Headphones,
  Landmark,
  Lock,
  LogOut,
  Mail,
  Phone,
  ShieldCheck,
  ShieldAlert,
  Trash2,
  UserPlus,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { usePhoneAuth } from '@/lib/phoneAuth';
import { useI18n } from '@/lib/i18n';
import { adminApi } from '@/lib/api';
import { useLoader } from '@/lib/useLoader';
import { formatDateTime } from '@/lib/format';
import { Button, Card, Field, Modal, Notice, PageHeader, Spinner, Badge } from '@/components/ui';
import { PanApplicationForm } from '@/components/PanApplicationForm';
import { HelplineForm } from '@/components/HelplineForm';
import { ServiceApplicationSection } from '@/components/ServiceApplicationSection';
import { PanDetailButton } from '@/components/PanApplicationDetail';
import { PanAdminReview } from '@/components/PanAdminReview';
import { OtpLogin } from '@/components/OtpLogin';
import type { PanApplication, PanApplicationStatus } from '@/lib/types';

type PanTab = 'panForm' | 'myApplications' | 'helpline' | 'applyServices' | 'adminReview';

function panStatusTone(status: PanApplicationStatus): 'amber' | 'sky' | 'emerald' | 'rose' {
  if (status === 'submitted') return 'amber';
  if (status === 'in_review') return 'sky';
  if (status === 'completed') return 'emerald';
  return 'rose';
}

async function loadPanApplications() {
  return adminApi.panApplications();
}

type LoginTab = 'otp' | 'email';

function PanSignInGate() {
  const { t } = useI18n();
  const { signIn, signUp, sendPasswordReset } = useAuth();
  const { status: phoneStatus } = usePhoneAuth();
  const [loginTab, setLoginTab] = useState<LoginTab>('otp');
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const switchMode = (next: 'signin' | 'signup' | 'forgot') => {
    setMode(next);
    setError(null);
    setInfo(null);
    setPassword('');
    setConfirmPassword('');
  };

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

  const handleForgot = (e: FormEvent) => {
    e.preventDefault();
    void runAction(() => sendPasswordReset(email.trim()), () => setInfo(t.resetSent));
  };

  const features = [
    { icon: FileText, text: t.pan.loginFeature1 },
    { icon: Activity, text: t.pan.loginFeature2 },
    { icon: ShieldCheck, text: t.pan.loginFeature3 },
  ];

  if (loginTab === 'otp') {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
          <div className="flex justify-center">
            <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
              <button
                type="button"
                onClick={() => setLoginTab('otp')}
                className={`flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold transition ${
                  loginTab === 'otp' ? 'bg-teal-700 text-white' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Phone className="h-4 w-4" aria-hidden="true" />
                {t.pan.otpTab}
              </button>
              <button
                type="button"
                onClick={() => setLoginTab('email')}
                className={`flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold transition ${
                  loginTab === 'email' ? 'bg-teal-700 text-white' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Mail className="h-4 w-4" aria-hidden="true" />
                {t.pan.emailTab}
              </button>
            </div>
          </div>
        </div>
        <OtpLogin />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Left branding panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-teal-800 via-teal-900 to-slate-900 p-10 lg:flex lg:w-[44%] xl:w-[40%] xl:p-14">
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-teal-400/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-10 h-80 w-80 rounded-full bg-teal-500/10 blur-3xl" />

        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20 backdrop-blur-sm">
              <Landmark className="h-7 w-7 text-teal-200" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xl font-bold text-white">{t.pan.portalTitle}</p>
              <p className="text-sm text-teal-200">{t.pan.portalSubtitle}</p>
            </div>
          </div>
        </div>

        <div className="relative space-y-8">
          <h2 className="max-w-sm text-3xl font-bold leading-tight text-white">
            {t.pan.loginHeading}
          </h2>
          <ul className="space-y-5">
            {features.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/15">
                  <Icon className="h-4 w-4 text-teal-200" aria-hidden="true" />
                </span>
                <span className="pt-1.5 text-sm leading-relaxed text-teal-50">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative flex items-center gap-2 text-sm text-teal-200">
          <Lock className="h-4 w-4" aria-hidden="true" />
          {t.pan.loginSecurityNote}
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 flex-col">
        <div className="flex items-center justify-center gap-3 bg-gradient-to-r from-teal-800 to-teal-900 px-4 py-6 lg:hidden">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20">
            <Landmark className="h-6 w-6 text-teal-200" aria-hidden="true" />
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-white">{t.pan.portalTitle}</p>
            <p className="text-xs text-teal-200">{t.pan.portalSubtitle}</p>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center px-4 py-10">
          <div className="w-full max-w-md animate-fade-up">
            <div className="mb-5 flex justify-center">
              <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
                <button
                  type="button"
                  onClick={() => setLoginTab('otp')}
                  className={`flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold transition ${
                    loginTab === 'otp' ? 'bg-teal-700 text-white' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Phone className="h-4 w-4" aria-hidden="true" />
                  {t.pan.otpTab}
                </button>
                <button
                  type="button"
                  onClick={() => setLoginTab('email')}
                  className={`flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold transition ${
                    loginTab === 'email' ? 'bg-teal-700 text-white' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Mail className="h-4 w-4" aria-hidden="true" />
                  {t.pan.emailTab}
                </button>
              </div>
            </div>
            <div className="mb-7">
              <h1 className="text-2xl font-bold text-slate-900">
                {mode === 'signin' && t.pan.secureLogin}
                {mode === 'signup' && t.createAccount}
                {mode === 'forgot' && t.forgotPassword}
              </h1>
              <p className="mt-1.5 text-sm text-slate-600">
                {mode === 'signin' && t.pan.signInPrompt}
                {mode === 'signup' && t.pan.signUpPrompt}
                {mode === 'forgot' && t.pan.forgotPrompt}
              </p>
            </div>

            <div className="card-surface p-6 sm:p-8">
              {mode === 'signin' && (
                <form onSubmit={handleSignIn} className="space-y-5">
                  <Field label={t.email}>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                      <input className="field-input pl-10" type="email" autoComplete="username" required
                        value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                  </Field>
                  <Field label={t.password}>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                      <input className="field-input px-10" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required
                        value={password} onChange={(e) => setPassword(e.target.value)} />
                      <button type="button" onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}>
                        {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                      </button>
                    </div>
                  </Field>
                  {error && <Notice tone="rose">{error}</Notice>}
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                      <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-teal-700 focus:ring-teal-600" />
                      {t.pan.loginRememberMe}
                    </label>
                    <button type="button" onClick={() => switchMode('forgot')}
                      className="text-sm font-medium text-teal-700 transition hover:text-teal-800 hover:underline">
                      {t.pan.loginForgotPassword}
                    </button>
                  </div>
                  <Button type="submit" loading={busy} className="w-full">
                    {!busy && <Lock className="h-4 w-4" aria-hidden="true" />}
                    {busy ? t.signingIn : t.signIn}
                  </Button>
                  <p className="text-center text-sm text-slate-600">
                    {t.pan.newToPortal}{' '}
                    <button type="button" onClick={() => switchMode('signup')}
                      className="font-semibold text-teal-700 transition hover:text-teal-800 hover:underline">
                      {t.launcher.goCreateAccount}
                    </button>
                  </p>
                </form>
              )}

              {mode === 'signup' && (
                <form onSubmit={handleSignUp} className="space-y-5">
                  <Field label={t.email}>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                      <input className="field-input pl-10" type="email" autoComplete="username" required
                        value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                  </Field>
                  <Field label={t.password}>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                      <input className="field-input px-10" type={showPassword ? 'text' : 'password'} autoComplete="new-password" required
                        value={password} onChange={(e) => setPassword(e.target.value)} />
                      <button type="button" onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}>
                        {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                      </button>
                    </div>
                  </Field>
                  <Field label={t.confirmPassword}>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                      <input className="field-input pl-10" type={showPassword ? 'text' : 'password'} autoComplete="new-password" required
                        value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                    </div>
                  </Field>
                  {error && <Notice tone="rose">{error}</Notice>}
                  {info && <Notice tone="emerald">{info}</Notice>}
                  {!info && (
                    <Button type="submit" loading={busy} className="w-full">
                      {!busy && <UserPlus className="h-4 w-4" aria-hidden="true" />}
                      {busy ? t.creatingAccount : t.createAccount}
                    </Button>
                  )}
                  <button type="button" onClick={() => switchMode('signin')}
                    className="flex w-full items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium text-slate-700 transition hover:underline">
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                    {t.backToSignIn}
                  </button>
                </form>
              )}

              {mode === 'forgot' && (
                <form onSubmit={handleForgot} className="space-y-5">
                  <Field label={t.email}>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                      <input className="field-input pl-10" type="email" autoComplete="username" required
                        value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                  </Field>
                  {error && <Notice tone="rose">{error}</Notice>}
                  {info && <Notice tone="emerald">{info}</Notice>}
                  <Button type="submit" loading={busy} className="w-full">
                    {!busy && <Mail className="h-4 w-4" aria-hidden="true" />}
                    {t.sendResetLink}
                  </Button>
                  <button type="button" onClick={() => switchMode('signin')}
                    className="flex w-full items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium text-slate-700 transition hover:underline">
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                    {t.backToSignIn}
                  </button>
                </form>
              )}
            </div>

            <p className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500">
              <Lock className="h-3.5 w-3.5" aria-hidden="true" />
              {t.pan.loginSecurityNote}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MyApplicationsSection() {
  const { t } = useI18n();
  const { data, error, loading, reload } = useLoader(loadPanApplications);
  const applications = data ?? [];
  const [removeError, setRemoveError] = useState<string | null>(null);

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
                      <div className="flex items-center gap-1">
                        <PanDetailButton app={app} label={t.pan.viewDetail} />
                        <button
                          onClick={() => void handleRemove(app)}
                          className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                          aria-label={t.pan.remove}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
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
  const { status: phoneStatus, phoneNumber, signOut: phoneSignOut } = usePhoneAuth();
  const [tab, setTab] = useState<PanTab>('panForm');

  const phoneAuthenticated = phoneStatus === 'authenticated';

  if (status === 'loading' || phoneStatus === 'loading') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50 text-sm text-slate-600">
        <Spinner />
        <p>{t.common.loading}</p>
      </div>
    );
  }

  if (status !== 'admin' && !phoneAuthenticated) {
    return <PanSignInGate />;
  }

  const isAdmin = profile?.role === 'owner' || profile?.role === 'admin';
  const displayName = profile?.displayName || profile?.email || phoneNumber || '';
  const handleSignOut = phoneAuthenticated ? phoneSignOut : signOut;

  const isAdmin = profile?.role === 'owner' || profile?.role === 'admin';

  const tabs: { key: PanTab; label: string; icon: typeof CreditCard }[] = [
    { key: 'panForm', label: t.pan.tabs.panForm, icon: CreditCard },
    { key: 'myApplications', label: t.pan.tabs.myApplications, icon: FileText },
    { key: 'helpline', label: t.pan.tabs.helpline, icon: Headphones },
    { key: 'applyServices', label: t.pan.tabs.applyServices, icon: ClipboardCheck },
    ...(isAdmin
      ? [{ key: 'adminReview' as PanTab, label: t.pan.tabsAdmin, icon: ShieldAlert }]
      : []),
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-teal-300">
              <Landmark className="h-6 w-6" aria-hidden="true" />
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
              <p className="text-xs font-medium text-slate-700">{displayName}</p>
              <p className="text-xs text-slate-500">{profile?.email || phoneNumber}</p>
            </div>
            <button
              onClick={() => void handleSignOut()}
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

        {tab === 'adminReview' && isAdmin && (
          <div className="animate-fade-up">
            <PanAdminReview />
          </div>
        )}
      </main>
    </div>
  );
}
