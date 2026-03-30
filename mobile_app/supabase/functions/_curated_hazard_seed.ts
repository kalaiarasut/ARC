export type SeedLanguage = "en" | "bn" | "gu" | "hi" | "kn" | "ml" | "mr" | "or" | "ta" | "te";
export type SeedHazardType = "High Waves" | "Tsunami" | "Storm" | "Flood" | "Other";
export type SeedUrgency = "Low" | "Medium" | "High";
export type SeedStatus = "pending" | "verified" | "rejected" | "resolved";

export type SeedReporterProfile = {
  key: string;
  language: SeedLanguage;
  email: string;
  password: string;
  user_name: string;
  user_phone: string;
};

export type SeedMediaAsset = {
  key: string;
  kind: "image" | "video";
  download_url: string;
  source_page_url: string;
  storage_file_name: string;
};

export type SeedRecord = {
  key: string;
  language: SeedLanguage;
  reporter_key: string;
  hazard_type: SeedHazardType;
  description: string;
  latitude: number;
  longitude: number;
  is_high_risk: boolean;
  people_at_risk: number | null;
  urgency_level: SeedUrgency;
  status: SeedStatus;
  event_time: string;
  created_at: string;
  media_asset_keys?: string[];
};

type EnglishVariationSet = {
  older: string[];
  media: string[];
};

type Scenario = {
  key: string;
  hazard_type: SeedHazardType;
  urgency_level: SeedUrgency;
  status: SeedStatus;
  is_high_risk: boolean;
  people_at_risk: number | null;
  latitude: number;
  longitude: number;
  event_offset_hours: number;
  create_delay_minutes: number;
  translated_english: string;
};

export const CURATED_SEED_VERSION = "curated-v1";
export const CURATED_SEED_DEVICE_PREFIX = `seed-curated:${CURATED_SEED_VERSION}`;

export const SUPPORTED_SEED_LANGUAGES: SeedLanguage[] = [
  "en",
  "bn",
  "gu",
  "hi",
  "kn",
  "ml",
  "mr",
  "or",
  "ta",
  "te",
];

const commonsFileUrl = (fileName: string, width?: number) => {
  const encoded = encodeURIComponent(fileName);
  return width
    ? `https://commons.wikimedia.org/wiki/Special:FilePath/${encoded}?width=${width}`
    : `https://commons.wikimedia.org/wiki/Special:FilePath/${encoded}`;
};

const commonsPageUrl = (fileName: string) =>
  `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(fileName).replace(/%20/g, "_")}`;

const makeImageAsset = (key: string, fileName: string, width = 1600): SeedMediaAsset => ({
  key,
  kind: "image",
  download_url: commonsFileUrl(fileName, width),
  source_page_url: commonsPageUrl(fileName),
  storage_file_name: fileName,
});

const makeVideoAsset = (key: string, fileName: string): SeedMediaAsset => ({
  key,
  kind: "video",
  download_url: commonsFileUrl(fileName),
  source_page_url: commonsPageUrl(fileName),
  storage_file_name: fileName,
});

export const SEED_MEDIA_ASSETS: Record<string, SeedMediaAsset> = {
  wave01: makeImageAsset("wave01", "Storm Surge, 200 miles away (2951065260).jpg"),
  wave02: makeImageAsset("wave02", "Waves.jpg", 1280),
  wave03: makeImageAsset("wave03", "Storm Surge (29317162487).jpg"),
  wave04: makeImageAsset("wave04", "Waves (38853036730).jpg"),
  wave05: makeImageAsset("wave05", "1938 Hurricane Storm Surge.jpg"),
  wave06: makeImageAsset("wave06", "WAVES.jpg"),
  wave07: makeImageAsset("wave07", "The Wave (5206692311).jpg"),
  wave08: makeImageAsset("wave08", "Waves (4539608377).jpg"),
  wave09: makeImageAsset("wave09", "Ocean waves.jpg"),
  wave10: makeImageAsset("wave10", "Breaking waves, Sète cf03.jpg"),
  wavev01: makeVideoAsset("wavev01", "Roll-Waves rain street.webm"),
  wavev02: makeVideoAsset("wavev02", "2022 Malaysian east coast floods (Pasir Puteh, Kelantan).webm"),
  wavev03: makeVideoAsset("wavev03", "Double Slit Wave Visualization.webm"),
  wavev04: makeVideoAsset("wavev04", "Iraq dust storm 20090705.ogv"),
  wavev05: makeVideoAsset("wavev05", "Rain in Rome 36.webm"),
  wavev06: makeVideoAsset("wavev06", "Roll-Waves in the Diessbach Conduit.webm"),
  wavev07: makeVideoAsset("wavev07", "Girls drying books affected by 2019 flood in Sangli.webm"),
  wavev08: makeVideoAsset("wavev08", "Bells Rapids in flood 2017.ogv"),
  wavev09: makeVideoAsset("wavev09", "Rain in Thiruvananthapuram.webm"),
  wavev10: makeVideoAsset("wavev10", "Flood Night.webm"),
  flood01: makeImageAsset("flood01", "Flooded Road.jpg"),
  flood02: makeImageAsset("flood02", "Flooded road.jpg"),
  flood03: makeImageAsset("flood03", "Flooded road (2400509690).jpg"),
  flood04: makeImageAsset("flood04", "Flood on the road.jpg"),
  flood05: makeImageAsset("flood05", "Storm Surge (54366082228).jpg"),
  flood06: makeImageAsset("flood06", "Flood Water on Main road.jpg"),
  flood07: makeImageAsset("flood07", "Flood affected road.jpg"),
  flood08: makeImageAsset("flood08", "The Rough Sea.jpg"),
  flood09: makeImageAsset("flood09", "Flood affected road (a).jpg"),
  flood10: makeImageAsset("flood10", "Road Over the Flood - geograph.org.uk - 292070.jpg"),
  floodv01: makeVideoAsset("floodv01", "Water Waves Greece.ogv"),
  floodv02: makeVideoAsset("floodv02", "Rain at Wikimania Esino Lario 2.webm"),
  floodv03: makeVideoAsset("floodv03", "Rainfall 2.webm"),
  floodv04: makeVideoAsset("floodv04", "Flood in Soan river.webm"),
  floodv05: makeVideoAsset("floodv05", "Rain in Rome 37.webm"),
  floodv06: makeVideoAsset("floodv06", "Tonga Volcano Tsunami 15 January 2022.webm"),
  floodv07: makeVideoAsset("floodv07", "Flood in Gurama Quarter.webm"),
  floodv08: makeVideoAsset("floodv08", "Seaside Italy Video.webm"),
  floodv09: makeVideoAsset("floodv09", "1938 flood at Olive.webm"),
  floodv10: makeVideoAsset("floodv10", "Flood on the street.webm"),
};

const WAVE_IMAGE_KEYS = [
  "wave01",
  "wave02",
  "wave03",
  "wave04",
  "wave05",
  "wave06",
  "wave07",
  "wave08",
  "wave09",
  "wave10",
] as const;

const FLOOD_IMAGE_KEYS = [
  "flood01",
  "flood02",
  "flood03",
  "flood04",
  "flood05",
  "flood06",
  "flood07",
  "flood08",
  "flood09",
  "flood10",
] as const;

const WAVE_VIDEO_KEYS = [
  "wavev01",
  "wavev02",
  "wavev03",
  "wavev04",
  "wavev05",
  "wavev06",
  "wavev07",
  "wavev08",
  "wavev09",
  "wavev10",
] as const;

const FLOOD_VIDEO_KEYS = [
  "floodv01",
  "floodv02",
  "floodv03",
  "floodv04",
  "floodv05",
  "floodv06",
  "floodv07",
  "floodv08",
  "floodv09",
  "floodv10",
] as const;

export const SEED_REPORTERS: Record<SeedLanguage, { primary: SeedReporterProfile; secondary: SeedReporterProfile }> = {
  en: {
    primary: {
      key: "en-primary",
      language: "en",
      email: "seed.en.primary@seed.ocean.local",
      password: "SeedOcean!2026",
      user_name: "Arun Joseph",
      user_phone: "+919900000101",
    },
    secondary: {
      key: "en-secondary",
      language: "en",
      email: "seed.en.secondary@seed.ocean.local",
      password: "SeedOcean!2026",
      user_name: "Maya Peter",
      user_phone: "+919900000102",
    },
  },
  bn: {
    primary: {
      key: "bn-primary",
      language: "bn",
      email: "seed.bn.primary@seed.ocean.local",
      password: "SeedOcean!2026",
      user_name: "Subho Das",
      user_phone: "+919900000201",
    },
    secondary: {
      key: "bn-secondary",
      language: "bn",
      email: "seed.bn.secondary@seed.ocean.local",
      password: "SeedOcean!2026",
      user_name: "Moumita Roy",
      user_phone: "+919900000202",
    },
  },
  gu: {
    primary: {
      key: "gu-primary",
      language: "gu",
      email: "seed.gu.primary@seed.ocean.local",
      password: "SeedOcean!2026",
      user_name: "Dhruv Patel",
      user_phone: "+919900000301",
    },
    secondary: {
      key: "gu-secondary",
      language: "gu",
      email: "seed.gu.secondary@seed.ocean.local",
      password: "SeedOcean!2026",
      user_name: "Krupa Joshi",
      user_phone: "+919900000302",
    },
  },
  hi: {
    primary: {
      key: "hi-primary",
      language: "hi",
      email: "seed.hi.primary@seed.ocean.local",
      password: "SeedOcean!2026",
      user_name: "Ravi Mishra",
      user_phone: "+919900000401",
    },
    secondary: {
      key: "hi-secondary",
      language: "hi",
      email: "seed.hi.secondary@seed.ocean.local",
      password: "SeedOcean!2026",
      user_name: "Neha Verma",
      user_phone: "+919900000402",
    },
  },
  kn: {
    primary: {
      key: "kn-primary",
      language: "kn",
      email: "seed.kn.primary@seed.ocean.local",
      password: "SeedOcean!2026",
      user_name: "Manjunath Rao",
      user_phone: "+919900000501",
    },
    secondary: {
      key: "kn-secondary",
      language: "kn",
      email: "seed.kn.secondary@seed.ocean.local",
      password: "SeedOcean!2026",
      user_name: "Kavya Hegde",
      user_phone: "+919900000502",
    },
  },
  ml: {
    primary: {
      key: "ml-primary",
      language: "ml",
      email: "seed.ml.primary@seed.ocean.local",
      password: "SeedOcean!2026",
      user_name: "Anoop Nair",
      user_phone: "+919900000601",
    },
    secondary: {
      key: "ml-secondary",
      language: "ml",
      email: "seed.ml.secondary@seed.ocean.local",
      password: "SeedOcean!2026",
      user_name: "Devika Menon",
      user_phone: "+919900000602",
    },
  },
  mr: {
    primary: {
      key: "mr-primary",
      language: "mr",
      email: "seed.mr.primary@seed.ocean.local",
      password: "SeedOcean!2026",
      user_name: "Sagar Shinde",
      user_phone: "+919900000701",
    },
    secondary: {
      key: "mr-secondary",
      language: "mr",
      email: "seed.mr.secondary@seed.ocean.local",
      password: "SeedOcean!2026",
      user_name: "Pooja Jadhav",
      user_phone: "+919900000702",
    },
  },
  or: {
    primary: {
      key: "or-primary",
      language: "or",
      email: "seed.or.primary@seed.ocean.local",
      password: "SeedOcean!2026",
      user_name: "Sambit Nayak",
      user_phone: "+919900000801",
    },
    secondary: {
      key: "or-secondary",
      language: "or",
      email: "seed.or.secondary@seed.ocean.local",
      password: "SeedOcean!2026",
      user_name: "Lopamudra Das",
      user_phone: "+919900000802",
    },
  },
  ta: {
    primary: {
      key: "ta-primary",
      language: "ta",
      email: "seed.ta.primary@seed.ocean.local",
      password: "SeedOcean!2026",
      user_name: "Sathish Kumar",
      user_phone: "+919900000901",
    },
    secondary: {
      key: "ta-secondary",
      language: "ta",
      email: "seed.ta.secondary@seed.ocean.local",
      password: "SeedOcean!2026",
      user_name: "Nivetha Raj",
      user_phone: "+919900000902",
    },
  },
  te: {
    primary: {
      key: "te-primary",
      language: "te",
      email: "seed.te.primary@seed.ocean.local",
      password: "SeedOcean!2026",
      user_name: "Praveen Goud",
      user_phone: "+919900001001",
    },
    secondary: {
      key: "te-secondary",
      language: "te",
      email: "seed.te.secondary@seed.ocean.local",
      password: "SeedOcean!2026",
      user_name: "Keerthi Reddy",
      user_phone: "+919900001002",
    },
  },
};

