// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for English (`en`).
class AppLocalizationsEn extends AppLocalizations {
  AppLocalizationsEn([String locale = 'en']) : super(locale);

  @override
  String get appTitle => 'Civil Alert System';

  @override
  String get profile => 'Profile';

  @override
  String get profileAndReports => 'Reports';

  @override
  String get edit => 'Edit';

  @override
  String get user => 'User';

  @override
  String get phoneNotSet => 'Phone not set';

  @override
  String get syncNow => 'Sync now';

  @override
  String get nothingToSync => 'Nothing to sync';

  @override
  String syncDone(Object succeeded, Object failed) {
    return 'Sync done: $succeeded succeeded, $failed failed';
  }

  @override
  String get offlineReports => 'Offline Reports';

  @override
  String get noPendingReports => 'No pending reports';

  @override
  String attemptsLabel(Object count) {
    return 'Attempts: $count';
  }

  @override
  String get retry => 'Retry';

  @override
  String get remove => 'Remove';

  @override
  String get myReports => 'My Reports';

  @override
  String get noUploadedReportsYet => 'No uploaded reports yet';

  @override
  String get failedToLoadReports => 'Failed to load reports';

  @override
  String get youreOffline => 'You\'re offline';

  @override
  String get connectToInternetToLoadMyReports =>
      'Connect to the internet to load My Reports.';

  @override
  String get settings => 'Settings';

  @override
  String get helpFaq => 'Help / FAQ';

  @override
  String get aboutTransparency => 'About & transparency';

  @override
  String get language => 'Language';

  @override
  String get privacyControls => 'Language & privacy controls';

  @override
  String get privacy => 'Privacy';

  @override
  String get chooseLanguage => 'Choose Language';

  @override
  String get save => 'Save';

  @override
  String get continueLabel => 'Continue';

  @override
  String get languageComingSoon => 'This language is coming soon.';

  @override
  String get updates => 'Updates';

  @override
  String pendingCount(Object count) {
    return '$count pending';
  }

  @override
  String get noUpdatesYet => 'No updates yet';

  @override
  String get failedToLoadUpdates => 'Failed to load updates';

  @override
  String get helpTitle => 'Help / FAQ';

  @override
  String get aboutTitle => 'About & transparency';

  @override
  String get privacyTitle => 'Privacy controls';

  @override
  String get privacyReducePrecisionTitle => 'Reduce map location precision';

  @override
  String get privacyReducePrecisionSubtitle =>
      'If enabled, your report markers are shown with reduced location precision on the map.';

  @override
  String get faqQ1 => 'How do I report a hazard?';

  @override
  String get faqA1 =>
      'Open Report, describe what you see, and submit. If you\'re offline, it will be queued and uploaded when you\'re back online.';

  @override
  String get faqQ2 => 'Why can\'t I upload from gallery?';

  @override
  String get faqA2 =>
      'To keep reports trustworthy, the app only allows live capture (camera/recording) so old media can\'t be uploaded.';

  @override
  String get faqQ3 => 'How is my location used?';

  @override
  String get faqA3 =>
      'Your location helps responders understand where hazards are happening. For public viewing, locations may be shown with reduced precision.';

  @override
  String get loginTitle => 'Log in / Sign up';

  @override
  String get signUpWithMobile => 'Sign up with your registered mobile number';

  @override
  String get otpIntro => 'We will send you an OTP to verify your number';

  @override
  String get mobileNumberLabel => 'Mobile number *';

  @override
  String get sendingLabel => 'Sending...';

  @override
  String get sendOtp => 'Send OTP';

  @override
  String get failedToSendOtp => 'Failed to send OTP.';

  @override
  String get checkSupabasePhoneConfig =>
      'Check Supabase: Authentication → Providers → Phone (enabled) and SMS provider configured (Twilio).';

  @override
  String get enterOtp => 'Enter OTP';

  @override
  String sentToNumber(Object mobileNumber) {
    return 'Sent to $mobileNumber';
  }

  @override
  String get pleaseEnter6DigitOtp => 'Please enter 6-digit OTP';

  @override
  String get otpVerificationFailed => 'OTP verification failed.';

  @override
  String signInFailedWithError(Object error) {
    return 'Sign-in failed: $error';
  }

  @override
  String get didntReceiveOtp => 'Didn\'t receive OTP? ';

  @override
  String get otpResentSuccessfully => 'OTP resent successfully';

  @override
  String failedToResendOtpWithError(Object error) {
    return 'Failed to resend OTP: $error';
  }

  @override
  String get resendWithTimer => 'Resend (00:30)';

  @override
  String get savingLabel => 'Saving...';

  @override
  String get signedInSuccessfully => 'You\'ve signed in\nsuccessfully';

  @override
  String get directingToDashboard =>
      'Please wait while we direct you to the dashboard...';

  @override
  String get whatsYourName => 'What\'s your name?';

  @override
  String get personalizeExperience => 'Help us personalize your experience';

  @override
  String get enterYourName => 'Enter your name';

  @override
  String get pleaseEnterValidName =>
      'Please enter a valid name (at least 2 characters)';

  @override
  String get onboarding1Title =>
      'Your Trusted Collaborator\nin Times of Disaster';

  @override
  String get onboarding1Description =>
      'Get real-time alerts and contribute to safety by reporting ocean hazards as they happen.';

  @override
  String get onboarding2Title => 'Empowering Safety,\nOne Step at a Time';

  @override
  String get onboarding2Description =>
      'Join a network of vigilant eyes on the sea, sharing real-time hazard information to save lives.';

