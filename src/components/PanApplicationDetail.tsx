import { useState } from 'react';
import { Download, Eye, Printer } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { Button, Card, Modal, Badge } from '@/components/ui';
import { PanDocumentUpload } from '@/components/PanDocumentUpload';
import { PanStatusTimeline } from '@/components/PanStatusTimeline';
import { formatDateTime } from '@/lib/format';
import type { PanApplication, PanApplicationStatus } from '@/lib/types';

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
