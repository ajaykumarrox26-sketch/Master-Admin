import { useState, useRef } from 'react';
import { CheckCircle2, Clock, Download, ExternalLink, Eye, FileText, Printer, Trash2, Upload, XCircle } from 'lucide-react';
import { adminApi } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { useLoader } from '@/lib/useLoader';
import { formatDateTime } from '@/lib/format';
import { Badge, Button, Card, Modal, Notice, Spinner } from '@/components/ui';
import type { PanApplication, PanApplicationStatus, PanTimelineEntry } from '@/lib/types';

function panStatusTone(status: PanApplicationStatus): 'amber' | 'sky' | 'emerald' | 'rose' {
  if (status === 'submitted') return 'amber';
  if (status === 'in_review') return 'sky';
  if (status === 'completed') return 'emerald';
  return 'rose';
}

function typeLabel(type: string, t: ReturnType<typeof useI18n>['t']): string {
  if (type === 'new') return t.pan.typeNew;
  if (type === 'correction') return t.pan.typeCorrection;
  return t.pan.typeReprint;
}

function joinAddr(...parts: (string | null | undefined)[]): string {
  return parts.filter(Boolean).join(', ');
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-0.5 border-b border-slate-100 py-2 last:border-0">
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="text-sm text-slate-900">{value}</dd>
    </div>
  );
}

function timelineIcon(status: PanApplicationStatus) {
  if (status === 'completed') return <CheckCircle2 className="h-5 w-5 text-emerald-600" aria-hidden="true" />;
  if (status === 'rejected') return <XCircle className="h-5 w-5 text-rose-600" aria-hidden="true" />;
  if (status === 'in_review') return <Clock className="h-5 w-5 text-sky-600" aria-hidden="true" />;
  return <FileText className="h-5 w-5 text-amber-600" aria-hidden="true" />;
}

function timelineColor(status: PanApplicationStatus) {
  if (status === 'completed') return 'bg-emerald-100';
  if (status === 'rejected') return 'bg-rose-100';
  if (status === 'in_review') return 'bg-sky-100';
  return 'bg-amber-100';
}

function PanStatusTimeline({ applicationId }: { applicationId: string }) {
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
            <span className={`absolute left-[10px] top-8 h-full w-0.5 ${timelineColor(entry.status)}`} aria-hidden="true" />
          )}
          <span className={`relative z-10 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${timelineColor(entry.status)}`}>
            {timelineIcon(entry.status)}
          </span>
          <div className="flex-1 pt-0.5">
            <p className="text-sm font-semibold text-slate-900">{t.pan.statusLabels[entry.status]}</p>
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

interface PanDocument {
  name: string;
  path: string;
  size: number;
}

const MAX_BYTES = 2 * 1024 * 1024;
const ACCEPTED = ['image/jpeg', 'image/png', 'application/pdf'];

