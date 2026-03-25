// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Kannada (`kn`).
class AppLocalizationsKn extends AppLocalizations {
  AppLocalizationsKn([String locale = 'kn']) : super(locale);

  @override
  String get appTitle => 'ಸಿವಿಲ್ ಅಲರ್ಟ್ ಸಿಸ್ಟಮ್';

  @override
  String get profile => 'ಪ್ರೊಫೈಲ್';

  @override
  String get profileAndReports => 'ವರದಿಗಳು';

  @override
  String get edit => 'ತಿದ್ದುಪಡಿ ಮಾಡಿ';

  @override
  String get user => 'ಬಳಕೆದಾರ';

  @override
  String get phoneNotSet => 'ಫೋನ್ ಸೆಟ್ ಮಾಡಲಾಗಿಲ್ಲ';

  @override
  String get syncNow => 'ಈಗ ಸಿಂಕ್ ಮಾಡಿ';

  @override
  String get nothingToSync => 'ಸಿಂಕ್ ಮಾಡಲು ಏನೂ ಇಲ್ಲ';

  @override
  String syncDone(Object succeeded, Object failed) {
    return 'ಸಿಂಕ್ ಮುಗಿದಿದೆ: $succeeded ಯಶಸ್ವಿ, $failed ವಿಫಲ';
  }

  @override
  String get offlineReports => 'ಆಫ್‌ಲೈನ್ ವರದಿಗಳು';

  @override
  String get noPendingReports => 'ಯಾವುದೇ ಬಾಕಿ ವರದಿಗಳಿಲ್ಲ';

  @override
  String attemptsLabel(Object count) {
    return 'ಪ್ರಯತ್ನಗಳು: $count';
  }

  @override
  String get retry => 'ಮರುಪ್ರಯತ್ನಿಸಿ';

  @override
  String get remove => 'ತೆಗೆದುಹಾಕಿ';

  @override
  String get myReports => 'ನನ್ನ ವರದಿಗಳು';

  @override
  String get noUploadedReportsYet =>
      'ಇನ್ನೂ ಯಾವುದೇ ವರದಿಗಳನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಲಾಗಿಲ್ಲ';

  @override
  String get failedToLoadReports => 'ವರದಿಗಳನ್ನು ಲೋಡ್ ಮಾಡಲು ವಿಫಲವಾಗಿದೆ';

  @override
  String get youreOffline => 'ನೀವು ಆಫ್‌ಲೈನ್‌ನಲ್ಲಿದ್ದೀರಿ';

  @override
  String get connectToInternetToLoadMyReports =>
      'ನನ್ನ ವರದಿಗಳನ್ನು ನೋಡಲು ಇಂಟರ್ನೆಟ್‌ಗೆ ಸಂಪರ್ಕಪಡಿಸಿ.';

  @override
  String get settings => 'ಸೆಟ್ಟಿಂಗ್ಸ್';

  @override
  String get helpFaq => 'ಸಹಾಯ / FAQ';

  @override
  String get aboutTransparency => 'ಮಾಹಿತಿ ಮತ್ತು ಪಾರದರ್ಶಕತೆ';

  @override
  String get language => 'ಭಾಷೆ';

  @override
  String get privacyControls => 'ಭಾಷೆ ಮತ್ತು ಗೌಪ್ಯತೆ ನಿಯಂತ್ರಣಗಳು';

  @override
  String get privacy => 'ಗೌಪ್ಯತೆ';

  @override
  String get chooseLanguage => 'ಭಾಷೆ ಆಯ್ಕೆಮಾಡಿ';

  @override
  String get save => 'ಉಳಿಸಿ';

  @override
  String get continueLabel => 'ಮುಂದುವರೆಯಿರಿ';

  @override
  String get languageComingSoon => 'ಈ ಭಾಷೆಯು ಶೀಘ್ರದಲ್ಲೇ ಬರಲಿದೆ.';

  @override
  String get updates => 'ಅಪ್‌ಡೇಟ್‌ಗಳು';

  @override
  String pendingCount(Object count) {
    return '$count ಬಾಕಿ';
  }

  @override
  String get noUpdatesYet => 'ಇಂದಿನವರೆಗೂ ಯಾವುದೇ ನವೀಕರಣಗಳಿಲ್ಲ';

  @override
  String get failedToLoadUpdates => 'ಅಪ್‌ಡೇಟ್‌ಗಳನ್ನು ಲೋಡ್ ಮಾಡಲು ವಿಫಲವಾಗಿದೆ';

  @override
  String get helpTitle => 'ಸಹಾಯ / FAQ';

  @override
  String get aboutTitle => 'ಮಾಹಿತಿ ಮತ್ತು ಪಾರದರ್ಶಕತೆ';

  @override
  String get privacyTitle => 'ಗೌಪ್ಯತೆ ನಿಯಂತ್ರಣಗಳು';

  @override
  String get privacyReducePrecisionTitle =>
      'ಮ್ಯಾಪ್ ಸ್ಥಳ ನಿಖರತೆಯನ್ನು ಕಡಿಮೆ ಮಾಡಿ';

  @override
  String get privacyReducePrecisionSubtitle =>
      'ಸಕ್ರಿಯಗೊಳಿಸಿದಲ್ಲಿ, ನಿಮ್ಮ ವರದಿ ಮಾಡುವವರು ನಕ್ಷೆಯಲ್ಲಿ ಕಡಿಮೆ ನಿಖರತೆಯೊಂದಿಗೆ ತೋರಿಸಲಾಗುವುದು.';

  @override
  String get faqQ1 => 'ನಾನು ಅಪಾಯವನ್ನು ಹೇಗೆ ವರದಿ ಮಾಡುವುದು?';

  @override
  String get faqA1 =>
      'ವರದಿಯನ್ನು ತೆರೆಯಿರಿ, ನೀವು ನೋಡುವುದನ್ನು ವಿವರಿಸಿ ಮತ್ತು ಸಲ್ಲಿಸಿ.';