const ENGLISH_VARIATIONS: Record<SeedLanguage, EnglishVariationSet> = {
  en: {
    older: [
      "Deckhands have started tying a second rope to the bow line.",
      "A school van is waiting for the water to drop before crossing.",
      "One broken branch is hanging over the lane entrance.",
      "Two children were moved from the first row of huts to a concrete house.",
      "The crews say they will wait for the evening tide update before landing.",
      "Visitors near the stone shore were asked to move closer to the temple road.",
      "A fish cart is parked across the deepest section to warn incoming autos.",
    ],
    media: [
      "Two vendors have already folded their stalls and moved inland.",
      "A traffic volunteer is guiding bikes to the drier inner lane.",
    ],
  },
  bn: {
    older: [
      "Harbour-এর দুজন শ্রমিক নৌকার সামনে অতিরিক্ত দড়ি বেঁধেছে।",
      "স্কুলের একটি ভ্যান জল কমার জন্য দাঁড়িয়ে আছে।",
      "একটি ভাঙা ডাল গলির মুখের ওপর ঝুলে আছে।",
      "দুটি শিশুকে সামনের সারির কুঁড়েঘর থেকে পাকা বাড়িতে সরানো হয়েছে।",
      "জেলেরা বলছে সন্ধ্যার জোয়ারের খবর না আসা পর্যন্ত নামবে না।",
      "পাথরের ধারে দাঁড়ানো দর্শনার্থীদের মন্দিরের রাস্তার দিকে সরানো হয়েছে।",
      "গভীর অংশের আগে একটি মাছের ঠেলা দাঁড় করিয়ে সতর্ক করা হচ্ছে।",
    ],
    media: [
      "দুজন দোকানি ইতিমধ্যে তাদের স্টল গুটিয়ে ভেতরের দিকে নিয়েছে।",
      "একজন স্বেচ্ছাসেবক বাইকগুলোকে ভেতরের শুকনো লেনে পাঠাচ্ছেন।",
    ],
  },
  gu: {
    older: [
      "બંદર પરના કામદારો બોટને આગળથી બીજી દોરીથી બાંધી રહ્યા છે.",
      "એક સ્કૂલ વાન પાણી ઉતરે તેની રાહ જોઈ રહી છે.",
      "તૂટેલી ડાળ ગલીના પ્રવેશદ્વાર ઉપર અટવાઈ છે.",
      "બે બાળકોને આગળની ઝૂંપડીઓમાંથી કાંકરીટના ઘરે ખસેડવામાં આવ્યા છે.",
      "માછીમારો કહે છે કે સાંજની જ્વાર માહિતી આવ્યા પછી જ ઉતરશે.",
      "પથ્થર પાસેના મુલાકાતીઓને મંદિર રોડ તરફ ખસેડવામાં આવ્યા છે.",
      "ઊંડા ભાગ પહેલાં માછલીની ગાડી ઊભી રાખીને ચેતવણી આપવામાં આવે છે.",
    ],
    media: [
      "બે વેપારીઓએ પહેલેથી જ પોતાના સ્ટોલ અંદર તરફ ખસેડી દીધા છે.",
      "એક સ્વયંસેવક બાઇકોને અંદરની સુકી લેન તરફ વાળી રહ્યો છે.",
    ],
  },
  hi: {
    older: [
      "घाट के दो मजदूरों ने नाव के अगले हिस्से पर दूसरी रस्सी बांध दी है।",
      "एक स्कूल वैन पानी कम होने का इंतजार कर रही है।",
      "टूटी हुई डाल गली के मुहाने पर लटक रही है।",
      "दो बच्चों को सामने वाली झोपड़ियों से पक्के घर में भेज दिया गया है।",
      "मछुआरे कह रहे हैं कि शाम की ज्वार जानकारी के बाद ही उतरेंगे।",
      "पत्थरों के पास खड़े लोगों को मंदिर रोड की ओर भेजा गया है।",
      "गहरे हिस्से से पहले एक मछली गाड़ी खड़ी करके चेतावनी दी जा रही है।",
    ],
    media: [
      "दो ठेले वाले पहले ही अपना सामान समेटकर अंदर की तरफ चले गए हैं।",
      "एक स्वयंसेवक बाइक वालों को सूखी अंदरूनी लेन में मोड़ रहा है।",
    ],
  },
  kn: {
    older: [
      "ತೀರದ ಇಬ್ಬರು ಕಾರ್ಮಿಕರು ದೋಣಿಯ ಮುಂಭಾಗಕ್ಕೆ ಇನ್ನೊಂದು ಕಯ್ಯನ್ನು ಕಟ್ಟಿದ್ದಾರೆ.",
      "ಒಂದು ಶಾಲಾ ವ್ಯಾನ್ ನೀರು ಇಳಿಯುವುದಕ್ಕಾಗಿ ಕಾಯುತ್ತಿದೆ.",
      "ಒಂದು ಮುರಿದ ಕೊಂಬೆ ದಾರಿಯ ಬಾಯಿಯಲ್ಲಿ ನೇತಾಡುತ್ತಿದೆ.",
      "ಎರಡು ಮಕ್ಕಳನ್ನು ಮೊದಲ ಸಾಲಿನ ಗುಡಿಸಲಿನಿಂದ ಕಾಂಕ್ರೀಟ್ ಮನೆಯಲ್ಲಿ ಇರಿಸಲಾಗಿದೆ.",
      "ಮೀನುಗಾರರು ಸಂಜೆ ಜ್ವಾರದ ಮಾಹಿತಿ ಬಂದ ಮೇಲೆ ಮಾತ್ರ ಇಳಿಯುವುದಾಗಿ ಹೇಳಿದ್ದಾರೆ.",
      "ಕಲ್ಲುಗಳ ಬಳಿಯವರನ್ನು ದೇವಾಲಯದ ರಸ್ತೆಯತ್ತ ಸರಿಸಲಾಗಿದೆ.",
      "ಆಳವಾದ ಭಾಗದ ಮೊದಲು ಮೀನು ಗಾಡಿಯನ್ನು ನಿಲ್ಲಿಸಿ ಎಚ್ಚರಿಕೆ ಕೊಡಲಾಗಿದೆ.",
    ],
    media: [
      "ಇಬ್ಬರು ವ್ಯಾಪಾರಿಗಳು ಈಗಾಗಲೇ ತಮ್ಮ ಅಂಗಡಿಗಳನ್ನು ಒಳಭಾಗಕ್ಕೆ ಸರಿಸಿದ್ದಾರೆ.",
      "ಒಬ್ಬ ಸ್ವಯಂಸೇವಕ ಬೈಕ್‌ಗಳನ್ನು ಒಣಗಿದ ಒಳ ಲೇನ್‌ಗೆ ಕಳುಹಿಸುತ್ತಿದ್ದಾರೆ.",
    ],
  },
  ml: {
    older: [
      "കരയിൽ നിന്ന രണ്ട് തൊഴിലാളികൾ ബോട്ടിന്റെ മുന്നിൽ രണ്ടാമത്തെ കയർ കൂടി കെട്ടിയിട്ടുണ്ട്.",
      "ഒരു സ്കൂൾ വാൻ വെള്ളം താഴാൻ കാത്തുനിൽക്കുകയാണ്.",
      "ഒരു പൊട്ടിയ കൊമ്പ് വഴിയുടെ പ്രവേശനത്തിൽ തൂങ്ങി നിൽക്കുന്നു.",
      "രണ്ട് കുട്ടികളെ മുന്നിലെ കുടിലുകളിൽ നിന്ന് കോൺക്രീറ്റ് വീട്ടിലേക്ക് മാറ്റി.",
      "സന്ധ്യാ തിരമാല വിവരം വന്നതിന് ശേഷമേ ഇറങ്ങൂ എന്ന് മത്സ്യത്തൊഴിലാളികൾ പറഞ്ഞു.",
      "കല്ലുകൾക്കരികിലെ ആളുകളെ ക്ഷേത്ര റോഡിലേക്ക് മാറ്റി.",
      "ആഴമുള്ള ഭാഗത്തിന് മുമ്പായി ഒരു മീൻ തള്ളി വണ്ടി നിർത്തി മുന്നറിയിപ്പ് നൽകുന്നു.",
    ],
    media: [
      "രണ്ട് കച്ചവടക്കാർ ഇതിനോടകം സ്റ്റാൾ മടക്കി അകത്തേക്ക് മാറ്റി.",
      "ഒരു സന്നദ്ധപ്രവർത്തകൻ ബൈക്കുകളെ ഉള്ളിലെ വരണ്ട ലെയിനിലേക്ക് തിരിക്കുന്നു.",
    ],
  },
  mr: {
    older: [
      "घाटावरच्या दोन कामगारांनी बोटीच्या पुढच्या भागाला अजून एक दोरी बांधली आहे.",
      "एक शाळेची व्हॅन पाणी ओसरण्याची वाट पाहत उभी आहे.",
      "एक मोडकी फांदी गल्लीतल्या प्रवेशावर लटकत आहे.",
      "दोन मुलांना पुढच्या झोपड्यांतून सिमेंटच्या घरात हलवले आहे.",
      "मच्छीमार म्हणत आहेत की संध्याकाळच्या भरतीची माहिती आल्यावरच उतरतील.",
      "दगडाजवळ उभे असलेल्यांना मंदिर रस्त्याकडे हलवण्यात आले आहे.",
      "खोल भागाआधी एक मासळीची गाडी उभी करून इशारा दिला जात आहे.",
    ],
    media: [
      "दोन विक्रेत्यांनी आधीच आपले स्टॉल आतल्या बाजूला हलवले आहेत.",
      "एक स्वयंसेवक बाइक्सना कोरड्या आतल्या लेनकडे वळवत आहे.",
    ],
  },
  or: {
    older: [
      "ଘାଟର ଦୁଇଜଣ କାମଗାର ଡୁଙ୍ଗାର ଆଗ ଭାଗକୁ ଆଉ ଗୋଟେ ରସି ବାନ୍ଧିଛନ୍ତି।",
      "ଗୋଟେ ସ୍କୁଲ୍ ଭ୍ୟାନ୍ ପାଣି କମିବାକୁ ଅପେକ୍ଷା କରୁଛି।",
      "ଗୋଟିଏ ଭାଞ୍ଚିଥିବା ଡାଳି ଗଲିର ପ୍ରବେଶରେ ଝୁଲିଛି।",
      "ଦୁଇଜଣ ଛୋଟ ଶିଶୁଙ୍କୁ ସାମ୍ନାର ଝୁପୁଡ଼ିରୁ ପକ୍କା ଘରକୁ ନେଇଯାଇଛନ୍ତି।",
      "ସନ୍ଧ୍ୟାର ଜ୍ୱାର ଖବର ଆସିଲେ ପରେ ମାତ୍ର ନମିବେ ବୋଲି ମାଛିଆମାନେ କହିଛନ୍ତି।",
      "ପଥର ନିକଟର ଲୋକମାନଙ୍କୁ ମନ୍ଦିର ରୋଡ଼ ଦିଗକୁ ହଟାଯାଇଛି।",
      "ଗଭୀର ସ୍ଥାନ ପୂର୍ବରୁ ଗୋଟେ ମାଛ ଗାଡ଼ି ରଖି ସତର୍କ କରାଯାଉଛି।",
    ],
    media: [
      "ଦୁଇଜଣ ବ୍ୟବସାୟୀ ପୂର୍ବରୁ ନିଜର ଷ୍ଟଲ୍ ଭିତରକୁ ସରାଇଦେଇଛନ୍ତି।",
      "ଗୋଟେ ସ୍ୱଇଚ୍ଛାସେବକ ବାଇକ୍‌ଗୁଡ଼ିକୁ ଭିତରର ଶୁଖିଲା ଲେନ୍‌କୁ ଘୁଞ୍ଚାଉଛନ୍ତି।",
    ],
  },
  ta: {
    older: [
      "துறையில் இருந்த இரண்டு தொழிலாளர்கள் படகின் முன்பகுதிக்கு இன்னொரு கயிறை கட்டியுள்ளனர்.",
      "ஒரு பள்ளி வேன் தண்ணீர் குறைய காத்திருக்கிறது.",
      "ஒரு முறிந்த கிளை தெரு நுழைவில் தொங்கிக்கொண்டிருக்கிறது.",
      "இரண்டு குழந்தைகள் முன்சாரி குடிசைகளில் இருந்து கான்கிரீட் வீட்டுக்கு மாற்றப்பட்டுள்ளனர்.",
      "மாலை அலை தகவல் வந்த பிறகுதான் இறங்குவோம் என்று மீனவர்கள் சொல்கிறார்கள்.",
      "பாறை அருகே நின்றவர்களை கோவில் சாலையோரம் நகர்த்தியுள்ளனர்.",
      "ஆழமான பகுதியுக்கு முன் ஒரு மீன் வண்டியை நிறுத்தி எச்சரிக்கை செய்கிறார்கள்.",
    ],
    media: [
      "இரண்டு விற்பனையாளர்கள் ஏற்கனவே தங்கள் கடைகளை உள்ளே நகர்த்தியுள்ளனர்.",
      "ஒரு தன்னார்வலர் பைக்குகளை உள்ளேயுள்ள வறண்ட வழிக்குத் திருப்புகிறார்.",
    ],
  },
  te: {
    older: [
      "తీరంలో ఉన్న ఇద్దరు కార్మికులు పడవ ముందు భాగానికి ఇంకో తాడు కట్టారు.",
      "ఒక స్కూల్ వ్యాన్ నీరు తగ్గే వరకు ఎదురు చూస్తోంది.",
      "ఒక విరిగిన కొమ్మ వీధి ప్రవేశం దగ్గర వేలాడుతోంది.",
      "రెండు పిల్లలను ముందున్న గుడిసెల నుంచి కాంక్రీట్ ఇంటికి మార్చారు.",
      "సాయంత్రపు అలల సమాచారం వచ్చాకే దిగుతామని మత్స్యకారులు చెబుతున్నారు.",
      "రాళ్ల దగ్గర ఉన్న వారిని దేవాలయ రోడ్డు వైపు పంపించారు.",
      "లోతైన భాగానికి ముందు ఒక చేపల బండిని పెట్టి హెచ్చరిస్తున్నారు.",
    ],
    media: [
      "ఇద్దరు వ్యాపారులు ఇప్పటికే తమ స్టాళ్లను లోపలికి మార్చేశారు.",
      "ఒక స్వచ్ఛంద సేవకుడు బైకులను లోపలి పొడి లేన్కి మళ్లిస్తున్నాడు.",
    ],
  },
};

