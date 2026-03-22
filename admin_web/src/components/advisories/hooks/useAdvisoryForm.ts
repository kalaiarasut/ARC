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

const initialFormState: AdvisoryFormState = {
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
};

export interface UseAdvisoryFormReturn {
  form: AdvisoryFormState;
  setForm: React.Dispatch<React.SetStateAction<AdvisoryFormState>>;
  updateField: <K extends keyof AdvisoryFormState>(field: K, value: AdvisoryFormState[K]) => void;
  resetForm: () => void;
  isSourceReady: boolean;
  parseNullableNumber: (value: string) => number | null;
  toIsoOrNull: (value: string) => string | null;
}

export function useAdvisoryForm(
  onSourceChange?: () => void
): UseAdvisoryFormReturn {
  const [form, setForm] = useState<AdvisoryFormState>(initialFormState);

  const updateField = useCallback(
    <K extends keyof AdvisoryFormState>(field: K, value: AdvisoryFormState[K]) => {
      setForm((prev) => {
        const next = { ...prev, [field]: value };
        // Trigger callback when source content changes
        if (onSourceChange && (field === 'title' || field === 'body' || field === 'region')) {
          onSourceChange();
        }
        return next;
      });
    },
    [onSourceChange]
  );

  const resetForm = useCallback(() => {
    setForm(initialFormState);
  }, []);

  const isSourceReady = form.title.trim().length > 0 && form.body.trim().length > 0;

  const parseNullableNumber = useCallback((value: string): number | null => {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }, []);

  const toIsoOrNull = useCallback((value: string): string | null => {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = new Date(trimmed);
    return Number.isFinite(parsed.getTime()) ? parsed.toISOString() : null;
  }, []);

  return {
    form,
    setForm,
    updateField,
    resetForm,
    isSourceReady,
    parseNullableNumber,
    toIsoOrNull,
  };
}
