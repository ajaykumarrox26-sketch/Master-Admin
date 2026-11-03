import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  Check,
  ChevronDown,
  LogOut,
  Mail,
  Shield,
  Pencil,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { Button, Field, Notice } from '@/components/ui';

const roleLabels: Record<string, { en: string; hi: string }> = {
  owner: { en: 'Owner', hi: 'स्वामी' },
  admin: { en: 'Admin', hi: 'एडमिन' },
  support: { en: 'Support', hi: 'सहायता' },
  viewer: { en: 'Viewer', hi: 'दर्शक' },
};

export function UserProfileMenu() {
  const { t, lang } = useI18n();
  const { profile, signOut, updateProfile } = useAuth();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('mousedown', onClick);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onClick);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!profile) return null;

  const initials = (profile.displayName || profile.email || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? '')
    .join('') || '?';

  const roleLabel = roleLabels[profile.role]?.[lang] ?? profile.role;

  const startEdit = () => {
    setDisplayName(profile.displayName);
    setError(null);
    setSuccess(false);
    setEditing(true);
  };

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = displayName.trim();
    if (!trimmed) {
      setError(lang === 'hi' ? 'कृपया नाम दर्ज करें।' : 'Please enter a name.');
      return;
    }
    setSaving(true);
    setError(null);
    void (async () => {
      try {
        await updateProfile(trimmed);
        setSuccess(true);
        setEditing(false);
        setTimeout(() => setSuccess(false), 3000);
      } catch (err) {
        setError(err instanceof Error ? err.message : t.common.error);
      } finally {
        setSaving(false);
      }
    })();
  };

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition hover:bg-slate-100"
        aria-label={t.pan.profileMenu}
        aria-expanded={open}
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-700 text-xs font-bold text-white">
          {initials}
        </span>
        <span className="hidden text-left sm:block">
          <span className="block text-xs font-semibold text-slate-800">{profile.displayName}</span>
          <span className="block text-[10px] text-slate-500">{roleLabel}</span>
        </span>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-30 mt-2 w-72 origin-top-right rounded-xl border border-slate-200 bg-white shadow-lg animate-fade-up">
          <div className="border-b border-slate-100 p-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-700 text-sm font-bold text-white">
                {initials}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">{profile.displayName}</p>
                <p className="flex items-center gap-1 truncate text-xs text-slate-500">
                  <Mail className="h-3 w-3 shrink-0" aria-hidden="true" />
                  {profile.email}
                </p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
              <Shield className="h-3.5 w-3.5 text-teal-700" aria-hidden="true" />
              <span className="font-medium text-slate-700">{t.pan.profileRole}:</span>
              <span className="font-semibold text-teal-800">{roleLabel}</span>
            </div>
          </div>

          {success && (
            <div className="px-4 pt-3">
              <Notice tone="emerald">{t.pan.profileSaved}</Notice>
            </div>
          )}

          {editing ? (
            <form onSubmit={handleSave} className="space-y-3 p-4">
              <Field label={t.pan.profileDisplayName}>
                <input
                  className="field-input"
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder={t.pan.profileDisplayNamePlaceholder}
                  autoFocus
                />
              </Field>
              {error && <Notice tone="rose">{error}</Notice>}
              <div className="flex gap-2">
                <Button type="submit" loading={saving} className="flex-1">
                  {!saving && <Check className="h-4 w-4" aria-hidden="true" />}
                  {saving ? t.pan.profileSaving : t.pan.profileSave}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => { setEditing(false); setError(null); }}
                >
                  {t.pan.profileCancel}
                </Button>
              </div>
            </form>
          ) : (
            <div className="p-2">
              <button
                type="button"
                onClick={startEdit}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <Pencil className="h-4 w-4 text-slate-400" aria-hidden="true" />
                {t.pan.profileEditName}
              </button>
              <button
                type="button"
                onClick={() => { setOpen(false); void signOut(); }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-rose-700 transition hover:bg-rose-50"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                {t.pan.profileSignOut}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