const OLDER_SCENARIOS: Scenario[] = [
  {
    key: "older-01",
    hazard_type: "High Waves",
    urgency_level: "Medium",
    status: "verified",
    is_high_risk: false,
    people_at_risk: 6,
    latitude: 13.1215,
    longitude: 80.3032,
    event_offset_hours: 216,
    create_delay_minutes: 18,
    translated_english:
      "Waves are crossing the lower fish landing steps at Kasimedu Harbour. Spray is hitting the auction lane and the smaller fibre boats are banging against the side.",
  },
  {
    key: "older-02",
    hazard_type: "Flood",
    urgency_level: "Medium",
    status: "verified",
    is_high_risk: false,
    people_at_risk: 11,
    latitude: 13.2359,
    longitude: 80.3208,
    event_offset_hours: 188,
    create_delay_minutes: 24,
    translated_english:
      "Sea water mixed with rainwater is flowing across the service road near Ennore. Buses are slowing down and bikes are turning back.",
  },
  {
    key: "older-03",
    hazard_type: "Storm",
    urgency_level: "High",
    status: "resolved",
    is_high_risk: true,
    people_at_risk: 18,
    latitude: 13.0284,
    longitude: 80.2745,
    event_offset_hours: 160,
    create_delay_minutes: 13,
    translated_english:
      "Strong wind near Foreshore Estate has lifted two tin sheets and snapped branches onto the lane. People are standing away from the power line.",
  },
  {
    key: "older-04",
    hazard_type: "Flood",
    urgency_level: "High",
    status: "verified",
    is_high_risk: true,
    people_at_risk: 23,
    latitude: 13.2177,
    longitude: 80.3294,
    event_offset_hours: 132,
    create_delay_minutes: 29,
    translated_english:
      "Water from the creek has entered the huts behind Ennore Creek. Families have moved utensils and bedding onto higher shelves.",
  },
  {
    key: "older-05",
    hazard_type: "High Waves",
    urgency_level: "Medium",
    status: "pending",
    is_high_risk: false,
    people_at_risk: 7,
    latitude: 12.7878,
    longitude: 80.2556,
    event_offset_hours: 104,
    create_delay_minutes: 16,
    translated_english:
      "The surf is too rough for the smaller fibre boats at Kovalam. Two crews are waiting on the sand because the landing is unsafe.",
  },
  {
    key: "older-06",
    hazard_type: "Tsunami",
    urgency_level: "High",
    status: "rejected",
    is_high_risk: true,
    people_at_risk: 15,
    latitude: 12.6174,
    longitude: 80.1947,
    event_offset_hours: 72,
    create_delay_minutes: 12,
    translated_english:
      "The shoreline near Mahabalipuram pulled back farther than usual and then returned in one hard surge. Shopkeepers asked people to move away from the rocks.",
  },
  {
    key: "older-07",
    hazard_type: "Flood",
    urgency_level: "Medium",
    status: "pending",
    is_high_risk: false,
    people_at_risk: 9,
    latitude: 13.0144,
    longitude: 80.2839,
    event_offset_hours: 30,
    create_delay_minutes: 20,
    translated_english:
      "Night rain has left knee-deep water on the low beach road at Pattinapakkam. Autos are stalling near the turn to the fishing hamlet.",
  },
];