  @override
  String get faqQ2 => 'ಗ್ಯಾಲರಿಯಿಂದ ನಾನು ಏಕೆ ಅಪ್‌ಲೋಡ್ ಮಾಡಲು ಸಾಧ್ಯವಿಲ್ಲ?';

  @override
  String get faqA2 =>
      'ವರದಿಗಳನ್ನು ವಿಶ್ವಾಸಾರ್ಹವಾಗಿಡಲು, ಅಪ್ಲಿಕೇಶನ್ ಕೇವಲ ಲೈವ್ ಕ್ಯಾಪ್ಚರ್ ಅನ್ನು ಅನುಮತಿಸುತ್ತದೆ.';

  @override
  String get faqQ3 => 'ನನ್ನ ಸ್ಥಳವನ್ನು ಹೇಗೆ ಬಳಸಲಾಗುತ್ತದೆ?';

  @override
  String get faqA3 =>
      'ಅಪಾಯಗಳು ಎಲ್ಲಿ ಸಂಭವಿಸುತ್ತಿವೆ ಎಂಬುದನ್ನು ಅರ್ಥಮಾಡಿಕೊಳ್ಳಲು ನಿಮ್ಮ ಸ್ಥಳ ಸಹಾಯ ಮಾಡುತ್ತದೆ.';

  @override
  String get loginTitle => 'ಲಾಗಿನ್ / ಸೈನ್-ಅಪ್';

  @override
  String get signUpWithMobile =>
      'ನಿಮ್ಮ ನೋಂದಾಯಿತ ಮೊಬೈಲ್ ಸಂಖ್ಯೆಯೊಂದಿಗೆ ಸೈನ್-ಅಪ್ ಮಾಡಿ';

  @override
  String get otpIntro =>
      'ನಿಮ್ಮ ಸಂಖ್ಯೆಯನ್ನು ಪರಿಶೀಲಿಸಲು ನಾವು ನಿಮಗೆ ಒಟಿಪಿ (OTP) ಕಳುಹಿಸುತ್ತೇವೆ';

  @override
  String get mobileNumberLabel => 'ಮೊಬೈಲ್ ಸಂಖ್ಯೆ *';

  @override
  String get sendingLabel => 'ಕಳುಹಿಸಲಾಗುತ್ತಿದೆ...';

  @override
  String get sendOtp => 'ಒಟಿಪಿ(OTP) ಕಳುಹಿಸಿ';

  @override
  String get failedToSendOtp => 'OTP ಕಳುಹಿಸಲು ವಿಫಲವಾಗಿದೆ.';

  @override
  String get checkSupabasePhoneConfig => 'ಸೂಪರ್‌ಬೇಸ್ ಪರೀಕ್ಷಿಸಿ.';

  @override
  String get enterOtp => 'ಒಟಿಪಿ(OTP) ನಮೂದಿಸಿ';

  @override
  String sentToNumber(Object mobileNumber) {
    return 'Sent to $mobileNumber';
  }

  @override
  String get pleaseEnter6DigitOtp => 'ದಯವಿಟ್ಟು 6 ಅಂಕಿಯ ಒಟಿಪಿ(OTP) ನಮೂದಿಸಿ';

  @override
  String get otpVerificationFailed => 'ಒಟಿಪಿ(OTP) ಪರಿಶೀಲನೆ ವಿಫಲವಾಗಿದೆ.';

  @override
  String signInFailedWithError(Object error) {
    return 'Sign-in failed: $error';
  }

  @override
  String get didntReceiveOtp => 'ಒಟಿಪಿ(OTP) ಸ್ವೀಕರಿಸಿಲ್ಲವೇ? ';

  @override
  String get otpResentSuccessfully =>
      'ಒಟಿಪಿ(OTP)ಯನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಮತ್ತೆ ಕಳುಹಿಸಲಾಗಿದೆ';

  @override
  String failedToResendOtpWithError(Object error) {
    return 'Failed to resend OTP: $error';
  }

  @override
  String get resendWithTimer => 'ಮತ್ತೆ ಕಳುಹಿಸಿ (00:30)';

  @override
  String get savingLabel => 'ಉಳಿಸಲಾಗುತ್ತಿದೆ...';

  @override
  String get signedInSuccessfully => 'ನೀವು ಯಶಸ್ವಿಯಾಗಿ\nಸೈನ್-ಇನ್ ಆಗಿರುವಿರಿ';

  @override
  String get directingToDashboard =>
      'ದಯವಿಟ್ಟು ನಿರೀಕ್ಷಿಸಿ, ನಾವು ನಿಮ್ಮನ್ನು ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗೆ ನಿರ್ದೇಶಿಸುತ್ತಿದ್ದೇವೆ...';

  @override
  String get whatsYourName => 'ನಿಮ್ಮ ಹೆಸರೇನು?';

  @override
  String get personalizeExperience =>
      'ನಿಮ್ಮ ಅನುಭವವನ್ನು ವೈಯಕ್ತೀಕರಿಸಲು ನಮಗೆ ಸಹಾಯ ಮಾಡಿ';

  @override
  String get enterYourName => 'ನಿಮ್ಮ ಹೆಸರನ್ನು ನಮೂದಿಸಿ';

  @override
  String get pleaseEnterValidName =>
      'ದಯವಿಟ್ಟು ಮಾನ್ಯವಾದ ಹೆಸರನ್ನು ನಮೂದಿಸಿ (ಕನಿಷ್ಠ 2 ಅಕ್ಷರಗಳು)';

  @override
  String get onboarding1Title => 'ವಿಪತ್ತಿನ ಸಮಯದಲ್ಲಿ\nನಿಮ್ಮ ವಿಶ್ವಾಸಾರ್ಹ ಪಾಲುದಾರ';

  @override
  String get onboarding1Description =>
      'ನೈಜ-ಸಮಯದ ಎಚ್ಚರಿಕೆಗಳನ್ನು ಪಡೆಯಿರಿ ಮತ್ತು ಸಂಭವಿಸುವಾಗ ಸಾಗರ ಅಪಾಯಗಳನ್ನು ವರದಿ ಮಾಡುವ ಮೂಲಕ ಸುರಕ್ಷತೆಗೆ ಕೊಡುಗೆ ನೀಡಿ.';

