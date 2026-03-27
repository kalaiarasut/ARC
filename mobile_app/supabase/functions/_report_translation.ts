const SARVAM_BASE_URL = Deno.env.get("SARVAM_BASE_URL") ?? "https://api.sarvam.ai";
const SARVAM_API_KEY = Deno.env.get("SARVAM_API_KEY") ?? "";
const TRANSLATE_MODEL = "sarvam-translate:v1";
const MAYURA_MODEL = "mayura:v1";

export const MAX_TRANSLATION_ATTEMPTS = 3;

export type TranslationQueueStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "skipped";

export type TranslationOutcome = {
  status: Extract<TranslationQueueStatus, "completed" | "skipped">;
  detected_language: string | null;
  translated_english: string | null;
  translation_provider: string | null;
  translation_model: string | null;
  translated_at: string | null;
};

export const normalizeLanguageCode = (value: string | null) => {
  const normalized = (value ?? "").trim().toLowerCase();
  if (!normalized) return null;
  if (normalized.startsWith("en")) return "en";
  if (normalized.startsWith("bn")) return "bn";
  if (normalized.startsWith("gu")) return "gu";
  if (normalized.startsWith("hi")) return "hi";
  if (normalized.startsWith("kn")) return "kn";
  if (normalized.startsWith("ml")) return "ml";
  if (normalized.startsWith("mr")) return "mr";
  if (normalized.startsWith("or")) return "or";
  if (normalized.startsWith("ta")) return "ta";
  if (normalized.startsWith("te")) return "te";
  return normalized;
};

const toSarvamLanguageCode = (languageCode: string) => {
  switch (normalizeLanguageCode(languageCode)) {
    case "bn":
      return "bn-IN";
    case "gu":
      return "gu-IN";
    case "hi":
      return "hi-IN";
    case "kn":
      return "kn-IN";
    case "ml":
      return "ml-IN";
    case "mr":
      return "mr-IN";
    case "or":
      return "or-IN";
    case "ta":
      return "ta-IN";
    case "te":
      return "te-IN";
    case "en":
    default:
      return "en-IN";
  }
};

const extractTranslatedText = (payload: any): string | null => {
  if (!payload || typeof payload !== "object") return null;
  const candidates = [
    payload.translated_text,
    payload.translation,
    payload.output,
    payload.output_text,
    payload.data?.translated_text,
    payload.data?.translation,
    payload.translations?.[0]?.translated_text,
    payload.translations?.[0]?.translation,
    payload.outputs?.[0]?.translated_text,
    payload.outputs?.[0]?.text,
  ];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate.trim();
    }
  }
  return null;
};

const getLatinLetterRatio = (text: string) => {
  const letters = text.match(/[A-Za-z]/g)?.length ?? 0;
  const allAlphaNumeric = text.match(/[A-Za-z\p{L}\p{N}]/gu)?.length ?? 0;
  if (allAlphaNumeric === 0) return 0;
  return letters / allAlphaNumeric;
};

const looksEnglish = (text: string) => getLatinLetterRatio(text) > 0.75;

const detectLanguageCode = async (text: string): Promise<string | null> => {
  if (!SARVAM_API_KEY || !text.trim()) return null;

  const response = await fetch(`${SARVAM_BASE_URL}/text-lid`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "api-subscription-key": SARVAM_API_KEY,
    },
    body: JSON.stringify({ input: text }),
  });

  if (!response.ok) return null;
  const payload = await response.json().catch(() => null);
  const candidates = [
    payload?.language_code,
    payload?.language,
    payload?.detected_language,
    payload?.data?.language_code,
    payload?.data?.language,
  ];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return normalizeLanguageCode(candidate);
    }
  }
  return null;
};

const translateText = async (text: string, sourceLanguage: string, model: string) => {
  const response = await fetch(`${SARVAM_BASE_URL}/translate`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "api-subscription-key": SARVAM_API_KEY,
    },
    body: JSON.stringify({
      input: text,
      source_language_code: toSarvamLanguageCode(sourceLanguage),
      target_language_code: toSarvamLanguageCode("en"),
      mode: "formal",
      model,
    }),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.error?.message ?? payload?.message ?? `Sarvam request failed (${response.status})`);
  }

  const translated = extractTranslatedText(payload);
  if (!translated) {
    throw new Error("Sarvam returned no translated text");
  }

  return translated;
};

export const computeNextRetryAt = (attempts: number) => {
  const backoffMinutes = attempts >= 3 ? 60 : attempts === 2 ? 15 : 5;
  return new Date(Date.now() + backoffMinutes * 60_000).toISOString();
};

export const translateReportDescription = async (description: string): Promise<TranslationOutcome> => {
  if (!SARVAM_API_KEY) {
    throw new Error("Missing SARVAM_API_KEY");
  }

  const originalDescription = description.trim();
  if (!originalDescription) {
    return {
      status: "skipped",
      detected_language: null,
      translated_english: null,
      translation_provider: null,
      translation_model: null,
      translated_at: null,
    };
  }

  let detectedLanguage = await detectLanguageCode(originalDescription);
  if (!detectedLanguage && looksEnglish(originalDescription)) {
    detectedLanguage = "en";
  }
  detectedLanguage ??= "en";

  if (detectedLanguage === "en") {
    return {
      status: "completed",
      detected_language: detectedLanguage,
      translated_english: originalDescription,
      translation_provider: "identity",
      translation_model: "identity",
      translated_at: new Date().toISOString(),
    };
  }

  let translatedEnglish = await translateText(originalDescription, detectedLanguage, TRANSLATE_MODEL);
  let translationModel = TRANSLATE_MODEL;

  if (!translatedEnglish.trim() || !looksEnglish(translatedEnglish)) {
    translatedEnglish = await translateText(originalDescription, detectedLanguage, MAYURA_MODEL);
    translationModel = MAYURA_MODEL;
  }

  return {
    status: "completed",
    detected_language: detectedLanguage,
    translated_english: translatedEnglish,
    translation_provider: "sarvam",
    translation_model: translationModel,
    translated_at: new Date().toISOString(),
  };
};
