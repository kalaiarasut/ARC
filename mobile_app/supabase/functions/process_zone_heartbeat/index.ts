/// <reference path="../types.d.ts" />

import {
  handleCors,
  jsonResponse,
  requireAuthenticatedUser,
} from "../_shared_admin.ts";

type ZoneRow = {
  id: string;
  name: string;
  shape: "circle" | "polygon";
  center_lat: number | null;
  center_lng: number | null;
  radius_meters: number | null;
  polygon_points: Array<{ lat: number; lng: number }> | null;
};

type HeartbeatPayload = {
  device_id?: string;
  latitude?: number;
  longitude?: number;
  accuracy_meters?: number | null;
  observed_at?: string | null;
  source?: "foreground" | "background";
};

type TransitionRow = {
  event_id: string;
  zone_id: string;
  zone_name: string;
  event_type: "entered" | "exited";
  occurred_at: string;
};

type PushTokenRow = {
  id: string;
  language_code: string | null;
};

const EARTH_RADIUS_METERS = 6371000;

const transitionCopy: Record<string, Record<"entered" | "exited", { title: string; body: (zoneName: string) => string }>> = {
  en: {
    entered: {
      title: "Entered monitoring zone",
      body: (zoneName) => `You entered ${zoneName}. Stay alert and follow official guidance.`,
    },
    exited: {
      title: "Exited monitoring zone",
      body: (zoneName) => `You left ${zoneName}. Keep checking nearby advisories and conditions.`,
    },
  },
  bn: {
    entered: {
      title: "পর্যবেক্ষণ এলাকায় প্রবেশ করেছেন",
      body: (zoneName) => `আপনি ${zoneName} এলাকায় প্রবেশ করেছেন। সতর্ক থাকুন এবং সরকারি নির্দেশনা অনুসরণ করুন।`,
    },
    exited: {
      title: "পর্যবেক্ষণ এলাকা ছেড়েছেন",
      body: (zoneName) => `আপনি ${zoneName} এলাকা ছেড়েছেন। আশপাশের সতর্কতা ও পরিস্থিতি দেখে চলুন।`,
    },
  },
  gu: {
    entered: {
      title: "મોનીટરીંગ ઝોનમાં પ્રવેશ કર્યો",
      body: (zoneName) => `તમે ${zoneName} માં પ્રવેશ કર્યો છે. સાવચેત રહો અને સત્તાવાર સૂચનાઓનું પાલન કરો.`,
    },
    exited: {
      title: "મોનીટરીંગ ઝોનમાંથી બહાર નીકળ્યા",
      body: (zoneName) => `તમે ${zoneName} છોડ્યું છે. નજીકની ચેતવણીઓ અને સ્થિતિ પર નજર રાખો.`,
    },
  },
  hi: {
    entered: {
      title: "मॉनिटरिंग ज़ोन में प्रवेश",
      body: (zoneName) => `आप ${zoneName} में प्रवेश कर चुके हैं। सतर्क रहें और आधिकारिक निर्देशों का पालन करें।`,
    },
    exited: {
      title: "मॉनिटरिंग ज़ोन से बाहर निकले",
      body: (zoneName) => `आप ${zoneName} से बाहर आ गए हैं। आसपास की सलाह और स्थिति देखते रहें।`,
    },
  },
  kn: {
    entered: {
      title: "ನಿಗಾವಹಿಸುವ ವಲಯಕ್ಕೆ ಪ್ರವೇಶಿಸಲಾಗಿದೆ",
      body: (zoneName) => `ನೀವು ${zoneName} ವಲಯಕ್ಕೆ ಪ್ರವೇಶಿದ್ದೀರಿ. ಎಚ್ಚರಿಕೆಯಿಂದಿರಿ ಮತ್ತು ಅಧಿಕೃತ ಸೂಚನೆಗಳನ್ನು ಅನುಸರಿಸಿ.`,
    },
    exited: {
      title: "ನಿಗಾವಹಿಸುವ ವಲಯದಿಂದ ಹೊರಬಂದಿದ್ದೀರಿ",
      body: (zoneName) => `ನೀವು ${zoneName} ವಲಯವನ್ನು ಬಿಟ್ಟಿದ್ದೀರಿ. ಸುತ್ತಮುತ್ತಲಿನ ಎಚ್ಚರಿಕೆಗಳನ್ನು ಗಮನಿಸಿ.`,
    },
  },
  ml: {
    entered: {
      title: "നിരീക്ഷണ മേഖലയിലേക്ക് പ്രവേശിച്ചു",
      body: (zoneName) => `നിങ്ങൾ ${zoneName} മേഖലയിലേക്ക് പ്രവേശിച്ചു. ജാഗ്രത പാലിക്കുകയും ഔദ്യോഗിക നിർദ്ദേശങ്ങൾ പിന്തുടരുകയും ചെയ്യുക.`,
    },
    exited: {
      title: "നിരീക്ഷണ മേഖല വിട്ടു",
      body: (zoneName) => `നിങ്ങൾ ${zoneName} മേഖല വിട്ടു. സമീപത്തെ മുന്നറിയിപ്പുകളും സാഹചര്യങ്ങളും ശ്രദ്ധിക്കുക.`,
    },
  },
  mr: {
    entered: {
      title: "निरीक्षण क्षेत्रात प्रवेश",
      body: (zoneName) => `तुम्ही ${zoneName} मध्ये प्रवेश केला आहे. सतर्क राहा आणि अधिकृत सूचनांचे पालन करा.`,
    },
    exited: {
      title: "निरीक्षण क्षेत्रातून बाहेर पडलात",
      body: (zoneName) => `तुम्ही ${zoneName} सोडले आहे. जवळच्या सूचना आणि परिस्थितीवर लक्ष ठेवा.`,
    },
  },
  or: {
    entered: {
      title: "ନିରୀକ୍ଷଣ ଅଞ୍ଚଳରେ ପ୍ରବେଶ କରିଛନ୍ତି",
      body: (zoneName) => `ଆପଣ ${zoneName} ଅଞ୍ଚଳରେ ପ୍ରବେଶ କରିଛନ୍ତି। ସତର୍କ ରୁହନ୍ତୁ ଏବଂ ଆଧିକାରିକ ନିର୍ଦ୍ଦେଶ ମାନନ୍ତୁ।`,
    },
    exited: {
      title: "ନିରୀକ୍ଷଣ ଅଞ୍ଚଳ ଛାଡ଼ିଛନ୍ତି",
      body: (zoneName) => `ଆପଣ ${zoneName} ଅଞ୍ଚଳ ଛାଡ଼ିଛନ୍ତି। ନିକଟସ୍ଥ ସତର୍କତା ଏବଂ ପରିସ୍ଥିତି ଦେଖୁଥାନ୍ତୁ।`,
    },
  },
  ta: {
    entered: {
      title: "கண்காணிப்பு பகுதியிற்குள் நுழைந்துள்ளீர்கள்",
      body: (zoneName) => `நீங்கள் ${zoneName} பகுதிக்குள் நுழைந்துள்ளீர்கள். எச்சரிக்கையுடன் இருந்து அதிகாரப்பூர்வ அறிவுறுத்தல்களை பின்பற்றுங்கள்.`,
    },
    exited: {
      title: "கண்காணிப்பு பகுதியை விட்டு வெளியேறியுள்ளீர்கள்",
      body: (zoneName) => `நீங்கள் ${zoneName} பகுதியை விட்டு வெளியேறியுள்ளீர்கள். அருகிலுள்ள அறிவுறுத்தல்களை தொடர்ந்து கவனியுங்கள்.`,
    },
  },
  te: {
    entered: {
      title: "పర్యవేక్షణ ప్రాంతంలోకి ప్రవేశించారు",
      body: (zoneName) => `మీరు ${zoneName} ప్రాంతంలోకి ప్రవేశించారు. అప్రమత్తంగా ఉండి అధికారిక సూచనలను అనుసరించండి.`,
    },
    exited: {
      title: "పర్యవేక్షణ ప్రాంతం నుండి బయటకు వచ్చారు",
      body: (zoneName) => `మీరు ${zoneName} ప్రాంతాన్ని విడిచారు. సమీప సూచనలు మరియు పరిస్థితులను గమనించండి.`,
    },
  },
};