  @override
  String get onboarding2Title => 'ಸುರಕ್ಷತೆಯನ್ನು ಸಬಲಗೊಳಿಸೋಣ, \nಹಂತ-ಹಂತವಾಗಿ';

  @override
  String get onboarding2Description =>
      'ಸಮುದ್ರದ ಮೇಲೆ ನಿಗಾ ಇಡುವ ಜನರ ನೆಟ್‌ವರ್ಕ್‌ಗೆ ಸೇರಿ, ಪ್ರಾಣ ಉಳಿಸುವ ಅಪಾಯದ ಮಾಹಿತಿಯನ್ನು ಹಂಚಿಕೊಳ್ಳಿ.';

  @override
  String get onboarding3Title => 'ಸಿದ್ಧತೆ ಈಗ \nನಿಮ್ಮ ಬೆರಳ ತುದಿಯಲ್ಲಿದೆ';

  @override
  String get onboarding3Description =>
      'ಸಾಗರ ಅಪಾಯಗಳನ್ನು ವರದಿ ಮಾಡಿ, ಪ್ರಮುಖ ಎಚ್ಚರಿಕೆಗಳನ್ನು ಪಡೆಯಿರಿ ಮತ್ತು ಸಮಯಾವಕಾಶ ಇರುವಾಗಲೇ ಎಚ್ಚರದಿಂದಿರಿ.';

  @override
  String get skip => 'ಸ್ಕಿಪ್ ಮಾಡಿ';

  @override
  String get splashTitle => 'ಸಿವಿಲ್ ಅಲರ್ಟ್';

  @override
  String get splashSubtitle => 'ಬಲವಾದ ಅಪಾಯ ಪತ್ತೆಗಾರಿಕೆ';

  @override
  String get hiWelcome => 'ಹಲೋ, ಸುಸ್ವಾಗತ 👋';

  @override
  String get togetherForOceanSafety =>
      'ಸಾಗರ ಸುರಕ್ಷತೆಗಾಗಿ \nಒಗ್ಗೂಡೋಣ, \nಬಲಶಾಲಿಯಾಗೋಣ';

  @override
  String get seeUpdates => 'ನವೀಕರಣಗಳನ್ನು ನೋಡಿ';

  @override
  String get unusualActivity => 'ವರದಿಗಳು';

  @override
  String get seeAll => 'ಎಲ್ಲವನ್ನೂ ನೋಡಿ';

  @override
  String get filterNow => 'ಈಗ';

  @override
  String get filterLastWeek => 'ಕಳೆದ ವಾರ';

  @override
  String get filterLastMonth => 'ಕಳೆದ ತಿಂಗಳು';

  @override
  String get locationServicesOffTitle => 'ಸ್ಥಳ ಸೇವೆಗಳು ಆಫ್ ಆಗಿವೆ';

  @override
  String get enableLocationServicesForReporting =>
      'ಅಪಾಯಗಳನ್ನು ವರದಿ ಮಾಡಲು ದಯವಿಟ್ಟು ಸ್ಥಳ ಸೇವೆಗಳನ್ನು (GPS) ಆನ್ ಮಾಡಿ.';

  @override
  String get enableLocationServicesForCurrentLocation =>
      'ನಿಮ್ಮ ಪ್ರಸ್ತುತ ಸ್ಥಳವನ್ನು ನೋಡಲು GPS ಆನ್ ಮಾಡಿ.';

  @override
  String get permissionRequiredTitle => 'ಅನುಮತಿಯ ಅಗತ್ಯವಿದೆ';

  @override
  String get locationPermissionDeniedAllowInSettings =>
      'ಸ್ಥಳ ಅನುಮತಿಯನ್ನು ನಿರಾಕರಿಸಲಾಗಿದೆ. ಸೆಟ್ಟಿಂಗ್ಸ್‌ಗಳಲ್ಲಿ ಪ್ರವೇಶವನ್ನು ಅನುಮತಿಸಿ.';

  @override
  String get locationPermissionDeniedAllowForCurrentLocation =>
      'ಸ್ಥಳ ಅನುಮತಿಯನ್ನು ನಿರಾಕರಿಸಲಾಗಿದೆ. ನಿಮ್ಮ ವಿಳಾಸವನ್ನು ತೋರಿಸಲು ಪ್ರವೇಶವನ್ನು ಒದಗಿಸಿ.';

  @override
  String get locationPermissionBlockedEnableInSettings =>
      'ಸ್ಥಳ ಅನುಮತಿಯನ್ನು ನಿರ್ಬಂಧಿಸಲಾಗಿದೆ. ಆಪ್ ಸೆಟ್ಟಿಂಗ್ಸ್‌ನಲ್ಲಿ ಅದನ್ನು ಸಕ್ರಿಯಗೊಳಿಸಿ.';

  @override
  String get locationPermissionPermanentlyDeniedForReporting =>
      'ಸ್ಥಳ ಅನುಮತಿಯನ್ನು ಶಾಶ್ವತವಾಗಿ ನಿರಾಕರಿಸಲಾಗಿದೆ.';

  @override
  String get locationPermissionPermanentlyDeniedForCurrentLocation =>
      'ನಿಮ್ಮ ಪ್ರಸ್ತುತ ಸ್ಥಳವನ್ನು ತೋರಿಸಲು ಸ್ಥಳ ಅನುಮತಿಯನ್ನು ನಿರಾಕರಿಸಲಾಗಿದೆ.';

  @override
  String get cancel => 'ರದ್ದು ಮಾಡು';

  @override
  String get notNow => 'ಈಗ ಬೇಡ';

  @override
  String get openSettings => 'ಸೆಟ್ಟಿಂಗ್‌ಗಳನ್ನು ತೆರೆಯಿರಿ';

  @override
  String errorGettingLocationWithError(Object error) {
    return 'Error getting location: $error';
  }