  @override
  String get onboarding3Title => 'Preparedness at\nYour Fingertips';

  @override
  String get onboarding3Description =>
      'Report ocean hazards, receive crucial alerts, and stay informed before it\'s too late.';

  @override
  String get skip => 'Skip';

  @override
  String get splashTitle => 'Civil Alert';

  @override
  String get splashSubtitle => 'Focused Hazard Detection';

  @override
  String get hiWelcome => 'Hi, Welcome 👋';

  @override
  String get togetherForOceanSafety =>
      'Together for\nOcean Safety,\nStronger Together';

  @override
  String get seeUpdates => 'See Updates';

  @override
  String get unusualActivity => 'Reports';

  @override
  String get seeAll => 'See All';

  @override
  String get filterNow => 'Now';

  @override
  String get filterLastWeek => 'Last week';

  @override
  String get filterLastMonth => 'Last month';

  @override
  String get locationServicesOffTitle => 'Location Services Off';

  @override
  String get enableLocationServicesForReporting =>
      'Please enable location services (GPS) to report hazards. Your location helps authorities respond quickly.';

  @override
  String get enableLocationServicesForCurrentLocation =>
      'Location services are off. Enable GPS to show your current location.';

  @override
  String get permissionRequiredTitle => 'Permission Required';

  @override
  String get locationPermissionDeniedAllowInSettings =>
      'Location permission denied. Please allow access in settings.';

  @override
  String get locationPermissionDeniedAllowForCurrentLocation =>
      'Location permission denied. Allow access to show your current location.';

  @override
  String get locationPermissionBlockedEnableInSettings =>
      'Location permission is blocked. Enable it in app settings.';

  @override
  String get locationPermissionPermanentlyDeniedForReporting =>
      'Location permission is permanently denied. Please enable it in app settings to report hazards.';

  @override
  String get locationPermissionPermanentlyDeniedForCurrentLocation =>
      'Location permission is permanently denied. Please enable it in app settings to show your current location.';

  @override
  String get cancel => 'Cancel';

  @override
  String get notNow => 'Not Now';

  @override
  String get openSettings => 'Open Settings';

  @override
  String errorGettingLocationWithError(Object error) {
    return 'Error getting location: $error';
  }

  @override
  String get gettingLocation => 'Getting location...';

  @override
  String get gettingYourLocation => 'Getting your location...';

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
  String get recordingAudioTapToStop => 'Recording audio… tap again to stop.';

  @override
  String errorStartingAudioWithError(Object error) {
    return 'Error starting audio: $error';
  }

  @override
  String get pleaseSelectHazardType => 'Please select a hazard type';

  @override
  String get pleaseDescribeSituation => 'Please describe the situation';

  @override
  String get waitingForLocation => 'Waiting for location...';

  @override
  String get pleaseEnterPeopleAtRisk =>
      'Please enter an estimate of people at risk';

  @override
  String get noInternetReportQueued =>
      'No internet connection. Report will be queued.';

  @override
  String get profileNeededTitle => 'Profile Needed';

  @override
  String get profileNeededBody =>
      'Please add your phone number before submitting a report.';

  @override
  String get addNow => 'Add Now';

  @override
  String get reportSavedMediaUploadFailedRetry =>
      'Report saved! Media upload failed, will retry later.';

  @override
  String get reportSubmittedSuccessfully => 'Report submitted successfully! 🎉';

  @override
  String errorWithError(Object error) {
    return 'Error: $error';
  }

  @override
  String get retryGps => 'Retry GPS';

  @override
  String get reportHazard => 'Report Hazard';

  @override
  String get whatAreYouSeeing => 'What are you seeing? 👁️';

  @override
  String get reportHelpsKeepSafe => 'Your report helps keep everyone safe';

  @override
  String get hazardTypeRequired => 'Hazard Type *';

  @override
  String get descriptionRequired => 'Description *';

  @override
  String get describeWhatYouSeeHint => 'Describe what you\'re seeing...';

  @override
  String get location => 'Location';

  @override
  String get time => 'Time';

  @override
  String get addMediaOptional => 'Add Media (Optional)';

  @override
  String get camera => 'Camera';

  @override
  String get record => 'Record';

  @override
  String get recordAudio => 'Record Audio';

  @override
  String get stopAudio => 'Stop Audio';

  @override
  String get highRiskSituation => 'High Risk Situation';

  @override
  String get peopleAtRiskEstimate => 'People at risk (estimate)';

  @override
  String get urgencyLow => 'Low';

  @override
  String get urgencyMedium => 'Medium';

  @override
  String get urgencyHigh => 'High';

  @override
  String get submitReport => 'Submit Report';

  @override
  String get close => 'Close';

  @override
  String get moreDetails => 'More Details';

  @override
  String get hazardHighWaves => 'High Waves';

  @override
  String get hazardTsunami => 'Tsunami';

  @override
  String get hazardStorm => 'Storm';

  @override
  String get hazardFlood => 'Flood';

  @override
  String get hazardOther => 'Other';

  @override
  String get homeTab => 'Home';

  @override
  String get mapTab => 'Map';

  @override
  String get updatesTab => 'Updates';

  @override
  String get profileTab => 'Reports';

  @override
  String get liveNews => 'Live News';

  @override
  String get sampleHazardHeadline => 'High Waves in Pacific Coast';

  @override
  String get sampleDate => 'Sun, 11 June 2024';

  @override
  String get sampleTimeAgo => '3 min ago';
}
