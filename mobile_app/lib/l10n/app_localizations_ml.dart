// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Malayalam (`ml`).
class AppLocalizationsMl extends AppLocalizations {
  AppLocalizationsMl([String locale = 'ml']) : super(locale);

  @override
  String get appTitle => 'സിവിൽ അലർട്ട് സിസ്റ്റം';

  @override
  String get profile => 'പ്രൊഫൈൽ';

  @override
  String get profileAndReports => 'റിപ്പോർട്ടുകൾ';

  @override
  String get edit => 'തിരുത്തുക';

  @override
  String get user => 'ഉപയോക്താവ്';

  @override
  String get phoneNotSet => 'ഫോൺ നൽകിയിട്ടില്ല';

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
  String get noUploadedReportsYet =>
      'ഇതുവരെ റിപ്പോർട്ടുകൾ അപ്‌ലോഡ് ചെയ്തിട്ടില്ല';

  @override
  String get failedToLoadReports => 'റിപ്പോർട്ടുകൾ ലോഡ് ചെയ്യാനായില്ല';

  @override
  String get youreOffline => 'നിങ്ങൾ ഓഫ്‌ലൈനിലാണ്';

  @override
  String get connectToInternetToLoadMyReports =>
      'എൻ്റെ റിപ്പോർട്ടുകൾ ലോഡ് ചെയ്യാൻ ഇൻ്റർനെറ്റിലേക്ക് കണക്റ്റുചെയ്യുക.';

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
  String get privacyReducePrecisionTitle => 'മാപ്പ് ലൊക്കേഷൻ കൃത്യത കുറയ്ക്കുക';

  @override
  String get privacyReducePrecisionSubtitle =>
      'പ്രവർത്തനക്ഷമമാക്കിയാൽ, നിങ്ങളുടെ റിപ്പോർട്ട് മാർക്കറുകൾ മാപ്പിൽ കുറഞ്ഞ ലൊക്കേഷൻ കൃത്യതയോടെ കാണിക്കും.';

  @override
  String get faqQ1 => 'ഒരു അപകടം ഞാൻ എങ്ങനെ റിപ്പോർട്ട് ചെയ്യും?';

  @override
  String get faqA1 =>
      'റിപ്പോർട്ട് തുറക്കുക, നിങ്ങൾ കാണുന്നത് വിവരിക്കുക, സമർപ്പിക്കുക.നിങ്ങൾ ഓഫ്‌ലൈനിലാണെങ്കിൽ, നിങ്ങൾ ഓൺലൈനിൽ തിരിച്ചെത്തുമ്പോൾ അത് ക്യൂവിൽ നിൽക്കുകയും അപ്‌ലോഡ് ചെയ്യുകയും ചെയ്യും.';

  @override
  String get faqQ2 =>
      'എന്തുകൊണ്ടാണ് എനിക്ക് ഗാലറിയിൽ നിന്ന് അപ്‌ലോഡ് ചെയ്യാൻ കഴിയാത്തത്?';

  @override
  String get faqA2 =>
      'റിപ്പോർട്ടുകൾ വിശ്വസനീയമായി നിലനിർത്താൻ, തത്സമയ ക്യാപ്‌ചർ (ക്യാമറ/റെക്കോർഡിംഗ്) മാത്രമേ ആപ്പ് അനുവദിക്കൂ, അതിനാൽ പഴയ മീഡിയ അപ്‌ലോഡ് ചെയ്യാൻ കഴിയില്ല.';

  @override
  String get faqQ3 => 'എൻ്റെ സ്ഥാനം എങ്ങനെയാണ് ഉപയോഗിക്കുന്നത്?';

  @override
  String get faqA3 =>
      'എവിടെയാണ് അപകടങ്ങൾ സംഭവിക്കുന്നതെന്ന് മനസിലാക്കാൻ പ്രതികരിക്കുന്നവരെ നിങ്ങളുടെ ലൊക്കേഷൻ സഹായിക്കുന്നു.പൊതു കാഴ്‌ചയ്‌ക്കായി, ലൊക്കേഷനുകൾ കുറച്ച് കൃത്യതയോടെ കാണിച്ചേക്കാം.';

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
  String get failedToSendOtp => 'OTP അയയ്‌ക്കുന്നതിൽ പരാജയപ്പെട്ടു.';

  @override
  String get checkSupabasePhoneConfig =>
      'സുപാബേസ് പരിശോധിക്കുക: പ്രാമാണീകരണം → ദാതാക്കൾ → ഫോൺ (പ്രാപ്‌തമാക്കി), SMS പ്രൊവൈഡർ കോൺഫിഗർ ചെയ്‌തു (Twilio).';

