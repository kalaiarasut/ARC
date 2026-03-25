// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Tamil (`ta`).
class AppLocalizationsTa extends AppLocalizations {
  AppLocalizationsTa([String locale = 'ta']) : super(locale);

  @override
  String get appTitle => 'சிவில் அலர்ட் அமைப்பு';

  @override
  String get profile => 'சுயவிவரம்';

  @override
  String get profileAndReports => 'அறிக்கைகள்';

  @override
  String get edit => 'திருத்து';

  @override
  String get user => 'பயனர்';

  @override
  String get phoneNotSet => 'தொலைபேசி அமைக்கப்படவில்லை';

  @override
  String get syncNow => 'இப்போது ஒத்திசை';

  @override
  String get nothingToSync => 'ஒத்திசைக்க எதுவும் இல்லை';

  @override
  String syncDone(Object succeeded, Object failed) {
    return 'ஒத்திசை முடிந்தது: $succeeded வெற்றி, $failed தோல்வி';
  }

  @override
  String get offlineReports => 'ஆஃப்லைன் அறிக்கைகள்';

  @override
  String get noPendingReports => 'நிலுவையில் உள்ள அறிக்கைகள் இல்லை';

  @override
  String attemptsLabel(Object count) {
    return 'முயற்சிகள்: $count';
  }

  @override
  String get retry => 'மீண்டும் முயற்சி';

  @override
  String get remove => 'நீக்கு';

  @override
  String get myReports => 'என் அறிக்கைகள்';

  @override
  String get noUploadedReportsYet => 'இன்னும் பதிவேற்றப்பட்ட அறிக்கைகள் இல்லை';

  @override
  String get failedToLoadReports => 'அறிக்கைகள் ஏற்ற முடியவில்லை';

  @override
  String get youreOffline => 'நீங்கள் ஆஃப்லைனில் உள்ளீர்கள்';

  @override
  String get connectToInternetToLoadMyReports =>
      'என் அறிக்கைகளை ஏற்ற இணையத்துடன் இணைக்கவும்.';

  @override
  String get settings => 'அமைப்புகள்';

  @override
  String get helpFaq => 'உதவி / கேள்விகள்';

  @override
  String get aboutTransparency => 'பற்றி & வெளிப்படைத்தன்மை';

  @override
  String get language => 'மொழி';

  @override
  String get privacyControls => 'மொழி & தனியுரிமை கட்டுப்பாடுகள்';

  @override
  String get privacy => 'தனியுரிமை';

  @override
  String get chooseLanguage => 'மொழியைத் தேர்ந்தெடுக்கவும்';

  @override
  String get save => 'சேமி';

  @override
  String get continueLabel => 'தொடரவும்';

  @override
  String get languageComingSoon => 'இந்த மொழி விரைவில் வரும்.';

  @override
  String get updates => 'புதுப்பிப்புகள்';

  @override
  String pendingCount(Object count) {
    return '$count நிலுவையில்';
  }

  @override
  String get noUpdatesYet => 'இன்னும் புதுப்பிப்புகள் இல்லை';

  @override
  String get failedToLoadUpdates => 'புதுப்பிப்புகளை ஏற்ற முடியவில்லை';

  @override
  String get helpTitle => 'உதவி / கேள்விகள்';

  @override
  String get aboutTitle => 'பற்றி & வெளிப்படைத்தன்மை';

  @override
  String get privacyTitle => 'தனியுரிமை கட்டுப்பாடுகள்';

  @override
  String get privacyReducePrecisionTitle =>
      'வரைபடத்தில் இடத் துல்லியத்தை குறைக்கவும்';

  @override
  String get privacyReducePrecisionSubtitle =>
      'இயக்கப்பட்டால், உங்கள் அறிக்கை குறியீடுகள் வரைபடத்தில் குறைந்த துல்லியத்துடன் காட்டப்படும்.';

  @override
  String get faqQ1 => 'ஆபத்தை எப்படி அறிக்கையிடுவது?';

  @override
  String get faqA1 =>
      'Report பக்கத்தில் சென்று நீங்கள் பார்க்கும் நிலையை விவரித்து அனுப்பவும். நீங்கள் ஆஃப்லைனில் இருந்தால், அது சேமிக்கப்பட்டு இணையம் வந்ததும் பதிவேற்றப்படும்.';

