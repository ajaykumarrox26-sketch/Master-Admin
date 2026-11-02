import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  ArrowLeft,
  Activity,
  FileText,
  Landmark,
  Lock,
  Phone,
  RefreshCw,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { usePhoneAuth } from '@/lib/phoneAuth';
import { Button, Field, Notice } from '@/components/ui';

const RESEND_COOLDOWN = 30;

function normalizePhone(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith('+')) return trimmed.replace(/\s/g, '');
  return `+${trimmed.replace(/[^\d]/g, '')}`;
}

function isValidPhone(raw: string): boolean {
  const normalized = normalizePhone(raw);
  return /^\+\d{10,15}$/.test(normalized);
}

export function OtpLogin() {
  const { t } = useI18n();
  const { sendOtp, verifyOtp, resendOtp, resetOtp, status, phoneNumber, isConfigured } = usePhoneAuth();
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);
  const otpInputRef = useRef<HTMLInputElement | null>(null);

  const otpSent = status === 'otp_sent';

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = window.setTimeout(() => setResendIn((n) => n - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [resendIn]);

  useEffect(() => {
    if (otpSent && otpInputRef.current) {
      otpInputRef.current.focus();
    }
  }, [otpSent]);

  const runAction = async (action: () => Promise<void>, onSuccess?: () => void) => {
    setBusy(true);
    setError(null);
    try {
      await action();
      onSuccess?.();
    } catch (err) {
      const msg = err instanceof Error ? err.message : t.common.error;
      if (msg.toLowerCase().includes('invalid') && msg.toLowerCase().includes('verification')) {
        setError(t.pan.otpInvalid);
      } else {
        setError(msg);
      }
    } finally {
      setBusy(false);
    }
  };

  const handleSendOtp = (e: FormEvent) => {
    e.preventDefault();
    if (!isValidPhone(mobile)) {
      setError(t.pan.mobileInvalid);
      return;
    }
    setResendIn(RESEND_COOLDOWN);
    void runAction(
      () => sendOtp(normalizePhone(mobile)),
      () => setInfo(t.pan.otpSent),
    );
  };

  const handleVerifyOtp = (e: FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(otp.trim())) {
      setError(t.pan.otpCodeInvalid);
      return;
    }
    void runAction(() => verifyOtp(otp.trim()));
  };

  const handleResend = () => {
    setOtp('');
    setResendIn(RESEND_COOLDOWN);
    void runAction(
      () => resendOtp(),
      () => setInfo(t.pan.otpSent),
    );
  };

  const handleChangeNumber = () => {
    resetOtp();
    setMobile('');
    setOtp('');
    setError(null);
    setInfo(null);
    setResendIn(0);
  };

  const features = [
    { icon: FileText, text: t.pan.loginFeature1 },
    { icon: Activity, text: t.pan.loginFeature2 },
    { icon: ShieldCheck, text: t.pan.loginFeature3 },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50">
      <div id="recaptcha-container" className="fixed bottom-4 right-4 z-50" />

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
            <div className="mb-7">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-700 text-white shadow-lg">
                <Smartphone className="h-6 w-6" aria-hidden="true" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900">{t.pan.mobileLoginTitle}</h1>
              <p className="mt-1.5 text-sm text-slate-600">{t.pan.mobileLoginSubtitle}</p>
            </div>

            {!isConfigured && (
              <div className="mb-5">
                <Notice tone="amber">{t.pan.firebaseNotConfigured}</Notice>
              </div>
            )}

            <div className="card-surface p-6 sm:p-8">
              {!otpSent && (
                <form onSubmit={handleSendOtp} className="space-y-5">
                  <Field label={t.pan.mobileNumber}>
                    <div className="relative">
                      <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                      <input
                        className="field-input pl-10"
                        type="tel"
                        autoComplete="tel"
                        required
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value)}
                        placeholder={t.pan.mobilePlaceholder}
                      />
                    </div>
                  </Field>
                  {error && <Notice tone="rose">{error}</Notice>}
                  {info && <Notice tone="emerald">{info}</Notice>}
                  <Button type="submit" loading={busy} className="w-full" disabled={!isConfigured}>
                    {!busy && <Phone className="h-4 w-4" aria-hidden="true" />}
                    {busy ? t.pan.sendingOtp : t.pan.sendOtp}
                  </Button>
                </form>
              )}

              {otpSent && (
                <form onSubmit={handleVerifyOtp} className="space-y-5">
                  <div className="rounded-xl bg-teal-50 px-4 py-3 ring-1 ring-inset ring-teal-600/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-teal-700" aria-hidden="true" />
                        <span className="text-sm font-semibold text-teal-900">{phoneNumber}</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleChangeNumber}
                        className="text-sm font-medium text-teal-700 transition hover:text-teal-800 hover:underline"
                      >
                        {t.pan.changeNumber}
                      </button>
                    </div>
                  </div>

                  <Field label={t.pan.enterOtp}>
                    <input
                      ref={otpInputRef}
                      className="field-input tracking-[0.5em] text-center text-lg font-semibold"
                      type="text"
                      inputMode="numeric"
                      pattern="\d{6}"
                      maxLength={6}
                      required
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder={t.pan.otpPlaceholder}
                    />
                  </Field>
                  {error && <Notice tone="rose">{error}</Notice>}
                  {info && <Notice tone="emerald">{info}</Notice>}
                  <Button type="submit" loading={busy} className="w-full">
                    {!busy && <ShieldCheck className="h-4 w-4" aria-hidden="true" />}
                    {busy ? t.pan.verifyingOtp : t.pan.verifyOtp}
                  </Button>

                  <div className="flex items-center justify-center">
                    {resendIn > 0 ? (
                      <span className="text-sm text-slate-500">
                        {t.pan.resendOtpIn} {resendIn}s
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResend}
                        disabled={busy}
                        className="flex items-center gap-1.5 text-sm font-medium text-teal-700 transition hover:text-teal-800 hover:underline disabled:opacity-50"
                      >
                        <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                        {t.pan.resendOtp}
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleChangeNumber}
                    className="flex w-full items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium text-slate-700 transition hover:underline"
                  >
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                    {t.pan.changeNumber}
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
