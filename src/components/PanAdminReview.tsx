import { useMemo, useState } from 'react';
import { CheckCircle2, Clock, Eye, Search, X, XCircle } from 'lucide-react';
import { adminApi } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { useLoader } from '@/lib/useLoader';
import { formatDateTime } from '@/lib/format';
import { Badge, Button, Card, Field, Modal, Notice, PageHeader, Spinner } from '@/components/ui';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | PanApplicationStatus>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const allApplications = data ?? [];

  const filteredApplications = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const fromTime = dateFrom ? new Date(dateFrom + 'T00:00:00').getTime() : null;
    const toTime = dateTo ? new Date(dateTo + 'T23:59:59').getTime() : null;

    return allApplications.filter((app) => {
      if (statusFilter !== 'all' && app.status !== statusFilter) return false;
      if (fromTime !== null && new Date(app.created_at).getTime() < fromTime) return false;
      if (toTime !== null && new Date(app.created_at).getTime() > toTime) return false;
      if (query) {
        const haystack = [
          app.first_name,
          app.last_name,
          app.email,
          app.reference_number,
        ].join(' ').toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [allApplications, searchQuery, statusFilter, dateFrom, dateTo]);

  const hasActiveFilters = searchQuery.trim() !== '' || statusFilter !== 'all' || dateFrom !== '' || dateTo !== '';

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setDateFrom('');
    setDateTo('');
  };

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

      {!loading && allApplications.length === 0 && !error && (
        <Card className="p-10 text-center text-sm text-slate-500">{t.pan.adminReviewEmpty}</Card>
      )}

      {allApplications.length > 0 && (
        <>
          <Card className="mb-4 p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
              <div className="flex-1">
                <Field label={t.common.search}>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                    <input
                      type="text"
                      className="field-input pl-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t.pan.adminSearchPlaceholder}
                    />
                  </div>
                </Field>
              </div>
              <div className="lg:w-52">
                <Field label={t.pan.adminFilterStatus}>
                  <select
                    className="field-input"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as 'all' | PanApplicationStatus)}
                  >
                    <option value="all">{t.pan.adminFilterAll}</option>
                    <option value="submitted">{t.pan.statusLabels.submitted}</option>
                    <option value="in_review">{t.pan.statusLabels.in_review}</option>
                    <option value="completed">{t.pan.statusLabels.completed}</option>
                    <option value="rejected">{t.pan.statusLabels.rejected}</option>
                  </select>
                </Field>
              </div>
              <div className="lg:w-44">
                <Field label={t.pan.adminFilterFromDate}>
                  <input
                    type="date"
                    className="field-input"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                </Field>
              </div>
              <div className="lg:w-44">
                <Field label={t.pan.adminFilterToDate}>
                  <input
                    type="date"
                    className="field-input"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </Field>
              </div>
              {hasActiveFilters && (
                <Button variant="secondary" onClick={clearFilters}>
                  <X className="h-4 w-4" aria-hidden="true" />
                  {t.pan.adminClearFilters}
                </Button>
              )}
            </div>
            <p className="mt-3 text-xs font-medium text-slate-500">
              {filteredApplications.length} {t.pan.adminResultsCount}
            </p>
          </Card>

          {filteredApplications.length === 0 ? (
            <Card className="p-10 text-center text-sm text-slate-500">{t.pan.adminNoResults}</Card>
          ) : (
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
                    {filteredApplications.map((app) => (
                      <tr key={app.id} className="transition hover:bg-slate-50">
                        <td className="table-cell font-mono text-xs font-semibold text-slate-900">{app.reference_number}</td>
                        <td className="table-cell text-slate-700">{app.first_name} {app.last_name}</td>
                        <td className="table-cell text-slate-600">{app.email}</td>
                        <td className="table-cell">
                          <Badge tone={panStatusTone(app.status)}>{t.pan.statusLabels[app.status]}</Badge>
                        </td>
                        <td className="table-cell whitespace-nowrap text-slate-600">{formatDateTime(app.created_at)}</td>
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
        </>
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
              <Button variant="danger" onClick={() => void submitReview('rejected')} loading={busy}>
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