  @override
  String get faqQ2 => 'கேலரியிலிருந்து பதிவேற்ற முடியாதது ஏன்?';

  @override
  String get faqA2 =>
      'அறிக்கைகள் நம்பத்தகுந்ததாக இருக்க, நேரடியாகப் பதிவு செய்த (கேமரா/பதிவு) மீடியா மட்டும் அனுமதிக்கப்படுகிறது.';

  @override
  String get faqQ3 => 'என் இடம் எப்படி பயன்படுத்தப்படுகிறது?';

  @override
  String get faqA3 =>
      'ஆபத்து எங்கு நிகழ்கிறது என்பதை புரிந்துகொள்ள உங்கள் இடம் உதவுகிறது. பொதுப் பார்வைக்கு, இடம் குறைந்த துல்லியத்துடன் காட்டப்படலாம்.';

  @override
  String get loginTitle => 'உள்நுழை / பதிவு செய்';

  @override
  String get signUpWithMobile =>
      'பதிவு செய்யப்பட்ட கைபேசி எண்ணுடன் பதிவு செய்யவும்';

  @override
  String get otpIntro => 'உங்கள் எண்ணை சரிபார்க்க OTP அனுப்பப்படும்';

  @override
  String get mobileNumberLabel => 'கைபேசி எண் *';

  @override
  String get sendingLabel => 'அனுப்பப்படுகிறது...';

  @override
  String get sendOtp => 'OTP அனுப்பு';

  @override
  String get failedToSendOtp => 'OTP அனுப்ப முடியவில்லை.';

  @override
  String get checkSupabasePhoneConfig =>
      'Supabase: Authentication → Providers → Phone (enabled) மற்றும் SMS provider (Twilio) அமைக்கப்பட்டுள்ளதா என சரிபார்க்கவும்.';

  @override
  String get enterOtp => 'OTP உள்ளிடவும்';

  @override
  String sentToNumber(Object mobileNumber) {
    return 'Sent to $mobileNumber';
  }

  @override
  String get pleaseEnter6DigitOtp => '6 இலக்க OTP ஐ உள்ளிடவும்';

  @override
  String get otpVerificationFailed => 'OTP சரிபார்ப்பு தோல்வியடைந்தது.';

  @override
  String signInFailedWithError(Object error) {
    return 'Sign-in failed: $error';
  }

  @override
  String get didntReceiveOtp => 'OTP வரவில்லையா? ';

  @override
  String get otpResentSuccessfully => 'OTP மீண்டும் அனுப்பப்பட்டது';

  @override
  String failedToResendOtpWithError(Object error) {
    return 'Failed to resend OTP: $error';
  }

  @override
  String get resendWithTimer => 'மீண்டும் அனுப்பு (00:30)';

  @override
  String get savingLabel => 'சேமிக்கிறது...';

  @override
  String get signedInSuccessfully => 'உள்நுழைவு\nவெற்றிகரமாக முடிந்தது';

  @override
  String get directingToDashboard => 'டாஷ்போர்டிற்கு கொண்டு செல்கிறோம்...';

  @override
  String get whatsYourName => 'உங்கள் பெயர் என்ன?';

  @override
  String get personalizeExperience =>
      'உங்கள் அனுபவத்தை தனிப்பயன் செய்ய உதவுங்கள்';

  @override
  String get enterYourName => 'உங்கள் பெயரை உள்ளிடவும்';

  @override
  String get pleaseEnterValidName =>
      'செல்லுபடியாகும் பெயரை உள்ளிடவும் (குறைந்தது 2 எழுத்துகள்)';

  @override
  String get onboarding1Title => 'பேரிடர் நேரங்களில்\nஉங்கள் நம்பகமான துணை';

  @override
  String get onboarding1Description =>
      'நேரடி அலர்ட்களை பெறுங்கள் மற்றும் கடல் ஆபத்துகளை நிகழும் போதே அறிக்கையிட்டு பாதுகாப்பில் பங்களிக்கவும்.';

