import { AuthProvider, useAuth } from '@/lib/auth';
import { PhoneAuthProvider, usePhoneAuth } from '@/lib/phoneAuth';
import { I18nProvider, useI18n } from '@/lib/i18n';
import { usePathname } from '@/lib/router';
import { PanDashboardPage } from '@/pages/PanDashboardPage';
import { ResetPasswordPage } from '@/pages/ResetPasswordPage';
import { LauncherPage } from '@/pages/LauncherPage';
import { Spinner } from '@/components/ui';

function AppGate() {
  const { t } = useI18n();
  const { status } = useAuth();
  const { status: phoneStatus } = usePhoneAuth();
  const path = usePathname();

  if (path === '/reset-password') return <ResetPasswordPage />;
  if (path === '/launcher') return <LauncherPage />;

  const loading = status === 'loading' || phoneStatus === 'loading';

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50 text-sm text-slate-600">
        <Spinner />
        <p>{t.common.loading}</p>
      </div>
    );
  }

  return <PanDashboardPage />;
}

function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <PhoneAuthProvider>
          <AppGate />
        </PhoneAuthProvider>
      </AuthProvider>
    </I18nProvider>
  );
}

export default App;
