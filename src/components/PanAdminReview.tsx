import { useState } from 'react';
import { CheckCircle2, Eye, XCircle, Clock } from 'lucide-react';
import { adminApi } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { useLoader } from '@/lib/useLoader';
import { formatDateTime } from '@/lib/format';
import { Button, Card, Modal, Notice, PageHeader, Spinner, Badge, Field } from '@/components/ui';
import { PanApplicationDetail } from '@/components/PanApplicationDetail';
import type { PanApplication, PanApplicationStatus } from '@/lib/types';

function panStatusTone(status: PanApplicationStatus): 'amber' | 'sky' | 'emerald' | 'rose' {
  if (status === 'submitted') return 'amber';
  if (status === 'in_review') return 'sky';
  if (status === 'completed') return 'emerald';
  return 'rose';
}

async function loadAllPanApplications() {
  return adminApi.allPanApplications();
}

export function PanAdminReview() {
  const { t } = useI18n();
  const { data, error, loading, reload } = useLoader(loadAllPanApplications);
  const [detailApp, setDetailApp] = useState<PanApplication | null>(null);
  const [reviewApp, setReviewApp] = useState<PanApplication | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSuccess, setReviewSuccess] = useState<string | null>(null);

  const applications = data ?? [];

  const submitReview = async (decision: 'completed' | 'rejected' | 'in_review') => {
    if (!reviewApp) return;
    setBusy(true);
    setReviewError(null);
    setReviewSuccess(null);
    try {
      await adminApi.reviewPanApplication(reviewApp.id, decision, note);
      setReviewSuccess(t.pan.adminReviewDone);
      setReviewApp(null);
      setNote('');
      reload();
    } catch {
      setReviewError(t.pan.adminReviewError);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader title={t.pan.adminReviewTitle} subtitle={t.pan.adminReviewSubtitle} />

      {reviewSuccess && <div className="mb-4"><Notice tone="emerald">{reviewSuccess}</Notice></div>}
      {error && <Notice tone="rose">{t.pan.adminReviewError}</Notice>}
      {loading && <Spinner />}

      {!loading && applications.length === 0 && !error && (
        <Card className="p-10 text-center text-sm text-slate-500">{t.pan.adminReviewEmpty}</Card>
      )}

      {applications.length > 0 && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="table-cell font-semibold text-slate-700">{t.pan.detailRef}</th>
                  <th className="table-cell font-semibold text-slate-700">{t.pan.adminApplicant}</th>
                  <th className="table-cell font-semibold text-slate-700">{t.pan.adminEmail}</th>
                  <th className="table-cell font-semibold text-slate-700">{t.pan.detailStatus}</th>
                  <th className="table-cell font-semibold text-slate-700">{t.pan.adminSubmittedOn}</th>
                  <th className="table-cell font-semibold text-slate-700">{t.pan.adminActions}</th>
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
                    <td className="table-cell text-slate-600">{app.email}</td>
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
                        <button
                          onClick={() => setDetailApp(app)}
                          className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-teal-800 transition hover:bg-teal-50"
                        >
                          <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                          {t.pan.viewDetail}
                        </button>
                        {app.status !== 'completed' && app.status !== 'rejected' && (
                          <button
                            onClick={() => { setReviewApp(app); setNote(''); setReviewError(null); }}
                            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                          >
                            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                            {t.pan.adminInReview}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal open={detailApp !== null} title={t.pan.detailTitle} onClose={() => setDetailApp(null)}>
        {detailApp && <PanApplicationDetail app={detailApp} onClose={() => setDetailApp(null)} />}
      </Modal>

      <Modal open={reviewApp !== null} title={t.pan.adminReviewTitle} onClose={() => setReviewApp(null)}>
        {reviewApp && (
          <div className="space-y-4">
            <div>
              <p className="font-mono text-sm font-bold text-slate-900">{reviewApp.reference_number}</p>
              <p className="text-sm text-slate-600">{reviewApp.first_name} {reviewApp.last_name}</p>
            </div>
            <Field label={t.pan.adminNoteLabel}>
              <textarea
                className="field-input min-h-[80px] resize-y"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t.pan.adminNotePlaceholder}
              />
            </Field>
            {reviewError && <Notice tone="rose">{reviewError}</Notice>}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="primary"
                onClick={() => void submitReview('completed')}
                loading={busy}
                className="bg-emerald-700 hover:bg-emerald-800"
              >
                {!busy && <CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
                {t.pan.adminApprove}
              </Button>
              <Button
                variant="danger"
                onClick={() => void submitReview('rejected')}
                loading={busy}
              >
                {!busy && <XCircle className="h-4 w-4" aria-hidden="true" />}
                {t.pan.adminReject}
              </Button>
              <Button variant="secondary" onClick={() => void submitReview('in_review')} loading={busy}>
                {!busy && <Clock className="h-4 w-4" aria-hidden="true" />}
                {t.pan.adminInReview}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