  @override
  String get gettingLocation => 'ಸ್ಥಳವನ್ನು ಪಡೆಯಲಾಗುತ್ತಿದೆ...';

  @override
  String get gettingYourLocation => 'ನಿಮ್ಮ ಸ್ಥಳವನ್ನು ಪಡೆಯಲಾಗುತ್ತಿದೆ...';

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
      'ಆಡಿಯೋ ರೆಕಾರ್ಡ್ ಆಗುತ್ತಿದೆ… ನಿಲ್ಲಿಸಲು ಮತ್ತೊಮ್ಮೆ ಟ್ಯಾಪ್ ಮಾಡಿ.';

  @override
  String errorStartingAudioWithError(Object error) {
    return 'Error starting audio: $error';
  }

  @override
  String get pleaseSelectHazardType => 'ದಯವಿಟ್ಟು ಅಪಾಯದ ಪ್ರಕಾರವನ್ನು ಆಯ್ಕೆಮಾಡಿ';

  @override
  String get pleaseDescribeSituation => 'ದಯವಿಟ್ಟು ಪರಿಸ್ಥಿತಿಯನ್ನು ವಿವರಿಸಿ';

  @override
  String get waitingForLocation => 'ಸ್ಥಳಕ್ಕಾಗಿ ಕಾಯಲಾಗುತ್ತಿದೆ...';

  @override
  String get pleaseEnterPeopleAtRisk => 'ಅಪಾಯದಲ್ಲಿರುವ ಜನರ ಅಂದಾಜನ್ನು ನಮೂದಿಸಿ';

  @override
  String get noInternetReportQueued =>
      'ಇಂಟರ್ನೆಟ್ ಸಂಪರ್ಕವಿಲ್ಲ. ವರದಿಯು ಸರತಿಯಲ್ಲಿರುತ್ತದೆ.';

  @override
  String get profileNeededTitle => 'ಪ್ರೊಫೈಲ್ ಅಗತ್ಯವಿದೆ';

  @override
  String get profileNeededBody =>
      'ವರದಿಯನ್ನು ಸಲ್ಲಿಸುವ ಮೊದಲು ದಯವಿಟ್ಟು ನಿಮ್ಮ ಫೋನ್ ಸಂಖ್ಯೆಯನ್ನು ಸೇರಿಸಿ.';

  @override
  String get addNow => 'ಈಗ ಸೇರಿಸಿ';

  @override
  String get reportSavedMediaUploadFailedRetry =>
      'ವರದಿ ಉಳಿಸಲಾಗಿದೆ! ಮೀಡಿಯಾ ಅಪ್‌ಲೋಡ್ ವಿಫಲವಾಗಿದೆ, ನಂತರ ಪುನಃ ಪ್ರಯತ್ನಿಸುತ್ತೇವೆ.';

  @override
  String get reportSubmittedSuccessfully =>
      'ವರದಿಯನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಸಲ್ಲಿಸಲಾಗಿದೆ! 🎉';

  @override
  String errorWithError(Object error) {
    return 'Error: $error';
  }

  @override
  String get retryGps => 'GPS ಅನ್ನು ಮರುಪ್ರಯತ್ನಿಸಿ';

  @override
  String get reportHazard => 'ಅಪಾಯವನ್ನು ವರದಿ ಮಾಡಿ';

  @override
  String get whatAreYouSeeing => 'ನೀವು ಏನು ನೋಡುತ್ತಿದ್ದೀರಿ?';

  @override
  String get reportHelpsKeepSafe =>
      'ನಿಮ್ಮ ವರದಿಯು ಪ್ರತಿಯೊಬ್ಬರನ್ನು ಸುರಕ್ಷಿತವಾಗಿರಿಸಲು ಸಹಾಯ ಮಾಡುತ್ತದೆ';

  @override
  String get hazardTypeRequired => 'ಅಪಾಯದ ಪ್ರಕಾರ *';

  @override
  String get descriptionRequired => 'ವಿವರಣೆ *';

  @override
  String get describeWhatYouSeeHint => 'ನೀವು ನೋಡುವುದನ್ನು ವಿವರಿಸಿ...';

  @override
  String get location => 'ಸ್ಥಳ';

  @override
  String get time => 'ಸಮಯ';

  @override
  String get addMediaOptional => 'ಮಾಧ್ಯಮವನ್ನು ಸೇರಿಸಿ (ಐಚ್ಛಿಕ)';

  @override
  String get camera => 'ಕ್ಯಾಮರಾ';

  @override
  String get record => 'ರೆಕಾರ್ಡ್ಸ್';

  @override
  String get recordAudio => 'ಆಡಿಯೋ ರೆಕಾರ್ಡ್ ಮಾಡಿ';

  @override
  String get stopAudio => 'ಆಡಿಯೋ ನಿಲ್ಲಿಸಿ';

  @override
  String get highRiskSituation => 'ಹೆಚ್ಚಿನ ಅಪಾಯದ ಪರಿಸ್ಥಿತಿ';

  @override
  String get peopleAtRiskEstimate => 'ಅಪಾಯದಲ್ಲಿರುವ ಜನರ ಅಂದಾಜು';

  @override
  String get urgencyLow => 'ಕಡಿಮೆ';

  @override
  String get urgencyMedium => 'ಮಧ್ಯಮ';

  @override
  String get urgencyHigh => 'ಹೆಚ್ಚು';

  @override
  String get submitReport => 'ವರದಿಯನ್ನು ಸಲ್ಲಿಸಿ';

  @override
  String get close => 'ಮುಚ್ಚಿ';

  @override
  String get moreDetails => 'ಹೆಚ್ಚಿನ ವಿವರಗಳು';

  @override
  String get hazardHighWaves => 'ಎತ್ತರದ ಅಲೆಗಳು';

  @override
  String get hazardTsunami => 'ಸುನಾಮಿ';

  @override
  String get hazardStorm => 'ಚಂಡಮಾರುತ';

  @override
  String get hazardFlood => 'ಪ್ರವಾಹ';

