import { useMemo, useState, type FormEvent } from 'react';
import {
  ArrowLeft,
  ArrowDownCircle,
  ArrowUpCircle,
  Banknote,
  CheckCircle2,
  CreditCard,
  Link2,
  LogIn,
  Plus,
  Smartphone,
  Trash2,
  Wallet,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { adminApi } from '@/lib/api';
import { useLoader } from '@/lib/useLoader';
import { formatInr, formatDateTime } from '@/lib/format';
import { Button, Card, Field, Modal, Notice, PageHeader, Spinner, Badge } from '@/components/ui';
import type {
  AccountTransaction,
  LinkedAccount,
  LinkedAccountProvider,
  LinkedAccountStatus,
  TransactionType,
} from '@/lib/types';

type LauncherView = 'hub' | 'login' | 'linking' | 'transactions';

const PROVIDER_ICONS: Record<LinkedAccountProvider, typeof Banknote> = {
  bank: Banknote,
  wallet: Wallet,
  upi: Smartphone,
  card: CreditCard,
};

const PROVIDERS: LinkedAccountProvider[] = ['bank', 'wallet', 'upi', 'card'];

function statusTone(status: LinkedAccountStatus): 'emerald' | 'amber' | 'rose' | 'slate' {
  if (status === 'active') return 'emerald';
  if (status === 'unverified') return 'amber';
  return 'rose';
}

function txStatusTone(status: AccountTransaction['status']): 'emerald' | 'amber' | 'rose' {
  if (status === 'completed') return 'emerald';
  if (status === 'pending') return 'amber';
  return 'rose';
}

async function loadLauncherData() {
  const [accounts, transactions] = await Promise.all([
    adminApi.linkedAccounts(),
    adminApi.transactions(),
  ]);
  return { accounts, transactions };
}

function LauncherHub({ onSelect }: { onSelect: (view: LauncherView) => void }) {
  const { t } = useI18n();

  const options: { view: LauncherView; icon: typeof LogIn; title: string; body: string }[] = [
    { view: 'login', icon: LogIn, title: t.launcher.userLogin, body: t.launcher.userLoginBody },
    { view: 'linking', icon: Link2, title: t.launcher.accountLinking, body: t.launcher.accountLinkingBody },
    { view: 'transactions', icon: ArrowDownCircle, title: t.launcher.transactions, body: t.launcher.transactionsBody },
  ];

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <div className="w-full max-w-2xl animate-fade-up">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900">{t.launcher.title}</h1>
          <p className="mt-2 text-sm text-slate-600">{t.launcher.subtitle}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {options.map(({ view, icon: Icon, title, body }) => (
            <button
              key={view}
              onClick={() => onSelect(view)}
              className="group flex flex-col items-start gap-3 rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition duration-200 hover:-translate-y-1 hover:border-teal-400 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-700 transition group-hover:bg-teal-700 group-hover:text-white">
                <Icon className="h-6 w-6" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-base font-semibold text-slate-900">{title}</h2>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">{body}</p>
              </div>
              <span className="mt-auto text-sm font-medium text-teal-700 group-hover:underline">
                {t.launcher.open}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function LoginSection() {
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
    if (password !== confirmPassword) {
      setError(t.passwordMismatch);
      return;
    }
    if (password.length < 10) {
      setError(t.passwordTooShort);
      return;
    }
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
    <div className="mx-auto max-w-md">
      <div className="mb-6 text-center">
        <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-teal-700 text-white shadow-sm">
          <LogIn className="h-6 w-6" aria-hidden="true" />
        </span>
        <h2 className="text-xl font-bold text-slate-900">{t.launcher.loginTitle}</h2>
        <p className="mt-1 text-sm text-slate-600">{t.launcher.loginBody}</p>
      </div>

      <Card className="p-6 sm:p-8">
        {mode === 'signin' && (
          <form onSubmit={handleSignIn} className="space-y-5">
            <Field label={t.email}>
              <input
                className="field-input"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
            <Field label={t.password}>
              <input
                className="field-input"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>
            {error && <Notice tone="rose">{error}</Notice>}
            <Button type="submit" loading={busy} className="w-full">
              {busy ? t.signingIn : t.signIn}
            </Button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setError(null); setInfo(null); }}
              className="w-full text-center text-sm font-medium text-teal-800 hover:underline"
            >
              {t.launcher.noAccount} {t.launcher.goCreateAccount}
            </button>
          </form>
        )}

        {mode === 'signup' && (
          <form onSubmit={handleSignUp} className="space-y-5">
            <Field label={t.email}>
              <input
                className="field-input"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
            <Field label={t.password}>
              <input
                className="field-input"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>
            <Field label={t.confirmPassword}>
              <input
                className="field-input"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </Field>
            {error && <Notice tone="rose">{error}</Notice>}
            {info && <Notice tone="emerald">{info}</Notice>}
            {!info && (
              <Button type="submit" loading={busy} className="w-full">
                {busy ? t.creatingAccount : t.createAccount}
              </Button>
            )}
            <button
              type="button"
              onClick={() => { setMode('signin'); setError(null); setInfo(null); }}
              className="w-full text-center text-sm font-medium text-slate-700 hover:underline"
            >
              {t.backToSignIn}
            </button>
          </form>
        )}
      </Card>
    </div>
  );
}

function LinkingSection() {
  const { t } = useI18n();
  const { data, error, loading, reload } = useLoader(loadLauncherData);
  const [modalOpen, setModalOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [provider, setProvider] = useState<LinkedAccountProvider>('bank');
  const [ref, setRef] = useState('');
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const accounts = data?.accounts ?? [];

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!label.trim()) { setFormError(t.launcher.invalidLabel); return; }
    if (!ref.trim()) { setFormError(t.launcher.invalidRef); return; }
    setBusy(true);
    try {
      await adminApi.addLinkedAccount({
        account_label: label.trim(),
        provider,
        account_ref: ref.trim(),
      });
      setSuccess(t.launcher.addSuccess);
      setLabel(''); setRef(''); setProvider('bank');
      setModalOpen(false);
      reload();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t.common.error);
    } finally {
      setBusy(false);
    }
  };

  const handleStatusChange = async (account: LinkedAccount, status: LinkedAccountStatus) => {
    try {
      await adminApi.updateLinkedAccountStatus(account.id, status);
      reload();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t.common.error);
    }
  };

  const handleRemove = async (account: LinkedAccount) => {
    if (!window.confirm(t.launcher.removeConfirm)) return;
    try {
      await adminApi.removeLinkedAccount(account.id);
      reload();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t.common.error);
    }
  };

  return (
    <div>
      <PageHeader
        title={t.launcher.linkingTitle}
        subtitle={t.launcher.linkingSubtitle}
        actions={
          <Button onClick={() => { setModalOpen(true); setFormError(null); setSuccess(null); }}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t.launcher.addAccount}
          </Button>
        }
      />

      {error && <Notice tone="rose">{error}</Notice>}
      {success && <Notice tone="emerald">{success}</Notice>}
      {formError && <Notice tone="rose">{formError}</Notice>}
      {loading && <Spinner />}

      {!loading && accounts.length === 0 && !error && (
        <Card className="p-10 text-center text-sm text-slate-500">{t.launcher.noAccounts}</Card>
      )}

      {accounts.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {accounts.map((account) => {
            const Icon = PROVIDER_ICONS[account.provider] ?? Link2;
            return (
              <Card key={account.id} className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="font-semibold text-slate-900">{account.account_label}</p>
                      <p className="text-xs text-slate-500">
                        {t.launcher.providerLabels[account.provider]} · {account.account_ref}
                      </p>
                    </div>
                  </div>
                  <Badge tone={statusTone(account.status)}>
                    {t.launcher.statusLabels[account.status]}
                  </Badge>
                </div>
                <p className="mt-3 text-xs text-slate-500">
                  {t.launcher.linkedOn}: {formatDateTime(account.created_at)}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {account.status !== 'active' && (
                    <Button
                      variant="secondary"
                      className="min-h-[36px] py-1.5"
                      onClick={() => void handleStatusChange(account, 'active')}
                    >
                      <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                      {t.launcher.activate}
                    </Button>
                  )}
                  {account.status !== 'revoked' && (
                    <Button
                      variant="secondary"
                      className="min-h-[36px] py-1.5"
                      onClick={() => void handleStatusChange(account, 'revoked')}
                    >
                      {t.launcher.revoke}
                    </Button>
                  )}
                  <Button
                    variant="danger"
                    className="min-h-[36px] py-1.5"
                    onClick={() => void handleRemove(account)}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    {t.launcher.remove}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={modalOpen} title={t.launcher.addAccount} onClose={() => setModalOpen(false)}>
        <form onSubmit={handleAdd} className="space-y-5">
          <Field label={t.launcher.accountLabel}>
            <input
              className="field-input"
              required
              placeholder={t.launcher.accountLabelPlaceholder}
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </Field>
          <Field label={t.launcher.provider}>
            <select
              className="field-input"
              value={provider}
              onChange={(e) => setProvider(e.target.value as LinkedAccountProvider)}
            >
              {PROVIDERS.map((p) => (
                <option key={p} value={p}>{t.launcher.providerLabels[p]}</option>
              ))}
            </select>
          </Field>
          <Field label={t.launcher.accountRef}>
            <input
              className="field-input"
              required
              placeholder={t.launcher.accountRefPlaceholder}
              value={ref}
              onChange={(e) => setRef(e.target.value)}
            />
          </Field>
          {formError && <Notice tone="rose">{formError}</Notice>}
          <div className="flex gap-3">
            <Button type="submit" loading={busy}>
              {t.common.save}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              {t.common.cancel}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function TransactionsSection() {
  const { t } = useI18n();
  const { data, error, loading, reload } = useLoader(loadLauncherData);
  const [modalOpen, setModalOpen] = useState(false);
  const [type, setType] = useState<TransactionType>('credit');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [accountId, setAccountId] = useState('');
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const accounts = data?.accounts ?? [];
  const transactions = data?.transactions ?? [];

  const accountLabel = (id: string | null) => {
    if (!id) return t.launcher.txNoAccount;
    const acct = accounts.find((a) => a.id === id);
    return acct ? acct.account_label : t.launcher.txNoAccount;
  };

  const summary = useMemo(() => {
    const completed = transactions.filter((tx) => tx.status === 'completed');
    const credit = completed.filter((tx) => tx.type === 'credit').reduce((s, tx) => s + Number(tx.amount_inr), 0);
    const debit = completed.filter((tx) => tx.type === 'debit').reduce((s, tx) => s + Number(tx.amount_inr), 0);
    return { credit, debit, balance: credit - debit };
  }, [transactions]);

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const amt = Number(amount);
    if (!amt || amt <= 0) { setFormError(t.launcher.invalidAmount); return; }
    if (!description.trim()) { setFormError(t.launcher.invalidDescription); return; }
    setBusy(true);
    try {
      await adminApi.addTransaction({
        linked_account_id: accountId || null,
        type,
        amount_inr: amt,
        description: description.trim(),
      });
      setSuccess(t.launcher.txAddSuccess);
      setAmount(''); setDescription(''); setAccountId(''); setType('credit');
      setModalOpen(false);
      reload();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t.common.error);
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async (tx: AccountTransaction) => {
    if (!window.confirm(t.launcher.txRemoveConfirm)) return;
    try {
      await adminApi.removeTransaction(tx.id);
      reload();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t.common.error);
    }
  };

  return (
    <div>
      <PageHeader
        title={t.launcher.txTitle}
        subtitle={t.launcher.txSubtitle}
        actions={
          <Button onClick={() => { setModalOpen(true); setFormError(null); setSuccess(null); }}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t.launcher.addTx}
          </Button>
        }
      />

      {error && <Notice tone="rose">{error}</Notice>}
      {success && <Notice tone="emerald">{success}</Notice>}
      {formError && <Notice tone="rose">{formError}</Notice>}

      {!loading && transactions.length > 0 && (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="p-5">
            <p className="text-sm font-medium text-slate-600">{t.launcher.txBalance}</p>
            <p className={`mt-2 text-2xl font-bold ${summary.balance >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              {formatInr(summary.balance)}
            </p>
          </Card>
          <Card className="p-5">
            <p className="text-sm font-medium text-slate-600">{t.launcher.txTotalCredit}</p>
            <p className="mt-2 text-2xl font-bold text-emerald-700">{formatInr(summary.credit)}</p>
          </Card>
          <Card className="p-5">
            <p className="text-sm font-medium text-slate-600">{t.launcher.txTotalDebit}</p>
            <p className="mt-2 text-2xl font-bold text-rose-700">{formatInr(summary.debit)}</p>
          </Card>
        </div>
      )}

      {loading && <Spinner />}

      {!loading && transactions.length === 0 && !error && (
        <Card className="p-10 text-center text-sm text-slate-500">{t.launcher.txEmpty}</Card>
      )}

      {transactions.length > 0 && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="table-cell font-semibold text-slate-700">{t.launcher.txDate}</th>
                  <th className="table-cell font-semibold text-slate-700">{t.launcher.txType}</th>
                  <th className="table-cell font-semibold text-slate-700">{t.launcher.txAmount}</th>
                  <th className="table-cell font-semibold text-slate-700">{t.launcher.txDescription}</th>
                  <th className="table-cell font-semibold text-slate-700">{t.launcher.txAccount}</th>
                  <th className="table-cell font-semibold text-slate-700">{t.launcher.txStatus}</th>
                  <th className="table-cell" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="transition hover:bg-slate-50">
                    <td className="table-cell whitespace-nowrap text-slate-600">
                      {formatDateTime(tx.created_at)}
                    </td>
                    <td className="table-cell">
                      <span className={`inline-flex items-center gap-1.5 font-medium ${tx.type === 'credit' ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {tx.type === 'credit'
                          ? <ArrowDownCircle className="h-4 w-4" aria-hidden="true" />
                          : <ArrowUpCircle className="h-4 w-4" aria-hidden="true" />}
                        {tx.type === 'credit' ? t.launcher.txCredit : t.launcher.txDebit}
                      </span>
                    </td>
                    <td className="table-cell font-semibold text-slate-900">
                      {formatInr(Number(tx.amount_inr))}
                    </td>
                    <td className="table-cell text-slate-700">{tx.description}</td>
                    <td className="table-cell text-slate-600">{accountLabel(tx.linked_account_id)}</td>
                    <td className="table-cell">
                      <Badge tone={txStatusTone(tx.status)}>
                        {t.launcher.txStatusLabels[tx.status]}
                      </Badge>
                    </td>
                    <td className="table-cell">
                      <button
                        onClick={() => void handleRemove(tx)}
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                        aria-label={t.launcher.txRemove}
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

      <Modal open={modalOpen} title={t.launcher.addTx} onClose={() => setModalOpen(false)}>
        <form onSubmit={handleAdd} className="space-y-5">
          <Field label={t.launcher.txType}>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setType('credit')}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition ${
                  type === 'credit'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <ArrowDownCircle className="h-4 w-4" aria-hidden="true" />
                {t.launcher.txCredit}
              </button>
              <button
                type="button"
                onClick={() => setType('debit')}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition ${
                  type === 'debit'
                    ? 'border-rose-600 bg-rose-50 text-rose-700'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <ArrowUpCircle className="h-4 w-4" aria-hidden="true" />
                {t.launcher.txDebit}
              </button>
            </div>
          </Field>
          <Field label={t.launcher.txAmount}>
            <input
              className="field-input"
              type="number"
              min="1"
              step="1"
              required
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </Field>
          <Field label={t.launcher.txDescription}>
            <input
              className="field-input"
              required
              placeholder={t.launcher.txDescriptionPlaceholder}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>
          <Field label={t.launcher.txAccount}>
            <select
              className="field-input"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
            >
              <option value="">{t.launcher.txNoAccount}</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>{a.account_label}</option>
              ))}
            </select>
          </Field>
          {formError && <Notice tone="rose">{formError}</Notice>}
          <div className="flex gap-3">
            <Button type="submit" loading={busy}>
              {t.common.save}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              {t.common.cancel}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export function LauncherPage() {
  const { t } = useI18n();
  const { status } = useAuth();
  const [view, setView] = useState<LauncherView>('hub');

  if (view === 'hub') {
    return <LauncherHub onSelect={setView} />;
  }

  const backToHub = (
    <button
      onClick={() => setView('hub')}
      className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      {t.launcher.backToLauncher}
    </button>
  );

  if (view === 'login') {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto mb-6 max-w-md">{backToHub}</div>
        <LoginSection />
      </div>
    );
  }

  if (status !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto mb-6 max-w-2xl">{backToHub}</div>
        <div className="mx-auto max-w-2xl">
          <Card className="p-8 text-center">
            <p className="text-sm leading-relaxed text-slate-600">{t.launcher.mustSignIn}</p>
            <Button className="mt-4" onClick={() => setView('login')}>
              <LogIn className="h-4 w-4" aria-hidden="true" />
              {t.launcher.loginTitle}
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
      <div className="mx-auto mb-6 max-w-6xl">{backToHub}</div>
      <div className="mx-auto max-w-6xl">
        {view === 'linking' && <LinkingSection />}
        {view === 'transactions' && <TransactionsSection />}
      </div>
    </div>
  );
}
