import { useState, useRef } from 'react';
import { ExternalLink, Trash2, Upload } from 'lucide-react';
import { adminApi } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { useLoader } from '@/lib/useLoader';
import { Button, Notice, Spinner } from '@/components/ui';

interface PanDocument {
  name: string;
  path: string;
  size: number;
}

const MAX_BYTES = 2 * 1024 * 1024;
const ACCEPTED = ['image/jpeg', 'image/png', 'application/pdf'];

export function PanDocumentUpload({ applicationId }: { applicationId: string }) {
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
    if (!ACCEPTED.includes(file.type)) {
      setActionError(t.pan.documentTypeError);
      return;
    }
    if (file.size > MAX_BYTES) {
      setActionError(t.pan.documentSizeError);
      return;
    }
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
        <Button
          variant="secondary"
          onClick={() => fileRef.current?.click()}
          loading={uploading}
        >
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
              <li
                key={doc.path}
                className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 ring-1 ring-slate-200"
              >
                <span className="text-sm text-slate-800">
                  {t.pan.documentUpload} {index + 1}
                  {doc.size > 0 && (
                    <span className="ml-2 text-xs text-slate-400">
                      ({(doc.size / 1024).toFixed(0)} KB)
                    </span>
                  )}
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