  @override
  String get hazardOther => 'ಇತರೆ';

  @override
  String get homeTab => 'ಹೋಮ್';

  @override
  String get mapTab => 'ಮ್ಯಾಪ್';

  @override
  String get updatesTab => 'ಅಪ್‌ಡೇಟ್‌ಗಳು';

  @override
  String get profileTab => 'ವರದಿಗಳು';

  @override
  String get liveNews => 'ಲೈವ್ ಸುದ್ದಿ';

  @override
  String get sampleHazardHeadline => 'ಪೆಸಿಫಿಕ್ ಕರಾವಳಿಯಲ್ಲಿ ಎತ್ತರದ ಅಲೆಗಳು';

  @override
  String get sampleDate => 'ಭಾನು, 11 ಜೂನ್ 2024';

  @override
  String get sampleTimeAgo => '3 ನಿಮಿಷಗಳ ಹಿಂದೆ';

  @override
  String get queuedReportStuck => 'ಸಿಲುಕಿದೆ';

  @override
  String get queuedReportPendingUpload => 'ಅಪ್‌ಲೋಡ್ ಬಾಕಿ ಇದೆ';

  @override
  String get queuedReportReadyToRetry => 'ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಲು ಸಿದ್ಧವಾಗಿದೆ';

  @override
  String get queuedReportWaitingForRetry => 'ಮರುಪ್ರಯತ್ನಕ್ಕೆ ಕಾಯಲಾಗುತ್ತಿದೆ';

  @override
  String get removeQueuedReportTitle => 'ಕ್ಯೂನಲ್ಲಿರುವ ವರದಿಯನ್ನು ತೆಗೆದುಹಾಕಬೇಕೆ?';

  @override
  String get removeQueuedReportContent =>
      'ಇದು ಆಫ್‌ಲೈನ್ ಪ್ರತಿಯನ್ನು ಅಳಿಸುತ್ತದೆ ಮತ್ತು ಭವಿಷ್ಯದ ಮರುಪ್ರಯತ್ನಗಳನ್ನು ನಿಲ್ಲಿಸುತ್ತದೆ.';

  @override
  String get queuedReportRemoved => 'ಕ್ಯೂನಲ್ಲಿದ್ದ ವರದಿಯನ್ನು ತೆಗೆದುಹಾಕಲಾಗಿದೆ';

  @override
  String get themeLight => 'ಬೆಳಕು';

  @override
  String get themeDark => 'ಕತ್ತಲು';

  @override
  String get themeSystem => 'ಸಿಸ್ಟಮ್';

  @override
  String get notifications => 'ಅಧಿಸೂಚನೆಗಳು';

  @override
  String get logOutTitle => 'ಲಾಗ್ ಔಟ್ ಮಾಡಬೇಕೆ?';

  @override
  String get logOut => 'ಲಾಗ್ ಔಟ್';

  @override
  String get similarReportExists =>
      'ಹತ್ತಿರದಲ್ಲಿ ಅಂತಹುದೇ ವರದಿ ಇದೆ. ನಿಮ್ಮ ವರದಿಯನ್ನು ಅದಕ್ಕೆ ಲಿಂಕ್ ಮಾಡಲಾಗಿದೆ.';

  @override
  String get sendingReportsTooQuickly =>
      'ನೀವು ತುಂಬಾ ವೇಗವಾಗಿ ವರದಿಗಳನ್ನು ಕಳುಹಿಸುತ್ತಿದ್ದೀರಿ. 30 ಸೆಕೆಂಡು ಕಾಯಿರಿ.';

  @override
  String get hourlyReportLimitReached =>
      'ಗಂಟೆಯ ವರದಿಯ ಮಿತಿ ತಲುಪಿದೆ. ನಂತರ ಪ್ರಯತ್ನಿಸಿ.';

  @override
  String get couldNotOpenMaps => 'ಮ್ಯಾಪ್ ತೆರೆಯಲಾಗಲಿಲ್ಲ';

  @override
  String get navigate => 'ನ್ಯಾವಿಗೇಟ್ ಮಾಡಿ';

  @override
  String get reportDetailsNotAvailable => 'ವರದಿಯ ವಿವರಗಳು ಇನ್ನೂ ಲಭ್ಯವಿಲ್ಲ';

  @override
  String get viewQueue => 'ಕ್ಯೂ ನೋಡಿ';

  @override
  String get achievements => 'ಸಾಧನೆಗಳು';

  @override
  String get leaderboard => 'ಲೀಡರ್ ಬೋರ್ಡ್';

  @override
  String get chooseFromGallery => 'ಗ್ಯಾಲರಿಯಿಂದ ಆಯ್ಕೆಮಾಡಿ';

  @override
  String get downloadOfflineRegion => 'ಆಫ್‌ಲೈನ್ ಪ್ರದೇಶವನ್ನು ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ';

  @override
  String get radius => 'ತ್ರಿಜ್ಯ';

  @override
  String get download => 'ಡೌನ್‌ಲೋಡ್';

  @override
  String get deleteRegionTitle => 'ಪ್ರದೇಶವನ್ನು ಅಳಿಸಬೇಕೆ?';

  @override
  String deleteRegionContent(Object name, Object count) {
    return '\"$name\" ಮತ್ತು ಅದರ $count ಕ್ಯಾಶ್ ಟೈಲ್ಸ್ ಅಳಿಸಬೇಕೆ?';
  }

  @override
  String get delete => 'ಅಳಿಸಿ';

  @override
  String get media => 'ಮಾಧ್ಯಮ';

  @override
  String get failedToLoadImage => 'ಚಿತ್ರವನ್ನು ಲೋಡ್ ಮಾಡಲು ವಿಫಲವಾಗಿದೆ';

  @override
  String get unsupportedMediaType => 'ಬೆಂಬಲಿಸದ ಮಾಧ್ಯಮ ಪ್ರಕಾರ';

  @override
  String get noVerifiedRiskZones =>
      'ಈ ಪ್ರದೇಶದಲ್ಲಿ ಇನ್ನೂ ಪರಿಶೀಲಿಸಿದ ಅಪಾಯಕಾರಿ ವಲಯಗಳಿಲ್ಲ.';