  @override
  String get onboarding2Title => 'பாதுகாப்பை மேம்படுத்துவோம்,\nஒவ்வொரு படியாக';

  @override
  String get onboarding2Description =>
      'கடலை கவனிக்கும் விழிப்பான சமூகத்தில் சேர்ந்து, நேரடி ஆபத் தகவலை பகிர்ந்து உயிர்களை காக்க உதவுங்கள்.';

  @override
  String get onboarding3Title => 'உங்கள் கைவசத்தில்\nதயார்நிலை';

  @override
  String get onboarding3Description =>
      'கடல் ஆபத்துகளை அறிக்கையிடுங்கள், முக்கிய அலர்ட்களை பெறுங்கள், நேரம் தாமதமாகும்முன் தகவலறிந்து இருக்கவும்.';

  @override
  String get skip => 'தவிர்';

  @override
  String get splashTitle => 'சிவில் அலர்ட்';

  @override
  String get splashSubtitle => 'ஆபத்துகளை துல்லியமாக கண்டறிதல்';

  @override
  String get hiWelcome => 'வணக்கம், வரவேற்கிறோம் 👋';

  @override
  String get togetherForOceanSafety =>
      'கடல் பாதுகாப்பிற்காக\nஒன்றிணைவோம்,\nஇணைந்தால் பலம்';

  @override
  String get seeUpdates => 'புதுப்பிப்புகளை காண்க';

  @override
  String get unusualActivity => 'அறிக்கைகள்';

  @override
  String get seeAll => 'அனைத்தையும் காண்க';

  @override
  String get filterNow => 'இப்போது';

  @override
  String get filterLastWeek => 'கடந்த வாரம்';

  @override
  String get filterLastMonth => 'கடந்த மாதம்';

  @override
  String get locationServicesOffTitle => 'இடச் சேவைகள் அணைக்கப்பட்டுள்ளன';

  @override
  String get enableLocationServicesForReporting =>
      'ஆபத்துகளை அறிக்கையிட, இடச் சேவைகளை (GPS) இயக்கவும். உங்கள் இடம் அதிகாரிகள் விரைவில் பதிலளிக்க உதவுகிறது.';

  @override
  String get enableLocationServicesForCurrentLocation =>
      'இடச் சேவைகள் அணைக்கப்பட்டுள்ளன. உங்கள் தற்போதைய இடத்தை காட்ட GPS ஐ இயக்கவும்.';

  @override
  String get permissionRequiredTitle => 'அனுமதி தேவை';

  @override
  String get locationPermissionDeniedAllowInSettings =>
      'இட அனுமதி மறுக்கப்பட்டது. அமைப்புகளில் அனுமதி வழங்கவும்.';

  @override
  String get locationPermissionDeniedAllowForCurrentLocation =>
      'இட அனுமதி மறுக்கப்பட்டது. உங்கள் தற்போதைய இடத்தை காட்ட அனுமதி வழங்கவும்.';

  @override
  String get locationPermissionBlockedEnableInSettings =>
      'இட அனுமதி தடைசெய்யப்பட்டுள்ளது. ஆப் அமைப்புகளில் அதை இயக்கவும்.';

  @override
  String get locationPermissionPermanentlyDeniedForReporting =>
      'இட அனுமதி நிரந்தரமாக மறுக்கப்பட்டுள்ளது. ஆபத்துகளை அறிக்கையிட, ஆப் அமைப்புகளில் அதை இயக்கவும்.';

  @override
  String get locationPermissionPermanentlyDeniedForCurrentLocation =>
      'இட அனுமதி நிரந்தரமாக மறுக்கப்பட்டுள்ளது. உங்கள் தற்போதைய இடத்தை காட்ட, ஆப் அமைப்புகளில் அதை இயக்கவும்.';

  @override
  String get cancel => 'ரத்து';

  @override
  String get notNow => 'இப்போது இல்லை';

  @override
  String get openSettings => 'அமைப்புகளை திற';

  @override
  String errorGettingLocationWithError(Object error) {
    return 'Error getting location: $error';
  }

  @override
  String get gettingLocation => 'இடம் பெறுகிறது...';