const MEDIA_SCENARIOS: Scenario[] = [
  {
    key: "media-01",
    hazard_type: "High Waves",
    urgency_level: "High",
    status: "pending",
    is_high_risk: true,
    people_at_risk: 14,
    latitude: 12.9537,
    longitude: 80.2578,
    event_offset_hours: 18,
    create_delay_minutes: 8,
    translated_english:
      "Waves are breaking over the promenade wall at Neelankarai. Pedestrians and bike riders are moving back from the edge.",
  },
  {
    key: "media-02",
    hazard_type: "Flood",
    urgency_level: "High",
    status: "pending",
    is_high_risk: true,
    people_at_risk: 19,
    latitude: 13.0548,
    longitude: 80.2821,
    event_offset_hours: 3,
    create_delay_minutes: 6,
    translated_english:
      "Flood water is still moving across the Marina service lane after heavy rain and wind. Drain covers are not visible in two stretches.",
  },
];

const LOCALIZED_DESCRIPTIONS: Record<SeedLanguage, { older: string[]; media: string[] }> = {
  en: {
    older: [
      "Water is crossing the lower fish landing steps at Kasimedu Harbour. Spray is reaching the auction lane and the smaller fibre boats are hitting the side wall.",
      "Sea water mixed with rainwater is running across the service road near Ennore. Buses are slowing down and several bikes are turning back.",
      "Strong wind near Foreshore Estate has lifted two tin sheets and dropped branches onto the lane. Residents are keeping away from the power line.",
      "Water from the creek has entered the huts behind Ennore Creek. Families have moved bedding and utensils onto higher shelves.",
      "The surf is too rough for the smaller fibre boats at Kovalam. Two crews are waiting on the sand because the landing is unsafe.",
      "The shoreline near Mahabalipuram pulled back farther than usual and then came back in one hard surge. Shopkeepers asked people to move away from the rocks.",
      "Night rain has left knee-deep water on the low beach road at Pattinapakkam. Autos are stalling near the turn to the fishing hamlet.",
    ],
    media: [
      "Waves are breaking over the promenade wall at Neelankarai. People on foot and on bikes are moving back from the edge.",
      "Flood water is still moving across the Marina service lane after heavy rain and wind. Two drain covers are no longer visible.",
    ],
  },
  bn: {
    older: [
      "Kasimedu Harbour-এর নিচের মাছ নামানোর সিঁড়িতে ঢেউ উঠে আসছে। ছিটে নিলাম লেন পর্যন্ত আসছে, ছোট ফাইবার নৌকাগুলো পাশের দেওয়ালে ধাক্কা খাচ্ছে।",
      "Ennore-এর সার্ভিস রোডের ওপর সমুদ্রের জল আর বৃষ্টির জল একসঙ্গে বইছে। বাসগুলো ধীরে যাচ্ছে, অনেক বাইক ঘুরে ফিরে যাচ্ছে।",
      "Foreshore Estate-এর কাছে জোর হাওয়ায় দুটো টিনের চাল উড়ে গেছে আর ডালপালা লেনে পড়ে আছে। লোকজন বিদ্যুতের তার থেকে দূরে দাঁড়িয়ে আছে।",
      "Ennore Creek-এর পিছনের ঝুপড়িগুলোতে খালের জল ঢুকে গেছে। পরিবারগুলো বিছানা আর বাসন উঁচু তাকে তুলে রেখেছে।",
      "Kovalam-এ ছোট ফাইবার নৌকা নামানো এখন নিরাপদ নয়। দুটো জেলের দল বালুর ওপরই অপেক্ষা করছে কারণ ঢেউ খুব খারাপ।",
      "Mahabalipuram-এর ধারে জল স্বাভাবিকের চেয়ে অনেকটা সরে গিয়ে হঠাৎ জোরে ফিরে এসেছে। দোকানদারেরা সবাইকে পাথর থেকে সরে যেতে বলেছে।",
      "রাতের বৃষ্টির পর Pattinapakkam-এর নিচু সৈকত সড়কে হাঁটু সমান জল দাঁড়িয়ে আছে। জেলেপাড়ার মোড়ের কাছে অটোগুলো বন্ধ হয়ে যাচ্ছে।",
    ],
    media: [
      "Neelankarai-এর প্রোমেনেড দেওয়াল টপকে ঢেউ উঠছে। হাঁটা মানুষ আর বাইকওয়ালারা কিনারা থেকে পিছিয়ে যাচ্ছে।",
      "ভারি বৃষ্টি আর হাওয়ার পর Marina সার্ভিস লেনে এখনও জল বইছে। দুটো জায়গায় ড্রেনের ঢাকনা দেখা যাচ্ছে না।",
    ],
  },
  gu: {
    older: [
      "Kasimedu Harbour પાસે માછલી ઉતારવાની નીચેની સીડીઓ પર પાણી ચડી રહ્યું છે. છાંટા હરાજી લેન સુધી આવી રહ્યા છે અને નાની ફાઇબર બોટો બાજુની દિવાલ સાથે અથડાઈ રહી છે.",
      "Ennore પાસે સર્વિસ રોડ પર સમુદ્રનું પાણી અને વરસાદી પાણી સાથે વહે છે. બસો ધીમે ચાલી રહી છે અને ઘણી બાઇકો પાછી વળી રહી છે.",
      "Foreshore Estate પાસે જોરદાર પવને બે ટીનની ચાદરો ઉંચકી દીધી અને ડાળીઓ લેનમાં પડી છે. લોકો વીજ લાઇનથી દૂર ઊભા છે.",
      "Ennore Creek પાછળની ઝૂંપડીઓમાં ખાડીનું પાણી ઘૂસી ગયું છે. પરિવારો બિસ્તર અને વાસણો ઊંચી શેલ્ફ પર મૂકી રહ્યા છે.",
      "Kovalam ખાતે નાની ફાઇબર બોટોને ઉતારવું હવે સુરક્ષિત નથી. બે ક્રૂ દરિયાકિનારે રાહ જોઈ રહ્યા છે કારણ કે મોજાં ખૂબ ખડકલા છે.",
      "Mahabalipuram પાસે દરિયાનું પાણી સામાન્ય કરતાં વધુ પાછું ગયું અને પછી જોરથી ફરી આવ્યું. દુકાનદારોએ લોકોને પથ્થરો પરથી દૂર જવા કહ્યું.",
      "રાત્રીના વરસાદ પછી Pattinapakkamના નીચા બીચ રોડ પર ઘૂંટણ જેટલું પાણી ભરાયું છે. માછીમાર વસ્તી તરફના વળાંક પાસે ઓટો બંધ પડી રહ્યા છે.",
    ],
    media: [
      "Neelankaraiના પ્રોમેનાડ વોલ ઉપરથી મોજાં ફાટી રહ્યા છે. ચાલતા લોકો અને બાઈકચાલકો કિનારાથી પાછળ ખસી રહ્યા છે.",
      "ભારે વરસાદ અને પવન પછી Marina સર્વિસ લેન પર પાણી હજુ પણ વહી રહ્યું છે. બે જગ્યાએ ડ્રેન કવર દેખાતા નથી.",
    ],
  },
  hi: {
    older: [
      "Kasimedu Harbour पर मछली उतारने वाली नीचे की सीढ़ियों तक लहरें आ रही हैं। छींटे नीलामी वाली गली तक पहुंच रहे हैं और छोटी फाइबर नावें दीवार से टकरा रही हैं।",
      "Ennore के पास सर्विस रोड पर समुद्री पानी और बारिश का पानी साथ बह रहा है। बसें धीमी चल रही हैं और कई बाइक वापस मुड़ रही हैं।",
      "Foreshore Estate के पास तेज हवा से दो टिन की चादरें उठ गईं और डालियां गली में गिर गई हैं। लोग बिजली की लाइन से दूर खड़े हैं।",
      "Ennore Creek के पीछे की झोपड़ियों में नाले जैसा पानी घुस गया है। परिवारों ने बिस्तर और बर्तन ऊंची शेल्फ पर रख दिए हैं।",
      "Kovalam में छोटी फाइबर नावों को उतारना अभी सुरक्षित नहीं है। दो टीमें रेत पर ही इंतजार कर रही हैं क्योंकि लैंडिंग बहुत खराब है।",
      "Mahabalipuram के किनारे पानी सामान्य से ज्यादा पीछे गया और फिर एक जोरदार लहर के साथ लौटा। दुकानदारों ने लोगों को चट्टानों से हटने को कहा।",
      "रात की बारिश के बाद Pattinapakkam की नीची बीच रोड पर घुटने तक पानी खड़ा है। मछुआरों की बस्ती वाले मोड़ पर ऑटो बंद हो रहे हैं।",
    ],
    media: [
      "Neelankarai की प्रॉमनेड दीवार के ऊपर से लहरें टूट रही हैं। पैदल लोग और बाइक वाले किनारे से पीछे हट रहे हैं।",
      "तेज बारिश और हवा के बाद Marina सर्विस लेन पर पानी अभी भी बह रहा है। दो जगह ड्रेन के ढक्कन दिखाई नहीं दे रहे हैं।",
    ],
  },
  kn: {
    older: [
      "Kasimedu Harbourನಲ್ಲಿ ಮೀನು ಇಳಿಸುವ ಕೆಳಗಿನ ಮೆಟ್ಟಿಲುಗಳವರೆಗೆ ಅಲೆ ನೀರು ಬರುತ್ತಿದೆ. ಚಿಮುಕಿನ ನೀರು ಹರಾಜು ದಾರಿವರೆಗೆ ತಲುಪುತ್ತಿದೆ ಮತ್ತು ಸಣ್ಣ ಫೈಬರ್ ದೋಣಿಗಳು ಪಕ್ಕದ ಗೋಡೆಯಿಗೆ ಅಪ್ಪಳಿಸುತ್ತಿವೆ.",
      "Ennore ಹತ್ತಿರದ ಸರ್ವಿಸ್ ರಸ್ತೆಯ ಮೇಲೆ ಸಮುದ್ರದ ನೀರು ಮತ್ತು ಮಳೆನೀರು ಸೇರಿ ಹರಿಯುತ್ತಿದೆ. ಬಸ್ಸುಗಳು ನಿಧಾನವಾಗಿ ಸಾಗುತ್ತಿವೆ, ಹಲವು ಬೈಕ್‌ಗಳು ಹಿಂದಿರುಗುತ್ತಿವೆ.",
      "Foreshore Estate ಹತ್ತಿರ ಜೋರಾದ ಗಾಳಿ ಎರಡು ಟಿನ್ ಚಾವಣಿ ಹಾಳೆಗಳನ್ನು ಎತ್ತಿ ಹಾಕಿದೆ ಮತ್ತು ಕೊಂಬೆಗಳು ದಾರಿಯ ಮೇಲೆ ಬಿದ್ದಿವೆ. ಜನರು ವಿದ್ಯುತ್ ತಂತಿಯಿಂದ ದೂರ ನಿಂತಿದ್ದಾರೆ.",
      "Ennore Creek ಹಿಂದೆ ಇರುವ ಗುಡಿಸಲುಗಳಿಗೆ ಕಾಲುವೆ ನೀರು ಒಳ ಬಂದಿದೆ. ಕುಟುಂಬಗಳು ಹಾಸಿಗೆ ಮತ್ತು ಪಾತ್ರೆಗಳನ್ನು ಮೇಲಿನ ತೆಕ್ಕೆಯ ಮೇಲೆ ಇಟ್ಟಿವೆ.",
      "Kovalam ನಲ್ಲಿ ಸಣ್ಣ ಫೈಬರ್ ದೋಣಿಗಳನ್ನು ಇಳಿಸುವುದು ಈಗ ಸುರಕ್ಷಿತವಾಗಿಲ್ಲ. ಎರಡು ತಂಡಗಳು ತೀರದಲ್ಲೇ ಕಾಯುತ್ತಿವೆ ಏಕೆಂದರೆ ಅಲೆ ತುಂಬಾ ಕಠಿಣವಾಗಿದೆ.",
      "Mahabalipuram ಬಳಿ ಸಮುದ್ರದ ನೀರು ಸಾಮಾನ್ಯಕ್ಕಿಂತ ಹೆಚ್ಚು ಹಿಂದೆ ಸರಿದು ನಂತರ ಒಮ್ಮೆ ಜೋರಾಗಿ ಮರಳಿ ಬಂತು. ಅಂಗಡಿಕಾರರು ಜನರನ್ನು ಕಲ್ಲುಗಳಿಂದ ದೂರ ಹೋಗಲು ಹೇಳಿದರು.",
      "ರಾತ್ರಿ ಮಳೆಯ ನಂತರ Pattinapakkamನ ಕಡಿಮೆ ಮಟ್ಟದ ಕಡಲತೀರ ರಸ್ತೆಯಲ್ಲಿ ಮೊಣಕಾಲು ಮಟ್ಟದ ನೀರು ನಿಂತಿದೆ. ಮೀನುಗಾರರ ಕಾಲೋನಿಗೆ ತಿರುಗುವಲ್ಲಿ ಆಟೋಗಳು ನಿಂತು ಹೋಗುತ್ತಿವೆ.",
    ],
    media: [
      "Neelankarai ಪ್ರೊಮನೆಡ್ ಗೋಡೆಯ ಮೇಲೆ ಅಲೆಗಳು ಮುರಿದು ಬರುತ್ತಿವೆ. ನಡೆದು ಹೋಗುವವರು ಮತ್ತು ಬೈಕ್ ಸವಾರರು ಅಂಚಿನಿಂದ ಹಿಂದೆ ಸರಿಯುತ್ತಿದ್ದಾರೆ.",
      "ಭಾರಿ ಮಳೆ ಮತ್ತು ಗಾಳಿಯ ನಂತರ Marina ಸರ್ವಿಸ್ ಲೇನ್‌ನಲ್ಲಿ ಇನ್ನೂ ನೀರು ಹರಿಯುತ್ತಿದೆ. ಎರಡು ಕಡೆ ಡ್ರೇನ್ ಮುಚ್ಚಳ ಕಾಣುತ್ತಿಲ್ಲ.",
    ],
  },
  ml: {
    older: [
      "Kasimedu Harbourയിലെ മീൻ ഇറക്കുന്നതിനുള്ള താഴത്തെ പടികളിലേക്ക് തിരമാല കയറുന്നു. തുള്ളി വെള്ളം ലേലം നടക്കുന്ന വഴിവരെ എത്തുന്നു, ചെറിയ ഫൈബർ ബോട്ടുകൾ വശത്തെ ചുവരിൽ ഇടിക്കുകയാണ്.",
      "Ennore ഭാഗത്തെ സർവീസ് റോഡിലൂടെ കടൽവെള്ളവും മഴവെള്ളവും കൂടി ഒഴുകുന്നു. ബസുകൾ പതുക്കെ പോകുന്നു, പല ബൈക്കുകളും തിരികെ മടങ്ങുന്നു.",
      "Foreshore Estateക്കരികിലെ കാറ്റിൽ രണ്ട് ടിൻ ഷീറ്റുകൾ പൊങ്ങി, കൊമ്പുകൾ വഴിയിലേക്കു വീണിട്ടുണ്ട്. ആളുകൾ വൈദ്യുതി ലൈനിൽ നിന്ന് അകന്നു നിൽക്കുന്നു.",
      "Ennore Creekയുടെ പിറകിലുള്ള കുടിലുകളിലേക്ക് കായൽവെള്ളം കയറി. കുടുംബങ്ങൾ കിടക്കയും പാത്രങ്ങളും ഉയർന്ന തട്ടിലേക്ക് മാറ്റിയിരിക്കുന്നു.",
      "Kovalamൽ ചെറിയ ഫൈബർ ബോട്ടുകൾ ഇറക്കുന്നത് ഇപ്പോൾ സുരക്ഷിതമല്ല. തിര വളരെ കഠിനമായതിനാൽ രണ്ട് സംഘം മണലിൽ തന്നെ കാത്തിരിക്കുകയാണ്.",
      "Mahabalipuram തീരത്ത് വെള്ളം പതിവിലധികം പിന്നോട്ടു പോയി ശേഷം ഒരൊറ്റ കഠിനമായ തിരയായി തിരിച്ചുവന്നു. കല്ലുകൾക്കരികിൽ നിന്നവർ മാറാൻ കടക്കാരൻമാർ പറഞ്ഞു.",
      "രാത്രി മഴയ്ക്കു ശേഷം Pattinapakkamയിലെ താഴ്ന്ന കടൽത്തീര റോഡിൽ മുട്ടുനിലം വെള്ളം കെട്ടിക്കിടക്കുന്നു. മീൻപിടുത്ത ഗ്രാമത്തിലേക്കുള്ള വളവിൽ ഓട്ടോകൾ ഓഫ് ആകുന്നു.",
    ],
    media: [
      "Neelankarai പ്രോമനേഡ് മതിലിന് മീതെ തിരമാല പൊട്ടുന്നു. നടക്കുന്നതും ബൈക്കിൽ പോകുന്നതുമായ ആളുകൾ അരികിൽ നിന്ന് പിന്നോട്ടു പോകുന്നു.",
      "കാറ്റും കനത്ത മഴയും കഴിഞ്ഞിട്ടും Marina സർവീസ് ലെയിനിലൂടെ ഇപ്പോഴും വെള്ളം ഒഴുകുന്നു. രണ്ട് ഇടങ്ങളിൽ ഡ്രെയിൻ മൂടികൾ കാണുന്നില്ല.",
    ],
  },
  mr: {
    older: [
      "Kasimedu Harbour येथे मासे उतरवण्याच्या खालच्या पायऱ्यांवर लाटांचे पाणी येत आहे. उडणारे पाणी लिलावाच्या गल्लीत पोहोचत आहे आणि लहान फायबर बोटी भिंतीला आपटत आहेत.",
      "Ennore जवळच्या सर्विस रोडवर समुद्राचे पाणी आणि पावसाचे पाणी एकत्र वाहत आहे. बस हळू चालत आहेत आणि अनेक बाईक परत फिरत आहेत.",
      "Foreshore Estate जवळ जोरदार वाऱ्याने दोन टिन पत्रे उचलली आणि फांद्या गल्लीत पडल्या आहेत. लोक वीजेच्या तारेपासून दूर उभे आहेत.",
      "Ennore Creek मागच्या झोपड्यांमध्ये पाण्याचा शिरकाव झाला आहे. कुटुंबांनी अंथरूण आणि भांडी उंच शेल्फवर ठेवली आहेत.",
      "Kovalam येथे लहान फायबर बोटी किनाऱ्यावर आणणे सुरक्षित नाही. दोन पथके वाळूत थांबली आहेत कारण लाटांचा जोर खूप आहे.",
      "Mahabalipuram जवळ किनाऱ्यावरील पाणी नेहमीपेक्षा जास्त मागे गेले आणि मग एका जोरदार उसळीने परत आले. दुकानदारांनी लोकांना खडकांपासून दूर जायला सांगितले.",
      "रात्रीच्या पावसानंतर Pattinapakkamच्या खालच्या बीच रोडवर गुडघाभर पाणी साचले आहे. मच्छीमार वस्तीच्या वळणाजवळ ऑटो बंद पडत आहेत.",
    ],
    media: [
      "Neelankaraiच्या प्रॉमेनेड भिंतीवरून लाटा फुटत आहेत. चालणारे लोक आणि बाईकस्वार कडेकडून मागे सरकत आहेत.",
      "जोरदार पाऊस आणि वाऱ्यानंतर Marina सर्विस लेनवर अजूनही पाणी वाहत आहे. दोन ठिकाणी ड्रेनची झाकणे दिसत नाहीत.",
    ],
  },
  or: {
    older: [
      "Kasimedu Harbourର ତଳ ମାଛ ଉତରଣ ସିଢ଼ିକୁ ତରଙ୍ଗ ଚଢ଼ିଆସୁଛି। ଛିଟା ପାଣି ନିଲାମ ଲେନ୍ ପର୍ଯ୍ୟନ୍ତ ଯାଉଛି ଏବଂ ଛୋଟ ଫାଇବର ଡୁଙ୍ଗାଗୁଡ଼ିକ ପାର୍ଶ୍ୱ ଦିଆଳରେ ଲାଗୁଛି।",
      "Ennore ପାଖରେ ସର୍ଭିସ ରୋଡ୍ ଉପରେ ସମୁଦ୍ର ପାଣି ଓ ବର୍ଷା ପାଣି ଏକାସାଥିରେ ବହୁଛି। ବସ ଧୀରେ ଯାଉଛି ଏବଂ ଅନେକ ବାଇକ୍ ଫେରିଯାଉଛି।",
      "Foreshore Estate ନିକଟରେ ଜୋର ବାତାସରେ ଦୁଇଟି ଟିନ୍ ଚାଦର ଉଡ଼ିଗଲା ଏବଂ ଡାଳିଗୁଡ଼ିକ ଗଲିରେ ପଡ଼ିଛି। ଲୋକେ ବିଦ୍ୟୁତ ଲାଇନ୍‌ରୁ ଦୂରେ ରହୁଛନ୍ତି।",
      "Ennore Creek ପଛର ଝୁପୁଡ଼ିଗୁଡ଼ିକୁ ଖାଳର ପାଣି ପସିଗଲା। ପରିବାରଗୁଡ଼ିକ ଛାଦର ଓ ପାତ୍ରଗୁଡ଼ିକୁ ଉପରେ ରଖିଛନ୍ତି।",
      "Kovalamରେ ଛୋଟ ଫାଇବର ଡୁଙ୍ଗା ଉତାରିବା ଏବେ ସୁରକ୍ଷିତ ନୁହେଁ। ତରଙ୍ଗ ଖୁବ ଖରାପ ଥିବାରୁ ଦୁଇଟି ଦଳ ବାଲୁକାରେ ଅପେକ୍ଷା କରୁଛି।",
      "Mahabalipuram ପାଖରେ ସମୁଦ୍ର ପାଣି ସାଧାରଣଠାରୁ ବହୁତ ପଛକୁ ଗଲା ଏବଂ ପରେ ଜୋରରେ ଫେରିଆସିଲା। ଦୋକାନୀମାନେ ଲୋକଙ୍କୁ ପାହାଡ଼ପଥର ଠାରୁ ହଟିବାକୁ କହିଲେ।",
      "ରାତିର ବର୍ଷା ପରେ Pattinapakkamର ତଳ ସମୁଦ୍ର କୂଳ ରୋଡ୍‌ରେ ହାଟୁ ସମାନ ପାଣି ରହିଛି। ମାଛିଆ ଅଞ୍ଚଳକୁ ଘୁଞ୍ଚିବା ଠାରେ ଅଟୋ ଅଟକୁଛି।",
    ],
    media: [
      "Neelankarai ପ୍ରୋମେନାଡ୍ ଦିଆଳ ଉପରେ ତରଙ୍ଗ ଭାଙ୍ଗିପଡ଼ୁଛି। ପାଇଁ ଚାଲୁଥିବା ଲୋକ ଓ ବାଇକ୍ ଚାଳକମାନେ କୂଳଠାରୁ ପଛକୁ ଯାଉଛନ୍ତି।",
      "ଭାରି ବର୍ଷା ଓ ବାତାସ ପରେ Marina ସର୍ଭିସ ଲେନ୍‌ରେ ଏଯାବତ୍ ପାଣି ବହୁଛି। ଦୁଇଟି ସ୍ଥାନରେ ଡ୍ରେନ୍ କଭର୍ ଦେଖାଯାଉନାହିଁ।",
    ],
  },
  ta: {
    older: [
      "காசிமேடு துறையில் மீன் இறக்கும் கீழ் படிக்கட்டுகள் வரை அலைநீர் ஏறுகிறது. தெறிப்பு ஏலம் செல்லும் பாதை வரை வருகிறது; சிறிய ஃபைபர் படகுகள் பக்கச் சுவரில் மோதுகின்றன.",
      "எண்ணூர் அருகே சேவைச் சாலையில் கடல் நீரும் மழைநீரும் சேர்ந்து ஓடுகிறது. பேருந்துகள் மெதுவாக செல்கின்றன; பல பைக்குகள் திரும்பிச் செல்கின்றன.",
      "ஃபோர்ஷோர் எஸ்டேட் அருகே பலத்த காற்றில் இரண்டு டின் தாள்கள் பறந்துவிட்டன, மரக்கிளைகள் பாதையில் விழுந்துள்ளன. மக்கள் மின்கம்பியிலிருந்து விலகி நிற்கிறார்கள்.",
      "எண்ணூர் க்ரீக் பின்புற குடிசைகளுக்குள் கால்வாய் நீர் நுழைந்துள்ளது. குடும்பங்கள் படுக்கைப் பொருட்களையும் பாத்திரங்களையும் மேல்தட்டில் வைத்துள்ளனர்.",
      "கோவளம் கடற்கரையில் சிறிய ஃபைபர் படகுகளை இறக்குவது இப்போது பாதுகாப்பாக இல்லை. அலை மிக கடுமையாக இருப்பதால் இரண்டு குழுக்கள் மணலில் காத்திருக்கின்றன.",
      "மகாபலிபுரம் அருகே கடல் நீர் வழக்கத்தை விட அதிகமாக பின்வாங்கி, பின்னர் ஒரு பெரிய தள்ளலில் திரும்பி வந்தது. கடைக்காரர்கள் எல்லாரையும் பாறைகளில் இருந்து விலகச் சொன்னார்கள்.",
      "இரவு மழைக்குப் பிறகு பட்டினப்பாக்கம் குறைந்த நிலப்பகுதி கடற்கரைச் சாலையில் முழங்கால் அளவு தண்ணீர் நிற்கிறது. மீனவ குடியிருப்பு திருப்பத்தில் ஆட்டோக்கள் நின்றுபோகின்றன.",
    ],
    media: [
      "நீலாங்கரை நடைபாதைச் சுவரைத் தாண்டி அலை உடைகிறது. நடந்து செல்பவர்களும் பைக் ஓட்டுபவர்களும் விளிம்பிலிருந்து பின்னால் நகர்கிறார்கள்.",
      "பலத்த மழை மற்றும் காற்றுக்குப் பிறகும் மரீனா சேவைச் சாலையில் இன்னும் தண்ணீர் ஓடிக்கொண்டிருக்கிறது. இரண்டு இடங்களில் வடிகால் மூடிகள் தெரியவில்லை.",
    ],
  },
  te: {
    older: [
      "Kasimedu Harbourలో చేపలు దిగించే దిగువ మెట్ల వరకు అలలు ఎక్కుతున్నాయి. చిమ్మిన నీరు వేలం దారి వరకు వస్తోంది, చిన్న ఫైబర్ పడవలు పక్క గోడకు తగులుతున్నాయి.",
      "Ennore దగ్గర సర్వీస్ రోడ్డుపై సముద్రపు నీరు, వర్షపు నీరు కలిసి ప్రవహిస్తున్నాయి. బస్సులు నెమ్మదిగా వెళ్తున్నాయి, చాలా బైకులు తిరిగి వెళ్తున్నాయి.",
      "Foreshore Estate దగ్గర బలమైన గాలికి రెండు టిన్ షీట్లు ఎగిరిపోయాయి, కొమ్మలు దారిపై పడిపోయాయి. జనాలు విద్యుత్ లైన్‌కి దూరంగా నిలబడ్డారు.",
      "Ennore Creek వెనక ఉన్న గుడిసెల్లోకి కాలువ నీరు వచ్చింది. కుటుంబాలు మంచం సామాను, పాత్రలు ఎత్తైన మెట్టుపై పెట్టారు.",
      "Kovalam వద్ద చిన్న ఫైబర్ పడవలను దిగించడం ఇప్పుడు సురక్షితం కాదు. అలలు బలంగా ఉండటంతో రెండు బృందాలు ఇసుకపైనే వేచి ఉన్నాయి.",
      "Mahabalipuram దగ్గర సముద్రపు నీరు సాధారణం కంటే చాలా వెనక్కు వెళ్లి ఒక్కసారిగా బలంగా తిరిగి వచ్చింది. దుకాణదారులు అందరినీ రాళ్ల దగ్గరనుండి దూరంగా వెళ్లమన్నారు.",
      "రాత్రి వర్షం తర్వాత Pattinapakkam తక్కువ ఎత్తున్న బీచ్ రోడ్డుపై మోకాళ్లంత నీరు నిలిచింది. మత్స్యకార కాలనీ మలుపు దగ్గర ఆటోలు ఆగిపోతున్నాయి.",
    ],
    media: [
      "Neelankarai ప్రోమెనేడ్ గోడ మీదుగా అలలు విరుగుతున్నాయి. నడిచే వాళ్లు, బైక్ వాళ్లు అంచు నుంచి వెనక్కు వస్తున్నారు.",
      "భారీ వర్షం, గాలి తర్వాత కూడా Marina సర్వీస్ లేన్ మీద ఇంకా నీరు పారుతోంది. రెండు చోట్ల డ్రెయిన్ మూతలు కనిపించడం లేదు.",
    ],
  },
};