  @override
  String get filterAllHazards => 'ಎಲ್ಲಾ ಅಪಾಯಗಳು';

  @override
  String get filterRipCurrent => 'ರಿಪ್ ಕರೆಂಟ್';

  @override
  String get filterPollution => 'ಮಾಲಿನ್ಯ';

  @override
  String get filterEarthquake => 'ಭೂಕಂಪ';

  @override
  String get mobileNumberHint => '12345 67890';

  @override
  String distanceInKm(Object r) {
    return '$r ಕಿ.ಮೀ.';
  }

  @override
  String get filterCommunity => 'ಸಮುದಾಯ';

  @override
  String get filterMySubmitted => 'ನಾನು ಸಲ್ಲಿಸಿದ್ದು';

  @override
  String get noReportsYet => 'ಇನ್ನೂ ವರದಿಗಳಿಲ್ಲ';

  @override
  String get noSubmittedReportsYet => 'ಇನ್ನೂ ಯಾವುದೇ ವರದಿ ಸಲ್ಲಿಸಿಲ್ಲ';

  @override
  String failedToLoadAdvisory(String error) {
    return 'Failed to load advisory: $error';
  }

  @override
  String get advisoryNotFound => 'ಸಲಹೆ ಕಂಡುಬಂದಿಲ್ಲ.';

  @override
  String distanceKmAway(String km) {
    return '$km km away';
  }

  @override
  String distanceMAway(String m) {
    return '$m ಮೀ ದೂರ';
  }

  @override
  String get low => 'ಕಡಿಮೆ';

  @override
  String get justNow => 'ಈಗಷ್ಟೇ';

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
  String get leaderboardTitle => 'ಲೀಡರ್‌ಬೋರ್ಡ್';

  @override
  String error(String errorMsg) {
    return 'ದೋಷ: $errorMsg';
  }

  @override
  String get noLeaderboardData => 'ಇನ್ನೂ ಯಾವುದೇ ಲೀಡರ್‌ಬೋರ್ಡ್ ಡೇಟಾ ಇಲ್ಲ';

  @override
  String get startReportingToClimb =>
      'ಶ್ರೇಯಾಂಕಗಳನ್ನು ಏರಲು ವರದಿ ಮಾಡುವುದನ್ನು ಪ್ರಾರಂಭಿಸಿ!';

  @override
  String pointsAbbrev(int points) {
    return '$points pts';
  }

  @override
  String reportCountDesc(int count) {
    return '$count reports';
  }

  @override
  String get you => 'ನೀವು';

  @override
  String get achievementsTitle => 'ಸಾಧನೆಗಳು';

  @override
  String get earnedBadges => 'ಗಳಿಸಿದ ಬ್ಯಾಡ್ಜ್‌ಗಳು';

  @override
  String get lockedBadges => 'ಲಾಕ್ ಬ್ಯಾಡ್ಜ್‌ಗಳು';

  @override
  String get pointsHistory => 'ಅಂಕಗಳ ಇತಿಹಾಸ';

  @override
  String get totalPoints => 'ಒಟ್ಟು ಅಂಕಗಳು';

  @override
  String get verified => 'ಪರಿಶೀಲಿಸಲಾಗಿದೆ';

  @override
  String get rate => 'ದರ';

  @override
  String get badges => 'ಬ್ಯಾಡ್ಜ್‌ಗಳು';

  @override
  String get submitFirstReportBadge =>
      'ಬ್ಯಾಡ್ಜ್ ಗಳಿಸಲು ನಿಮ್ಮ ಮೊದಲ ವರದಿಯನ್ನು ಸಲ್ಲಿಸಿ!';

  @override
  String get allBadgesEarned => '🎉 ಎಲ್ಲಾ ಬ್ಯಾಡ್ಜ್‌ಗಳನ್ನು ಗಳಿಸಲಾಗಿದೆ!';

  @override
  String get noPointsHistoryYet => 'ಅಂಕಗಳ ಇತಿಹಾಸ ಇನ್ನೂ ಇಲ್ಲ';

  @override
  String get earned => '✅ ಗಳಿಸಲಾಗಿದೆ!';

  @override
  String get notYetEarned => '🔒 ಇನ್ನೂ ಗಳಿಸಿಲ್ಲ';

  @override
  String get ok => 'ಸರಿ';

  @override
  String get filterAllUrgencies => 'ಎಲ್ಲಾ ತುರ್ತುಗಳು';

  @override
  String get filtersTitle => 'ಶೋಧಕಗಳು';

  @override
  String get timeRangeTitle => 'ಸಮಯ ಶ್ರೇಣಿ';

  @override
  String get twentyFourHours => '24 ಗಂಟೆಗಳು';

  @override
  String daysNumber(int days) {
    return '$days days';
  }

  @override
  String get showRiskZonesTitle => 'ಅಪಾಯದ ವಲಯಗಳನ್ನು ತೋರಿಸಿ';

  @override
  String get displayHazardHotspots => 'ಅಪಾಯದ ಹಾಟ್‌ಸ್ಪಾಟ್‌ಗಳನ್ನು ಪ್ರದರ್ಶಿಸಿ';

  @override
  String get highRiskOnlyTitle => 'ಹೆಚ್ಚಿನ ಅಪಾಯ ಮಾತ್ರ';

  @override
  String get showOnlyCriticalReports => 'ನಿರ್ಣಾಯಕ ವರದಿಗಳನ್ನು ಮಾತ್ರ ತೋರಿಸಿ';

  @override
  String get mediaViewerTitle => 'ಮಾಧ್ಯಮ ವೀಕ್ಷಕ';

  @override
  String mediaViewerError(String error) {
    return 'Failed to load media: $error';
  }

  @override
  String get loadingText => 'ಲೋಡ್ ಆಗುತ್ತಿದೆ...';

  @override
  String urgencyLevelText(String level) {
    return '$level Urgency';
  }