  @override
  String get gettingYourLocation => 'உங்கள் இடத்தை பெறுகிறது...';

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
      'ஆடியோ பதிவு செய்கிறது… நிறுத்த மீண்டும் தட்டவும்.';

  @override
  String errorStartingAudioWithError(Object error) {
    return 'Error starting audio: $error';
  }

  @override
  String get pleaseSelectHazardType => 'ஒரு ஆபத்து வகையைத் தேர்ந்தெடுக்கவும்';

  @override
  String get pleaseDescribeSituation => 'நிகழ்வை விவரிக்கவும்';

  @override
  String get waitingForLocation => 'இடம் பெற காத்திருக்கிறது...';

  @override
  String get pleaseEnterPeopleAtRisk =>
      'ஆபத்தில் இருப்போர் எண்ணிக்கையை (மதிப்பீடு) உள்ளிடவும்';

  @override
  String get noInternetReportQueued =>
      'இணையம் இல்லை. அறிக்கை வரிசையில் சேமிக்கப்படும்.';

  @override
  String get profileNeededTitle => 'சுயவிவரம் தேவை';

  @override
  String get profileNeededBody =>
      'அறிக்கையை சமர்ப்பிக்கும் முன் உங்கள் தொலைபேசி எண்ணை சேர்க்கவும்.';

  @override
  String get addNow => 'இப்போது சேர்க்கவும்';

  @override
  String get reportSavedMediaUploadFailedRetry =>
      'அறிக்கை சேமிக்கப்பட்டது! மீடியா பதிவேற்றம் தோல்வியடைந்தது, பின்னர் மீண்டும் முயற்சி செய்யப்படும்.';

  @override
  String get reportSubmittedSuccessfully =>
      'அறிக்கை வெற்றிகரமாக சமர்ப்பிக்கப்பட்டது! 🎉';

  @override
  String errorWithError(Object error) {
    return 'Error: $error';
  }

  @override
  String get retryGps => 'GPS மீண்டும் முயற்சி';

  @override
  String get reportHazard => 'ஆபத்தை அறிக்கையிடு';

  @override
  String get whatAreYouSeeing => 'நீங்கள் என்ன பார்க்கிறீர்கள்? 👁️';

  @override
  String get reportHelpsKeepSafe =>
      'உங்கள் அறிக்கை அனைவரையும் பாதுகாப்பாக வைத்திருக்க உதவுகிறது';

  @override
  String get hazardTypeRequired => 'ஆபத்து வகை *';

  @override
  String get descriptionRequired => 'விளக்கம் *';

  @override
  String get describeWhatYouSeeHint =>
      'நீங்கள் பார்க்கும் நிலையை விவரிக்கவும்...';

  @override
  String get location => 'இடம்';

  @override
  String get time => 'நேரம்';

  @override
  String get addMediaOptional => 'மீடியா சேர்க்கவும் (விருப்பம்)';

  @override
  String get camera => 'கேமரா';

  @override
  String get record => 'பதிவு';

  @override
  String get recordAudio => 'ஆடியோ பதிவு';

  @override
  String get stopAudio => 'ஆடியோ நிறுத்து';

  @override
  String get highRiskSituation => 'உயர் ஆபத்து நிலை';

  @override
  String get peopleAtRiskEstimate => 'ஆபத்தில் இருப்போர் (மதிப்பீடு)';

  @override
  String get urgencyLow => 'குறைவு';

  @override
  String get urgencyMedium => 'நடுத்தரம்';

  @override
  String get urgencyHigh => 'அதிகம்';

  @override
  String get submitReport => 'அறிக்கையை சமர்ப்பி';

  @override
  String get close => 'மூடு';

  @override
  String get moreDetails => 'மேலும் விவரங்கள்';

  @override
  String get hazardHighWaves => 'உயர்ந்த அலைகள்';

  @override
  String get hazardTsunami => 'சுனாமி';

  @override
  String get hazardStorm => 'புயல்';

  @override
  String get hazardFlood => 'வெள்ளம்';

  @override
  String get hazardOther => 'மற்றவை';

  @override
  String get homeTab => 'முகப்பு';

  @override
  String get mapTab => 'வரைபடம்';

  @override
  String get updatesTab => 'புதுப்பிப்புகள்';