  @override
  String get enterOtp => 'OTP നൽകുക';

  @override
  String sentToNumber(Object mobileNumber) {
    return 'Sent to $mobileNumber';
  }

  @override
  String get pleaseEnter6DigitOtp => 'ദയവായി 6 അക്ക OTP നൽകുക';

  @override
  String get otpVerificationFailed => 'OTP പരിശോധിച്ചുറപ്പിക്കൽ പരാജയപ്പെട്ടു.';

  @override
  String signInFailedWithError(Object error) {
    return 'Sign-in failed: $error';
  }

  @override
  String get didntReceiveOtp => 'OTP ലഭിച്ചില്ലേ? ';

  @override
  String get otpResentSuccessfully => 'OTP വീണ്ടും അയച്ചു';

  @override
  String failedToResendOtpWithError(Object error) {
    return 'Failed to resend OTP: $error';
  }

  @override
  String get resendWithTimer => 'വീണ്ടും അയക്കുക (00:30)';

  @override
  String get savingLabel => 'സംരക്ഷിക്കുന്നു...';

  @override
  String get signedInSuccessfully => 'നിങ്ങൾ വിജയകരമായി\nലോഗിൻ ചെയ്തു';

  @override
  String get directingToDashboard =>
      'ഞങ്ങൾ നിങ്ങളെ ഡാഷ്‌ബോർഡിലേക്ക് നയിക്കുന്നതുവരെ കാത്തിരിക്കുക...';

  @override
  String get whatsYourName => 'നിങ്ങളുടെ പേര് എന്താണ്?';

  @override
  String get personalizeExperience =>
      'നിങ്ങളുടെ അനുഭവം വ്യക്തിപരമാക്കാൻ ഞങ്ങളെ സഹായിക്കൂ';

  @override
  String get enterYourName => 'നിങ്ങളുടെ പേര് നൽകുക';

  @override
  String get pleaseEnterValidName =>
      'ദയവായി ഒരു സാധുവായ പേര് നൽകുക (കുറഞ്ഞത് 2 പ്രതീകങ്ങളെങ്കിലും)';

  @override
  String get onboarding1Title =>
      'ദുരന്ത സമയങ്ങളിൽ\nനിങ്ങളുടെ വിശ്വസ്ത കൂട്ടായി';

  @override
  String get onboarding1Description =>
      'തത്സമയ അലേർട്ടുകൾ നേടുകയും അവ സംഭവിക്കുമ്പോൾ സമുദ്രത്തിലെ അപകടങ്ങൾ റിപ്പോർട്ട് ചെയ്തുകൊണ്ട് സുരക്ഷയ്ക്ക് സംഭാവന നൽകുകയും ചെയ്യുക.';

  @override
  String get onboarding2Title => 'സുരക്ഷയെ ശക്തിപ്പെടുത്തി,\nഒരു ചുവടു വീതം';

  @override
  String get onboarding2Description =>
      'ജീവൻ രക്ഷിക്കാൻ തത്സമയ അപകട വിവരങ്ങൾ പങ്കുവെച്ച് കടലിലെ ജാഗ്രതയുള്ള കണ്ണുകളുടെ ശൃംഖലയിൽ ചേരുക.';

  @override
  String get onboarding3Title => 'സജ്ജത ഇപ്പോൾ\nനിങ്ങളുടെ വിരൽതുമ്പിൽ';

  @override
  String get onboarding3Description =>
      'സമുദ്രത്തിലെ അപകടങ്ങൾ റിപ്പോർട്ടുചെയ്യുക, നിർണായകമായ അലേർട്ടുകൾ സ്വീകരിക്കുക, വൈകുന്നതിന് മുമ്പ് വിവരം അറിയിക്കുക.';

  @override
  String get skip => 'സ്കിപ്പ്';

  @override
  String get splashTitle => 'സിവിൽ അലേർട്ട്';

  @override
  String get splashSubtitle => 'ഫോക്കസ്ഡ് ഹസാർഡ് ഡിറ്റക്ഷൻ';

  @override
  String get hiWelcome => 'നമസ്കാരം, സ്വാഗതം';

  @override
  String get togetherForOceanSafety =>
      'വേണ്ടി ഒരുമിച്ച്\nസമുദ്ര സുരക്ഷ,\nഒരുമിച്ച് ശക്തമായി';

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
  String get locationServicesOffTitle => 'ലൊക്കേഷൻ സേവനങ്ങൾ ഓഫാണ്';