  @override
  String get highRiskBadge => 'ಹೆಚ್ಚಿನ ಅಪಾಯ';

  @override
  String get mediaTitle => 'ಮಾಧ್ಯಮ';

  @override
  String get playLabel => 'ಪ್ಲೇ ಮಾಡಿ';

  @override
  String get pauseLabel => 'ವಿರಾಮ';

  @override
  String get notificationsTitle => 'ಅಧಿಸೂಚನೆಗಳು';

  @override
  String reportStatusTitle(String status) {
    return 'Report $status';
  }

  @override
  String reportStatusBody(String hazardType, String status) {
    return 'Your $hazardType report has been $status.';
  }

  @override
  String get noNotificationsYet => 'ಇನ್ನೂ ಯಾವುದೇ ಅಧಿಸೂಚನೆಗಳಿಲ್ಲ';

  @override
  String get downloadOfflineRegionTitle =>
      'ಆಫ್‌ಲೈನ್ ಪ್ರದೇಶವನ್ನು ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ';

  @override
  String get downloadOfflineRegionDesc =>
      'ಆಫ್‌ಲೈನ್ ಬಳಕೆಗಾಗಿ ನಿಮ್ಮ ಪ್ರಸ್ತುತ ಸ್ಥಳದ ಸುತ್ತಲೂ ಮ್ಯಾಪ್ ಟೈಲ್ಸ್‌ಗಳನ್ನು ಡೌನ್‌ಲೋಡ್ ಮಾಡುತ್ತದೆ.';

  @override
  String get regionNameLabel => 'ಪ್ರದೇಶದ ಹೆಸರು';

  @override
  String get radiusLabel => 'ತ್ರಿಜ್ಯ';

  @override
  String get cancelLabel => 'ರದ್ದುಮಾಡಿ';

  @override
  String get downloadLabel => 'ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ';

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
  String get deleteLabel => 'ಅಳಿಸಿ';

  @override
  String get offlineMapsTitle => 'ಆಫ್‌ಲೈನ್ ನಕ್ಷೆಗಳು';

  @override
  String get downloadingTiles => 'ಟೈಲ್‌ಗಳನ್ನು ಡೌನ್‌ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ...';

  @override
  String get offlineMapInfoDesc =>
      'ನೀವು ಆನ್‌ಲೈನ್‌ನಲ್ಲಿ ವೀಕ್ಷಿಸುವ ನಕ್ಷೆಯ ಅಂಚುಗಳನ್ನು ಆಫ್‌ಲೈನ್ ಬಳಕೆಗಾಗಿ ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಸಂಗ್ರಹಿಸಲಾಗುತ್ತದೆ.ಸಂಪೂರ್ಣ ಆಫ್‌ಲೈನ್ ಕವರೇಜ್‌ಗಾಗಿ ಪ್ರದೇಶಗಳನ್ನು ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ.';

  @override
  String get noOfflineRegionsYet => 'ಇನ್ನೂ ಯಾವುದೇ ಆಫ್‌ಲೈನ್ ಪ್ರದೇಶಗಳಿಲ್ಲ';

  @override
  String get tapToDownloadRegion =>
      'ಪ್ರದೇಶವನ್ನು ಡೌನ್‌ಲೋಡ್ ಮಾಡಲು + ಅನ್ನು ಟ್ಯಾಪ್ ಮಾಡಿ';

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
      'ಮರುಪ್ರಯತ್ನ ಸ್ಥಿತಿ, ದೋಷದ ಕಾರಣವನ್ನು ಪರಿಶೀಲಿಸಿ ಮತ್ತು ಅಂಟಿಕೊಂಡಿರುವ ಐಟಂಗಳನ್ನು ಇಲ್ಲಿ ತೆಗೆದುಹಾಕಿ.';

  @override
  String get duplicateReportDetected =>
      'ಇದೇ ರೀತಿಯ ವರದಿಯು ಈಗಾಗಲೇ ಹತ್ತಿರದಲ್ಲಿದೆ.ನಿಮ್ಮ ಸಲ್ಲಿಕೆಯನ್ನು ನಾವು ಅದಕ್ಕೆ ಲಿಂಕ್ ಮಾಡಿದ್ದೇವೆ.';

  @override
  String get uploadTimelineCompleted =>
      'ನಿಮ್ಮ ಅಪ್‌ಲೋಡ್ ಟೈಮ್‌ಲೈನ್ ಪೂರ್ಣಗೊಂಡಿದೆ ಮತ್ತು ಉಳಿಸಲಾಗಿದೆ.';

  @override
  String get doneLabel => 'ಮುಗಿದಿದೆ';

  @override
  String get rateLimitMinInterval =>
      'ನೀವು ತುಂಬಾ ವೇಗವಾಗಿ ವರದಿಗಳನ್ನು ಕಳುಹಿಸುತ್ತಿದ್ದೀರಿ.ದಯವಿಟ್ಟು 30 ಸೆಕೆಂಡುಗಳು ನಿರೀಕ್ಷಿಸಿ ಮತ್ತು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.';

  @override
  String get rateLimitHourly =>
      'ಗಂಟೆಯ ವರದಿ ಮಿತಿಯನ್ನು ತಲುಪಿದೆ.ದಯವಿಟ್ಟು ನಂತರ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.';

  @override
  String get uploadingReportTitle => 'ನಿಮ್ಮ ವರದಿಯನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ';

  @override
  String get preparingReportDesc => 'ವರದಿಯ ವಿವರಗಳನ್ನು ಸಿದ್ಧಪಡಿಸಲಾಗುತ್ತಿದೆ';

  @override
  String get reportDetailsUploaded => 'ವರದಿ ವಿವರಗಳನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಲಾಗಿದೆ';

  @override
  String get duplicateReportLinked =>
      'ನಕಲಿ ವರದಿ ಪತ್ತೆಯಾಗಿದೆ, ಅಸ್ತಿತ್ವದಲ್ಲಿರುವ ವರದಿಗೆ ಲಿಂಕ್ ಮಾಡಲಾಗಿದೆ';