  @override
  String get profileTab => 'அறிக்கைகள்';

  @override
  String get liveNews => 'நேரடி செய்திகள்';

  @override
  String get sampleHazardHeadline => 'பசிபிக் கடற்கரையில் உயர் அலைகள்';

  @override
  String get sampleDate => 'ஞாயிறு, 11 ஜூன் 2024';

  @override
  String get sampleTimeAgo => '3 நிமிடங்களுக்கு முன்பு';

  @override
  String get queuedReportStuck => 'சிக்கிக்கொண்டது';

  @override
  String get queuedReportPendingUpload => 'பதிவேற்ற நிலுவையில் உள்ளது';

  @override
  String get queuedReportReadyToRetry => 'மீண்டும் முயற்சிக்க தயார்';

  @override
  String get queuedReportWaitingForRetry =>
      'மீண்டும் முயற்சிக்க காத்திருக்கிறது';

  @override
  String get removeQueuedReportTitle => 'வரிசையில் உள்ள அறிக்கையை அகற்றவா?';

  @override
  String get removeQueuedReportContent =>
      'இது ஆஃப்லைன் நகலை அழித்து எதிர்கால முயற்சிகளை நிறுத்தும்.';

  @override
  String get queuedReportRemoved => 'வரிசையில் இருந்த அறிக்கை அகற்றப்பட்டது';

  @override
  String get themeLight => 'வௌிச்சம்';

  @override
  String get themeDark => 'இருட்டு';

  @override
  String get themeSystem => 'கணினி';

  @override
  String get notifications => 'அறிவிப்புகள்';

  @override
  String get logOutTitle => 'வெளியேறவா?';

  @override
  String get logOut => 'வெளியேறு';

  @override
  String get similarReportExists =>
      'அருகாமையில் இதேபோன்ற அறிக்கை உள்ளது. உங்கள் அறிக்கை அதனுடன் இணைக்கப்பட்டுள்ளது.';

  @override
  String get sendingReportsTooQuickly =>
      'நீங்கள் மிக வேகமாக அறிக்கைகளை அனுப்புகிறீர்கள். 30 வினாடிகள் காத்திருக்கவும்.';

  @override
  String get hourlyReportLimitReached =>
      'மணிநேர அறிக்கை வரம்பு எட்டப்பட்டது. பின்னர் முயற்சிக்கவும்.';

  @override
  String get couldNotOpenMaps => 'வரைபடத்தை திறக்க முடியவில்லை';

  @override
  String get navigate => 'வழிச்செலுத்து';

  @override
  String get reportDetailsNotAvailable =>
      'அறிக்கை விவரங்கள் இன்னும் கிடைக்கவில்லை';

  @override
  String get viewQueue => 'வரிசையைப் பார்க்கவும்';

  @override
  String get achievements => 'சாதனைகள்';

  @override
  String get leaderboard => 'முன்னிலைப்பட்டியல்';

  @override
  String get chooseFromGallery => 'கேலரியில் இருந்து தேர்ந்தெடுக்கவும்';

  @override
  String get downloadOfflineRegion => 'ஆஃப்லைன் பகுதியை பதிவிறக்கு';

  @override
  String get radius => 'ஆரம்';

  @override
  String get download => 'பதிவிறக்கு';

  @override
  String get deleteRegionTitle => 'பகுதியை அழிக்கவா?';

  @override
  String deleteRegionContent(Object name, Object count) {
    return '\"$name\" மற்றும் அதன் $count தற்காலிக சேமிப்பு ஓடுகளை அகற்றவா?';
  }

  @override
  String get delete => 'அழி';

  @override
  String get media => 'ஊடகம்';

  @override
  String get failedToLoadImage => 'படத்தை ஏற்ற முடியவில்லை';

  @override
  String get unsupportedMediaType => 'ஆதரிக்கப்படாத ஊடக வகை';

  @override
  String get noVerifiedRiskZones =>
      'இப்பகுதியில் சரிபார்க்கப்பட்ட அபாய மண்டலங்கள் இன்னும் இல்லை.';

  @override
  String get filterAllHazards => 'அனைத்து அபாயங்கள்';

