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

String advisoryCategoryLabelForLanguage(AdvisoryCategory category, String languageCode) {
  switch (languageCode.trim().toLowerCase()) {
    case 'ta':
      switch (category) {
        case AdvisoryCategory.food:
          return 'உணவு';
        case AdvisoryCategory.shelter:
          return 'தங்குமிடம்';
        case AdvisoryCategory.medical:
          return 'மருத்துவம்';
        case AdvisoryCategory.rescue:
          return 'மீட்பு';
        case AdvisoryCategory.roadblock:
          return 'சாலை மறியல்';
        case AdvisoryCategory.warning:
          return 'எச்சரிக்கை';
        case AdvisoryCategory.evacuation:
          return 'வெளியேற்றம்';
        case AdvisoryCategory.unknown:
          return 'புதுப்பிப்பு';
      }
    case 'hi':
      switch (category) {
        case AdvisoryCategory.food:
          return 'भोजन';
        case AdvisoryCategory.shelter:
          return 'आश्रय';
        case AdvisoryCategory.medical:
          return 'चिकित्सा';
        case AdvisoryCategory.rescue:
          return 'बचाव';
        case AdvisoryCategory.roadblock:
          return 'सड़क अवरोध';
        case AdvisoryCategory.warning:
          return 'चेतावनी';
        case AdvisoryCategory.evacuation:
          return 'निकासी';
        case AdvisoryCategory.unknown:
          return 'अपडेट';
      }
    case 'te':
      switch (category) {
        case AdvisoryCategory.food:
          return 'ఆహారం';
        case AdvisoryCategory.shelter:
          return 'ఆశ్రయం';
        case AdvisoryCategory.medical:
          return 'వైద్యం';
        case AdvisoryCategory.rescue:
          return 'రక్షణ';
        case AdvisoryCategory.roadblock:
          return 'రోడ్బ్లాక్';
        case AdvisoryCategory.warning:
          return 'హెచ్చరిక';
        case AdvisoryCategory.evacuation:
          return 'తరలింపు';
        case AdvisoryCategory.unknown:
          return 'అప్డేట్';
      }
    case 'ml':
      switch (category) {
        case AdvisoryCategory.food:
          return 'ഭക്ഷണം';
        case AdvisoryCategory.shelter:
          return 'താമസം';
        case AdvisoryCategory.medical:
          return 'മെഡിക്കൽ';
        case AdvisoryCategory.rescue:
          return 'രക്ഷാപ്രവർത്തനം';
        case AdvisoryCategory.roadblock:
          return 'റോഡ് തടസം';
        case AdvisoryCategory.warning:
          return 'മുന്നറിയിപ്പ്';
        case AdvisoryCategory.evacuation:
          return 'ഒഴിപ്പിക്കൽ';
        case AdvisoryCategory.unknown:
          return 'അപ്‌ഡേറ്റ്';
      }
    default:
      switch (category) {
        case AdvisoryCategory.food:
          return 'Food';
        case AdvisoryCategory.shelter:
          return 'Shelter';
        case AdvisoryCategory.medical:
          return 'Medical';
        case AdvisoryCategory.rescue:
          return 'Rescue';
        case AdvisoryCategory.roadblock:
          return 'Roadblock';
        case AdvisoryCategory.warning:
          return 'Warning';
        case AdvisoryCategory.evacuation:
          return 'Evacuation';
        case AdvisoryCategory.unknown:
          return 'Update';
      }
  }
}

