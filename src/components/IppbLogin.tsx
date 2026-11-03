import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Lock,
  Mail,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth, firebaseConfigured } from '@/lib/firebase';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { Button, Field, Notice } from '@/components/ui';
import { generateCaptchaText, drawCaptcha } from '@/lib/captcha';

type IppbMode = 'signin' | 'forgot';

function firebaseAuthError(err: unknown): string {
  const code = (err as { code?: string })?.code ?? '';
  const map: Record<string, string> = {
    'auth/invalid-email': 'The email address is not valid.',
    'auth/user-disabled': 'This account has been disabled.',
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'The password is incorrect.',
    'auth/invalid-credential': 'The email or password is incorrect.',
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/weak-password': 'The password is too weak. Use at least 8 characters.',
    'auth/too-many-requests': 'Too many attempts. Please try again later.',
    'auth/network-request-failed': 'Network error. Please check your connection.',
    'auth/operation-not-allowed': 'Email/password sign-in is not enabled in Firebase.',
  };
  return map[code] ?? (err instanceof Error ? err.message : 'An unexpected error occurred.');
}

export function IppbLogin() {
  const { t } = useI18n();
  const { signIn: supabaseSignIn, sendPasswordReset } = useAuth();

  const [mode, setMode] = useState<IppbMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const captchaTextRef = useRef<string>('');

  const refreshCaptcha = useCallback(() => {
    const text = generateCaptchaText(6);
    captchaTextRef.current = text;
    if (canvasRef.current) {
      drawCaptcha(canvasRef.current, text);
    }
  }, []);

  useEffect(() => {
    refreshCaptcha();
  }, [refreshCaptcha, mode]);

  const switchMode = (next: IppbMode) => {
    setMode(next);
    setError(null);
    setInfo(null);
    setPassword('');
    setCaptchaInput('');
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
    if (!email.trim()) { setError('Please enter your email address.'); return; }
    if (!password) { setError('Please enter your password.'); return; }
    if (captchaInput.trim().toUpperCase() !== captchaTextRef.current.toUpperCase()) {
      setError(t.pan.ippbCaptchaMismatch);
      refreshCaptcha();
      setCaptchaInput('');
      return;
    }

    void runAction(async () => {
      if (firebaseConfigured && auth) {
        try {
          await signInWithEmailAndPassword(auth, email.trim(), password);
        } catch (err) {
          throw new Error(firebaseAuthError(err));
        }
      }
      await supabaseSignIn(email.trim(), password, rememberMe);
    });
  };

  const handleForgot = (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError('Please enter your email address.'); return; }
    if (captchaInput.trim().toUpperCase() !== captchaTextRef.current.toUpperCase()) {
      setError(t.pan.ippbCaptchaMismatch);
      refreshCaptcha();
      setCaptchaInput('');
      return;
    }

    void runAction(async () => {
      if (firebaseConfigured && auth) {
        try {
          await sendPasswordResetEmail(auth, email.trim());
        } catch (err) {
          throw new Error(firebaseAuthError(err));
        }
      } else {
        await sendPasswordReset(email.trim());
      }
    }, () => setInfo(t.resetSent));
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-slate-50 to-teal-50 px-4 py-8">
      <div className="w-full max-w-md animate-fade-up">

        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-700 text-white shadow-lg ring-1 ring-teal-600/20">
            <Lock className="h-8 w-8" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{t.pan.ippbTitle}</h1>
          <p className="mt-1.5 text-sm text-slate-600">{t.pan.ippbSubtitle}</p>
        </div>

        <div className="card-surface p-6 sm:p-8">

          {mode === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-5">
              <Field label={t.pan.ippbEmailAddress}>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                  <input
                    className="field-input pl-10"
                    type="email"
                    autoComplete="username"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t.pan.ippbEmailPlaceholder}
                  />
                </div>
              </Field>

              <Field label={t.pan.ippbPassword}>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                  <input
                    className="field-input px-10"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t.pan.ippbPasswordPlaceholder}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                  </button>
                </div>
              </Field>

              <Field label={t.pan.ippbTextVerification}>
                <div className="flex items-stretch gap-2">
                  <canvas
                    ref={canvasRef}
                    width={180}
                    height={50}
                    className="rounded-lg border border-slate-300 bg-slate-50"
                    aria-label="Captcha image"
                  />
                  <button
                    type="button"
                    onClick={() => { refreshCaptcha(); setCaptchaInput(''); }}
                    className="flex shrink-0 items-center justify-center rounded-lg border border-slate-300 px-3 text-slate-500 transition hover:bg-slate-50 hover:text-teal-700"
                    aria-label={t.pan.ippbRefreshCaptcha}
                    title={t.pan.ippbRefreshCaptcha}
                  >
                    <RefreshCw className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
                <input
                  className="field-input mt-2"
                  type="text"
                  required
                  value={captchaInput}
                  onChange={(e) => setCaptchaInput(e.target.value.toUpperCase())}
                  placeholder={t.pan.ippbCaptchaPlaceholder}
                  autoCapitalize="characters"
                  autoCorrect="off"
                  spellCheck={false}
                />
              </Field>

              {error && <Notice tone="rose">{error}</Notice>}
              {info && <Notice tone="emerald">{info}</Notice>}

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-teal-700 focus:ring-teal-600"
                  />
                  {t.pan.ippbRememberMe}
                </label>
                <button
                  type="button"
                  onClick={() => switchMode('forgot')}
                  className="text-sm font-medium text-teal-700 transition hover:text-teal-800 hover:underline"
                >
                  {t.pan.ippbForgotPassword}
                </button>
              </div>

              <Button type="submit" loading={busy} className="w-full">
                {!busy && <ShieldCheck className="h-4 w-4" aria-hidden="true" />}
                {busy ? t.pan.ippbSigningIn : t.pan.ippbSignIn}
              </Button>
            </form>
          )}

          {mode === 'forgot' && (
            <form onSubmit={handleForgot} className="space-y-5">
              <Field label={t.pan.ippbEmailAddress}>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                  <input
                    className="field-input pl-10"
                    type="email"
                    autoComplete="username"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t.pan.ippbEmailPlaceholder}
                  />
                </div>
              </Field>

              <Field label={t.pan.ippbTextVerification}>
                <div className="flex items-stretch gap-2">
                  <canvas
                    ref={canvasRef}
                    width={180}
                    height={50}
                    className="rounded-lg border border-slate-300 bg-slate-50"
                    aria-label="Captcha image"
                  />
                  <button
                    type="button"
                    onClick={() => { refreshCaptcha(); setCaptchaInput(''); }}
                    className="flex shrink-0 items-center justify-center rounded-lg border border-slate-300 px-3 text-slate-500 transition hover:bg-slate-50 hover:text-teal-700"
                    aria-label={t.pan.ippbRefreshCaptcha}
                    title={t.pan.ippbRefreshCaptcha}
                  >
                    <RefreshCw className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
                <input
                  className="field-input mt-2"
                  type="text"
                  required
                  value={captchaInput}
                  onChange={(e) => setCaptchaInput(e.target.value.toUpperCase())}
                  placeholder={t.pan.ippbCaptchaPlaceholder}
                  autoCapitalize="characters"
                  autoCorrect="off"
                  spellCheck={false}
                />
              </Field>

              {error && <Notice tone="rose">{error}</Notice>}
              {info && <Notice tone="emerald">{info}</Notice>}

              <Button type="submit" loading={busy} className="w-full">
                {!busy && <Mail className="h-4 w-4" aria-hidden="true" />}
                {t.sendResetLink}
              </Button>

              <button
                type="button"
                onClick={() => switchMode('signin')}
                className="flex w-full items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium text-slate-700 transition hover:underline"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                {t.pan.ippbBackToSignIn}
              </button>
            </form>
          )}
        </div>

        <p className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500">
          <Lock className="h-3.5 w-3.5" aria-hidden="true" />
          {t.pan.loginSecurityNote}
        </p>

        {!firebaseConfigured && (
          <p className="mt-3 text-center text-xs text-slate-400">
            Firebase not configured — using database authentication.
          </p>
        )}
      </div>
    </div>
  );
}