  @override
  String get enableLocationServicesForReporting =>
      'അപകടങ്ങൾ റിപ്പോർട്ട് ചെയ്യാൻ ലൊക്കേഷൻ സേവനങ്ങൾ (GPS) പ്രവർത്തനക്ഷമമാക്കുക.വേഗത്തിൽ പ്രതികരിക്കാൻ നിങ്ങളുടെ ലൊക്കേഷൻ അധികാരികളെ സഹായിക്കുന്നു.';

  @override
  String get enableLocationServicesForCurrentLocation =>
      'ലൊക്കേഷൻ സേവനങ്ങൾ ഓഫാണ്.നിങ്ങളുടെ നിലവിലെ സ്ഥാനം കാണിക്കാൻ GPS പ്രവർത്തനക്ഷമമാക്കുക.';

  @override
  String get permissionRequiredTitle => 'അനുമതി ആവശ്യമാണ്';

  @override
  String get locationPermissionDeniedAllowInSettings =>
      'ലൊക്കേഷൻ അനുമതി നിഷേധിച്ചു.ക്രമീകരണങ്ങളിൽ ആക്‌സസ് അനുവദിക്കുക.';

  @override
  String get locationPermissionDeniedAllowForCurrentLocation =>
      'ലൊക്കേഷൻ അനുമതി നിഷേധിച്ചു.നിങ്ങളുടെ നിലവിലെ ലൊക്കേഷൻ കാണിക്കാൻ ആക്സസ് അനുവദിക്കുക.';

  @override
  String get locationPermissionBlockedEnableInSettings =>
      'ലൊക്കേഷൻ അനുമതി തടഞ്ഞു.ആപ്പ് ക്രമീകരണങ്ങളിൽ ഇത് പ്രവർത്തനക്ഷമമാക്കുക.';

  @override
  String get locationPermissionPermanentlyDeniedForReporting =>
      'ലൊക്കേഷൻ അനുമതി ശാശ്വതമായി നിരസിക്കപ്പെട്ടു.അപകടങ്ങൾ റിപ്പോർട്ട് ചെയ്യുന്നതിനായി ആപ്പ് ക്രമീകരണങ്ങളിൽ ഇത് പ്രവർത്തനക്ഷമമാക്കുക.';

  @override
  String get locationPermissionPermanentlyDeniedForCurrentLocation =>
      'ലൊക്കേഷൻ അനുമതി ശാശ്വതമായി നിരസിക്കപ്പെട്ടു.നിങ്ങളുടെ നിലവിലെ ലൊക്കേഷൻ കാണിക്കാൻ ആപ്പ് ക്രമീകരണങ്ങളിൽ ഇത് പ്രവർത്തനക്ഷമമാക്കുക.';

  @override
  String get cancel => 'റദ്ദാക്കുക';

  @override
  String get notNow => 'ഇപ്പോൾ വേണ്ട';

  @override
  String get openSettings => 'ക്രമീകരണങ്ങൾ തുറക്കുക';

  @override
  String errorGettingLocationWithError(Object error) {
    return 'Error getting location: $error';
  }

  @override
  String get gettingLocation => 'ലൊക്കേഷൻ ലഭിക്കുന്നു...';

  @override
  String get gettingYourLocation => 'നിങ്ങളുടെ സ്ഥാനം നേടുന്നു...';

  @override
  String maximumAttachmentsAllowed(Object max) {
    return 'Maximum $max attachments allowed';
  }

  @override
  String errorPickingImageWithError(Object error) {
    return 'Error picking image: $error';
  }

  @override
  String errorPickingVideoWithError(Object error) {
    return 'Error picking video: $error';
  }

  @override
  String errorStoppingAudioWithError(Object error) {
    return 'Error stopping audio: $error';
  }

  @override
  String get recordingAudioTapToStop =>
      'ഓഡിയോ റെക്കോർഡ് ചെയ്യുന്നു... നിർത്താൻ വീണ്ടും ടാപ്പ് ചെയ്യുക.';

  @override
  String errorStartingAudioWithError(Object error) {
    return 'Error starting audio: $error';
  }

  @override
  String get pleaseSelectHazardType => 'ദയവായി ഒരു അപകട തരം തിരഞ്ഞെടുക്കുക';

  @override
  String get pleaseDescribeSituation => 'ദയവായി സാഹചര്യം വിവരിക്കുക';

  @override
  String get waitingForLocation => 'ലൊക്കേഷനായി കാത്തിരിക്കുന്നു...';

