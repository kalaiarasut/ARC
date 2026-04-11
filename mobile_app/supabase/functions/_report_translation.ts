const DEFAULT_SARVAM_BASE_URL = "https://api.sarvam.ai";
const SARVAM_BASE_URL = Deno.env.get("SARVAM_BASE_URL") ?? DEFAULT_SARVAM_BASE_URL;
const SARVAM_API_KEYS = (Deno.env.get("SARVAM_API_KEYS") ?? "")
  .split(",")
  .map((item) => item.trim())
  .filter((item) => item.length > 0);
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
  if (
    normalized.startsWith("od") ||
    normalized.startsWith("ory") ||
    normalized.startsWith("odia") ||
    normalized.startsWith("oriya")
  ) return "or";
  if (normalized.startsWith("or")) return "or";
  if (normalized.startsWith("ta")) return "ta";
  if (normalized.startsWith("te")) return "te";
  return normalized;
};

const normalizeBaseUrl = (value: string) => value.trim().replace(/\/+$/, "");

let sarvamKeyCursor = 0;

const getSarvamApiKeys = () => {
  const candidates = [...SARVAM_API_KEYS, SARVAM_API_KEY]
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
  return Array.from(new Set(candidates));
};

const getRotatedSarvamApiKeys = () => {
  const keys = getSarvamApiKeys();
  if (keys.length <= 1) return keys;

  const start = sarvamKeyCursor % keys.length;
  sarvamKeyCursor = (sarvamKeyCursor + 1) % keys.length;

  return [...keys.slice(start), ...keys.slice(0, start)];
};

const isRetryableSarvamStatus = (status: number) =>
  status === 401 ||
  status === 403 ||
  status === 408 ||
  status === 409 ||
  status === 425 ||
  status === 429 ||
  status >= 500;

const sarvamPost = async (path: string, body: Record<string, unknown>) => {
  const baseUrl = normalizeBaseUrl(SARVAM_BASE_URL || DEFAULT_SARVAM_BASE_URL);
  const apiKeys = getRotatedSarvamApiKeys();
  if (apiKeys.length === 0) {
    throw new Error("Missing SARVAM_API_KEY or SARVAM_API_KEYS");
  }

  let lastError: Error | null = null;

  for (const apiKey of apiKeys) {
    const maskedKeySuffix = apiKey.length >= 4 ? apiKey.slice(-4) : "***";
    const url = `${baseUrl}${path}`;
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "api-subscription-key": apiKey,
        },
        body: JSON.stringify(body),
      });

      const payload = await response.json().catch(() => null);
      if (response.ok) {
        return { payload, baseUrl };
      }

      const message =
        payload?.error?.message ??
        payload?.message ??
        `Sarvam request failed (${response.status})`;
      const error = new Error(`${message} @ ${baseUrl}${path} [key:${maskedKeySuffix}]`);

      if (!isRetryableSarvamStatus(response.status)) {
        (error as Error & { nonRetryable?: boolean }).nonRetryable = true;
        throw error;
      }

      lastError = error;
    } catch (error) {
      if ((error as Error & { nonRetryable?: boolean })?.nonRetryable) {
        throw error;
      }
      lastError =
        error instanceof Error
          ? error
          : new Error(`Sarvam request failed @ ${baseUrl}${path} [key:${maskedKeySuffix}]`);
    }
  }

  throw lastError ?? new Error(`Sarvam request failed for ${path}`);
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
      return "od-IN";
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

const inferLanguageFromScript = (text: string): string | null => {
  const scriptCounts = {
    bn: text.match(/[\u0980-\u09FF]/g)?.length ?? 0,
    gu: text.match(/[\u0A80-\u0AFF]/g)?.length ?? 0,
    or: text.match(/[\u0B00-\u0B7F]/g)?.length ?? 0,
    ta: text.match(/[\u0B80-\u0BFF]/g)?.length ?? 0,
    te: text.match(/[\u0C00-\u0C7F]/g)?.length ?? 0,
    kn: text.match(/[\u0C80-\u0CFF]/g)?.length ?? 0,
    ml: text.match(/[\u0D00-\u0D7F]/g)?.length ?? 0,
  } as const;

  const topEntry = Object.entries(scriptCounts).sort((a, b) => b[1] - a[1])[0];
  if (!topEntry) return null;

  const [language, count] = topEntry;
  if (count < 8) return null;
  return language;
};

const detectLanguageCode = async (text: string): Promise<string | null> => {
  if (getSarvamApiKeys().length === 0 || !text.trim()) return null;

  let payload: any = null;
  try {
    ({ payload } = await sarvamPost("/text-lid", { input: text }));
  } catch {
    return null;
  }
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
  const { payload } = await sarvamPost("/translate", {
    input: text,
    source_language_code: toSarvamLanguageCode(sourceLanguage),
    target_language_code: toSarvamLanguageCode("en"),
    mode: "formal",
    model,
  });

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
  if (getSarvamApiKeys().length === 0) {
    throw new Error("Missing SARVAM_API_KEY or SARVAM_API_KEYS");
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
  const scriptInferredLanguage = inferLanguageFromScript(originalDescription);

  if (detectedLanguage === "en" && scriptInferredLanguage && scriptInferredLanguage !== "en") {
    detectedLanguage = scriptInferredLanguage;
  }

  if (!detectedLanguage && scriptInferredLanguage) {
    detectedLanguage = scriptInferredLanguage;
  }

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
