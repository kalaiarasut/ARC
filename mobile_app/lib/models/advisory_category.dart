/// Official advisory category
/// food | shelter | medical | rescue | roadblock | warning | evacuation
enum AdvisoryCategory {
  food,
  shelter,
  medical,
  rescue,
  roadblock,
  warning,
  evacuation,
  unknown,
}

AdvisoryCategory advisoryCategoryFromString(String? value) {
  switch ((value ?? '').toLowerCase()) {
    case 'food':
      return AdvisoryCategory.food;
    case 'shelter':
      return AdvisoryCategory.shelter;
    case 'medical':
      return AdvisoryCategory.medical;
    case 'rescue':
      return AdvisoryCategory.rescue;
    case 'roadblock':
      return AdvisoryCategory.roadblock;
    case 'warning':
      return AdvisoryCategory.warning;
    case 'evacuation':
      return AdvisoryCategory.evacuation;
    default:
      return AdvisoryCategory.unknown;
  }
}

String advisoryCategoryLabel(AdvisoryCategory category) {
  return advisoryCategoryLabelForLanguage(category, 'en');
}

String advisoryCategoryLabelForLanguage(
  AdvisoryCategory category,
  String languageCode,
) {
  final labels = _categoryLabelsByLanguage[languageCode.trim().toLowerCase()] ??
      _categoryLabelsByLanguage['en']!;
  return labels[category] ?? _categoryLabelsByLanguage['en']![category]!;
}

String advisorySeverityLabelForLanguage(String severity, String languageCode) {
  final normalizedSeverity = severity.trim().toLowerCase();
  final labels = _severityLabelsByLanguage[languageCode.trim().toLowerCase()] ??
      _severityLabelsByLanguage['en']!;
  return labels[normalizedSeverity] ?? labels['info'] ?? 'Info';
}

String advisoryLabelForLanguage(String key, String languageCode) {
  final labels = _uiLabelsByLanguage[languageCode.trim().toLowerCase()] ??
      _uiLabelsByLanguage['en']!;
  return labels[key] ?? key;
}

String advisorySeverityLabel(String severity) {
  return advisorySeverityLabelForLanguage(severity, 'en');
}

String advisoryCategoryLabelLegacy(AdvisoryCategory category) {
  return advisoryCategoryLabelForLanguage(category, 'en');
}