String advisorySeverityLabelForLanguage(String severity, String languageCode) {
  final normalizedSeverity = severity.trim().toLowerCase();
  final normalizedLanguage = languageCode.trim().toLowerCase();

  switch (normalizedLanguage) {
    case 'ta':
      if (normalizedSeverity == 'warning') return 'எச்சரிக்கை';
      if (normalizedSeverity == 'watch') return 'கவனிப்பு';
      return 'தகவல்';
    case 'hi':
      if (normalizedSeverity == 'warning') return 'चेतावनी';
      if (normalizedSeverity == 'watch') return 'निगरानी';
      return 'जानकारी';
    case 'te':
      if (normalizedSeverity == 'warning') return 'హెచ్చరిక';
      if (normalizedSeverity == 'watch') return 'అప్రమత్తం';
      return 'సమాచారం';
    case 'ml':
      if (normalizedSeverity == 'warning') return 'മുന്നറിയിപ്പ്';
      if (normalizedSeverity == 'watch') return 'ജാഗ്രത';
      return 'വിവരം';
    default:
      if (normalizedSeverity == 'warning') return 'Warning';
      if (normalizedSeverity == 'watch') return 'Watch';
      return 'Info';
  }
}

String advisoryLabelForLanguage(String key, String languageCode) {
  final normalizedLanguage = languageCode.trim().toLowerCase();
  switch (normalizedLanguage) {
    case 'ta':
      return {
            'advisory': 'அறிவிப்பு',
            'published': 'வெளியிடப்பட்டது',
            'starts': 'தொடக்கம்',
            'expires': 'முடிவு',
            'contacts': 'அவசர தொடர்புகள்',
            'directions': 'வழி பெறுக',
            'phone': 'தொலைபேசி',
            'whatsapp': 'வாட்ஸ்அப்',
            'hotline': 'ஹாட்லைன்',
          }[key] ??
          key;
    case 'hi':
      return {
            'advisory': 'परामर्श',
            'published': 'प्रकाशित',
            'starts': 'आरंभ',
            'expires': 'समाप्ति',
            'contacts': 'आपात संपर्क',
            'directions': 'दिशा प्राप्त करें',
            'phone': 'फ़ोन',
            'whatsapp': 'व्हाट्सऐप',
            'hotline': 'हॉटलाइन',
          }[key] ??
          key;
    case 'te':
      return {
            'advisory': 'సలహా',
            'published': 'ప్రచురితం',
            'starts': 'ప్రారంభం',
            'expires': 'ముగింపు',
            'contacts': 'అత్యవసర సంప్రదింపులు',
            'directions': 'దిశలు పొందండి',
            'phone': 'ఫోన్',
            'whatsapp': 'వాట్సాప్',
            'hotline': 'హాట్‌లైన్',
          }[key] ??
          key;
    case 'ml':
      return {
            'advisory': 'അറിയിപ്പ്',
            'published': 'പ്രസിദ്ധീകരിച്ചത്',
            'starts': 'തുടക്കം',
            'expires': 'അവസാനം',
            'contacts': 'അടിയന്തര ബന്ധങ്ങൾ',
            'directions': 'ദിശകൾ നേടുക',
            'phone': 'ഫോൺ',
            'whatsapp': 'വാട്ട്സ്ആപ്പ്',
            'hotline': 'ഹോട്ട്‌ലൈൻ',
          }[key] ??
          key;
    default:
      return {
            'advisory': 'Advisory',
            'published': 'Published',
            'starts': 'Starts',
            'expires': 'Expires',
            'contacts': 'Emergency Contacts',
            'directions': 'Get Directions',
            'phone': 'Phone',
            'whatsapp': 'WhatsApp',
            'hotline': 'Hotline',
          }[key] ??
          key;
  }
}

String advisorySeverityLabel(String severity) {
  return advisorySeverityLabelForLanguage(severity, 'en');
}

String advisoryCategoryLabelLegacy(AdvisoryCategory category) {
  switch (category) {
    case AdvisoryCategory.food:
      return 'Food';
    case AdvisoryCategory.shelter:
      return 'Shelter';
    case AdvisoryCategory.medical:
      return 'Medical';
    case AdvisoryCategory.rescue:
      return 'Rescue';
    case AdvisoryCategory.roadblock:
      return 'Roadblock';
    case AdvisoryCategory.warning:
      return 'Warning';
    case AdvisoryCategory.evacuation:
      return 'Evacuation';
    case AdvisoryCategory.unknown:
      return 'Update';
  }
}