  @override
  String get filterRipCurrent => 'ரிப் கரண்ட்';

  @override
  String get filterPollution => 'மாசுபாடு';

  @override
  String get filterEarthquake => 'பூகம்பம்';

  @override
  String get mobileNumberHint => '12345 67890';

  @override
  String distanceInKm(Object r) {
    return '$r கி.மீ.';
  }

  @override
  String get filterCommunity => 'சமூகம்';

  @override
  String get filterMySubmitted => 'நான் சமர்ப்பித்தவை';

  @override
  String get noReportsYet => 'இதுவரை அறிக்கைகள் இல்லை';

  @override
  String get noSubmittedReportsYet =>
      'இதுவரை சமர்ப்பிக்கப்பட்ட அறிக்கைகள் இல்லை';

  @override
  String failedToLoadAdvisory(String error) {
    return 'Failed to load advisory: $error';
  }

  @override
  String get advisoryNotFound => 'ஆலோசனை கிடைக்கவில்லை.';

  @override
  String distanceKmAway(String km) {
    return '$km km away';
  }

  @override
  String distanceMAway(String m) {
    return '$m மீ தொலைவில்';
  }

  @override
  String get low => 'குறைந்த';

  @override
  String get justNow => 'இப்போதுதான்';

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
  String get leaderboardTitle => 'லீடர்போர்டு';

  @override
  String error(String errorMsg) {
    return 'பிழை: $errorMsg';
  }

  @override
  String get noLeaderboardData => 'லீடர்போர்டு தரவு இன்னும் இல்லை';

  @override
  String get startReportingToClimb =>
      'தரவரிசையில் ஏற அறிக்கையைத் தொடங்குங்கள்!';

  @override
  String pointsAbbrev(int points) {
    return '$points pts';
  }

  @override
  String reportCountDesc(int count) {
    return '$count reports';
  }

  @override
  String get you => 'நீங்கள்';

  @override
  String get achievementsTitle => 'சாதனைகள்';

  @override
  String get earnedBadges => 'சம்பாதித்த பதக்கங்கள்';

  @override
  String get lockedBadges => 'பூட்டப்பட்ட பேட்ஜ்கள்';

  @override
  String get pointsHistory => 'புள்ளிகள் வரலாறு';

  @override
  String get totalPoints => 'மொத்த புள்ளிகள்';

  @override
  String get verified => 'சரிபார்க்கப்பட்டது';

  @override
  String get rate => 'மதிப்பிடவும்';

  @override
  String get badges => 'பேட்ஜ்கள்';

  @override
  String get submitFirstReportBadge =>
      'பேட்ஜைப் பெற, உங்கள் முதல் அறிக்கையைச் சமர்ப்பிக்கவும்!';

  @override
  String get allBadgesEarned => '🎉 அனைத்து பேட்ஜ்களும் பெற்றன!';

  @override
  String get noPointsHistoryYet => 'இதுவரை புள்ளிகள் வரலாறு இல்லை';

  @override
  String get earned => '✅ சம்பாதித்தது!';

  @override
  String get notYetEarned => '🔒 இன்னும் சம்பாதிக்கவில்லை';

  @override
  String get ok => 'சரி';

  @override
  String get filterAllUrgencies => 'அனைத்து அவசரங்களும்';

  @override
  String get filtersTitle => 'வடிப்பான்கள்';

  @override
  String get timeRangeTitle => 'நேர வரம்பு';

  @override
  String get twentyFourHours => '24 மணிநேரம்';

  @override
  String daysNumber(int days) {
    return '$days days';
  }

  @override
  String get showRiskZonesTitle => 'ஆபத்து மண்டலங்களைக் காட்டு';

  @override
  String get displayHazardHotspots => 'ஆபத்து ஹாட்ஸ்பாட்களைக் காட்டு';

  @override
  String get highRiskOnlyTitle => 'அதிக ஆபத்து மட்டுமே';

  @override
  String get showOnlyCriticalReports => 'முக்கியமான அறிக்கைகளை மட்டும் காட்டு';

  @override
  String get mediaViewerTitle => 'மீடியா பார்வையாளர்';

  @override
  String mediaViewerError(String error) {
    return 'Failed to load media: $error';
  }