  @override
  String get pleaseEnterPeopleAtRisk => 'അപകടസാധ്യതയുള്ള ആളുകളുടെ കണക്ക് നൽകുക';

  @override
  String get noInternetReportQueued =>
      'ഇൻ്റർനെറ്റ് കണക്ഷനില്ല.റിപ്പോർട്ട് ക്യൂവിൽ ആയിരിക്കും.';

  @override
  String get profileNeededTitle => 'പ്രൊഫൈൽ ആവശ്യമാണ്';

  @override
  String get profileNeededBody =>
      'ഒരു റിപ്പോർട്ട് സമർപ്പിക്കുന്നതിന് മുമ്പ് ദയവായി നിങ്ങളുടെ ഫോൺ നമ്പർ ചേർക്കുക.';

  @override
  String get addNow => 'ഇപ്പോൾ ചേർക്കുക';

  @override
  String get reportSavedMediaUploadFailedRetry =>
      'റിപ്പോർട്ട് സംരക്ഷിച്ചു!മീഡിയ അപ്‌ലോഡ് പരാജയപ്പെട്ടു, പിന്നീട് വീണ്ടും ശ്രമിക്കും.';

  @override
  String get reportSubmittedSuccessfully => 'റിപ്പോർട്ട് സമർപ്പിച്ചു!🎉';

  @override
  String errorWithError(Object error) {
    return 'Error: $error';
  }

  @override
  String get retryGps => 'GPS വീണ്ടും ശ്രമിക്കുക';

  @override
  String get reportHazard => 'അപകടം റിപ്പോർട്ട് ചെയ്യുക';

  @override
  String get whatAreYouSeeing => 'നിങ്ങൾ എന്താണ് കാണുന്നത്?';

  @override
  String get reportHelpsKeepSafe =>
      'നിങ്ങളുടെ റിപ്പോർട്ട് എല്ലാവരേയും സുരക്ഷിതമായി നിലനിർത്താൻ സഹായിക്കുന്നു';

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

  @override
  String get liveNews => 'തത്സമയ വാർത്തകൾ';

  @override
  String get sampleHazardHeadline => 'പസഫിക് തീരത്ത് വലിയ തിരമാലകൾ';

  @override
  String get sampleDate => 'ഞായർ, 11 ജൂൺ 2024';

  @override
  String get sampleTimeAgo => '3 മിനിറ്റ് മുമ്പ്';

  @override
  String get queuedReportStuck => 'കുടുങ്ങി';

  @override
  String get queuedReportPendingUpload => 'അപ്‌ലോഡ് ചെയ്യാനുണ്ട്';

  @override
  String get queuedReportReadyToRetry => 'വീണ്ടും ശ്രമിക്കാൻ തയ്യാറാണ്';

  @override
  String get queuedReportWaitingForRetry =>
      'വീണ്ടും ശ്രമിക്കാൻ കാത്തിരിക്കുന്നു';

  @override
  String get removeQueuedReportTitle =>
      'ക്യൂവിലുള്ള റിപ്പോർട്ട് നീക്കം ചെയ്യണോ?';

  @override
  String get removeQueuedReportContent =>
      'ഇത് ഓഫ്‌ലൈൻ കോപ്പി മായ്ക്കുകയും ഭാവിയിലുള്ള ശ്രമങ്ങൾ നിർത്തുകയും ചെയ്യും.';

  @override
  String get queuedReportRemoved => 'ക്യൂവിലുള്ള റിപ്പോർട്ട് മാറ്റി';

  @override
  String get themeLight => 'ലൈറ്റ്';

  @override
  String get themeDark => 'ഡാർക്ക്';

  @override
  String get themeSystem => 'സിസ്റ്റം';

  @override
  String get notifications => 'അറിയിപ്പുകൾ';

  @override
  String get logOutTitle => 'ലോഗ് ഔട്ട് ചെയ്യണോ?';

  @override
  String get logOut => 'ലോഗ് ഔട്ട്';

  @override
  String get similarReportExists =>
      'അടുത്തായി സമാനമായ റിപ്പോർട്ട് ഉണ്ട്. നിങ്ങളുടെ റിപ്പോർട്ട് അതിനോട് ചേർത്തു.';

  @override
  String get sendingReportsTooQuickly =>
      'നിങ്ങൾ വളരെ വേഗത്തിൽ റിപ്പോർട്ടുകൾ അയയ്ക്കുന്നു. 30 സെക്കൻഡ് കാത്തിരിക്കുക.';

  @override
  String get hourlyReportLimitReached =>
      'മണിക്കൂർ റിപ്പോർട്ട് പരിധി കഴിഞ്ഞു. പിന്നീട് ശ്രമിക്കുക.';

