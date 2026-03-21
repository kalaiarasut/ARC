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
    return 'இதற்கு அனுப்பப்பட்டது: $mobileNumber';
  }

  @override
  String get pleaseEnter6DigitOtp => '6 இலக்க OTP ஐ உள்ளிடவும்';

  @override
  String get otpVerificationFailed => 'OTP சரிபார்ப்பு தோல்வியடைந்தது.';

  @override
  String signInFailedWithError(Object error) {
    return 'உள்நுழை தோல்வியடைந்தது: $error';
  }

  @override
  String get didntReceiveOtp => 'OTP வரவில்லையா? ';

  @override
  String get otpResentSuccessfully => 'OTP மீண்டும் அனுப்பப்பட்டது';

  @override
  String failedToResendOtpWithError(Object error) {
    return 'OTP மீண்டும் அனுப்ப முடியவில்லை: $error';
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
    return 'இடம் பெறுவதில் பிழை: $error';
  }

  @override
  String get gettingLocation => 'இடம் பெறுகிறது...';

  @override
  String get gettingYourLocation => 'உங்கள் இடத்தை பெறுகிறது...';

  @override
  String maximumAttachmentsAllowed(Object max) {
    return 'அதிகபட்சம் $max இணைப்புகள் மட்டுமே அனுமதி';
  }

  @override
  String errorPickingImageWithError(Object error) {
    return 'படத்தை தேர்வு செய்வதில் பிழை: $error';
  }

  @override
  String errorPickingVideoWithError(Object error) {
    return 'வீடியோவை தேர்வு செய்வதில் பிழை: $error';
  }

  @override
  String errorStoppingAudioWithError(Object error) {
    return 'ஆடியோ நிறுத்துவதில் பிழை: $error';
  }

  @override
  String get recordingAudioTapToStop =>
      'ஆடியோ பதிவு செய்கிறது… நிறுத்த மீண்டும் தட்டவும்.';

  @override
  String errorStartingAudioWithError(Object error) {
    return 'ஆடியோ தொடங்குவதில் பிழை: $error';
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
    return 'பிழை: $error';
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
  String get sampleHazardHeadline => 'பசிபிக் கரையில் உயர்ந்த அலைகள்';

  @override
  String get sampleDate => 'ஞா, 11 ஜூன் 2024';

  @override
  String get sampleTimeAgo => '3 நிமிடங்களுக்கு முன்';
}
