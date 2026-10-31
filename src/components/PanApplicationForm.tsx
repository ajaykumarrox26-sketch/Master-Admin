import { useState, type FormEvent } from 'react';
import { CheckCircle2, CreditCard, Send } from 'lucide-react';
import { adminApi } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import type {
  PanApplicationType,
  PanApplicantCategory,
  PanTitle,
  PanGender,
  PanCitizenship,
  PanKycMode,
  PanDeliveryMode,
  PanMothersNameFlag,
  PanSourceOfIncome,
  PanApplicationInput,
} from '@/lib/types';
import { Button, Field, Notice } from '@/components/ui';

const TITLES: PanTitle[] = ['shri', 'smt', 'kumari', 'm_s', 'dr', 'adv', 'prof', 'ca'];
const CATEGORIES: PanApplicantCategory[] = [
  'individual', 'minor', 'huf', 'company', 'partnership',
  'trust', 'aop', 'local_authority', 'artificial_judicial',
];
const GENDERS: PanGender[] = ['male', 'female', 'transgender'];
const CITIZENSHIPS: PanCitizenship[] = ['indian', 'oci', 'foreign'];
const KYC_MODES: PanKycMode[] = ['ekyc', 'scan', 'physical'];
const DELIVERY_MODES: PanDeliveryMode[] = ['physical', 'digital', 'both'];
const INCOME_SOURCES: PanSourceOfIncome[] = [
  'salary', 'business', 'house_property', 'capital_gains', 'other_sources', 'no_income',
];

const MOBILE_PATTERN = /^[6-9]\d{9}$/;
const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const PINCODE_PATTERN = /^\d{6}$/;

function emptyForm(): PanApplicationInput & { _acceptDeclaration: boolean } {
  return {
    application_type: 'new',
    applicant_category: 'individual',
    title: 'shri',
    last_name: '',
    first_name: '',
    middle_name: null,
    fathers_last_name: '',
    fathers_first_name: '',
    fathers_middle_name: null,
    mothers_last_name: null,
    mothers_first_name: null,
    mothers_name_flag: 'f',
    dob: '',
    gender: 'male',
    aadhaar_number: null,
    citizenship: 'indian',
    source_of_income: ['salary'],
    office_address_line1: null,
    office_address_line2: null,
    office_city: null,
    office_state: null,
    office_pincode: null,
    office_country: null,
    residential_address_line1: '',
    residential_address_line2: null,
    residential_city: '',
    residential_state: '',
    residential_pincode: '',
    residential_country: 'India',
    contact_number: '',
    email: '',
    kyc_mode: 'ekyc',
    physical_pan_required: true,
    pan_card_delivery_mode: 'physical',
    signature_name: null,
    _acceptDeclaration: false,
  };
}