const hashString = (value: string) => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
};

const jitter = (seed: string, magnitude: number) => {
  const hash = hashString(seed);
  const ratio = (hash % 10_000) / 10_000;
  return (ratio - 0.5) * magnitude;
};

const isoDate = (date: Date) => date.toISOString();

const CONTEXT_SPOTS = [
  "the fish auction lane",
  "the bus turnaround near the beach road",
  "the storm-water pumping station approach",
  "the school pickup point by the coastal street",
  "the ice-storage loading bay",
  "the shrine-side pedestrian steps",
  "the fuel kiosk service lane",
  "the net-repair shed entrance",
  "the market-side bridge corner",
  "the temporary relief desk near the harbor office",
] as const;

const CONTEXT_IMPACTS = [
  "standing water is entering low shops and storage rooms",
  "sand and debris are forcing two-way traffic into one narrow lane",
  "power fluctuation has paused cold-storage compressors",
  "vehicle movement is restricted because drain covers are not visible",
  "small craft crews are delaying landing due to unstable surf",
  "residents are moving food stock and medicine to upper shelves",
  "pedestrians are redirecting through inner streets to avoid splash zones",
  "public transport is running with staggered delays and short turns",
  "shoreline steps are slippery and access is being controlled",
  "visibility is reduced by spray and intermittent rain bursts",
] as const;

