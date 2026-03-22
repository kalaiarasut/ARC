/// <reference path="../types.d.ts" />

import { handleCors, jsonResponse, requireAdmin } from "../_shared_admin.ts";

type TargetLanguage = "ta" | "hi" | "te" | "ml";

type TranslationDraft = {
  language_code: TargetLanguage;
  title: string;
  body: string;
  region: string | null;
  translation_status: "generated" | "failed";
  provider: string | null;
  model: string | null;
  error?: string;
};

const SARVAM_BASE_URL = Deno.env.get("SARVAM_BASE_URL") ?? "https://api.sarvam.ai";
const SARVAM_API_KEY = Deno.env.get("SARVAM_API_KEY") ?? "";
const SUPPORTED_TARGETS: TargetLanguage[] = ["ta", "hi", "te", "ml"];
const TRANSLATE_MODEL = "sarvam-translate:v1";
const MAYURA_MODEL = "mayura:v1";

const toSarvamLanguageCode = (languageCode: TargetLanguage | "en") => {
  switch (languageCode) {
    case "ta":
      return "ta-IN";
    case "hi":
      return "hi-IN";
    case "te":
      return "te-IN";
    case "ml":
      return "ml-IN";
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

const looksInvalidTranslation = (input: string, translated: string) => {
  const source = input.trim().toLowerCase();
  const output = translated.trim().toLowerCase();
  if (!output) return true;
  if (source && source === output) return true;
  return getLatinLetterRatio(translated) > 0.75;
};

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
      return candidate.trim().toLowerCase();
    }
  }
  return null;
};

const translateText = async (text: string, targetLanguage: TargetLanguage, model: string) => {
  const response = await fetch(`${SARVAM_BASE_URL}/translate`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "api-subscription-key": SARVAM_API_KEY,
    },
    body: JSON.stringify({
      input: text,
      source_language_code: toSarvamLanguageCode("en"),
      target_language_code: toSarvamLanguageCode(targetLanguage),
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

const translateFieldWithFallback = async (text: string, targetLanguage: TargetLanguage) => {
  if (!text.trim()) {
    return { text: "", provider: null, model: null };
  }

  let translated = await translateText(text, targetLanguage, TRANSLATE_MODEL);
  let model = TRANSLATE_MODEL;

  const detected = await detectLanguageCode(translated);
  const expected = toSarvamLanguageCode(targetLanguage).toLowerCase();
  const invalid = looksInvalidTranslation(text, translated) || (detected != null && detected !== expected);

  if (invalid) {
    translated = await translateText(text, targetLanguage, MAYURA_MODEL);
    model = MAYURA_MODEL;
  }

  return { text: translated, provider: "sarvam", model };
};

Deno.serve(async (request: Request) => {
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  if (!SARVAM_API_KEY) {
    return jsonResponse({ error: "Missing SARVAM_API_KEY" }, 500);
  }

  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;

  const payload = await request.json().catch(() => null);
  const title = String(payload?.title ?? "").trim();
  const body = String(payload?.body ?? "").trim();
  const region = String(payload?.region ?? "").trim();
  const requestedTargets = Array.isArray(payload?.target_languages)
    ? payload.target_languages.filter((code: unknown): code is TargetLanguage =>
        typeof code === "string" && SUPPORTED_TARGETS.includes(code as TargetLanguage),
      )
    : SUPPORTED_TARGETS;

  if (!title || !body) {
    return jsonResponse({ error: "title and body are required" }, 400);
  }

  const uniqueTargets = Array.from(new Set(requestedTargets));
  if (uniqueTargets.length === 0) {
    return jsonResponse({ error: "At least one supported target language is required" }, 400);
  }

  const translations: TranslationDraft[] = [];

  for (const language_code of uniqueTargets) {
    try {
      const translatedTitle = await translateFieldWithFallback(title, language_code);
      const translatedBody = await translateFieldWithFallback(body, language_code);
      const translatedRegion = region ? await translateFieldWithFallback(region, language_code) : { text: "", provider: null, model: null };

      translations.push({
        language_code,
        title: translatedTitle.text,
        body: translatedBody.text,
        region: region ? translatedRegion.text : null,
        translation_status: "generated",
        provider: translatedBody.provider ?? translatedTitle.provider,
        model: translatedBody.model ?? translatedTitle.model,
      });
    } catch (error) {
      translations.push({
        language_code,
        title: "",
        body: "",
        region: region || null,
        translation_status: "failed",
        provider: "sarvam",
        model: null,
        error: error instanceof Error ? error.message : "Unknown translation error",
      });
    }
  }

  return jsonResponse({
    source_language: "en",
    translations,
  });
});