  @override
  String get couldNotOpenMaps => 'മാപ്പ് തുറക്കാനായില്ല';

  @override
  String get navigate => 'നാവിഗേറ്റ് ചെയ്യുക';

  @override
  String get reportDetailsNotAvailable =>
      'റിപ്പോർട്ട് വിവരങ്ങൾ ഇതുവരെ ലഭ്യമല്ല';

  @override
  String get viewQueue => 'ക്യൂ കാണുക';

  @override
  String get achievements => 'നേട്ടങ്ങൾ';

  @override
  String get leaderboard => 'ലീഡർബോർഡ്';

  @override
  String get chooseFromGallery => 'ഗാലറിയിൽ നിന്ന് തിരഞ്ഞെടുക്കുക';

  @override
  String get downloadOfflineRegion => 'ഓഫ്‌ലൈൻ പ്രദേശം ഡൗൺലോഡ് ചെയ്യുക';

  @override
  String get radius => 'ചുറ്റളവ്';

  @override
  String get download => 'ഡൗൺലോഡ്';

  @override
  String get deleteRegionTitle => 'പ്രദേശം മായ്ക്കണോ?';

  @override
  String deleteRegionContent(Object name, Object count) {
    return '\"$name\" എന്നതും അതിലെ $count ക്യാഷ് ചെയ്ത ടൈലുകളും മായ്ക്കണോ?';
  }

  @override
  String get delete => 'മായ്ക്കുക';

  @override
  String get media => 'മീഡിയ';

  @override
  String get failedToLoadImage => 'ചിത്രം ലോഡ് ചെയ്യാൻ കഴിഞ്ഞില്ല';

  @override
  String get unsupportedMediaType => 'പിന്തുണയ്ക്കാത്ത മീഡിയ തരം';

  @override
  String get noVerifiedRiskZones =>
      'ഇവിടെ ഇതുവരെ സ്ഥിരീകരിച്ച അപകട മേഖലകളില്ല.';

  @override
  String get filterAllHazards => 'എല്ലാ അപകടങ്ങളും';

  @override
  String get filterRipCurrent => 'റിപ്പ് കറന്റ്';

  @override
  String get filterPollution => 'മലിനീകരണം';

  @override
  String get filterEarthquake => 'ഭൂകമ്പം';

  @override
  String get mobileNumberHint => '12345 67890';

  @override
  String distanceInKm(Object r) {
    return '$r കി.മീ.';
  }

  @override
  String get filterCommunity => 'സമൂഹം';

  @override
  String get filterMySubmitted => 'ഞാൻ സമർപ്പിച്ചത്';

  @override
  String get noReportsYet => 'റിപ്പോർട്ടുകളൊന്നുമില്ല';

  @override
  String get noSubmittedReportsYet =>
      'നിലവിൽ റിപ്പോർട്ടുകളൊന്നും സമർപ്പിച്ചിട്ടില്ല';

  @override
  String failedToLoadAdvisory(String error) {
    return 'Failed to load advisory: $error';
  }

  @override
  String get advisoryNotFound => 'ഉപദേശം കണ്ടെത്തിയില്ല.';

  @override
  String distanceKmAway(String km) {
    return '$km km away';
  }

  @override
  String distanceMAway(String m) {
    return '$m മീറ്റർ അകലെ';
  }

  @override
  String get low => 'കുറവ്';

  @override
  String get justNow => 'ഇപ്പോള്';

  @override
  String minutesAgo(int minutes) {
    return '${minutes}m ago';
  }

  @override
  String hoursAgo(int hours) {
    return '${hours}h ago';
  }

  @override
  String daysAgo(int days) {
    return '${days}d ago';
  }

  @override
  String get leaderboardTitle => 'ലീഡർബോർഡ്';

  @override
  String error(String errorMsg) {
    return 'പിശക്: $errorMsg';
  }

  @override
  String get noLeaderboardData => 'ഇതുവരെ ലീഡർബോർഡ് ഡാറ്റയില്ല';

  @override
  String get startReportingToClimb =>
      'റാങ്കുകൾ കയറാൻ റിപ്പോർട്ടിംഗ് ആരംഭിക്കുക!';

  @override
  String pointsAbbrev(int points) {
    return '$points pts';
  }

  @override
  String reportCountDesc(int count) {
    return '$count reports';
  }

  @override
  String get you => 'നിങ്ങൾ';

  @override
  String get achievementsTitle => 'നേട്ടങ്ങൾ';