function PanDocumentUpload({ applicationId }: { applicationId: string }) {
  const { t } = useI18n();
  const { data: docs, error, loading, reload } = useLoader(() => adminApi.listPanDocuments(applicationId));
  const [uploading, setUploading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [openingPath, setOpeningPath] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setActionError(null);
    setSuccessMsg(null);
    if (!ACCEPTED.includes(file.type)) { setActionError(t.pan.documentTypeError); return; }
    if (file.size > MAX_BYTES) { setActionError(t.pan.documentSizeError); return; }
    setUploading(true);
    try {
      await adminApi.uploadPanDocument(applicationId, file);
      reload();
    } catch {
      setActionError(t.pan.documentUploadError);
    } finally {
      setUploading(false);
    }
  };

  const handleOpen = async (path: string) => {
    setOpeningPath(path);
    setActionError(null);
    try {
      const url = await adminApi.panDocumentLink(path);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch {
      setActionError(t.pan.documentError);
    } finally {
      setOpeningPath(null);
    }
  };

  const handleRemove = async (path: string) => {
    if (!window.confirm(t.pan.documentRemoveConfirm)) return;
    setActionError(null);
    try {
      await adminApi.removePanDocument(path);
      setSuccessMsg(t.pan.documentRemoveSuccess);
      reload();
    } catch {
      setActionError(t.pan.documentError);
    }
  };

  return (
    <div>
      <p className="text-sm leading-relaxed text-slate-600">{t.pan.documentsBody}</p>
      <div className="mt-4 flex items-center gap-3">
        <input
          ref={fileRef}
          type="file"
          accept=".jpeg,.jpg,.png,.pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
            e.target.value = '';
          }}
        />
        <Button variant="secondary" onClick={() => fileRef.current?.click()} loading={uploading}>
          {!uploading && <Upload className="h-4 w-4" aria-hidden="true" />}
          {uploading ? t.pan.documentUploading : t.pan.documentUpload}
        </Button>
      </div>

      {actionError && <div className="mt-3"><Notice tone="rose">{actionError}</Notice></div>}
      {successMsg && <div className="mt-3"><Notice tone="emerald">{successMsg}</Notice></div>}

      <div className="mt-5">
        {loading && <Spinner />}
        {error && <Notice tone="rose">{t.pan.documentError}</Notice>}
        {!loading && !error && docs && docs.length === 0 && (
          <p className="text-sm text-slate-500">{t.pan.documentEmpty}</p>
        )}
        {docs && docs.length > 0 && (
          <ul className="space-y-2">
            {docs.map((doc: PanDocument, index: number) => (
              <li key={doc.path} className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 ring-1 ring-slate-200">
                <span className="text-sm text-slate-800">
                  {t.pan.documentUpload} {index + 1}
                  {doc.size > 0 && <span className="ml-2 text-xs text-slate-400">({(doc.size / 1024).toFixed(0)} KB)</span>}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => void handleOpen(doc.path)}
                    disabled={openingPath !== null}
                    className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-teal-800 transition hover:bg-teal-50 disabled:opacity-50"
                  >
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                    {openingPath === doc.path ? t.pan.documentOpening : t.pan.documentOpen}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleRemove(doc.path)}
                    className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                    aria-label={t.pan.documentRemove}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function PdfPrintView({ app, t }: { app: PanApplication; t: ReturnType<typeof useI18n>['t'] }) {
  return (
    <div id="pan-pdf-print" className="hidden print:block">
      <style>{`@media print { body * { visibility: hidden; } #pan-pdf-print, #pan-pdf-print * { visibility: visible; } #pan-pdf-print { position: absolute; left: 0; top: 0; width: 100%; padding: 32px; } }`}</style>
      <h1 className="text-xl font-bold text-slate-900">{t.pan.exportHeader}</h1>
      <table className="mt-4 w-full text-sm">
        <tbody>
          <tr><td className="border border-slate-300 px-3 py-1.5 font-semibold">{t.pan.exportRef}</td><td className="border border-slate-300 px-3 py-1.5">{app.reference_number}</td></tr>
          <tr><td className="border border-slate-300 px-3 py-1.5 font-semibold">{t.pan.exportApplicant}</td><td className="border border-slate-300 px-3 py-1.5">{app.first_name} {app.middle_name ?? ''} {app.last_name}</td></tr>
          <tr><td className="border border-slate-300 px-3 py-1.5 font-semibold">{t.pan.detailType}</td><td className="border border-slate-300 px-3 py-1.5">{typeLabel(app.application_type, t)}</td></tr>
          <tr><td className="border border-slate-300 px-3 py-1.5 font-semibold">{t.pan.detailDob}</td><td className="border border-slate-300 px-3 py-1.5">{app.dob}</td></tr>
          <tr><td className="border border-slate-300 px-3 py-1.5 font-semibold">{t.pan.detailGender}</td><td className="border border-slate-300 px-3 py-1.5">{app.gender}</td></tr>
          <tr><td className="border border-slate-300 px-3 py-1.5 font-semibold">{t.pan.detailContact}</td><td className="border border-slate-300 px-3 py-1.5">{app.contact_number}</td></tr>
          <tr><td className="border border-slate-300 px-3 py-1.5 font-semibold">{t.pan.detailEmail}</td><td className="border border-slate-300 px-3 py-1.5">{app.email}</td></tr>
          <tr><td className="border border-slate-300 px-3 py-1.5 font-semibold">{t.pan.detailResidential}</td><td className="border border-slate-300 px-3 py-1.5">{joinAddr(app.residential_address_line1, app.residential_address_line2, app.residential_city, app.residential_state, app.residential_pincode, app.residential_country)}</td></tr>
          <tr><td className="border border-slate-300 px-3 py-1.5 font-semibold">{t.pan.detailKyc}</td><td className="border border-slate-300 px-3 py-1.5">{app.kyc_mode}</td></tr>
          <tr><td className="border border-slate-300 px-3 py-1.5 font-semibold">{t.pan.detailDelivery}</td><td className="border border-slate-300 px-3 py-1.5">{app.pan_card_delivery_mode}</td></tr>
          <tr><td className="border border-slate-300 px-3 py-1.5 font-semibold">{t.pan.detailStatus}</td><td className="border border-slate-300 px-3 py-1.5">{t.pan.statusLabels[app.status]}</td></tr>
          <tr><td className="border border-slate-300 px-3 py-1.5 font-semibold">{t.pan.detailSubmittedOn}</td><td className="border border-slate-300 px-3 py-1.5">{formatDateTime(app.created_at)}</td></tr>
        </tbody>
      </table>
    </div>
  );
}

export function PanApplicationDetail({ app, onClose }: { app: PanApplication; onClose: () => void }) {
  const { t } = useI18n();
  const [showPdf, setShowPdf] = useState(false);

  return (
    <>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-mono text-sm font-bold text-slate-900">{app.reference_number}</p>
            <p className="text-sm text-slate-600">{app.first_name} {app.middle_name ?? ''} {app.last_name}</p>
          </div>
          <Badge tone={panStatusTone(app.status)}>{t.pan.statusLabels[app.status]}</Badge>
        </div>

        <Card className="p-4">
          <dl>
            <Row label={t.pan.detailType} value={typeLabel(app.application_type, t)} />
            <Row label={t.pan.detailCategory} value={app.applicant_category} />
            <Row label={t.pan.detailDob} value={app.dob} />
            <Row label={t.pan.detailGender} value={app.gender} />
            <Row label={t.pan.detailAadhaar} value={app.aadhaar_number ? `XXXX-XXXX-${app.aadhaar_number.slice(-4)}` : null} />
            <Row label={t.pan.detailCitizenship} value={app.citizenship} />
            <Row label={t.pan.detailIncome} value={app.source_of_income.join(', ')} />
            <Row label={t.pan.detailContact} value={app.contact_number} />
            <Row label={t.pan.detailEmail} value={app.email} />
            <Row label={t.pan.detailResidential} value={joinAddr(app.residential_address_line1, app.residential_address_line2, app.residential_city, app.residential_state, app.residential_pincode, app.residential_country)} />
            <Row label={t.pan.detailOffice} value={joinAddr(app.office_address_line1, app.office_address_line2, app.office_city, app.office_state, app.office_pincode, app.office_country)} />
            <Row label={t.pan.detailKyc} value={app.kyc_mode} />
            <Row label={t.pan.detailDelivery} value={app.pan_card_delivery_mode} />
            <Row label={t.pan.detailPhysical} value={app.physical_pan_required ? t.pan.detailYes : t.pan.detailNo} />
            <Row label={t.pan.detailSubmittedOn} value={formatDateTime(app.created_at)} />
          </dl>
        </Card>

        <div>
          <h3 className="mb-3 text-sm font-bold text-slate-900">{t.pan.timelineTitle}</h3>
          <PanStatusTimeline applicationId={app.id} />
        </div>

        <div>
          <h3 className="mb-2 text-sm font-bold text-slate-900">{t.pan.documentsTitle}</h3>
          <PanDocumentUpload applicationId={app.id} />
        </div>

        <div className="flex gap-2 border-t border-slate-200 pt-4">
          <Button variant="secondary" onClick={() => setShowPdf(true)}>
            <Download className="h-4 w-4" aria-hidden="true" />
            {t.pan.exportPdf}
          </Button>
          <Button variant="ghost" onClick={onClose}>{t.pan.closeDetail}</Button>
        </div>
      </div>

      <PdfPrintView app={app} t={t} />

      <Modal open={showPdf} title={t.pan.exportPdf} onClose={() => setShowPdf(false)}>
        <div className="space-y-4">
          <p className="text-sm leading-relaxed text-slate-600">{t.pan.exportBody}</p>
          <div className="flex gap-2">
            <Button onClick={() => window.print()}>
              <Printer className="h-4 w-4" aria-hidden="true" />
              {t.pan.exportPrint}
            </Button>
            <Button variant="ghost" onClick={() => setShowPdf(false)}>{t.pan.exportClose}</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

export function PanDetailButton({ app, label }: { app: PanApplication; label: string }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-teal-800 transition hover:bg-teal-50"
      >
        <Eye className="h-3.5 w-3.5" aria-hidden="true" />
        {label}
      </button>
      <Modal open={open} title={t.pan.detailTitle} onClose={() => setOpen(false)}>
        <PanApplicationDetail app={app} onClose={() => setOpen(false)} />
      </Modal>
    </>
  );
}