  @override
  String get loadingText => 'ஏற்றுகிறது...';

  @override
  String urgencyLevelText(String level) {
    return '$level Urgency';
  }

  @override
  String get highRiskBadge => 'அதிக ஆபத்து';

  @override
  String get mediaTitle => 'ஊடகம்';

  @override
  String get playLabel => 'விளையாடு';

  @override
  String get pauseLabel => 'இடைநிறுத்தம்';

  @override
  String get notificationsTitle => 'அறிவிப்புகள்';

  @override
  String reportStatusTitle(String status) {
    return 'Report $status';
  }

  @override
  String reportStatusBody(String hazardType, String status) {
    return 'Your $hazardType report has been $status.';
  }

  @override
  String get noNotificationsYet => 'இதுவரை எந்த அறிவிப்பும் இல்லை';

  @override
  String get downloadOfflineRegionTitle =>
      'ஆஃப்லைன் பிராந்தியத்தைப் பதிவிறக்கவும்';

  @override
  String get downloadOfflineRegionDesc =>
      'ஆஃப்லைன் பயன்பாட்டிற்காக உங்கள் தற்போதைய இருப்பிடத்தைச் சுற்றியுள்ள வரைபட ஓடுகளைப் பதிவிறக்குகிறது.';

  @override
  String get regionNameLabel => 'பிராந்தியத்தின் பெயர்';

  @override
  String get radiusLabel => 'ஆரம்';

  @override
  String get cancelLabel => 'ரத்து செய்';

  @override
  String get downloadLabel => 'பதிவிறக்கவும்';

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
  String get deleteLabel => 'நீக்கு';

  @override
  String get offlineMapsTitle => 'ஆஃப்லைன் வரைபடங்கள்';

  @override
  String get downloadingTiles => 'ஓடுகளைப் பதிவிறக்குகிறது...';

  @override
  String get offlineMapInfoDesc =>
      'நீங்கள் ஆன்லைனில் பார்க்கும் மேப் டைல்ஸ் ஆஃப்லைன் பயன்பாட்டிற்காக தானாகவே தற்காலிகமாக சேமிக்கப்படும்.முழு ஆஃப்லைன் கவரேஜுக்கு பிராந்தியங்களைப் பதிவிறக்கவும்.';

  @override
  String get noOfflineRegionsYet => 'இன்னும் ஆஃப்லைன் பகுதிகள் இல்லை';

  @override
  String get tapToDownloadRegion => 'ஒரு பகுதியைப் பதிவிறக்க + தட்டவும்';

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
      'மறுமுயற்சியின் நிலை, பிழையின் காரணம் ஆகியவற்றை மதிப்பாய்வு செய்து, சிக்கிய பொருட்களை இங்கே அகற்றவும்.';

  @override
  String get duplicateReportDetected =>
      'இதே போன்ற அறிக்கை ஏற்கனவே அருகில் உள்ளது.உங்கள் சமர்ப்பிப்பை அதனுடன் இணைத்துள்ளோம்.';

  @override
  String get uploadTimelineCompleted =>
      'உங்கள் பதிவேற்ற காலவரிசை நிறைவு செய்யப்பட்டு சேமிக்கப்பட்டது.';

  @override
  String get doneLabel => 'முடிந்தது';

  @override
  String get rateLimitMinInterval =>
      'மிக விரைவாக அறிக்கைகளை அனுப்புகிறீர்கள்.30 வினாடிகள் காத்திருந்து மீண்டும் முயற்சிக்கவும்.';

  @override
  String get rateLimitHourly =>
      'மணிநேர அறிக்கை வரம்பை அடைந்தது.பிறகு முயற்சிக்கவும்.';

  @override
  String get uploadingReportTitle => 'உங்கள் அறிக்கையைப் பதிவேற்றுகிறது';

  @override
  String get preparingReportDesc => 'அறிக்கை விவரங்களைத் தயாரித்தல்';

  @override
  String get reportDetailsUploaded => 'அறிக்கை விவரங்கள் பதிவேற்றப்பட்டன';

