import 'app_localizations_en.dart';

// ignore_for_file: type=lint

/// The translations for Malayalam (`ml`).
class AppLocalizationsMl extends AppLocalizationsEn {
  AppLocalizationsMl([String locale = 'ml']) : super(locale);

  @override
  String get appTitle => 'സിവിൽ അലർട്ട് സിസ്റ്റം';

  @override
  String get profile => 'പ്രൊഫൈൽ';

  @override
  String get profileAndReports => 'റിപ്പോർട്ടുകൾ';

  @override
  String get settings => 'സെറ്റിംഗ്സ്';

  @override
  String get helpFaq => 'സഹായം / FAQ';

  @override
  String get aboutTransparency => 'വിവരങ്ങളും പരസ്യതയും';

  @override
  String get language => 'ഭാഷ';

  @override
  String get privacyControls => 'ഭാഷയും സ്വകാര്യത നിയന്ത്രണങ്ങളും';

  @override
  String get privacy => 'സ്വകാര്യത';

  @override
  String get chooseLanguage => 'ഭാഷ തിരഞ്ഞെടുക്കുക';

  @override
  String get save => 'സംരക്ഷിക്കുക';

  @override
  String get continueLabel => 'തുടരുക';

  @override
  String get languageComingSoon => 'ഈ ഭാഷ ഉടൻ ലഭ്യമാകും.';

  @override
  String get updates => 'അപ്‌ഡേറ്റുകൾ';

  @override
  String get syncNow => 'ഇപ്പോൾ സിങ്ക് ചെയ്യുക';

  @override
  String get nothingToSync => 'സിങ്ക് ചെയ്യാൻ ഒന്നുമില്ല';

  @override
  String syncDone(Object succeeded, Object failed) {
    return 'സിങ്ക് പൂർത്തിയായി: $succeeded വിജയിച്ചു, $failed പരാജയപ്പെട്ടു';
  }

  @override
  String get offlineReports => 'ഓഫ്‌ലൈൻ റിപ്പോർട്ടുകൾ';

  @override
  String get noPendingReports => 'കാത്തിരിക്കുന്ന റിപ്പോർട്ടുകളില്ല';

  @override
  String attemptsLabel(Object count) {
    return 'ശ്രമങ്ങൾ: $count';
  }

  @override
  String get retry => 'വീണ്ടും ശ്രമിക്കുക';

  @override
  String get remove => 'നീക്കുക';

  @override
  String get myReports => 'എന്റെ റിപ്പോർട്ടുകൾ';

  @override
  String get noUploadedReportsYet => 'ഇതുവരെ റിപ്പോർട്ടുകൾ അപ്‌ലോഡ് ചെയ്തിട്ടില്ല';

  @override
  String get failedToLoadReports => 'റിപ്പോർട്ടുകൾ ലോഡ് ചെയ്യാനായില്ല';

  @override
  String get youreOffline => 'നിങ്ങൾ ഓഫ്‌ലൈനിലാണ്';

  @override
  String get connectToInternetToLoadMyReports =>
      'എന്റെ റിപ്പോർട്ടുകൾ കാണാൻ ഇന്റർനെറ്റുമായി ബന്ധിപ്പിക്കുക.';

  @override
  String pendingCount(Object count) {
    return '$count കാത്തിരിക്കുന്നു';
  }

  @override
  String get noUpdatesYet => 'ഇതുവരെ അപ്‌ഡേറ്റുകളില്ല';

  @override
  String get failedToLoadUpdates => 'അപ്‌ഡേറ്റുകൾ ലോഡ് ചെയ്യാനായില്ല';

  @override
  String get helpTitle => 'സഹായം / FAQ';

  @override
  String get aboutTitle => 'വിവരങ്ങളും പരസ്യതയും';

  @override
  String get privacyTitle => 'സ്വകാര്യത നിയന്ത്രണങ്ങൾ';

  @override
  String get loginTitle => 'ലോഗിൻ / സൈൻ അപ്പ്';

  @override
  String get signUpWithMobile =>
      'നിങ്ങളുടെ രജിസ്റ്റർ ചെയ്ത മൊബൈൽ നമ്പർ ഉപയോഗിച്ച് സൈൻ അപ്പ് ചെയ്യുക';

  @override
  String get otpIntro => 'നിങ്ങളുടെ നമ്പർ സ്ഥിരീകരിക്കാൻ ഞങ്ങൾ OTP അയക്കും';

  @override
  String get mobileNumberLabel => 'മൊബൈൽ നമ്പർ *';

  @override
  String get sendingLabel => 'അയയ്ക്കുന്നു...';

  @override
  String get sendOtp => 'OTP അയയ്ക്കുക';

  @override
  String get enterOtp => 'OTP നൽകുക';

  @override
  String get pleaseEnter6DigitOtp => 'ദയവായി 6 അക്ക OTP നൽകുക';

  @override
  String get didntReceiveOtp => 'OTP ലഭിച്ചില്ലേ? ';

  @override
  String get resendWithTimer => 'വീണ്ടും അയക്കുക (00:30)';

  @override
  String get savingLabel => 'സംരക്ഷിക്കുന്നു...';

  @override
  String get signedInSuccessfully => 'നിങ്ങൾ വിജയകരമായി\nലോഗിൻ ചെയ്തു';

  @override
  String get directingToDashboard =>
      'ദയവായി കാത്തിരിക്കൂ, നിങ്ങളെ ഡാഷ്‌ബോർഡിലേക്ക് നയിക്കുകയാണ്...';