const CONTEXT_RESPONSES = [
  "ward volunteers set rope markers along the deepest stretch",
  "local shop owners placed reflective cones and hand lamps",
  "harbor workers created a temporary one-way movement corridor",
  "a community team started door-to-door checks for elderly residents",
  "fisher crews tied spare mooring lines and moved engines inland",
  "school staff shifted pickup to an elevated side street",
  "traffic marshals are rotating vehicles every few minutes",
  "municipal workers started clearing blocked grates with hand tools",
  "a first-aid desk was moved beside a dry concrete platform",
  "boat operators announced a delay until tide conditions stabilize",
] as const;

const CONTEXT_WITNESS = [
  "a tea stall owner and two drivers confirmed rising flow in the last hour",
  "three nearby families reported repeated wave hits on the same wall segment",
  "night-shift workers documented changes in water direction after each gust",
  "a lifeguard team noted faster backwash compared with yesterday evening",
  "auto drivers reported engine stalls on the same flooded bend",
  "vendors counted repeated surges reaching their shutter line",
  "security staff observed crowd movement away from exposed edges",
  "residents recorded ankle-to-knee depth variation across short distance",
  "cleanup teams reported fresh debris after each rain burst",
  "boat handlers observed rope tension spikes during incoming sets",
] as const;

const HUMAN_LONG_NOTES = [
  "I stayed on-site for almost twenty minutes and the flow pattern changed twice; first the water pulled back, then it pushed across the lane again in one wide sheet. People nearby were warning each other before every surge.",
  "This did not look like a single short burst. The water kept returning in pulses, and each pulse carried fresh debris. We had to shift parked two-wheelers one by one because engines were already taking in water.",
  "Locals said this stretch usually drains quickly, but today it kept filling again after each gust. We marked the safer side with torch light and asked school kids to wait until the crossing was clear.",
  "The condition looked manageable at first, then became worse within minutes. Foam, silt, and floating plastic started moving into side entries, so shop staff pulled stock inward and closed shutters halfway.",
  "I checked the same point two times before sending this. The second check was clearly worse: stronger backwash, deeper pockets, and less visibility from spray. We are keeping pedestrians off the exposed edge for now.",
] as const;