  @override
  String get duplicateReportLinked =>
      'நகல் அறிக்கை கண்டறியப்பட்டது, ஏற்கனவே உள்ள அறிக்கையுடன் இணைக்கப்பட்டுள்ளது';

  @override
  String uploadedAttachmentCounter(int current, int total) {
    return 'Uploaded attachment $current/$total';
  }

  @override
  String get uploadingMedia => 'மீடியாவைப் பதிவேற்றுகிறது';

  @override
  String get mediaUploadFailedQueued =>
      'மீடியா பதிவேற்றம் தோல்வியடைந்தது, மீண்டும் முயற்சிக்க வரிசையில் உள்ளது';

  @override
  String get finalizingReport => 'இறுதி அறிக்கை';

  @override
  String get pleaseWaitBeforeSending =>
      'மற்றொரு அறிக்கையை அனுப்பும் முன் காத்திருக்கவும்';

  @override
  String get hourlyReportLimitTitle => 'மணிநேர அறிக்கை வரம்பை அடைந்தது';

  @override
  String uploadFailedError(String error) {
    return 'Upload failed: $error';
  }

  @override
  String get openQueueToReview =>
      'மறுமுயற்சியின் நிலை, பிழையின் காரணத்தை மதிப்பாய்வு செய்யவும், சிக்கிய பொருட்களை அகற்றவும் வரிசையைத் திறக்கவும்.';

  @override
  String get arcAbbr => 'ARC';

  @override
  String get arcFull => 'எச்சரிக்கை • அறிக்கை • ஒருங்கிணைத்தல்';

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
      'வரிசைப்படுத்தப்பட்ட அறிக்கைகளை ஒத்திசைக்கிறது';

  @override
  String preparingPendingReports(int count) {
    return 'Preparing $count pending report(s)';
  }

  @override
  String uploadingReportCount(int current, int total) {
    return 'Uploading report $current of $total';
  }

  @override
  String get uploadingAttachments => 'இணைப்புகளைப் பதிவேற்றுகிறது';

  @override
  String get reportUpdateTitle => 'புதுப்பிப்பைப் புகாரளிக்கவும்';

  @override
  String get aboutTransparencyBody =>
      'இந்த ஆப் குடிமக்கள் கடல் அபாயங்களைப் புகாரளிக்க உதவுகிறது மற்றும் நிகழ்நேர நிலைமைகளைப் புரிந்துகொள்ள அதிகாரிகளுக்கு உதவுகிறது.\n\nதனிப்பட்ட விவரங்களின் பொது வெளிப்பாட்டைக் கட்டுப்படுத்துவதன் மூலமும், பொதுப் பார்வைகளுக்கு தனியுரிமை தொடர்பான பாதுகாப்பான வரைபடத் தரவைப் பயன்படுத்துவதன் மூலமும் தனியுரிமைக்கு முன்னுரிமை அளிக்கிறோம்.';

  @override
  String get privacyBody =>
      'நாங்கள் சேகரிப்பது: உங்கள் தொலைபேசி (உள்நுழைவதற்கு), உங்கள் அறிக்கை விளக்கம், நேரம் மற்றும் இருப்பிடம்.\n\nஅதை நாங்கள் எவ்வாறு பயன்படுத்துகிறோம்: உங்கள் அறிக்கையைச் சேமிக்கவும், வரைபடம் மற்றும் புதுப்பிப்புகள் ஊட்டத்தில் சரிபார்க்கப்பட்ட, தனியுரிமை தொடர்பான பாதுகாப்பான தகவலைக் காட்டவும்.';

  @override
  String get reportSubmittedReason => 'அறிக்கை சமர்ப்பிக்கப்பட்டது';

  @override
  String get reportVerifiedReason => 'அறிக்கை சரிபார்க்கப்பட்டது';

  @override
  String get highRiskVerifiedReason => 'அதிக ஆபத்து அறிக்கை சரிபார்க்கப்பட்டது';

  @override
  String get reportRejectedReason => 'அறிக்கை நிராகரிக்கப்பட்டது';

  @override
  String get achievementsAndBadges => 'சாதனைகள் மற்றும் பேட்ஜ்கள்';

  @override
  String get offlineMaps => 'ஆஃப்லைன் வரைபடங்கள்';
}