  @override
  String uploadedAttachmentCounter(int current, int total) {
    return 'Uploaded attachment $current/$total';
  }

  @override
  String get uploadingMedia => 'ಮಾಧ್ಯಮವನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ';

  @override
  String get mediaUploadFailedQueued =>
      'ಮಾಧ್ಯಮ ಅಪ್‌ಲೋಡ್ ವಿಫಲವಾಗಿದೆ, ಮರುಪ್ರಯತ್ನಕ್ಕಾಗಿ ಸರದಿಯಲ್ಲಿದೆ';

  @override
  String get finalizingReport => 'ಅಂತಿಮಗೊಳಿಸುವ ವರದಿ';

  @override
  String get pleaseWaitBeforeSending =>
      'ಇನ್ನೊಂದು ವರದಿಯನ್ನು ಕಳುಹಿಸುವ ಮೊದಲು ದಯವಿಟ್ಟು ನಿರೀಕ್ಷಿಸಿ';

  @override
  String get hourlyReportLimitTitle => 'ಗಂಟೆಯ ವರದಿ ಮಿತಿಯನ್ನು ತಲುಪಿದೆ';

  @override
  String uploadFailedError(String error) {
    return 'Upload failed: $error';
  }

  @override
  String get openQueueToReview =>
      'ಮರುಪ್ರಯತ್ನ ಸ್ಥಿತಿ, ದೋಷದ ಕಾರಣವನ್ನು ಪರಿಶೀಲಿಸಲು ಮತ್ತು ಅಂಟಿಕೊಂಡಿರುವ ಐಟಂಗಳನ್ನು ತೆಗೆದುಹಾಕಲು ಸರದಿಯನ್ನು ತೆರೆಯಿರಿ.';

  @override
  String get arcAbbr => 'ARC';

  @override
  String get arcFull => 'ಎಚ್ಚರಿಕೆ • ವರದಿ • ಸಂಘಟಿಸಿ';

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
      'ಸರದಿಯಲ್ಲಿರುವ ವರದಿಗಳನ್ನು ಸಿಂಕ್ ಮಾಡಲಾಗುತ್ತಿದೆ';

  @override
  String preparingPendingReports(int count) {
    return 'Preparing $count pending report(s)';
  }

  @override
  String uploadingReportCount(int current, int total) {
    return 'Uploading report $current of $total';
  }

  @override
  String get uploadingAttachments => 'ಲಗತ್ತುಗಳನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ';

  @override
  String get reportUpdateTitle => 'ನವೀಕರಣವನ್ನು ವರದಿ ಮಾಡಿ';

  @override
  String get aboutTransparencyBody =>
      'ಈ ಆ್ಯಪ್ ನಾಗರಿಕರಿಗೆ ಸಾಗರದ ಅಪಾಯಗಳನ್ನು ವರದಿ ಮಾಡಲು ಸಹಾಯ ಮಾಡುತ್ತದೆ ಮತ್ತು ಅಧಿಕಾರಿಗಳಿಗೆ ನೈಜ-ಸಮಯದ ಪರಿಸ್ಥಿತಿಗಳನ್ನು ಅರ್ಥಮಾಡಿಕೊಳ್ಳಲು ಸಹಾಯ ಮಾಡುತ್ತದೆ.\n\nವೈಯಕ್ತಿಕ ವಿವರಗಳ ಸಾರ್ವಜನಿಕ ಮಾನ್ಯತೆಯನ್ನು ಸೀಮಿತಗೊಳಿಸುವ ಮೂಲಕ ಮತ್ತು ಸಾರ್ವಜನಿಕ ವೀಕ್ಷಣೆಗಳಿಗಾಗಿ ಗೌಪ್ಯತೆ-ಸುರಕ್ಷಿತ ಮ್ಯಾప్ ಡೇಟಾವನ್ನು ಬಳಸುವ ಮೂಲಕ ನಾವು ಗೌಪ್ಯತೆಗೆ ಆದ್ಯತೆ ನೀಡುತ್ತೇವೆ.';

  @override
  String get privacyBody =>
      'ನಾವು ಏನನ್ನು ಸಂಗ್ರಹಿಸುತ್ತೇವೆ: ನಿಮ್ಮ ಫೋನ್ (ಲಾಗಿನ್‌ಗಾಗಿ), ನಿಮ್ಮ ವರದಿ ವಿವರಣೆ, ಸಮಯ ಮತ್ತು ಸ್ಥಳ.\n\nನಾವು ಅದನ್ನು ಹೇಗೆ ಬಳಸುತ್ತೇವೆ: ನಿಮ್ಮ ವರದಿಯನ್ನು ಸಂಗ್ರಹಿಸಲು ಮತ್ತು ನಕ್ಷೆ ಹಾಗೂ ಅಪ್‌ಡೇಟ್‌ಗಳ ಫೀಡ್‌ನಲ್ಲಿ ಪರಿಶೀಲಿಸಿದ, ಗೌಪ್ಯತೆ-ಸುರಕ್ಷಿತ ಮಾಹಿತಿಯನ್ನು ತೋರಿಸಲು.';

  @override
  String get reportSubmittedReason => 'ವರದಿ ಸಲ್ಲಿಸಲಾಗಿದೆ';

  @override
  String get reportVerifiedReason => 'ವರದಿ ಪರಿಶೀಲಿಸಲಾಗಿದೆ';

  @override
  String get highRiskVerifiedReason => 'ಹೆಚ್ಚಿನ ಅಪಾಯದ ವರದಿ ಪರಿಶೀಲಿಸಲಾಗಿದೆ';

  @override
  String get reportRejectedReason => 'ವರದಿ ತಿರಸ್ಕರಿಸಲಾಗಿದೆ';

  @override
  String get achievementsAndBadges => 'ಸಾಧನೆಗಳು ಮತ್ತು ಬ್ಯಾಡ್ಜ್‌ಗಳು';

  @override
  String get offlineMaps => 'ಆಫ್‌ಲೈನ್ ನಕ್ಷೆಗಳು';
}