  @override
  String get earnedBadges => 'സമ്പാദിച്ച ബാഡ്ജുകൾ';

  @override
  String get lockedBadges => 'പൂട്ടിയ ബാഡ്ജുകൾ';

  @override
  String get pointsHistory => 'പോയിൻ്റ് ചരിത്രം';

  @override
  String get totalPoints => 'ആകെ പോയിൻ്റുകൾ';

  @override
  String get verified => 'പരിശോധിച്ചുറപ്പിച്ചു';

  @override
  String get rate => 'നിരക്ക്';

  @override
  String get badges => 'ബാഡ്ജുകൾ';

  @override
  String get submitFirstReportBadge =>
      'ഒരു ബാഡ്ജ് നേടാൻ നിങ്ങളുടെ ആദ്യ റിപ്പോർട്ട് സമർപ്പിക്കുക!';

  @override
  String get allBadgesEarned => '🎉 എല്ലാ ബാഡ്ജുകളും നേടി!';

  @override
  String get noPointsHistoryYet => 'ഇതുവരെ പോയിൻ്റ് ചരിത്രമില്ല';

  @override
  String get earned => '✅ സമ്പാദിച്ചു!';

  @override
  String get notYetEarned => '🔒 ഇതുവരെ നേടിയിട്ടില്ല';

  @override
  String get ok => 'ശരി';

  @override
  String get filterAllUrgencies => 'എല്ലാ അടിയന്തിര സാഹചര്യങ്ങളും';

  @override
  String get filtersTitle => 'ഫിൽട്ടറുകൾ';

  @override
  String get timeRangeTitle => 'സമയ പരിധി';

  @override
  String get twentyFourHours => '24 മണിക്കൂർ';

  @override
  String daysNumber(int days) {
    return '$days days';
  }

  @override
  String get showRiskZonesTitle => 'റിസ്ക് സോണുകൾ കാണിക്കുക';

  @override
  String get displayHazardHotspots =>
      'അപകട ഹോട്ട്‌സ്‌പോട്ടുകൾ പ്രദർശിപ്പിക്കുക';

  @override
  String get highRiskOnlyTitle => 'ഉയർന്ന അപകടസാധ്യത മാത്രം';

  @override
  String get showOnlyCriticalReports =>
      'നിർണായക റിപ്പോർട്ടുകൾ മാത്രം കാണിക്കുക';

  @override
  String get mediaViewerTitle => 'മീഡിയ വ്യൂവർ';

  @override
  String mediaViewerError(String error) {
    return 'Failed to load media: $error';
  }

  @override
  String get loadingText => 'ലോഡ് ചെയ്യുന്നു...';

  @override
  String urgencyLevelText(String level) {
    return '$level Urgency';
  }

  @override
  String get highRiskBadge => 'ഉയർന്ന റിസ്ക്';

  @override
  String get mediaTitle => 'മാധ്യമങ്ങൾ';

  @override
  String get playLabel => 'കളിക്കുക';

  @override
  String get pauseLabel => 'താൽക്കാലികമായി നിർത്തുക';

  @override
  String get notificationsTitle => 'അറിയിപ്പുകൾ';

  @override
  String reportStatusTitle(String status) {
    return 'Report $status';
  }

  @override
  String reportStatusBody(String hazardType, String status) {
    return 'Your $hazardType report has been $status.';
  }

  @override
  String get noNotificationsYet => 'ഇതുവരെ അറിയിപ്പുകളൊന്നുമില്ല';

  @override
  String get downloadOfflineRegionTitle => 'ഓഫ്‌ലൈൻ മേഖല ഡൗൺലോഡ് ചെയ്യുക';

  @override
  String get downloadOfflineRegionDesc =>
      'ഓഫ്‌ലൈൻ ഉപയോഗത്തിനായി നിങ്ങളുടെ നിലവിലെ സ്ഥലത്തിന് ചുറ്റുമുള്ള മാപ്പ് ടൈലുകൾ ഡൗൺലോഡ് ചെയ്യുന്നു.';

  @override
  String get regionNameLabel => 'പ്രദേശത്തിൻ്റെ പേര്';

  @override
  String get radiusLabel => 'ആരം';

  @override
  String get cancelLabel => 'റദ്ദാക്കുക';

  @override
  String get downloadLabel => 'ഡൗൺലോഡ് ചെയ്യുക';

  @override
  String downloadSuccessMsg(String name) {
    return '\"$name\" downloaded successfully!';
  }

  @override
  String downloadFailedMsg(String error) {
    return 'Download failed: $error';
  }