const HUMAN_IMPERFECT_NOTES = [
  "not 100% sure on exact mins, but it got bad real fast.",
  "pls check soon, this stretch is getting messy again.",
  "typing quick from road side, signal weak here.",
  "sorry for rough msg, crowd is moving and its noisy.",
  "we tried to guide people, still risky if rain picks up.",
] as const;

type PersonaTone = "formal" | "colloquial" | "terse" | "emotional";
type PersonaLength = "short" | "medium" | "long";
type NumericHabit = "exact" | "approx" | "rounded";
type ReporterPersona = {
  tone: PersonaTone;
  length: PersonaLength;
  typoRate: number;
  numeric: NumericHabit;
  rushed: boolean;
};

type IncidentPhase = "initial" | "follow_up" | "escalation" | "resolution";
type PhasePlan = {
  thread: 0 | 1 | 2;
  phase: IncidentPhase;
  phaseMinutes: number;
};

type TemplateSpec = {
  id: number;
  variant: number;
  location: number;
  impact: number;
  affected: number;
  action: number;
  cause: number;
  outcome: number;
};

const LOCATION_TYPES = [
  "the fish auction lane",
  "the bus turnaround near the shore",
  "the bridge-side culvert approach",
  "the school pickup corner",
  "the market loading strip",
  "the fuel kiosk bypass lane",
  "the breakwater pedestrian step zone",
  "the creek-side access road",
  "the net-repair shed entry",
  "the harbor office frontage",
  "the temple road descent",
  "the old jetty connector",
  "the cold-storage service path",
  "the tidal drain junction",
  "the beach-parking exit",
] as const;

const IMPACT_TYPES = [
  "water pushed into low storefronts",
  "debris narrowed traffic to a single passable side",
  "backwash caused repeated slips near the edge",
  "drain flow reversed for several minutes",
  "vehicle engines stalled in standing water",
  "moorings tightened sharply during incoming sets",
  "pedestrian movement shifted to inner lanes",
  "shoreline steps remained slick despite cleanup",
  "spray reduced visibility for riders",
  "temporary barriers were overtopped twice",
  "waste bins and loose boards drifted into the lane",
  "ambulance access required rerouting",
  "bus movement was delayed at the turning point",
  "cold-storage unloading paused during surge intervals",
  "shop shutters were kept half-closed for safety",
] as const;

const AFFECTED_GROUPS = [
  "fisher crews",
  "school children waiting for pickup",
  "street vendors",
  "auto drivers",
  "bus commuters",
  "night-shift workers",
  "elderly residents",
  "pedestrians near the sea wall",
  "small delivery teams",
  "harbor loaders",
  "tea stall staff",
  "shoreline maintenance workers",
] as const;

const ACTION_TYPES = [
  "set rope markers around deeper pockets",
  "moved stock and medicine to higher shelves",
  "redirected vehicles through an inner lane",
  "paused unloading until tide softened",
  "placed temporary warning lamps at both ends",
  "started manual clearing of blocked grates",
  "shifted pickup point to elevated ground",
  "used cones to isolate the most exposed stretch",
  "held foot traffic behind a temporary cordon",
  "logged video from two angles for verification",
  "coordinated local volunteers in rotating shifts",
  "kept one emergency corridor open",
] as const;

const CAUSE_TYPES = [
  "consecutive tide pulses",
  "wind-driven backflow",
  "blocked storm-water outfall",
  "debris-packed curb inlets",
  "rain burst on already saturated ground",
  "cross-current near the wall section",
  "overflow from the inner canal",
  "drain choke point near the turning bend",
  "shoreline overtopping during gust cycles",
  "delayed pump activation window",
] as const;

const OUTCOME_TYPES = [
  "conditions stabilized after coordinated diversion",
  "flow reduced but slippery zones remained",
  "crowd pressure eased once route guidance started",
  "movement improved after grate clearing",
  "risk stayed high near exposed wall segments",
  "access reopened partially for local traffic",
  "landing operations remained delayed",
  "secondary lanes became usable with caution",
  "shopfront exposure dropped after barriers were reset",
  "night operations were switched to monitoring mode",
] as const;

const TEMPLATE_BANK: TemplateSpec[] = Array.from({ length: 60 }, (_, id) => ({
  id,
  variant: id % 10,
  location: (id * 7 + 3) % LOCATION_TYPES.length,
  impact: (id * 11 + 5) % IMPACT_TYPES.length,
  affected: (id * 13 + 1) % AFFECTED_GROUPS.length,
  action: (id * 17 + 2) % ACTION_TYPES.length,
  cause: (id * 19 + 4) % CAUSE_TYPES.length,
  outcome: (id * 23 + 6) % OUTCOME_TYPES.length,
}));

const OLDER_PHASE_PLAN: PhasePlan[] = [
  { thread: 0, phase: "initial", phaseMinutes: 0 },
  { thread: 0, phase: "follow_up", phaseMinutes: 38 },
  { thread: 1, phase: "initial", phaseMinutes: 0 },
  { thread: 1, phase: "follow_up", phaseMinutes: 46 },
  { thread: 2, phase: "initial", phaseMinutes: 0 },
  { thread: 2, phase: "follow_up", phaseMinutes: 64 },
  { thread: 2, phase: "resolution", phaseMinutes: 168 },
];

const MEDIA_PHASE_PLAN: PhasePlan[] = [
  { thread: 0, phase: "escalation", phaseMinutes: 82 },
  { thread: 1, phase: "escalation", phaseMinutes: 90 },
];

const THREAD_BASE_HOURS = [41, 27, 16] as const;

const buildPersona = (reporterKey: string): ReporterPersona => {
  const h = hashString(reporterKey);
  const tones: PersonaTone[] = ["formal", "colloquial", "terse", "emotional"];
  const lengths: PersonaLength[] = ["short", "medium", "long"];
  const numeric: NumericHabit[] = ["exact", "approx", "rounded"];
  return {
    tone: tones[h % tones.length],
    length: lengths[Math.floor(h / 7) % lengths.length],
    numeric: numeric[Math.floor(h / 13) % numeric.length],
    typoRate: (h % 100) < 22 ? 0.08 : (h % 100) < 46 ? 0.04 : 0.0,
    rushed: (h % 5) === 0,
  };
};

const withTypos = (text: string, seed: string, rate: number) => {
  if (rate <= 0) return text;
  if (!/^[\x20-\x7E\s]+$/.test(text)) return text;
  const h = hashString(`${seed}:typo`);
  if ((h % 100) / 100 > rate) return text;
  const replacements: Array<[RegExp, string]> = [
    [/\bplease\b/i, "pls"],
    [/\bbecause\b/i, "becoz"],
    [/\bthrough\b/i, "thru"],
    [/\band\b/i, "&"],
    [/\bapproximately\b/i, "approx"],
  ];
  const pick = replacements[h % replacements.length];
  return text.replace(pick[0], pick[1]);
};

const formatMetric = (value: number, persona: ReporterPersona, unit: string) => {
  if (persona.numeric === "approx") {
    const rounded = Math.round(value / 5) * 5;
    return `approx ${rounded}${unit}`;
  }
  if (persona.numeric === "rounded") {
    const rounded = Math.round(value / 10) * 10;
    return `${rounded}${unit}`;
  }
  return `${value}${unit}`;
};

