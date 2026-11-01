import { CheckCircle2, Clock, XCircle, FileText } from 'lucide-react';
import { adminApi } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { useLoader } from '@/lib/useLoader';
import { Spinner, Notice } from '@/components/ui';
import { formatDateTime } from '@/lib/format';
import type { PanApplicationStatus, PanTimelineEntry } from '@/lib/types';

function statusIcon(status: PanApplicationStatus) {
  if (status === 'completed') return <CheckCircle2 className="h-5 w-5 text-emerald-600" aria-hidden="true" />;
  if (status === 'rejected') return <XCircle className="h-5 w-5 text-rose-600" aria-hidden="true" />;
  if (status === 'in_review') return <Clock className="h-5 w-5 text-sky-600" aria-hidden="true" />;
  return <FileText className="h-5 w-5 text-amber-600" aria-hidden="true" />;
}

function statusColor(status: PanApplicationStatus) {
  if (status === 'completed') return 'bg-emerald-100';
  if (status === 'rejected') return 'bg-rose-100';
  if (status === 'in_review') return 'bg-sky-100';
  return 'bg-amber-100';
}

export function PanStatusTimeline({ applicationId }: { applicationId: string }) {
  const { t } = useI18n();
  const { data: entries, error, loading } = useLoader(() => adminApi.panTimeline(applicationId));

  if (loading) return <Spinner />;
  if (error) return <Notice tone="rose">{t.common.error}</Notice>;
  if (!entries || entries.length === 0)
    return <p className="text-sm text-slate-500">{t.pan.timelineEmpty}</p>;

  return (
    <ol className="space-y-0">
      {entries.map((entry: PanTimelineEntry, index: number) => (
        <li key={entry.id} className="relative flex gap-4 pb-6 last:pb-0">
          {index < entries.length - 1 && (
            <span
              className={`absolute left-[10px] top-8 h-full w-0.5 ${statusColor(entry.status)}`}
              aria-hidden="true"
            />
          )}
          <span
            className={`relative z-10 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${statusColor(entry.status)}`}
          >
            {statusIcon(entry.status)}
          </span>
          <div className="flex-1 pt-0.5">
            <p className="text-sm font-semibold text-slate-900">
              {t.pan.statusLabels[entry.status]}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              {formatDateTime(entry.created_at)} · {t.pan.timelineBy} {entry.actor_name}
            </p>
            {entry.note && (
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                <span className="font-medium text-slate-700">{t.pan.timelineNote}:</span> {entry.note}
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