  @override
  String deleteRegionDesc(String name, int count) {
    return 'Remove \"$name\" and its $count cached tiles?';
  }

  @override
  String get deleteLabel => 'ഇല്ലാതാക്കുക';

  @override
  String get offlineMapsTitle => 'ഓഫ്‌ലൈൻ മാപ്പുകൾ';

  @override
  String get downloadingTiles => 'ടൈലുകൾ ഡൗൺലോഡ് ചെയ്യുന്നു...';

  @override
  String get offlineMapInfoDesc =>
      'നിങ്ങൾ ഓൺലൈനിൽ കാണുന്ന മാപ്പ് ടൈലുകൾ ഓഫ്‌ലൈൻ ഉപയോഗത്തിനായി സ്വയമേവ കാഷെ ചെയ്യപ്പെടും.പൂർണ്ണമായ ഓഫ്‌ലൈൻ കവറേജിനായി പ്രദേശങ്ങൾ ഡൗൺലോഡ് ചെയ്യുക.';

  @override
  String get noOfflineRegionsYet => 'ഇതുവരെ ഓഫ്‌ലൈൻ മേഖലകളൊന്നുമില്ല';

  @override
  String get tapToDownloadRegion =>
      'ഒരു പ്രദേശം ഡൗൺലോഡ് ചെയ്യാൻ + ടാപ്പുചെയ്യുക';

  @override
  String estimatedTiles(int estimate, String sizeMB) {
    return '~$estimate tiles ($sizeMB MB est.)';
  }

  @override
  String regionTileSize(int count, String sizeMB) {
    return '$count tiles · $sizeMB MB';
  }