const buildNarrative = (params: {
  baseDescription: string;
  seed: string;
  hazardType: SeedHazardType;
  includeMediaLine: boolean;
  persona: ReporterPersona;
  phase: IncidentPhase;
  language: SeedLanguage;
  flavorLine: string;
}) => {
  const { baseDescription, seed, hazardType, includeMediaLine, persona, phase, language, flavorLine } = params;
  const h1 = hashString(`${seed}:1`);
  const h2 = hashString(`${seed}:2`);
  const h3 = hashString(`${seed}:3`);
  const h4 = hashString(`${seed}:4`);

  const template = TEMPLATE_BANK[h1 % TEMPLATE_BANK.length];
  const location = LOCATION_TYPES[(template.location + (h2 % 3)) % LOCATION_TYPES.length];
  const impact = IMPACT_TYPES[(template.impact + (h3 % 4)) % IMPACT_TYPES.length];
  const affected = AFFECTED_GROUPS[(template.affected + (h4 % 5)) % AFFECTED_GROUPS.length];
  const action = ACTION_TYPES[(template.action + (h1 % 3)) % ACTION_TYPES.length];
  const cause = CAUSE_TYPES[(template.cause + (h2 % 2)) % CAUSE_TYPES.length];
  const outcome = OUTCOME_TYPES[(template.outcome + (h3 % 2)) % OUTCOME_TYPES.length];

  const depthCm = 10 + (h1 % 74);
  const windKmh = 16 + (h2 % 52);
  const stretchMeters = 20 + (h3 % 220);
  const households = 2 + (h4 % 34);

  const phaseLine =
    phase === "initial"
      ? "Initial observation logged from the ground."
      : phase === "follow_up"
        ? "Follow-up after recheck confirms this change in conditions."
        : phase === "escalation"
          ? "Escalation noted in a second pass with stronger impact."
          : "Resolution phase update: direct risk has reduced, but monitoring continues.";

  const variant = template.variant;
  let causalLine = "";
  if (variant === 0) causalLine = `${hazardType} impact at ${location}: ${impact}.`;
  else if (variant === 1) causalLine = `At ${location}, ${impact} after ${cause}.`;
  else if (variant === 2) causalLine = `Ground team linked this ${hazardType.toLowerCase()} report to ${cause} near ${location}.`;
  else if (variant === 3) causalLine = `During this ${hazardType.toLowerCase()} window, ${impact} around ${location}.`;
  else if (variant === 4) causalLine = `${location} remained critical because ${cause}, and ${impact}.`;
  else if (variant === 5) causalLine = `Field note: ${impact} was observed at ${location} under ${hazardType.toLowerCase()} conditions.`;
  else if (variant === 6) causalLine = `${cause} triggered a visible change: ${impact} near ${location}.`;
  else if (variant === 7) causalLine = `${hazardType} report from ${location} shows ${impact}.`;
  else if (variant === 8) causalLine = `Observers at ${location} recorded ${impact}; likely driver was ${cause}.`;
  else causalLine = `${impact} developed around ${location} while ${cause} persisted.`;

  const metricsLine =
    `Measured depth ${formatMetric(depthCm, persona, "cm")}, wind ${formatMetric(windKmh, persona, "km/h")}, affected stretch ${formatMetric(stretchMeters, persona, "m")}, and about ${formatMetric(households, persona, "")} households.`;
  const affectedLine = `Primary affected group: ${affected}; response team ${action}.`;
  const outcomeLine = phase === "resolution" ? `Latest outcome: ${outcome}.` : "";
  const uncertaintyLine = (h2 % 7 === 0) ? "not fully sure on exact count yet; recheck in progress." : "";
  const correctionLine = (h3 % 9 === 0)
    ? `Correction: earlier estimate was ${4 + (h1 % 5)} shops, now ${7 + (h4 % 6)} after second walk-through.`
    : "";
  const fragmentLine = (h4 % 11 === 0) ? "signal weak, sending quick update." : "";
  const mediaLine = includeMediaLine
    ? "Attached one photo and one short video from separate angles for verification."
    : "";

  const tonePrefix =
    persona.tone === "formal"
      ? "As observed on-site,"
      : persona.tone === "colloquial"
        ? "From what we can see right now,"
        : persona.tone === "terse"
          ? "Quick field note:"
          : "This is concerning on ground right now:";

  const nonEnglish = language !== "en";
  const ordered = nonEnglish
    ? [
        baseDescription.trim(),
        flavorLine,
        `${hazardType} phase ${phase}: ${impact} at ${location}.`,
        `Metrics ${formatMetric(depthCm, persona, "cm")}/${formatMetric(windKmh, persona, "km/h")}/${formatMetric(stretchMeters, persona, "m")} and ${formatMetric(households, persona, "")} households.`,
        (h1 % 3 === 0) ? uncertaintyLine : "",
        (h2 % 4 === 0) ? correctionLine : "",
        (persona.rushed ? HUMAN_IMPERFECT_NOTES[h4 % HUMAN_IMPERFECT_NOTES.length] : ""),
        mediaLine,
      ]
    : [
        baseDescription.trim(),
        tonePrefix,
        phaseLine,
        causalLine,
        affectedLine,
        metricsLine,
        flavorLine,
        outcomeLine,
        (h1 % 2 === 0) ? HUMAN_LONG_NOTES[h2 % HUMAN_LONG_NOTES.length] : "",
        (h3 % 5 === 0) ? HUMAN_LONG_NOTES[(h1 + h4) % HUMAN_LONG_NOTES.length] : "",
        uncertaintyLine,
        correctionLine,
        (persona.rushed ? HUMAN_IMPERFECT_NOTES[h4 % HUMAN_IMPERFECT_NOTES.length] : ""),
        fragmentLine,
        mediaLine,
      ].filter((part) => part.length > 0);

  const cleaned = ordered.filter((part) => part.length > 0);
  const maxSentences =
    persona.length === "short" ? (nonEnglish ? 5 : 7) :
    persona.length === "medium" ? (nonEnglish ? 7 : 10) : (nonEnglish ? 9 : 14);
  const trimmed = cleaned.slice(0, maxSentences).join(" ");
  return withTypos(trimmed, seed, persona.typoRate);
};

const buildOlderRecord = (
  now: Date,
  language: SeedLanguage,
  scenario: Scenario,
  scenarioIndex: number,
  languageIndex: number,
): SeedRecord => {
  const profile = SEED_REPORTERS[language].primary;
  const persona = buildPersona(profile.key);
  const phasePlan = OLDER_PHASE_PLAN[scenarioIndex];
  const threadStart = new Date(
    now.getTime() - (THREAD_BASE_HOURS[phasePlan.thread] * 60 + languageIndex * 11) * 60 * 1000,
  );
  const eventAt = new Date(threadStart.getTime() + phasePlan.phaseMinutes * 60 * 1000);
  const creationLag = Math.max(
    2,
    scenario.create_delay_minutes +
      (persona.rushed ? 1 : 6) +
      (persona.length === "long" ? 3 : 0) +
      (languageIndex % 3),
  );
  const createdAt = new Date(eventAt.getTime() + creationLag * 60 * 1000);
  const phaseStatus: SeedStatus =
    phasePlan.phase === "resolution" ? "resolved" :
    phasePlan.phase === "follow_up" && scenarioIndex % 2 === 1 ? "verified" :
    "pending";
  const peopleBase = scenario.people_at_risk ?? 0;
  const peopleDelta =
    phasePlan.phase === "initial" ? 0 :
    phasePlan.phase === "follow_up" ? 3 :
    phasePlan.phase === "escalation" ? 6 :
    -Math.min(peopleBase, 4);
  return {
    key: `${language}-thr${phasePlan.thread + 1}-${phasePlan.phase}-${scenario.key}`,
    language,
    reporter_key: profile.key,
    hazard_type: scenario.hazard_type,
    description: buildNarrative({
      baseDescription: LOCALIZED_DESCRIPTIONS[language].older[scenarioIndex],
      seed: `${language}:${scenario.key}:older:${phasePlan.phase}`,
      hazardType: scenario.hazard_type,
      includeMediaLine: false,
      persona,
      phase: phasePlan.phase,
      language,
      flavorLine: ENGLISH_VARIATIONS[language].older[scenarioIndex],
    }),
    latitude: Number((scenario.latitude + jitter(`${language}:${scenario.key}:lat`, 0.018)).toFixed(6)),
    longitude: Number((scenario.longitude + jitter(`${language}:${scenario.key}:lon`, 0.02)).toFixed(6)),
    is_high_risk: scenario.is_high_risk,
    people_at_risk: peopleBase > 0 ? Math.max(0, peopleBase + peopleDelta) : null,
    urgency_level: scenario.urgency_level,
    status: phaseStatus,
    event_time: isoDate(eventAt),
    created_at: isoDate(createdAt),
  };
};

const buildMediaRecord = (
  now: Date,
  language: SeedLanguage,
  scenario: Scenario,
  scenarioIndex: number,
  languageIndex: number,
): SeedRecord => {
  const profile = SEED_REPORTERS[language].secondary;
  const persona = buildPersona(profile.key);
  const phasePlan = MEDIA_PHASE_PLAN[scenarioIndex];
  const imageKey =
    scenarioIndex === 0 ? WAVE_IMAGE_KEYS[languageIndex] : FLOOD_IMAGE_KEYS[languageIndex];
  const videoKey =
    scenarioIndex === 0 ? WAVE_VIDEO_KEYS[languageIndex] : FLOOD_VIDEO_KEYS[languageIndex];
  const threadStart = new Date(
    now.getTime() - (THREAD_BASE_HOURS[phasePlan.thread] * 60 + languageIndex * 11) * 60 * 1000,
  );
  const eventAt = new Date(threadStart.getTime() + phasePlan.phaseMinutes * 60 * 1000);
  const creationLag = Math.max(
    1,
    scenario.create_delay_minutes + (persona.rushed ? 0 : 4) + (languageIndex % 2),
  );
  const createdAt = new Date(eventAt.getTime() + creationLag * 60 * 1000);
  const peopleBase = scenario.people_at_risk ?? 0;
  return {
    key: `${language}-thr${phasePlan.thread + 1}-${phasePlan.phase}-${scenario.key}`,
    language,
    reporter_key: profile.key,
    hazard_type: scenario.hazard_type,
    description: buildNarrative({
      baseDescription: LOCALIZED_DESCRIPTIONS[language].media[scenarioIndex],
      seed: `${language}:${scenario.key}:media:${phasePlan.phase}`,
      hazardType: scenario.hazard_type,
      includeMediaLine: true,
      persona,
      phase: phasePlan.phase,
      language,
      flavorLine: ENGLISH_VARIATIONS[language].media[scenarioIndex],
    }),
    latitude: Number((scenario.latitude + jitter(`${language}:${scenario.key}:lat`, 0.012)).toFixed(6)),
    longitude: Number((scenario.longitude + jitter(`${language}:${scenario.key}:lon`, 0.012)).toFixed(6)),
    is_high_risk: scenario.is_high_risk,
    people_at_risk: peopleBase > 0 ? peopleBase + 5 + (languageIndex % 4) : null,
    urgency_level: scenario.urgency_level,
    status: "pending",
    event_time: isoDate(eventAt),
    created_at: isoDate(createdAt),
    media_asset_keys: [imageKey, videoKey],
  };
};

export const buildCuratedSeedRecords = (seedNow = new Date()): SeedRecord[] => {
  const olderRecords: SeedRecord[] = [];
  const mediaRecords: SeedRecord[] = [];

  SUPPORTED_SEED_LANGUAGES.forEach((language, languageIndex) => {
    OLDER_SCENARIOS.forEach((scenario, scenarioIndex) => {
      olderRecords.push(buildOlderRecord(seedNow, language, scenario, scenarioIndex, languageIndex));
    });
    MEDIA_SCENARIOS.forEach((scenario, scenarioIndex) => {
      mediaRecords.push(buildMediaRecord(seedNow, language, scenario, scenarioIndex, languageIndex));
    });
  });

  return [...olderRecords, ...mediaRecords];
};