function normalizeLanguageCode(languageCode: string | null | undefined): string {
  const code = String(languageCode ?? "en").trim().toLowerCase();
  return transitionCopy[code] ? code : "en";
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function haversineDistanceMeters(aLat: number, aLng: number, bLat: number, bLng: number) {
  const dLat = toRadians(bLat - aLat);
  const dLng = toRadians(bLng - aLng);
  const lat1 = toRadians(aLat);
  const lat2 = toRadians(bLat);

  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const inner = sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLng * sinLng;
  const arc = 2 * Math.atan2(Math.sqrt(inner), Math.sqrt(1 - inner));
  return EARTH_RADIUS_METERS * arc;
}

function isPointInPolygon(
  latitude: number,
  longitude: number,
  polygonPoints: Array<{ lat: number; lng: number }>,
) {
  if (polygonPoints.length < 3) return false;

  let inside = false;
  for (let i = 0, j = polygonPoints.length - 1; i < polygonPoints.length; j = i++) {
    const xi = polygonPoints[i].lng;
    const yi = polygonPoints[i].lat;
    const xj = polygonPoints[j].lng;
    const yj = polygonPoints[j].lat;

    const intersects =
      yi > latitude !== yj > latitude &&
      longitude < ((xj - xi) * (latitude - yi)) / ((yj - yi) || Number.EPSILON) + xi;

    if (intersects) inside = !inside;
  }

  return inside;
}

function isPointInZone(zone: ZoneRow, latitude: number, longitude: number) {
  if (zone.shape === "polygon") {
    return isPointInPolygon(latitude, longitude, zone.polygon_points ?? []);
  }

  if (zone.center_lat == null || zone.center_lng == null || zone.radius_meters == null) {
    return false;
  }

  return haversineDistanceMeters(latitude, longitude, zone.center_lat, zone.center_lng) <= zone.radius_meters;
}

function parsePayload(body: unknown): HeartbeatPayload | null {
  if (!body || typeof body !== "object") return null;
  return body as HeartbeatPayload;
}

Deno.serve(async (request: Request) => {
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const auth = await requireAuthenticatedUser(request);
  if (auth instanceof Response) return auth;

  const payload = parsePayload(await request.json().catch(() => null));
  const deviceId = String(payload?.device_id ?? "").trim();
  const latitude = Number(payload?.latitude);
  const longitude = Number(payload?.longitude);
  const accuracyMeters = payload?.accuracy_meters == null ? null : Number(payload.accuracy_meters);
  const observedAt = String(payload?.observed_at ?? "").trim();
  const source = payload?.source === "background" ? "background" : "foreground";

  if (!deviceId) {
    return jsonResponse({ error: "device_id is required" }, 400);
  }
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return jsonResponse({ error: "latitude and longitude are required" }, 400);
  }

  const { data: zones, error: zonesError } = await auth.supabase
    .from("monitoring_zones")
    .select("id,name,shape,center_lat,center_lng,radius_meters,polygon_points");

  if (zonesError) {
    return jsonResponse({ error: zonesError.message }, 500);
  }

  const normalizedZones = ((zones as ZoneRow[] | null) ?? []).filter((zone) => zone.id);
  const insideZoneIds = normalizedZones
    .filter((zone) => isPointInZone(zone, latitude, longitude))
    .map((zone) => zone.id);

  const { data: transitions, error: transitionError } = await auth.supabase.rpc(
    "process_zone_heartbeat_state",
    {
      p_device_id: deviceId,
      p_latitude: latitude,
      p_longitude: longitude,
      p_accuracy_meters: Number.isFinite(accuracyMeters ?? Number.NaN) ? accuracyMeters : null,
      p_observed_at: observedAt || new Date().toISOString(),
      p_source: source,
      p_inside_zone_ids: insideZoneIds,
    },
  );

  if (transitionError) {
    return jsonResponse({ error: transitionError.message }, 500);
  }

  const transitionRows = (transitions as TransitionRow[] | null) ?? [];

  if (transitionRows.length === 0) {
    return jsonResponse({
      transitions: [],
      inside_zone_ids: insideZoneIds,
    });
  }

  const { data: pushToken, error: pushTokenError } = await auth.supabase
    .from("push_tokens")
    .select("id,language_code")
    .eq("user_id", auth.user.id)
    .eq("device_id", deviceId)
    .eq("enabled", true)
    .maybeSingle();

  if (pushTokenError) {
    return jsonResponse({ error: pushTokenError.message }, 500);
  }

  const activePushToken = (pushToken as PushTokenRow | null) ?? null;

  for (const transition of transitionRows) {
    if (!activePushToken) {
      await auth.supabase
        .from("zone_transition_events")
        .update({ delivery_status: "skipped" })
        .eq("id", transition.event_id);
      continue;
    }

    const languageCode = normalizeLanguageCode(activePushToken.language_code);
    const localized = transitionCopy[languageCode][transition.event_type] ?? transitionCopy.en[transition.event_type];

    const { data: outboxRows, error: outboxError } = await auth.supabase
      .from("notification_outbox")
      .insert({
        push_token_id: activePushToken.id,
        user_id: auth.user.id,
        type: "zone_transition",
        title: localized.title,
        body: localized.body(transition.zone_name),
        data: {
          transition_event_id: transition.event_id,
          zone_id: transition.zone_id,
          zone_name: transition.zone_name,
          event_type: transition.event_type,
          device_id: deviceId,
          latitude: latitude,
          longitude: longitude,
          source,
        },
      })
      .select("id");

    if (outboxError) {
      await auth.supabase
        .from("zone_transition_events")
        .update({ delivery_status: "failed" })
        .eq("id", transition.event_id);
      continue;
    }

    const outboxId = Array.isArray(outboxRows) && outboxRows[0]?.id
      ? String(outboxRows[0].id)
      : null;

    await auth.supabase
      .from("zone_transition_events")
      .update({
        delivery_status: outboxId ? "queued" : "failed",
        notification_outbox_id: outboxId,
      })
      .eq("id", transition.event_id);
  }

  return jsonResponse({
    transitions: transitionRows,
    inside_zone_ids: insideZoneIds,
  });
});