export function PanApplicationForm() {
  const { t } = useI18n();
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const update = <K extends keyof typeof form>(field: K, value: (typeof form)[K]) =>
    setForm((current) => ({ ...current, [field]: value }));

  const updateText = (field: keyof typeof form) => (e: { target: { value: string } }) => {
    const value = e.target.value;
    setForm((current) => ({ ...current, [field]: value || null }));
  };

  const toggleIncomeSource = (source: PanSourceOfIncome) => {
    setForm((current) => {
      const has = current.source_of_income.includes(source);
      const next = has
        ? current.source_of_income.filter((s) => s !== source)
        : [...current.source_of_income, source];
      return { ...current, source_of_income: next.length > 0 ? next : current.source_of_income };
    });
  };

  const validate = (): string | null => {
    if (!form.last_name.trim()) return t.pan.validation.lastName;
    if (!form.first_name.trim()) return t.pan.validation.firstName;
    if (!form.fathers_last_name.trim()) return t.pan.validation.fathersLast;
    if (!form.fathers_first_name.trim()) return t.pan.validation.fathersFirst;
    if (!form.dob) return t.pan.validation.dob;
    if (!form.residential_address_line1.trim()) return t.pan.validation.addressLine1;
    if (!form.residential_city.trim()) return t.pan.validation.city;
    if (!form.residential_state.trim()) return t.pan.validation.state;
    if (!PINCODE_PATTERN.test(form.residential_pincode)) return t.pan.validation.pincode;
    if (!MOBILE_PATTERN.test(form.contact_number.replace(/\s/g, ''))) return t.pan.validation.contact;
    if (!EMAIL_PATTERN.test(form.email.trim())) return t.pan.validation.email;
    if (form.source_of_income.length === 0) return t.pan.validation.sourceOfIncome;
    if (!form._acceptDeclaration) return t.pan.validation.declaration;
    return null;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const problem = validate();
    if (problem) { setError(problem); return; }
    setBusy(true);
    setError(null);
    try {
      const { _acceptDeclaration, ...input } = form;
      void _acceptDeclaration;
      const data = await adminApi.submitPanApplication(input);
      setResult(data.reference_number);
      setForm(emptyForm());
    } catch (err) {
      setError(err instanceof Error ? err.message : t.common.error);
    } finally {
      setBusy(false);
    }
  };

  if (result) {
    return (
      <div className="animate-fade-up py-8 text-center">
        <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-600" aria-hidden="true" />
        <h3 className="mt-4 text-xl font-bold text-slate-900">{t.pan.submitSuccess}</h3>
        <p className="mt-2 text-sm text-slate-600">
          {t.pan.refNumber}{' '}
          <span className="font-mono font-semibold text-slate-900">{result}</span>
        </p>
        <Button variant="secondary" className="mt-6" onClick={() => setResult(null)}>
          {t.pan.backToForm}
        </Button>
      </div>
    );
  }

  const sectionTitle = (text: string) => (
    <h3 className="border-b border-slate-200 pb-2 text-sm font-bold uppercase tracking-wide text-teal-700">
      {text}
    </h3>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-8" noValidate>
      <div className="flex items-center gap-3 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3">
        <CreditCard className="h-5 w-5 shrink-0 text-teal-700" aria-hidden="true" />
        <p className="text-sm font-medium text-teal-900">{t.pan.formSubtitle}</p>
      </div>

      <div className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={t.pan.applicationType}>
            <select
              className="field-input"
              value={form.application_type}
              onChange={(e) => update('application_type', e.target.value as PanApplicationType)}
            >
              <option value="new">{t.pan.typeNew}</option>
              <option value="correction">{t.pan.typeCorrection}</option>
              <option value="reprint">{t.pan.typeReprint}</option>
            </select>
          </Field>
          <Field label={t.pan.applicantCategory}>
            <select
              className="field-input"
              value={form.applicant_category}
              onChange={(e) => update('applicant_category', e.target.value as PanApplicantCategory)}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{t.pan.categoryLabels[c]}</option>
              ))}
            </select>
          </Field>
        </div>
      </div>

      {sectionTitle(t.pan.sectionPersonal)}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <Field label={t.pan.title_label}>
          <select
            className="field-input"
            value={form.title}
            onChange={(e) => update('title', e.target.value as PanTitle)}
          >
            {TITLES.map((t2) => (
              <option key={t2} value={t2}>{t.pan.titleLabels[t2]}</option>
            ))}
          </select>
        </Field>
        <Field label={t.pan.lastName}>
          <input className="field-input" required value={form.last_name}
            onChange={(e) => update('last_name', e.target.value)} />
        </Field>
        <Field label={t.pan.firstName}>
          <input className="field-input" required value={form.first_name}
            onChange={(e) => update('first_name', e.target.value)} />
        </Field>
        <Field label={t.pan.middleName}>
          <input className="field-input" value={form.middle_name ?? ''}
            onChange={updateText('middle_name')} />
        </Field>
        <Field label={t.pan.dob}>
          <input className="field-input" type="date" required value={form.dob}
            onChange={(e) => update('dob', e.target.value)} />
        </Field>
        <Field label={t.pan.gender}>
          <select className="field-input" value={form.gender}
            onChange={(e) => update('gender', e.target.value as PanGender)}>
            {GENDERS.map((g) => (
              <option key={g} value={g}>{t.pan.genderLabels[g]}</option>
            ))}
          </select>
        </Field>
      </div>

      {sectionTitle(t.pan.sectionFathers)}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <Field label={t.pan.fathersLastName}>
          <input className="field-input" required value={form.fathers_last_name}
            onChange={(e) => update('fathers_last_name', e.target.value)} />
        </Field>
        <Field label={t.pan.fathersFirstName}>
          <input className="field-input" required value={form.fathers_first_name}
            onChange={(e) => update('fathers_first_name', e.target.value)} />
        </Field>
        <Field label={t.pan.fathersMiddleName}>
          <input className="field-input" value={form.fathers_middle_name ?? ''}
            onChange={updateText('fathers_middle_name')} />
        </Field>
        <Field label={t.pan.mothersLastName}>
          <input className="field-input" value={form.mothers_last_name ?? ''}
            onChange={updateText('mothers_last_name')} />
        </Field>
        <Field label={t.pan.mothersFirstName}>
          <input className="field-input" value={form.mothers_first_name ?? ''}
            onChange={updateText('mothers_first_name')} />
        </Field>
        <Field label={t.pan.mothersMiddleName}>
          <input className="field-input"
            value={form.mothers_first_name ? '' : ''}
            onChange={updateText('mothers_first_name')}
            placeholder=""
          />
        </Field>
      </div>

      <Field label={t.pan.mothersNameFlag}>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => update('mothers_name_flag', 'f')}
            className={`rounded-lg border px-4 py-2.5 text-sm font-medium transition ${
              form.mothers_name_flag === 'f'
                ? 'border-teal-600 bg-teal-50 text-teal-700'
                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            {t.pan.mothersNameFlagFather}
          </button>
          <button
            type="button"
            onClick={() => update('mothers_name_flag', 'm')}
            className={`rounded-lg border px-4 py-2.5 text-sm font-medium transition ${
              form.mothers_name_flag === 'm'
                ? 'border-teal-600 bg-teal-50 text-teal-700'
                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            {t.pan.mothersNameFlagMother}
          </button>
        </div>
      </Field>

      {sectionTitle(t.pan.sectionOther)}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <Field label={t.pan.aadhaarNumber}>
          <input className="field-input" inputMode="numeric" maxLength={12}
            value={form.aadhaar_number ?? ''}
            onChange={updateText('aadhaar_number')}
            placeholder="XXXX XXXX XXXX" />
        </Field>
        <Field label={t.pan.citizenship}>
          <select className="field-input" value={form.citizenship}
            onChange={(e) => update('citizenship', e.target.value as PanCitizenship)}>
            {CITIZENSHIPS.map((c) => (
              <option key={c} value={c}>{t.pan.citizenshipLabels[c]}</option>
            ))}
          </select>
        </Field>
      </div>

      <Field label={t.pan.sourceOfIncome}>
        <div className="flex flex-wrap gap-3">
          {INCOME_SOURCES.map((source) => {
            const active = form.source_of_income.includes(source);
            return (
              <button
                key={source}
                type="button"
                onClick={() => toggleIncomeSource(source)}
                className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                  active
                    ? 'border-teal-600 bg-teal-50 text-teal-700'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                {t.pan.sourceOfIncomeLabels[source]}
              </button>
            );
          })}
        </div>
      </Field>

      {sectionTitle(t.pan.sectionContact)}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={t.pan.contactNumber}>
          <input className="field-input" inputMode="tel" required
            value={form.contact_number}
            onChange={(e) => update('contact_number', e.target.value)}
            placeholder="10-digit mobile number" />
        </Field>
        <Field label={t.pan.email}>
          <input className="field-input" type="email" required
            value={form.email}
            onChange={(e) => update('email', e.target.value)} />
        </Field>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
        <p className="mb-4 text-sm font-semibold text-slate-900">{t.pan.residentialAddress}</p>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={t.pan.addressLine1}>
            <input className="field-input" required
              value={form.residential_address_line1}
              onChange={(e) => update('residential_address_line1', e.target.value)} />
          </Field>
          <Field label={t.pan.addressLine2}>
            <input className="field-input"
              value={form.residential_address_line2 ?? ''}
              onChange={updateText('residential_address_line2')} />
          </Field>
          <Field label={t.pan.city}>
            <input className="field-input" required
              value={form.residential_city}
              onChange={(e) => update('residential_city', e.target.value)} />
          </Field>
          <Field label={t.pan.state}>
            <input className="field-input" required
              value={form.residential_state}
              onChange={(e) => update('residential_state', e.target.value)} />
          </Field>
          <Field label={t.pan.pincode}>
            <input className="field-input" inputMode="numeric" maxLength={6} required
              value={form.residential_pincode}
              onChange={(e) => update('residential_pincode', e.target.value)} />
          </Field>
          <Field label={t.pan.country}>
            <input className="field-input" required
              value={form.residential_country}
              onChange={(e) => update('residential_country', e.target.value)} />
          </Field>
        </div>
      </div>

      <details className="rounded-xl border border-slate-200 bg-slate-50 p-5">
        <summary className="cursor-pointer text-sm font-semibold text-slate-900">
          {t.pan.officeAddress}
        </summary>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <Field label={t.pan.officeAddressLine1}>
            <input className="field-input"
              value={form.office_address_line1 ?? ''}
              onChange={updateText('office_address_line1')} />
          </Field>
          <Field label={t.pan.officeAddressLine2}>
            <input className="field-input"
              value={form.office_address_line2 ?? ''}
              onChange={updateText('office_address_line2')} />
          </Field>
          <Field label={t.pan.officeCity}>
            <input className="field-input"
              value={form.office_city ?? ''}
              onChange={updateText('office_city')} />
          </Field>
          <Field label={t.pan.officeState}>
            <input className="field-input"
              value={form.office_state ?? ''}
              onChange={updateText('office_state')} />
          </Field>
          <Field label={t.pan.officePincode}>
            <input className="field-input" inputMode="numeric" maxLength={6}
              value={form.office_pincode ?? ''}
              onChange={updateText('office_pincode')} />
          </Field>
          <Field label={t.pan.officeCountry}>
            <input className="field-input"
              value={form.office_country ?? ''}
              onChange={updateText('office_country')} />
          </Field>
        </div>
      </details>

      {sectionTitle(t.pan.sectionKyc)}

      <Field label={t.pan.kycMode}>
        <select className="field-input" value={form.kyc_mode}
          onChange={(e) => update('kyc_mode', e.target.value as PanKycMode)}>
          {KYC_MODES.map((k) => (
            <option key={k} value={k}>{t.pan.kycModeLabels[k]}</option>
          ))}
        </select>
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={t.pan.deliveryMode}>
          <select className="field-input" value={form.pan_card_delivery_mode}
            onChange={(e) => update('pan_card_delivery_mode', e.target.value as PanDeliveryMode)}>
            {DELIVERY_MODES.map((d) => (
              <option key={d} value={d}>{t.pan.deliveryModeLabels[d]}</option>
            ))}
          </select>
        </Field>
        <Field label={t.pan.signatureName}>
          <input className="field-input"
            value={form.signature_name ?? ''}
            onChange={updateText('signature_name')} />
        </Field>
      </div>

      <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
        <input
          type="checkbox"
          checked={form.physical_pan_required}
          onChange={(e) => update('physical_pan_required', e.target.checked)}
          className="h-4 w-4 rounded border-slate-300 text-teal-700 focus:ring-teal-600"
        />
        <span className="text-sm font-medium text-slate-700">{t.pan.physicalPanRequired}</span>
      </label>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
        <p className="text-sm leading-relaxed text-slate-700">{t.pan.declaration}</p>
        <label className="mt-4 flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={form._acceptDeclaration}
            onChange={(e) => update('_acceptDeclaration', e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-teal-700 focus:ring-teal-600"
          />
          <span className="text-sm font-semibold text-slate-900">{t.pan.declarationAccept}</span>
        </label>
      </div>

      <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-900">
        {t.pan.demoNotice}
      </p>

      {error && <Notice tone="rose">{error}</Notice>}

      <Button type="submit" loading={busy} disabled={busy} className="w-full sm:w-auto">
        <Send className="h-4 w-4" aria-hidden="true" />
        {busy ? t.pan.submittingPan : t.pan.submitPan}
      </Button>
    </form>
  );
}