const Map<String, Map<AdvisoryCategory, String>> _categoryLabelsByLanguage = {
  'en': {
    AdvisoryCategory.food: 'Food',
    AdvisoryCategory.shelter: 'Shelter',
    AdvisoryCategory.medical: 'Medical',
    AdvisoryCategory.rescue: 'Rescue',
    AdvisoryCategory.roadblock: 'Roadblock',
    AdvisoryCategory.warning: 'Warning',
    AdvisoryCategory.evacuation: 'Evacuation',
    AdvisoryCategory.unknown: 'Update',
  },
  'bn': {
    AdvisoryCategory.food: 'খাদ্য',
    AdvisoryCategory.shelter: 'আশ্রয়',
    AdvisoryCategory.medical: 'চিকিৎসা',
    AdvisoryCategory.rescue: 'উদ্ধার',
    AdvisoryCategory.roadblock: 'রাস্তা অবরোধ',
    AdvisoryCategory.warning: 'সতর্কতা',
    AdvisoryCategory.evacuation: 'স্থানান্তর',
    AdvisoryCategory.unknown: 'আপডেট',
  },
  'gu': {
    AdvisoryCategory.food: 'ખોરાક',
    AdvisoryCategory.shelter: 'આશ્રય',
    AdvisoryCategory.medical: 'ચિકિત્સા',
    AdvisoryCategory.rescue: 'બચાવ',
    AdvisoryCategory.roadblock: 'રસ્તા અવરોધ',
    AdvisoryCategory.warning: 'ચેતવણી',
    AdvisoryCategory.evacuation: 'સ્થળાંતર',
    AdvisoryCategory.unknown: 'અપડેટ',
  },
  'hi': {
    AdvisoryCategory.food: 'भोजन',
    AdvisoryCategory.shelter: 'आश्रय',
    AdvisoryCategory.medical: 'चिकित्सा',
    AdvisoryCategory.rescue: 'बचाव',
    AdvisoryCategory.roadblock: 'सड़क अवरोध',
    AdvisoryCategory.warning: 'चेतावनी',
    AdvisoryCategory.evacuation: 'निकासी',
    AdvisoryCategory.unknown: 'अपडेट',
  },
  'kn': {
    AdvisoryCategory.food: 'ಆಹಾರ',
    AdvisoryCategory.shelter: 'ಆಶ್ರಯ',
    AdvisoryCategory.medical: 'ವೈದ್ಯಕೀಯ',
    AdvisoryCategory.rescue: 'ರಕ್ಷಣೆ',
    AdvisoryCategory.roadblock: 'ರಸ್ತೆ ತಡೆ',
    AdvisoryCategory.warning: 'ಎಚ್ಚರಿಕೆ',
    AdvisoryCategory.evacuation: 'ಸ್ಥಳಾಂತರ',
    AdvisoryCategory.unknown: 'ನವೀಕರಣ',
  },
  'ml': {
    AdvisoryCategory.food: 'ഭക്ഷണം',
    AdvisoryCategory.shelter: 'താമസം',
    AdvisoryCategory.medical: 'മെഡിക്കൽ',
    AdvisoryCategory.rescue: 'രക്ഷാപ്രവർത്തനം',
    AdvisoryCategory.roadblock: 'റോഡ് തടസം',
    AdvisoryCategory.warning: 'മുന്നറിയിപ്പ്',
    AdvisoryCategory.evacuation: 'ഒഴിപ്പിക്കൽ',
    AdvisoryCategory.unknown: 'അപ്ഡേറ്റ്',
  },
  'mr': {
    AdvisoryCategory.food: 'अन्न',
    AdvisoryCategory.shelter: 'निवारा',
    AdvisoryCategory.medical: 'वैद्यकीय',
    AdvisoryCategory.rescue: 'बचाव',
    AdvisoryCategory.roadblock: 'रस्ता अडथळा',
    AdvisoryCategory.warning: 'इशारा',
    AdvisoryCategory.evacuation: 'स्थलांतर',
    AdvisoryCategory.unknown: 'अपडेट',
  },
  'or': {
    AdvisoryCategory.food: 'ଖାଦ୍ୟ',
    AdvisoryCategory.shelter: 'ଆଶ୍ରୟ',
    AdvisoryCategory.medical: 'ଚିକିତ୍ସା',
    AdvisoryCategory.rescue: 'ଉଦ୍ଧାର',
    AdvisoryCategory.roadblock: 'ରାସ୍ତା ଅବରୋଧ',
    AdvisoryCategory.warning: 'ସତର୍କବାଣୀ',
    AdvisoryCategory.evacuation: 'ସ୍ଥାନାନ୍ତର',
    AdvisoryCategory.unknown: 'ଅଦ୍ୟତନ',
  },
  'ta': {
    AdvisoryCategory.food: 'உணவு',
    AdvisoryCategory.shelter: 'தங்குமிடம்',
    AdvisoryCategory.medical: 'மருத்துவம்',
    AdvisoryCategory.rescue: 'மீட்பு',
    AdvisoryCategory.roadblock: 'சாலை மறியல்',
    AdvisoryCategory.warning: 'எச்சரிக்கை',
    AdvisoryCategory.evacuation: 'வெளியேற்றம்',
    AdvisoryCategory.unknown: 'புதுப்பிப்பு',
  },
  'te': {
    AdvisoryCategory.food: 'ఆహారం',
    AdvisoryCategory.shelter: 'ఆశ్రయం',
    AdvisoryCategory.medical: 'వైద్యం',
    AdvisoryCategory.rescue: 'రక్షణ',
    AdvisoryCategory.roadblock: 'రోడ్‌బ్లాక్',
    AdvisoryCategory.warning: 'హెచ్చరిక',
    AdvisoryCategory.evacuation: 'తరలింపు',
    AdvisoryCategory.unknown: 'అప్డేట్',
  },
};

const Map<String, Map<String, String>> _severityLabelsByLanguage = {
  'en': {
    'warning': 'Warning',
    'watch': 'Watch',
    'info': 'Info',
  },
  'bn': {
    'warning': 'সতর্কতা',
    'watch': 'নজরদারি',
    'info': 'তথ্য',
  },
  'gu': {
    'warning': 'ચેતવણી',
    'watch': 'નિરીક્ષણ',
    'info': 'માહિતી',
  },
  'hi': {
    'warning': 'चेतावनी',
    'watch': 'निगरानी',
    'info': 'जानकारी',
  },
  'kn': {
    'warning': 'ಎಚ್ಚರಿಕೆ',
    'watch': 'ನಿಗಾವಳಿ',
    'info': 'ಮಾಹಿತಿ',
  },
  'ml': {
    'warning': 'മുന്നറിയിപ്പ്',
    'watch': 'ജാഗ്രത',
    'info': 'വിവരം',
  },
  'mr': {
    'warning': 'इशारा',
    'watch': 'नजर',
    'info': 'माहिती',
  },
  'or': {
    'warning': 'ସତର୍କବାଣୀ',
    'watch': 'ନଜରଦାରୀ',
    'info': 'ସୂଚନା',
  },
  'ta': {
    'warning': 'எச்சரிக்கை',
    'watch': 'கவனிப்பு',
    'info': 'தகவல்',
  },
  'te': {
    'warning': 'హెచ్చరిక',
    'watch': 'అప్రమత్తం',
    'info': 'సమాచారం',
  },
};

