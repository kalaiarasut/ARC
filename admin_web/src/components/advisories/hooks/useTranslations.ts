import { useCallback, useMemo, useState } from 'react';
import type { AdvisoryTranslationDraft, AdvisoryLanguageCode } from '../../../types/advisory';

export const TARGET_LANGUAGES: {
  code: AdvisoryLanguageCode;
  label: string;
  nativeLabel: string;
}[] = [
  { code: 'ta', label: 'Tamil', nativeLabel: 'தமிழ்' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी' },
  { code: 'te', label: 'Telugu', nativeLabel: 'తెలుగు' },
  { code: 'ml', label: 'Malayalam', nativeLabel: 'മലയാളം' },
];

export interface UseTranslationsReturn {
  translations: AdvisoryTranslationDraft[];
  setTranslations: React.Dispatch<React.SetStateAction<AdvisoryTranslationDraft[]>>;
  activeTab: AdvisoryLanguageCode;
  setActiveTab: React.Dispatch<React.SetStateAction<AdvisoryLanguageCode>>;
  clearTranslations: () => void;
  invalidateTranslations: () => void;
  updateTranslation: (
    languageCode: AdvisoryLanguageCode,
    patch: Partial<AdvisoryTranslationDraft>
  ) => void;
  markReviewed: (languageCode: AdvisoryLanguageCode) => boolean;
  markEditable: (languageCode: AdvisoryLanguageCode) => void;
  allReviewed: boolean;
  reviewedCount: number;
  totalCount: number;
  getTranslation: (languageCode: AdvisoryLanguageCode) => AdvisoryTranslationDraft | undefined;
  languages: typeof TARGET_LANGUAGES;
}

export function useTranslations(): UseTranslationsReturn {
  const [translations, setTranslations] = useState<AdvisoryTranslationDraft[]>([]);
  const [activeTab, setActiveTab] = useState<AdvisoryLanguageCode>('ta');

  const clearTranslations = useCallback(() => {
    setTranslations([]);
    setActiveTab('ta');
  }, []);

  const invalidateTranslations = useCallback(() => {
    setTranslations((current) => (current.length === 0 ? current : []));
    setActiveTab((current) => (current === 'ta' ? current : 'ta'));
  }, []);

  const updateTranslation = useCallback(
    (languageCode: AdvisoryLanguageCode, patch: Partial<AdvisoryTranslationDraft>) => {
      setTranslations((current) =>
        current.map((translation) => {
          if (translation.language_code !== languageCode) return translation;

          const next = { ...translation, ...patch };
          const touchedText =
            patch.title !== undefined || patch.body !== undefined || patch.region !== undefined;

          if (touchedText && translation.translation_status === 'reviewed') {
            next.translation_status = 'generated';
          }

          return next;
        })
      );
    },
    []
  );

  const markReviewed = useCallback(
    (languageCode: AdvisoryLanguageCode): boolean => {
      const draft = translations.find((t) => t.language_code === languageCode);

      if (!draft || !draft.title.trim() || !draft.body.trim()) {
        return false;
      }

      updateTranslation(languageCode, {
        translation_status: 'reviewed',
        error: undefined,
      });
      return true;
    },
    [translations, updateTranslation]
  );

  const markEditable = useCallback(
    (languageCode: AdvisoryLanguageCode) => {
      updateTranslation(languageCode, {
        translation_status: 'generated',
        error: undefined,
      });
    },
    [updateTranslation]
  );

  const allReviewed = useMemo(
    () =>
      TARGET_LANGUAGES.every((lang) =>
        translations.some(
          (t) =>
            t.language_code === lang.code &&
            t.translation_status === 'reviewed' &&
            t.title.trim().length > 0 &&
            t.body.trim().length > 0
        )
      ),
    [translations]
  );

  const reviewedCount = useMemo(
    () => translations.filter((t) => t.translation_status === 'reviewed').length,
    [translations]
  );

  const getTranslation = useCallback(
    (languageCode: AdvisoryLanguageCode) =>
      translations.find((t) => t.language_code === languageCode),
    [translations]
  );

  return {
    translations,
    setTranslations,
    activeTab,
    setActiveTab,
    clearTranslations,
    invalidateTranslations,
    updateTranslation,
    markReviewed,
    markEditable,
    allReviewed,
    reviewedCount,
    totalCount: TARGET_LANGUAGES.length,
    getTranslation,
    languages: TARGET_LANGUAGES,
  };
}