  @override
  String get whatsYourName => 'നിങ്ങളുടെ പേര് എന്താണ്?';

  @override
  String get personalizeExperience =>
      'നിങ്ങളുടെ അനുഭവം വ്യക്തിഗതമാക്കാൻ ഞങ്ങളെ സഹായിക്കുക';

  @override
  String get enterYourName => 'നിങ്ങളുടെ പേര് നൽകുക';

  @override
  String get pleaseEnterValidName =>
      'ദയവായി ശരിയായ പേര് നൽകുക (കുറഞ്ഞത് 2 അക്ഷരങ്ങൾ)';

  @override
  String get onboarding1Title => 'ദുരന്ത സമയങ്ങളിൽ\nനിങ്ങളുടെ വിശ്വസ്ത കൂട്ടായി';

  @override
  String get onboarding1Description =>
      'തത്സമയ അലർട്ടുകൾ ലഭിക്കൂ, സമുദ്രാപത്തുകൾ റിപ്പോർട്ട് ചെയ്ത് സുരക്ഷയിൽ പങ്കുചേരൂ.';

  @override
  String get onboarding2Title => 'സുരക്ഷയെ ശക്തിപ്പെടുത്തി,\nഒരു ചുവടു വീതം';

  @override
  String get onboarding2Description =>
      'കടലിനെ നിരീക്ഷിക്കുന്ന ജാഗരൂക കൂട്ടായ്മയിൽ ചേരൂ, ജീവൻ രക്ഷിക്കുന്ന അപകട വിവരങ്ങൾ പങ്കുവെക്കൂ.';

  @override
  String get onboarding3Title => 'സജ്ജത ഇപ്പോൾ\nനിങ്ങളുടെ വിരൽതുമ്പിൽ';

  @override
  String get onboarding3Description =>
      'സമുദ്രാപത്തുകൾ റിപ്പോർട്ട് ചെയ്യൂ, നിർണായക അലർട്ടുകൾ നേടൂ, സമയത്തിന് മുമ്പ് അറിയാം.';

  @override
  String get skip => 'സ്കിപ്പ്';

  @override
  String get hiWelcome => 'നമസ്കാരം, സ്വാഗതം';

  @override
  String get togetherForOceanSafety =>
      'സമുദ്ര സുരക്ഷയ്ക്കായി\nഒന്നിച്ച്,\nകൂടുതൽ ശക്തമായി';

  @override
  String get seeUpdates => 'അപ്‌ഡേറ്റുകൾ കാണുക';

  @override
  String get unusualActivity => 'റിപ്പോർട്ടുകൾ';

  @override
  String get seeAll => 'എല്ലാം കാണുക';

  @override
  String get filterNow => 'ഇപ്പോൾ';

  @override
  String get filterLastWeek => 'കഴിഞ്ഞ ആഴ്ച';

  @override
  String get filterLastMonth => 'കഴിഞ്ഞ മാസം';

  @override
  String get reportHazard => 'അപകടം റിപ്പോർട്ട് ചെയ്യുക';

  @override
  String get whatAreYouSeeing => 'നിങ്ങൾ എന്താണ് കാണുന്നത്?';

  @override
  String get reportHelpsKeepSafe =>
      'നിങ്ങളുടെ റിപ്പോർട്ട് എല്ലാവരെയും സുരക്ഷിതരാക്കാൻ സഹായിക്കുന്നു';

  @override
  String get hazardTypeRequired => 'അപകട തരം *';

  @override
  String get descriptionRequired => 'വിവരണം *';

  @override
  String get describeWhatYouSeeHint => 'നിങ്ങൾ കാണുന്നത് വിവരിക്കുക...';

  @override
  String get location => 'സ്ഥലം';

  @override
  String get time => 'സമയം';

  @override
  String get addMediaOptional => 'മീഡിയ ചേർക്കുക (ഐച്ഛികം)';

  @override
  String get camera => 'ക്യാമറ';

  @override
  String get record => 'റെക്കോർഡ്';

  @override
  String get recordAudio => 'ഓഡിയോ റെക്കോർഡ് ചെയ്യുക';

  @override
  String get stopAudio => 'ഓഡിയോ നിർത്തുക';

  @override
  String get highRiskSituation => 'ഉയർന്ന അപകട സ്ഥിതി';

  @override
  String get peopleAtRiskEstimate => 'അപകടത്തിൽ ഉള്ളവരുടെ കണക്ക്';

  @override
  String get urgencyLow => 'കുറവ്';

  @override
  String get urgencyMedium => 'ഇടത്തരം';

  @override
  String get urgencyHigh => 'ഉയർന്ന്';

  @override
  String get submitReport => 'റിപ്പോർട്ട് സമർപ്പിക്കുക';

  @override
  String get close => 'അടയ്ക്കുക';

  @override
  String get moreDetails => 'കൂടുതൽ വിവരങ്ങൾ';

  @override
  String get hazardHighWaves => 'ഉയർന്ന തിരകൾ';

  @override
  String get hazardTsunami => 'സുനാമി';

  @override
  String get hazardStorm => 'കൊടുങ്കാറ്റ്';

  @override
  String get hazardFlood => 'പ്രളയം';

  @override
  String get hazardOther => 'മറ്റ്';

  @override
  String get homeTab => 'ഹോം';

  @override
  String get mapTab => 'മാപ്';

  @override
  String get updatesTab => 'അപ്‌ഡേറ്റുകൾ';

  @override
  String get profileTab => 'റിപ്പോർട്ടുകൾ';
}