const Map<String, Map<String, String>> _uiLabelsByLanguage = {
  'en': {
    'advisory': 'Advisory',
    'published': 'Published',
    'starts': 'Starts',
    'expires': 'Expires',
    'contacts': 'Emergency Contacts',
    'directions': 'Get Directions',
    'phone': 'Phone',
    'whatsapp': 'WhatsApp',
    'hotline': 'Hotline',
  },
  'bn': {
    'advisory': 'পরামর্শ',
    'published': 'প্রকাশিত',
    'starts': 'শুরু',
    'expires': 'শেষ',
    'contacts': 'জরুরি যোগাযোগ',
    'directions': 'দিকনির্দেশ নিন',
    'phone': 'ফোন',
    'whatsapp': 'হোয়াটসঅ্যাপ',
    'hotline': 'হটলাইন',
  },
  'gu': {
    'advisory': 'સલાહ',
    'published': 'પ્રકાશિત',
    'starts': 'શરૂ થાય છે',
    'expires': 'સમાપ્ત થાય છે',
    'contacts': 'આપત્તિકાળીન સંપર્કો',
    'directions': 'દિશાઓ મેળવો',
    'phone': 'ફોન',
    'whatsapp': 'વોટ્સએપ',
    'hotline': 'હોટલાઇન',
  },
  'hi': {
    'advisory': 'परामर्श',
    'published': 'प्रकाशित',
    'starts': 'आरंभ',
    'expires': 'समाप्ति',
    'contacts': 'आपात संपर्क',
    'directions': 'दिशा प्राप्त करें',
    'phone': 'फ़ोन',
    'whatsapp': 'व्हाट्सऐप',
    'hotline': 'हॉटलाइन',
  },
  'kn': {
    'advisory': 'ಸಲಹೆ',
    'published': 'ಪ್ರಕಟಿಸಲಾಗಿದೆ',
    'starts': 'ಆರಂಭ',
    'expires': 'ಅಂತ್ಯ',
    'contacts': 'ತುರ್ತು ಸಂಪರ್ಕಗಳು',
    'directions': 'ದಿಕ್ಕುಗಳನ್ನು ಪಡೆಯಿರಿ',
    'phone': 'ಫೋನ್',
    'whatsapp': 'ವಾಟ್ಸ್ಆಪ್',
    'hotline': 'ಹಾಟ್‌ಲೈನ್',
  },
  'ml': {
    'advisory': 'അറിയിപ്പ്',
    'published': 'പ്രസിദ്ധീകരിച്ചത്',
    'starts': 'തുടക്കം',
    'expires': 'അവസാനം',
    'contacts': 'അടിയന്തര ബന്ധങ്ങൾ',
    'directions': 'ദിശകൾ നേടുക',
    'phone': 'ഫോൺ',
    'whatsapp': 'വാട്ട്സ്ആപ്പ്',
    'hotline': 'ഹോട്ട്‌ലൈൻ',
  },
  'mr': {
    'advisory': 'सल्ला',
    'published': 'प्रकाशित',
    'starts': 'सुरुवात',
    'expires': 'समाप्ती',
    'contacts': 'आपत्कालीन संपर्क',
    'directions': 'दिशा मिळवा',
    'phone': 'फोन',
    'whatsapp': 'व्हॉट्सअॅप',
    'hotline': 'हॉटलाइन',
  },
  'or': {
    'advisory': 'ପରାମର୍ଶ',
    'published': 'ପ୍ରକାଶିତ',
    'starts': 'ଆରମ୍ଭ',
    'expires': 'ସମାପ୍ତ',
    'contacts': 'ଜରୁରୀ ଯୋଗାଯୋଗ',
    'directions': 'ଦିଗ ପାଆନ୍ତୁ',
    'phone': 'ଫୋନ',
    'whatsapp': 'ୱାଟସ୍ଆପ୍',
    'hotline': 'ହଟଲାଇନ୍',
  },
  'ta': {
    'advisory': 'அறிவிப்பு',
    'published': 'வெளியிடப்பட்டது',
    'starts': 'தொடக்கம்',
    'expires': 'முடிவு',
    'contacts': 'அவசர தொடர்புகள்',
    'directions': 'வழி பெறுக',
    'phone': 'தொலைபேசி',
    'whatsapp': 'வாட்ஸ்அப்',
    'hotline': 'ஹாட்லைன்',
  },
  'te': {
    'advisory': 'సలహా',
    'published': 'ప్రచురితం',
    'starts': 'ప్రారంభం',
    'expires': 'ముగింపు',
    'contacts': 'అత్యవసర సంప్రదింపులు',
    'directions': 'దిశలు పొందండి',
    'phone': 'ఫోన్',
    'whatsapp': 'వాట్సాప్',
    'hotline': 'హాట్‌లైన్',
  },
};