  @override
  String queuedReportsCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count queued reports',
      one: '1 queued report',
    );
    return '$_temp0';
  }

  @override
  String stuckItemsManualAttention(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count items need manual attention.',
      one: '1 item needs manual attention.',
    );
    return '$_temp0';
  }

  @override
  String get reviewRetryStatus =>
      'ഇവിടെ വീണ്ടും ശ്രമത്തിൻ്റെ നിലയും പിശകിൻ്റെ കാരണവും അവലോകനം ചെയ്യുക, കുടുങ്ങിയ ഇനങ്ങൾ നീക്കം ചെയ്യുക.';

  @override
  String get duplicateReportDetected =>
      'സമാനമായ റിപ്പോർട്ട് ഇതിനകം സമീപത്തുണ്ട്.നിങ്ങളുടെ സമർപ്പണം ഞങ്ങൾ ഇതിലേക്ക് ലിങ്ക് ചെയ്‌തു.';

  @override
  String get uploadTimelineCompleted =>
      'നിങ്ങളുടെ അപ്‌ലോഡ് ടൈംലൈൻ പൂർത്തിയാക്കി സംരക്ഷിക്കപ്പെട്ടു.';

  @override
  String get doneLabel => 'ചെയ്തു';

  @override
  String get rateLimitMinInterval =>
      'നിങ്ങൾ വളരെ വേഗത്തിൽ റിപ്പോർട്ടുകൾ അയയ്ക്കുന്നു.ദയവായി 30 സെക്കൻഡ് കാത്തിരുന്ന് വീണ്ടും ശ്രമിക്കുക.';

  @override
  String get rateLimitHourly =>
      'മണിക്കൂർ റിപ്പോർട്ട് പരിധി എത്തി.ദയവായി പിന്നീട് വീണ്ടും ശ്രമിക്കുക.';

  @override
  String get uploadingReportTitle =>
      'നിങ്ങളുടെ റിപ്പോർട്ട് അപ്‌ലോഡ് ചെയ്യുന്നു';

  @override
  String get preparingReportDesc => 'റിപ്പോർട്ട് വിശദാംശങ്ങൾ തയ്യാറാക്കുന്നു';

  @override
  String get reportDetailsUploaded => 'റിപ്പോർട്ട് വിശദാംശങ്ങൾ അപ്‌ലോഡ് ചെയ്തു';

  @override
  String get duplicateReportLinked =>
      'ഡ്യൂപ്ലിക്കേറ്റ് റിപ്പോർട്ട് കണ്ടെത്തി, നിലവിലുള്ള റിപ്പോർട്ടുമായി ലിങ്ക് ചെയ്‌തു';

  @override
  String uploadedAttachmentCounter(int current, int total) {
    return 'Uploaded attachment $current/$total';
  }

  @override
  String get uploadingMedia => 'മീഡിയ അപ്‌ലോഡ് ചെയ്യുന്നു';

  @override
  String get mediaUploadFailedQueued =>
      'മീഡിയ അപ്‌ലോഡ് പരാജയപ്പെട്ടു, വീണ്ടും ശ്രമിക്കാനായി ക്യൂവിൽ';

  @override
  String get finalizingReport => 'അന്തിമ റിപ്പോർട്ട്';

  @override
  String get pleaseWaitBeforeSending =>
      'മറ്റൊരു റിപ്പോർട്ട് അയയ്ക്കുന്നതിന് മുമ്പ് ദയവായി കാത്തിരിക്കുക';

  @override
  String get hourlyReportLimitTitle => 'മണിക്കൂർ റിപ്പോർട്ട് പരിധി എത്തി';

  @override
  String uploadFailedError(String error) {
    return 'Upload failed: $error';
  }

  @override
  String get openQueueToReview =>
      'വീണ്ടും ശ്രമിക്കുന്നതിനുള്ള നിലയും പിശകിൻ്റെ കാരണവും അവലോകനം ചെയ്യാനും കുടുങ്ങിയ ഇനങ്ങൾ നീക്കംചെയ്യാനും ക്യൂ തുറക്കുക.';

  @override
  String get arcAbbr => 'ARC';

  @override
  String get arcFull => 'അലേർട്ട് • റിപ്പോർട്ട് • കോർഡിനേറ്റ് ചെയ്യുക';

  @override
  String failedToTakePhoto(String error) {
    return 'Failed to take photo: $error';
  }

  @override
  String failedToPickPhoto(String error) {
    return 'Failed to pick photo: $error';
  }

  @override
  String get syncingQueuedReports =>
      'ക്യൂവിലുള്ള റിപ്പോർട്ടുകൾ സമന്വയിപ്പിക്കുന്നു';

  @override
  String preparingPendingReports(int count) {
    return 'Preparing $count pending report(s)';
  }

  @override
  String uploadingReportCount(int current, int total) {
    return 'Uploading report $current of $total';
  }

  @override
  String get uploadingAttachments => 'അറ്റാച്ച്‌മെൻ്റുകൾ അപ്‌ലോഡ് ചെയ്യുന്നു';

  @override
  String get reportUpdateTitle => 'അപ്ഡേറ്റ് റിപ്പോർട്ട് ചെയ്യുക';

  @override
  String get aboutTransparencyBody =>
      'കടൽ അപകടങ്ങൾ റിപ്പോർട്ട് ചെയ്യാൻ പൗരന്മാരെ സഹായിക്കുകയും തത്സമയ സാഹചര്യങ്ങൾ മനസ്സിലാക്കാൻ അധികാരികളെ സഹായിക്കുകയും ചെയ്യുന്നതാണ് ഈ ആപ്പ്.\n\nവ്യക്തിഗത വിവരങ്ങളുടെ പരസ്യപ്പെടുത്തൽ പരിമിതപ്പെടുത്തിക്കൊണ്ടും പൊതു കാഴ്ചകൾക്കായി സ്വകാര്യത-സുരക്ഷിത മാപ്പ് ഡാറ്റ ഉപയോഗിച്ചുകൊണ്ടും ഞങ്ങൾ സ്വകാര്യതയ്ക്ക് മുൻഗണന നൽകുന്നു.';

  @override
  String get privacyBody =>
      'ഞങ്ങൾ ശേഖരിക്കുന്നവ: നിങ്ങളുടെ ഫോൺ (ലോഗിൻ ചെയ്യുന്നതിന്), നിങ്ങളുടെ റിപ്പോർട്ട് വിവരണം, സമയം, സ്ഥലം എന്നിവ.\n\nഞങ്ങൾ ഇത് എങ്ങനെ ഉപയോഗിക്കുന്നു: നിങ്ങളുടെ റിപ്പോർട്ട് സംഭരിക്കാനും മാപ്പിലും അപ്‌ഡേറ്റ് ഫീഡിലും പരിശോധിച്ചുറപ്പിച്ച സ്വകാര്യത-സുരക്ഷിത വിവരങ്ങൾ കാണിക്കാനും.';

  @override
  String get reportSubmittedReason => 'റിപ്പോർട്ട് സമർപ്പിച്ചു';

  @override
  String get reportVerifiedReason => 'റിപ്പോർട്ട് സ്ഥിരീകരിച്ചു';

  @override
  String get highRiskVerifiedReason =>
      'ഉയർന്ന അപകടസാധ്യതയുള്ള റിപ്പോർട്ട് സ്ഥിരീകരിച്ചു';

  @override
  String get reportRejectedReason => 'റിപ്പോർട്ട് നിരസിച്ചു';
}
