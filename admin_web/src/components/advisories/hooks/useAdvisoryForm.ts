import { useCallback, useState } from 'react';
import type { AdvisoryCategory, AdvisorySeverity } from '../../../types/advisory';

export interface AdvisoryFormState {
  title: string;
  body: string;
  region: string;
  category: AdvisoryCategory;
  severity: AdvisorySeverity;
  lat: string;
  lng: string;
  radius: string;
  startsAt: string;
  expiresAt: string;
  phone: string;
  whatsapp: string;
  hotline: string;
}

export interface UseAdvisoryFormReturn {
  form: AdvisoryFormState;
  updateField: <K extends keyof AdvisoryFormState>(field: K, value: AdvisoryFormState[K]) => void;
  setFormValues: (next: AdvisoryFormState) => void;
  resetForm: () => void;
  isSourceReady: boolean;
  parseNullableNumber: (value: string) => number | null;
  toIsoOrNull: (value: string) => string | null;
}

export function useAdvisoryForm(onFormChange?: () => void): UseAdvisoryFormReturn {
  const [form, setForm] = useState<AdvisoryFormState>({
    title: '',
    body: '',
    region: '',
    category: 'warning',
    severity: 'info',
    lat: '',
    lng: '',
    radius: '',
    startsAt: '',
    expiresAt: '',
    phone: '',
    whatsapp: '',
    hotline: '',
  });

  const updateField = useCallback(
    <K extends keyof AdvisoryFormState>(field: K, value: AdvisoryFormState[K]) => {
      setForm((prev) => ({ ...prev, [field]: value }));
      onFormChange?.();
    },
    [onFormChange]
  );

  const setFormValues = useCallback(
    (next: AdvisoryFormState) => {
      setForm(next);
      onFormChange?.();
    },
    [onFormChange]
  );

  const resetForm = useCallback(() => {
    setForm({
      title: '',
      body: '',
      region: '',
      category: 'warning',
      severity: 'info',
      lat: '',
      lng: '',
      radius: '',
      startsAt: '',
      expiresAt: '',
      phone: '',
      whatsapp: '',
      hotline: '',
    });
  }, []);

  const isSourceReady = form.title.trim().length > 0 && form.body.trim().length > 0;

  const parseNullableNumber = (value: string): number | null => {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const toIsoOrNull = (value: string): string | null => {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = new Date(trimmed);
    return Number.isFinite(parsed.getTime()) ? parsed.toISOString() : null;
  };

  return {
    form,
    updateField,
    setFormValues,
    resetForm,
    isSourceReady,
    parseNullableNumber,
    toIsoOrNull,
  };
}
