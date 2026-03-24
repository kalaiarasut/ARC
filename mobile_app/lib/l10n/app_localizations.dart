import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_bn.dart';
import 'app_localizations_en.dart';
import 'app_localizations_gu.dart';
import 'app_localizations_hi.dart';
import 'app_localizations_kn.dart';
import 'app_localizations_ml.dart';
import 'app_localizations_mr.dart';
import 'app_localizations_or.dart';
import 'app_localizations_ta.dart';
import 'app_localizations_te.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of AppLocalizations
/// returned by `AppLocalizations.of(context)`.
///
/// Applications need to include `AppLocalizations.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'l10n/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: AppLocalizations.localizationsDelegates,
///   supportedLocales: AppLocalizations.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the AppLocalizations.supportedLocales
/// property.
abstract class AppLocalizations {
  AppLocalizations(String locale)
    : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static AppLocalizations of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations)!;
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
        delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
      ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
    Locale('bn'),
    Locale('en'),
    Locale('gu'),
    Locale('hi'),
    Locale('kn'),
    Locale('ml'),
    Locale('mr'),
    Locale('or'),
    Locale('ta'),
    Locale('te'),
  ];

  /// No description provided for @appTitle.
  ///
  /// In en, this message translates to:
  /// **'Civil Alert System'**
  String get appTitle;

  /// No description provided for @profile.
  ///
  /// In en, this message translates to:
  /// **'Profile'**
  String get profile;

  /// No description provided for @profileAndReports.
  ///
  /// In en, this message translates to:
  /// **'Reports'**
  String get profileAndReports;

  /// No description provided for @edit.
  ///
  /// In en, this message translates to:
  /// **'Edit'**
  String get edit;

  /// No description provided for @user.
  ///
  /// In en, this message translates to:
  /// **'User'**
  String get user;

  /// No description provided for @phoneNotSet.
  ///
  /// In en, this message translates to:
  /// **'Phone not set'**
  String get phoneNotSet;

  /// No description provided for @syncNow.
  ///
  /// In en, this message translates to:
  /// **'Sync now'**
  String get syncNow;

  /// No description provided for @nothingToSync.
  ///
  /// In en, this message translates to:
  /// **'Nothing to sync'**
  String get nothingToSync;

  /// No description provided for @syncDone.
  ///
  /// In en, this message translates to:
  /// **'Sync done: {succeeded} succeeded, {failed} failed'**
  String syncDone(Object succeeded, Object failed);

  /// No description provided for @offlineReports.
  ///
  /// In en, this message translates to:
  /// **'Offline Reports'**
  String get offlineReports;

  /// No description provided for @noPendingReports.
  ///
  /// In en, this message translates to:
  /// **'No pending reports'**
  String get noPendingReports;

  /// No description provided for @attemptsLabel.
  ///
  /// In en, this message translates to:
  /// **'Attempts: {count}'**
  String attemptsLabel(Object count);

  /// No description provided for @retry.
  ///
  /// In en, this message translates to:
  /// **'Retry'**
  String get retry;

  /// No description provided for @remove.
  ///
  /// In en, this message translates to:
  /// **'Remove'**
  String get remove;

  /// No description provided for @myReports.
  ///
  /// In en, this message translates to:
  /// **'My Reports'**
  String get myReports;

  /// No description provided for @noUploadedReportsYet.
  ///
  /// In en, this message translates to:
  /// **'No uploaded reports yet'**
  String get noUploadedReportsYet;

  /// No description provided for @failedToLoadReports.
  ///
  /// In en, this message translates to:
  /// **'Failed to load reports'**
  String get failedToLoadReports;

  /// No description provided for @youreOffline.
  ///
  /// In en, this message translates to:
  /// **'You\'re offline'**
  String get youreOffline;

  /// No description provided for @connectToInternetToLoadMyReports.
  ///
  /// In en, this message translates to:
  /// **'Connect to the internet to load My Reports.'**
  String get connectToInternetToLoadMyReports;

  /// No description provided for @settings.
  ///
  /// In en, this message translates to:
  /// **'Settings'**
  String get settings;

  /// No description provided for @helpFaq.
  ///
  /// In en, this message translates to:
  /// **'Help / FAQ'**
  String get helpFaq;

  /// No description provided for @aboutTransparency.
  ///
  /// In en, this message translates to:
  /// **'About & transparency'**
  String get aboutTransparency;

  /// No description provided for @language.
  ///
  /// In en, this message translates to:
  /// **'Language'**
  String get language;

  /// No description provided for @privacyControls.
  ///
  /// In en, this message translates to:
  /// **'Language & privacy controls'**
  String get privacyControls;

  /// No description provided for @privacy.
  ///
  /// In en, this message translates to:
  /// **'Privacy'**
  String get privacy;

  /// No description provided for @chooseLanguage.
  ///
  /// In en, this message translates to:
  /// **'Choose Language'**
  String get chooseLanguage;

  /// No description provided for @save.
  ///
  /// In en, this message translates to:
  /// **'Save'**
  String get save;

  /// No description provided for @continueLabel.
  ///
  /// In en, this message translates to:
  /// **'Continue'**
  String get continueLabel;

  /// No description provided for @languageComingSoon.
  ///
  /// In en, this message translates to:
  /// **'This language is coming soon.'**
  String get languageComingSoon;

  /// No description provided for @updates.
  ///
  /// In en, this message translates to:
  /// **'Updates'**
  String get updates;

  /// No description provided for @pendingCount.
  ///
  /// In en, this message translates to:
  /// **'{count} pending'**
  String pendingCount(Object count);

  /// No description provided for @noUpdatesYet.
  ///
  /// In en, this message translates to:
  /// **'No updates yet'**
  String get noUpdatesYet;

  /// No description provided for @failedToLoadUpdates.
  ///
  /// In en, this message translates to:
  /// **'Failed to load updates'**
  String get failedToLoadUpdates;

  /// No description provided for @helpTitle.
  ///
  /// In en, this message translates to:
  /// **'Help / FAQ'**
  String get helpTitle;

  /// No description provided for @aboutTitle.
  ///
  /// In en, this message translates to:
  /// **'About & transparency'**
  String get aboutTitle;

  /// No description provided for @privacyTitle.
  ///
  /// In en, this message translates to:
  /// **'Privacy controls'**
  String get privacyTitle;

  /// No description provided for @privacyReducePrecisionTitle.
  ///
  /// In en, this message translates to:
  /// **'Reduce map location precision'**
  String get privacyReducePrecisionTitle;

  /// No description provided for @privacyReducePrecisionSubtitle.
  ///
  /// In en, this message translates to:
  /// **'If enabled, your report markers are shown with reduced location precision on the map.'**
  String get privacyReducePrecisionSubtitle;

  /// No description provided for @faqQ1.
  ///
  /// In en, this message translates to:
  /// **'How do I report a hazard?'**
  String get faqQ1;

  /// No description provided for @faqA1.
  ///
  /// In en, this message translates to:
  /// **'Open Report, describe what you see, and submit. If you\'re offline, it will be queued and uploaded when you\'re back online.'**
  String get faqA1;

  /// No description provided for @faqQ2.
  ///
  /// In en, this message translates to:
  /// **'Why can\'t I upload from gallery?'**
  String get faqQ2;

  /// No description provided for @faqA2.
  ///
  /// In en, this message translates to:
  /// **'To keep reports trustworthy, the app only allows live capture (camera/recording) so old media can\'t be uploaded.'**
  String get faqA2;

  /// No description provided for @faqQ3.
  ///
  /// In en, this message translates to:
  /// **'How is my location used?'**
  String get faqQ3;

  /// No description provided for @faqA3.
  ///
  /// In en, this message translates to:
  /// **'Your location helps responders understand where hazards are happening. For public viewing, locations may be shown with reduced precision.'**
  String get faqA3;

  /// No description provided for @loginTitle.
  ///
  /// In en, this message translates to:
  /// **'Log in / Sign up'**
  String get loginTitle;

  /// No description provided for @signUpWithMobile.
  ///
  /// In en, this message translates to:
  /// **'Sign up with your registered mobile number'**
  String get signUpWithMobile;

  /// No description provided for @otpIntro.
  ///
  /// In en, this message translates to:
  /// **'We will send you an OTP to verify your number'**
  String get otpIntro;

  /// No description provided for @mobileNumberLabel.
  ///
  /// In en, this message translates to:
  /// **'Mobile number *'**
  String get mobileNumberLabel;

  /// No description provided for @sendingLabel.
  ///
  /// In en, this message translates to:
  /// **'Sending...'**
  String get sendingLabel;

  /// No description provided for @sendOtp.
  ///
  /// In en, this message translates to:
  /// **'Send OTP'**
  String get sendOtp;

  /// No description provided for @failedToSendOtp.
  ///
  /// In en, this message translates to:
  /// **'Failed to send OTP.'**
  String get failedToSendOtp;

  /// No description provided for @checkSupabasePhoneConfig.
  ///
  /// In en, this message translates to:
  /// **'Check Supabase: Authentication → Providers → Phone (enabled) and SMS provider configured (Twilio).'**
  String get checkSupabasePhoneConfig;

  /// No description provided for @enterOtp.
  ///
  /// In en, this message translates to:
  /// **'Enter OTP'**
  String get enterOtp;

  /// No description provided for @sentToNumber.
  ///
  /// In en, this message translates to:
  /// **'Sent to {mobileNumber}'**
  String sentToNumber(Object mobileNumber);

  /// No description provided for @pleaseEnter6DigitOtp.
  ///
  /// In en, this message translates to:
  /// **'Please enter 6-digit OTP'**
  String get pleaseEnter6DigitOtp;

  /// No description provided for @otpVerificationFailed.
  ///
  /// In en, this message translates to:
  /// **'OTP verification failed.'**
  String get otpVerificationFailed;

  /// No description provided for @signInFailedWithError.
  ///
  /// In en, this message translates to:
  /// **'Sign-in failed: {error}'**
  String signInFailedWithError(Object error);

  /// No description provided for @didntReceiveOtp.
  ///
  /// In en, this message translates to:
  /// **'Didn\'t receive OTP? '**
  String get didntReceiveOtp;

  /// No description provided for @otpResentSuccessfully.
  ///
  /// In en, this message translates to:
  /// **'OTP resent successfully'**
  String get otpResentSuccessfully;

  /// No description provided for @failedToResendOtpWithError.
  ///
  /// In en, this message translates to:
  /// **'Failed to resend OTP: {error}'**
  String failedToResendOtpWithError(Object error);

  /// No description provided for @resendWithTimer.
  ///
  /// In en, this message translates to:
  /// **'Resend (00:30)'**
  String get resendWithTimer;

  /// No description provided for @savingLabel.
  ///
  /// In en, this message translates to:
  /// **'Saving...'**
  String get savingLabel;

  /// No description provided for @signedInSuccessfully.
  ///
  /// In en, this message translates to:
  /// **'You\'ve signed in\nsuccessfully'**
  String get signedInSuccessfully;

  /// No description provided for @directingToDashboard.
  ///
  /// In en, this message translates to:
  /// **'Please wait while we direct you to the dashboard...'**
  String get directingToDashboard;

  /// No description provided for @whatsYourName.
  ///
  /// In en, this message translates to:
  /// **'What\'s your name?'**
  String get whatsYourName;

  /// No description provided for @personalizeExperience.
  ///
  /// In en, this message translates to:
  /// **'Help us personalize your experience'**
  String get personalizeExperience;

  /// No description provided for @enterYourName.
  ///
  /// In en, this message translates to:
  /// **'Enter your name'**
  String get enterYourName;

  /// No description provided for @pleaseEnterValidName.
  ///
  /// In en, this message translates to:
  /// **'Please enter a valid name (at least 2 characters)'**
  String get pleaseEnterValidName;

  /// No description provided for @onboarding1Title.
  ///
  /// In en, this message translates to:
  /// **'Your Trusted Collaborator\nin Times of Disaster'**
  String get onboarding1Title;

  /// No description provided for @onboarding1Description.
  ///
  /// In en, this message translates to:
  /// **'Get real-time alerts and contribute to safety by reporting ocean hazards as they happen.'**
  String get onboarding1Description;

  /// No description provided for @onboarding2Title.
  ///
  /// In en, this message translates to:
  /// **'Empowering Safety,\nOne Step at a Time'**
  String get onboarding2Title;

  /// No description provided for @onboarding2Description.
  ///
  /// In en, this message translates to:
  /// **'Join a network of vigilant eyes on the sea, sharing real-time hazard information to save lives.'**
  String get onboarding2Description;

  /// No description provided for @onboarding3Title.
  ///
  /// In en, this message translates to:
  /// **'Preparedness at\nYour Fingertips'**
  String get onboarding3Title;

  /// No description provided for @onboarding3Description.
  ///
  /// In en, this message translates to:
  /// **'Report ocean hazards, receive crucial alerts, and stay informed before it\'s too late.'**
  String get onboarding3Description;

  /// No description provided for @skip.
  ///
  /// In en, this message translates to:
  /// **'Skip'**
  String get skip;

  /// No description provided for @splashTitle.
  ///
  /// In en, this message translates to:
  /// **'Civil Alert'**
  String get splashTitle;

  /// No description provided for @splashSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Focused Hazard Detection'**
  String get splashSubtitle;

  /// No description provided for @hiWelcome.
  ///
  /// In en, this message translates to:
  /// **'Hi, Welcome 👋'**
  String get hiWelcome;

  /// No description provided for @togetherForOceanSafety.
  ///
  /// In en, this message translates to:
  /// **'Together for\nOcean Safety,\nStronger Together'**
  String get togetherForOceanSafety;

  /// No description provided for @seeUpdates.
  ///
  /// In en, this message translates to:
  /// **'See Updates'**
  String get seeUpdates;

  /// No description provided for @unusualActivity.
  ///
  /// In en, this message translates to:
  /// **'Reports'**
  String get unusualActivity;

  /// No description provided for @seeAll.
  ///
  /// In en, this message translates to:
  /// **'See All'**
  String get seeAll;

  /// No description provided for @filterNow.
  ///
  /// In en, this message translates to:
  /// **'Now'**
  String get filterNow;

  /// No description provided for @filterLastWeek.
  ///
  /// In en, this message translates to:
  /// **'Last week'**
  String get filterLastWeek;

  /// No description provided for @filterLastMonth.
  ///
  /// In en, this message translates to:
  /// **'Last month'**
  String get filterLastMonth;

  /// No description provided for @locationServicesOffTitle.
  ///
  /// In en, this message translates to:
  /// **'Location Services Disabled'**
  String get locationServicesOffTitle;

  /// No description provided for @enableLocationServicesForReporting.
  ///
  /// In en, this message translates to:
  /// **'Please enable location services (GPS) to report hazards. Your location helps authorities respond quickly.'**
  String get enableLocationServicesForReporting;

  /// No description provided for @enableLocationServicesForCurrentLocation.
  ///
  /// In en, this message translates to:
  /// **'Please enable location services to view your current location.'**
  String get enableLocationServicesForCurrentLocation;

  /// No description provided for @permissionRequiredTitle.
  ///
  /// In en, this message translates to:
  /// **'Permission Required'**
  String get permissionRequiredTitle;

  /// No description provided for @locationPermissionDeniedAllowInSettings.
  ///
  /// In en, this message translates to:
  /// **'Location permission denied. Please allow access in settings.'**
  String get locationPermissionDeniedAllowInSettings;

  /// No description provided for @locationPermissionDeniedAllowForCurrentLocation.
  ///
  /// In en, this message translates to:
  /// **'Allow location permission to view your current location'**
  String get locationPermissionDeniedAllowForCurrentLocation;

  /// No description provided for @locationPermissionBlockedEnableInSettings.
  ///
  /// In en, this message translates to:
  /// **'Location permissions blocked. Enable them in Settings.'**
  String get locationPermissionBlockedEnableInSettings;

  /// No description provided for @locationPermissionPermanentlyDeniedForReporting.
  ///
  /// In en, this message translates to:
  /// **'Location permission is permanently denied. Please enable it in app settings to report hazards.'**
  String get locationPermissionPermanentlyDeniedForReporting;

  /// No description provided for @locationPermissionPermanentlyDeniedForCurrentLocation.
  ///
  /// In en, this message translates to:
  /// **'Location permissions are permanently denied. Please allow them in settings.'**
  String get locationPermissionPermanentlyDeniedForCurrentLocation;

  /// No description provided for @cancel.
  ///
  /// In en, this message translates to:
  /// **'Cancel'**
  String get cancel;

  /// No description provided for @notNow.
  ///
  /// In en, this message translates to:
  /// **'Not Now'**
  String get notNow;

  /// No description provided for @openSettings.
  ///
  /// In en, this message translates to:
  /// **'Open Settings'**
  String get openSettings;

  /// No description provided for @errorGettingLocationWithError.
  ///
  /// In en, this message translates to:
  /// **'Error getting location: {error}'**
  String errorGettingLocationWithError(Object error);

  /// No description provided for @gettingLocation.
  ///
  /// In en, this message translates to:
  /// **'Getting location...'**
  String get gettingLocation;

  /// No description provided for @gettingYourLocation.
  ///
  /// In en, this message translates to:
  /// **'Getting your location...'**
  String get gettingYourLocation;

  /// No description provided for @maximumAttachmentsAllowed.
  ///
  /// In en, this message translates to:
  /// **'Maximum {max} attachments allowed'**
  String maximumAttachmentsAllowed(Object max);

  /// No description provided for @errorPickingImageWithError.
  ///
  /// In en, this message translates to:
  /// **'Error picking image: {error}'**
  String errorPickingImageWithError(Object error);

  /// No description provided for @errorPickingVideoWithError.
  ///
  /// In en, this message translates to:
  /// **'Error picking video: {error}'**
  String errorPickingVideoWithError(Object error);

  /// No description provided for @errorStoppingAudioWithError.
  ///
  /// In en, this message translates to:
  /// **'Error stopping audio: {error}'**
  String errorStoppingAudioWithError(Object error);

  /// No description provided for @recordingAudioTapToStop.
  ///
  /// In en, this message translates to:
  /// **'Recording audio… tap again to stop.'**
  String get recordingAudioTapToStop;

  /// No description provided for @errorStartingAudioWithError.
  ///
  /// In en, this message translates to:
  /// **'Error starting audio: {error}'**
  String errorStartingAudioWithError(Object error);

  /// No description provided for @pleaseSelectHazardType.
  ///
  /// In en, this message translates to:
  /// **'Please select a hazard type'**
  String get pleaseSelectHazardType;

  /// No description provided for @pleaseDescribeSituation.
  ///
  /// In en, this message translates to:
  /// **'Please describe the situation'**
  String get pleaseDescribeSituation;

  /// No description provided for @waitingForLocation.
  ///
  /// In en, this message translates to:
  /// **'Waiting for location...'**
  String get waitingForLocation;

  /// No description provided for @pleaseEnterPeopleAtRisk.
  ///
  /// In en, this message translates to:
  /// **'Please enter an estimate of people at risk'**
  String get pleaseEnterPeopleAtRisk;

  /// No description provided for @noInternetReportQueued.
  ///
  /// In en, this message translates to:
  /// **'No internet connection. Report will be queued.'**
  String get noInternetReportQueued;

  /// No description provided for @profileNeededTitle.
  ///
  /// In en, this message translates to:
  /// **'Profile Needed'**
  String get profileNeededTitle;

  /// No description provided for @profileNeededBody.
  ///
  /// In en, this message translates to:
  /// **'Please add your phone number before submitting a report.'**
  String get profileNeededBody;

  /// No description provided for @addNow.
  ///
  /// In en, this message translates to:
  /// **'Add Now'**
  String get addNow;

  /// No description provided for @reportSavedMediaUploadFailedRetry.
  ///
  /// In en, this message translates to:
  /// **'Report saved! Media upload failed, will retry later.'**
  String get reportSavedMediaUploadFailedRetry;

  /// No description provided for @reportSubmittedSuccessfully.
  ///
  /// In en, this message translates to:
  /// **'Report submitted successfully! 🎉'**
  String get reportSubmittedSuccessfully;

  /// No description provided for @errorWithError.
  ///
  /// In en, this message translates to:
  /// **'Error: {error}'**
  String errorWithError(Object error);

  /// No description provided for @retryGps.
  ///
  /// In en, this message translates to:
  /// **'Retry GPS'**
  String get retryGps;

  /// No description provided for @reportHazard.
  ///
  /// In en, this message translates to:
  /// **'Report Hazard'**
  String get reportHazard;

  /// No description provided for @whatAreYouSeeing.
  ///
  /// In en, this message translates to:
  /// **'What are you seeing? 👁️'**
  String get whatAreYouSeeing;

  /// No description provided for @reportHelpsKeepSafe.
  ///
  /// In en, this message translates to:
  /// **'Your report helps keep everyone safe'**
  String get reportHelpsKeepSafe;

  /// No description provided for @hazardTypeRequired.
  ///
  /// In en, this message translates to:
  /// **'Hazard Type *'**
  String get hazardTypeRequired;

  /// No description provided for @descriptionRequired.
  ///
  /// In en, this message translates to:
  /// **'Description *'**
  String get descriptionRequired;

  /// No description provided for @describeWhatYouSeeHint.
  ///
  /// In en, this message translates to:
  /// **'Describe what you\'re seeing...'**
  String get describeWhatYouSeeHint;

  /// No description provided for @location.
  ///
  /// In en, this message translates to:
  /// **'Location'**
  String get location;

  /// No description provided for @time.
  ///
  /// In en, this message translates to:
  /// **'Time'**
  String get time;

  /// No description provided for @addMediaOptional.
  ///
  /// In en, this message translates to:
  /// **'Add Media (Optional)'**
  String get addMediaOptional;

  /// No description provided for @camera.
  ///
  /// In en, this message translates to:
  /// **'Camera'**
  String get camera;

  /// No description provided for @record.
  ///
  /// In en, this message translates to:
  /// **'Record'**
  String get record;

  /// No description provided for @recordAudio.
  ///
  /// In en, this message translates to:
  /// **'Record Audio'**
  String get recordAudio;

  /// No description provided for @stopAudio.
  ///
  /// In en, this message translates to:
  /// **'Stop Audio'**
  String get stopAudio;

  /// No description provided for @highRiskSituation.
  ///
  /// In en, this message translates to:
  /// **'High Risk Situation'**
  String get highRiskSituation;

  /// No description provided for @peopleAtRiskEstimate.
  ///
  /// In en, this message translates to:
  /// **'People at risk (estimate)'**
  String get peopleAtRiskEstimate;

  /// No description provided for @urgencyLow.
  ///
  /// In en, this message translates to:
  /// **'Low'**
  String get urgencyLow;

  /// No description provided for @urgencyMedium.
  ///
  /// In en, this message translates to:
  /// **'Medium'**
  String get urgencyMedium;

  /// No description provided for @urgencyHigh.
  ///
  /// In en, this message translates to:
  /// **'High (Critical)'**
  String get urgencyHigh;

  /// No description provided for @submitReport.
  ///
  /// In en, this message translates to:
  /// **'Submit Report'**
  String get submitReport;

  /// No description provided for @close.
  ///
  /// In en, this message translates to:
  /// **'Close'**
  String get close;

  /// No description provided for @moreDetails.
  ///
  /// In en, this message translates to:
  /// **'More Details'**
  String get moreDetails;

  /// No description provided for @hazardHighWaves.
  ///
  /// In en, this message translates to:
  /// **'High Waves'**
  String get hazardHighWaves;

  /// No description provided for @hazardTsunami.
  ///
  /// In en, this message translates to:
  /// **'Tsunami'**
  String get hazardTsunami;

  /// No description provided for @hazardStorm.
  ///
  /// In en, this message translates to:
  /// **'Storm'**
  String get hazardStorm;

  /// No description provided for @hazardFlood.
  ///
  /// In en, this message translates to:
  /// **'Flood'**
  String get hazardFlood;

  /// No description provided for @hazardOther.
  ///
  /// In en, this message translates to:
  /// **'Other'**
  String get hazardOther;

  /// No description provided for @homeTab.
  ///
  /// In en, this message translates to:
  /// **'Home'**
  String get homeTab;

  /// No description provided for @mapTab.
  ///
  /// In en, this message translates to:
  /// **'Map'**
  String get mapTab;

  /// No description provided for @updatesTab.
  ///
  /// In en, this message translates to:
  /// **'Updates'**
  String get updatesTab;

  /// No description provided for @profileTab.
  ///
  /// In en, this message translates to:
  /// **'Reports'**
  String get profileTab;

  /// No description provided for @liveNews.
  ///
  /// In en, this message translates to:
  /// **'Live News'**
  String get liveNews;

  /// No description provided for @sampleHazardHeadline.
  ///
  /// In en, this message translates to:
  /// **'High Waves in Pacific Coast'**
  String get sampleHazardHeadline;

  /// No description provided for @sampleDate.
  ///
  /// In en, this message translates to:
  /// **'Sun, 11 June 2024'**
  String get sampleDate;

  /// No description provided for @sampleTimeAgo.
  ///
  /// In en, this message translates to:
  /// **'3 min ago'**
  String get sampleTimeAgo;

  /// No description provided for @queuedReportStuck.
  ///
  /// In en, this message translates to:
  /// **'Stuck'**
  String get queuedReportStuck;

  /// No description provided for @queuedReportPendingUpload.
  ///
  /// In en, this message translates to:
  /// **'Pending upload'**
  String get queuedReportPendingUpload;

  /// No description provided for @queuedReportReadyToRetry.
  ///
  /// In en, this message translates to:
  /// **'Ready to retry'**
  String get queuedReportReadyToRetry;

  /// No description provided for @queuedReportWaitingForRetry.
  ///
  /// In en, this message translates to:
  /// **'Waiting for retry'**
  String get queuedReportWaitingForRetry;

  /// No description provided for @removeQueuedReportTitle.
  ///
  /// In en, this message translates to:
  /// **'Remove queued report?'**
  String get removeQueuedReportTitle;

  /// No description provided for @removeQueuedReportContent.
  ///
  /// In en, this message translates to:
  /// **'This will delete the offline copy and stop future retries for this report.'**
  String get removeQueuedReportContent;

  /// No description provided for @queuedReportRemoved.
  ///
  /// In en, this message translates to:
  /// **'Queued report removed'**
  String get queuedReportRemoved;

  /// No description provided for @themeLight.
  ///
  /// In en, this message translates to:
  /// **'Light'**
  String get themeLight;

  /// No description provided for @themeDark.
  ///
  /// In en, this message translates to:
  /// **'Dark'**
  String get themeDark;

  /// No description provided for @themeSystem.
  ///
  /// In en, this message translates to:
  /// **'System'**
  String get themeSystem;

  /// No description provided for @notifications.
  ///
  /// In en, this message translates to:
  /// **'Notifications'**
  String get notifications;

  /// No description provided for @logOutTitle.
  ///
  /// In en, this message translates to:
  /// **'Log out?'**
  String get logOutTitle;

  /// No description provided for @logOut.
  ///
  /// In en, this message translates to:
  /// **'Log out'**
  String get logOut;

  /// No description provided for @similarReportExists.
  ///
  /// In en, this message translates to:
  /// **'Similar report already exists nearby. We linked your submission to it.'**
  String get similarReportExists;

  /// No description provided for @sendingReportsTooQuickly.
  ///
  /// In en, this message translates to:
  /// **'You are sending reports too quickly. Please wait 30 seconds and try again.'**
  String get sendingReportsTooQuickly;

  /// No description provided for @hourlyReportLimitReached.
  ///
  /// In en, this message translates to:
  /// **'Hourly report limit reached. Please try again later.'**
  String get hourlyReportLimitReached;

  /// No description provided for @couldNotOpenMaps.
  ///
  /// In en, this message translates to:
  /// **'Could not open maps'**
  String get couldNotOpenMaps;

  /// No description provided for @navigate.
  ///
  /// In en, this message translates to:
  /// **'Navigate'**
  String get navigate;

  /// No description provided for @reportDetailsNotAvailable.
  ///
  /// In en, this message translates to:
  /// **'Report details are not available yet'**
  String get reportDetailsNotAvailable;

  /// No description provided for @viewQueue.
  ///
  /// In en, this message translates to:
  /// **'View queue'**
  String get viewQueue;

  /// No description provided for @achievements.
  ///
  /// In en, this message translates to:
  /// **'Achievements'**
  String get achievements;

  /// No description provided for @leaderboard.
  ///
  /// In en, this message translates to:
  /// **'Leaderboard'**
  String get leaderboard;

  /// No description provided for @chooseFromGallery.
  ///
  /// In en, this message translates to:
  /// **'Choose from gallery'**
  String get chooseFromGallery;

  /// No description provided for @downloadOfflineRegion.
  ///
  /// In en, this message translates to:
  /// **'Download Offline Region'**
  String get downloadOfflineRegion;

  /// No description provided for @radius.
  ///
  /// In en, this message translates to:
  /// **'Radius'**
  String get radius;

  /// No description provided for @download.
  ///
  /// In en, this message translates to:
  /// **'Download'**
  String get download;

  /// No description provided for @deleteRegionTitle.
  ///
  /// In en, this message translates to:
  /// **'Delete Region?'**
  String get deleteRegionTitle;

  /// No description provided for @deleteRegionContent.
  ///
  /// In en, this message translates to:
  /// **'Remove \"{name}\" and its {count} cached tiles?'**
  String deleteRegionContent(Object name, Object count);

  /// No description provided for @delete.
  ///
  /// In en, this message translates to:
  /// **'Delete'**
  String get delete;

  /// No description provided for @media.
  ///
  /// In en, this message translates to:
  /// **'Media'**
  String get media;

  /// No description provided for @failedToLoadImage.
  ///
  /// In en, this message translates to:
  /// **'Failed to load image'**
  String get failedToLoadImage;

  /// No description provided for @unsupportedMediaType.
  ///
  /// In en, this message translates to:
  /// **'Unsupported media type'**
  String get unsupportedMediaType;

  /// No description provided for @noVerifiedRiskZones.
  ///
  /// In en, this message translates to:
  /// **'No verified risk zones in this area yet.'**
  String get noVerifiedRiskZones;

  /// No description provided for @filterAllHazards.
  ///
  /// In en, this message translates to:
  /// **'All Hazards'**
  String get filterAllHazards;

  /// No description provided for @filterRipCurrent.
  ///
  /// In en, this message translates to:
  /// **'Rip Current'**
  String get filterRipCurrent;

  /// No description provided for @filterPollution.
  ///
  /// In en, this message translates to:
  /// **'Pollution'**
  String get filterPollution;

  /// No description provided for @filterEarthquake.
  ///
  /// In en, this message translates to:
  /// **'Earthquake'**
  String get filterEarthquake;

  /// No description provided for @mobileNumberHint.
  ///
  /// In en, this message translates to:
  /// **'12345 67890'**
  String get mobileNumberHint;

  /// No description provided for @distanceInKm.
  ///
  /// In en, this message translates to:
  /// **'{r} km'**
  String distanceInKm(Object r);

  /// No description provided for @filterCommunity.
  ///
  /// In en, this message translates to:
  /// **'Community'**
  String get filterCommunity;

  /// No description provided for @filterMySubmitted.
  ///
  /// In en, this message translates to:
  /// **'My Submitted'**
  String get filterMySubmitted;

  /// No description provided for @noReportsYet.
  ///
  /// In en, this message translates to:
  /// **'No reports yet'**
  String get noReportsYet;

  /// No description provided for @noSubmittedReportsYet.
  ///
  /// In en, this message translates to:
  /// **'No submitted reports yet'**
  String get noSubmittedReportsYet;

  /// No description provided for @failedToLoadAdvisory.
  ///
  /// In en, this message translates to:
  /// **'Failed to load advisory: {error}'**
  String failedToLoadAdvisory(String error);

  /// No description provided for @advisoryNotFound.
  ///
  /// In en, this message translates to:
  /// **'Advisory not found.'**
  String get advisoryNotFound;

  /// No description provided for @distanceKmAway.
  ///
  /// In en, this message translates to:
  /// **'{km} km away'**
  String distanceKmAway(String km);

  /// No description provided for @distanceMAway.
  ///
  /// In en, this message translates to:
  /// **'{m} m away'**
  String distanceMAway(String m);

  /// No description provided for @low.
  ///
  /// In en, this message translates to:
  /// **'LOW'**
  String get low;

  /// No description provided for @justNow.
  ///
  /// In en, this message translates to:
  /// **'Just now'**
  String get justNow;

  /// No description provided for @minutesAgo.
  ///
  /// In en, this message translates to:
  /// **'{minutes}m ago'**
  String minutesAgo(int minutes);

  /// No description provided for @hoursAgo.
  ///
  /// In en, this message translates to:
  /// **'{hours}h ago'**
  String hoursAgo(int hours);

  /// No description provided for @daysAgo.
  ///
  /// In en, this message translates to:
  /// **'{days}d ago'**
  String daysAgo(int days);

  /// No description provided for @leaderboardTitle.
  ///
  /// In en, this message translates to:
  /// **'Leaderboard'**
  String get leaderboardTitle;

  /// No description provided for @error.
  ///
  /// In en, this message translates to:
  /// **'Error: {errorMsg}'**
  String error(String errorMsg);

  /// No description provided for @noLeaderboardData.
  ///
  /// In en, this message translates to:
  /// **'No leaderboard data yet'**
  String get noLeaderboardData;

  /// No description provided for @startReportingToClimb.
  ///
  /// In en, this message translates to:
  /// **'Start reporting to climb the ranks!'**
  String get startReportingToClimb;

  /// No description provided for @pointsAbbrev.
  ///
  /// In en, this message translates to:
  /// **'{points} pts'**
  String pointsAbbrev(int points);

  /// No description provided for @reportCountDesc.
  ///
  /// In en, this message translates to:
  /// **'{count} reports'**
  String reportCountDesc(int count);

  /// No description provided for @you.
  ///
  /// In en, this message translates to:
  /// **'YOU'**
  String get you;

  /// No description provided for @achievementsTitle.
  ///
  /// In en, this message translates to:
  /// **'Achievements'**
  String get achievementsTitle;

  /// No description provided for @earnedBadges.
  ///
  /// In en, this message translates to:
  /// **'Earned Badges'**
  String get earnedBadges;

  /// No description provided for @lockedBadges.
  ///
  /// In en, this message translates to:
  /// **'Locked Badges'**
  String get lockedBadges;

  /// No description provided for @pointsHistory.
  ///
  /// In en, this message translates to:
  /// **'Points History'**
  String get pointsHistory;

  /// No description provided for @totalPoints.
  ///
  /// In en, this message translates to:
  /// **'Total Points'**
  String get totalPoints;

  /// No description provided for @verified.
  ///
  /// In en, this message translates to:
  /// **'Verified'**
  String get verified;

  /// No description provided for @rate.
  ///
  /// In en, this message translates to:
  /// **'Rate'**
  String get rate;

  /// No description provided for @badges.
  ///
  /// In en, this message translates to:
  /// **'Badges'**
  String get badges;

  /// No description provided for @submitFirstReportBadge.
  ///
  /// In en, this message translates to:
  /// **'Submit your first report to earn a badge!'**
  String get submitFirstReportBadge;

  /// No description provided for @allBadgesEarned.
  ///
  /// In en, this message translates to:
  /// **'🎉 All badges earned!'**
  String get allBadgesEarned;

  /// No description provided for @noPointsHistoryYet.
  ///
  /// In en, this message translates to:
  /// **'No points history yet'**
  String get noPointsHistoryYet;

  /// No description provided for @earned.
  ///
  /// In en, this message translates to:
  /// **'✅ Earned!'**
  String get earned;

  /// No description provided for @notYetEarned.
  ///
  /// In en, this message translates to:
  /// **'🔒 Not yet earned'**
  String get notYetEarned;

  /// No description provided for @ok.
  ///
  /// In en, this message translates to:
  /// **'OK'**
  String get ok;

  /// No description provided for @filterAllUrgencies.
  ///
  /// In en, this message translates to:
  /// **'All Urgencies'**
  String get filterAllUrgencies;

  /// No description provided for @filtersTitle.
  ///
  /// In en, this message translates to:
  /// **'Filters'**
  String get filtersTitle;

  /// No description provided for @timeRangeTitle.
  ///
  /// In en, this message translates to:
  /// **'Time Range'**
  String get timeRangeTitle;

  /// No description provided for @twentyFourHours.
  ///
  /// In en, this message translates to:
  /// **'24 hours'**
  String get twentyFourHours;

  /// No description provided for @daysNumber.
  ///
  /// In en, this message translates to:
  /// **'{days} days'**
  String daysNumber(int days);

  /// No description provided for @showRiskZonesTitle.
  ///
  /// In en, this message translates to:
  /// **'Show Risk Zones'**
  String get showRiskZonesTitle;

  /// No description provided for @displayHazardHotspots.
  ///
  /// In en, this message translates to:
  /// **'Display hazard hotspots'**
  String get displayHazardHotspots;

  /// No description provided for @highRiskOnlyTitle.
  ///
  /// In en, this message translates to:
  /// **'High Risk Only'**
  String get highRiskOnlyTitle;

  /// No description provided for @showOnlyCriticalReports.
  ///
  /// In en, this message translates to:
  /// **'Show only critical reports'**
  String get showOnlyCriticalReports;

  /// No description provided for @mediaViewerTitle.
  ///
  /// In en, this message translates to:
  /// **'Media Viewer'**
  String get mediaViewerTitle;

  /// No description provided for @mediaViewerError.
  ///
  /// In en, this message translates to:
  /// **'Failed to load media: {error}'**
  String mediaViewerError(String error);

  /// No description provided for @loadingText.
  ///
  /// In en, this message translates to:
  /// **'Loading...'**
  String get loadingText;

  /// No description provided for @urgencyLevelText.
  ///
  /// In en, this message translates to:
  /// **'{level} Urgency'**
  String urgencyLevelText(String level);

  /// No description provided for @highRiskBadge.
  ///
  /// In en, this message translates to:
  /// **'HIGH RISK'**
  String get highRiskBadge;

  /// No description provided for @mediaTitle.
  ///
  /// In en, this message translates to:
  /// **'Media'**
  String get mediaTitle;

  /// No description provided for @playLabel.
  ///
  /// In en, this message translates to:
  /// **'Play'**
  String get playLabel;

  /// No description provided for @pauseLabel.
  ///
  /// In en, this message translates to:
  /// **'Pause'**
  String get pauseLabel;

  /// No description provided for @notificationsTitle.
  ///
  /// In en, this message translates to:
  /// **'Notifications'**
  String get notificationsTitle;

  /// No description provided for @reportStatusTitle.
  ///
  /// In en, this message translates to:
  /// **'Report {status}'**
  String reportStatusTitle(String status);

  /// No description provided for @reportStatusBody.
  ///
  /// In en, this message translates to:
  /// **'Your {hazardType} report has been {status}.'**
  String reportStatusBody(String hazardType, String status);

  /// No description provided for @noNotificationsYet.
  ///
  /// In en, this message translates to:
  /// **'No notifications yet'**
  String get noNotificationsYet;

  /// No description provided for @downloadOfflineRegionTitle.
  ///
  /// In en, this message translates to:
  /// **'Download Offline Region'**
  String get downloadOfflineRegionTitle;

  /// No description provided for @downloadOfflineRegionDesc.
  ///
  /// In en, this message translates to:
  /// **'Downloads map tiles around your current location for offline use.'**
  String get downloadOfflineRegionDesc;

  /// No description provided for @regionNameLabel.
  ///
  /// In en, this message translates to:
  /// **'Region Name'**
  String get regionNameLabel;

  /// No description provided for @radiusLabel.
  ///
  /// In en, this message translates to:
  /// **'Radius'**
  String get radiusLabel;

  /// No description provided for @cancelLabel.
  ///
  /// In en, this message translates to:
  /// **'Cancel'**
  String get cancelLabel;

  /// No description provided for @downloadLabel.
  ///
  /// In en, this message translates to:
  /// **'Download'**
  String get downloadLabel;

  /// No description provided for @downloadSuccessMsg.
  ///
  /// In en, this message translates to:
  /// **'\"{name}\" downloaded successfully!'**
  String downloadSuccessMsg(String name);

  /// No description provided for @downloadFailedMsg.
  ///
  /// In en, this message translates to:
  /// **'Download failed: {error}'**
  String downloadFailedMsg(String error);

  /// No description provided for @deleteRegionDesc.
  ///
  /// In en, this message translates to:
  /// **'Remove \"{name}\" and its {count} cached tiles?'**
  String deleteRegionDesc(String name, int count);

  /// No description provided for @deleteLabel.
  ///
  /// In en, this message translates to:
  /// **'Delete'**
  String get deleteLabel;

  /// No description provided for @offlineMapsTitle.
  ///
  /// In en, this message translates to:
  /// **'Offline Maps'**
  String get offlineMapsTitle;

  /// No description provided for @downloadingTiles.
  ///
  /// In en, this message translates to:
  /// **'Downloading tiles...'**
  String get downloadingTiles;

  /// No description provided for @offlineMapInfoDesc.
  ///
  /// In en, this message translates to:
  /// **'Map tiles you view online are automatically cached for offline use. Download regions for full offline coverage.'**
  String get offlineMapInfoDesc;

  /// No description provided for @noOfflineRegionsYet.
  ///
  /// In en, this message translates to:
  /// **'No offline regions yet'**
  String get noOfflineRegionsYet;

  /// No description provided for @tapToDownloadRegion.
  ///
  /// In en, this message translates to:
  /// **'Tap + to download a region'**
  String get tapToDownloadRegion;

  /// No description provided for @estimatedTiles.
  ///
  /// In en, this message translates to:
  /// **'~{estimate} tiles ({sizeMB} MB est.)'**
  String estimatedTiles(int estimate, String sizeMB);

  /// No description provided for @regionTileSize.
  ///
  /// In en, this message translates to:
  /// **'{count} tiles · {sizeMB} MB'**
  String regionTileSize(int count, String sizeMB);

  /// No description provided for @queuedReportsCount.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, =1{1 queued report} other{{count} queued reports}}'**
  String queuedReportsCount(int count);

  /// No description provided for @stuckItemsManualAttention.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, =1{1 item needs manual attention.} other{{count} items need manual attention.}}'**
  String stuckItemsManualAttention(int count);

  /// No description provided for @reviewRetryStatus.
  ///
  /// In en, this message translates to:
  /// **'Review retry status, error reason, and remove stuck items here.'**
  String get reviewRetryStatus;

  /// No description provided for @duplicateReportDetected.
  ///
  /// In en, this message translates to:
  /// **'Similar report already exists nearby. We linked your submission to it.'**
  String get duplicateReportDetected;

  /// No description provided for @uploadTimelineCompleted.
  ///
  /// In en, this message translates to:
  /// **'Your upload timeline has been completed and saved.'**
  String get uploadTimelineCompleted;

  /// No description provided for @doneLabel.
  ///
  /// In en, this message translates to:
  /// **'Done'**
  String get doneLabel;

  /// No description provided for @rateLimitMinInterval.
  ///
  /// In en, this message translates to:
  /// **'You are sending reports too quickly. Please wait 30 seconds and try again.'**
  String get rateLimitMinInterval;

  /// No description provided for @rateLimitHourly.
  ///
  /// In en, this message translates to:
  /// **'Hourly report limit reached. Please try again later.'**
  String get rateLimitHourly;

  /// No description provided for @uploadingReportTitle.
  ///
  /// In en, this message translates to:
  /// **'Uploading your report'**
  String get uploadingReportTitle;

  /// No description provided for @preparingReportDesc.
  ///
  /// In en, this message translates to:
  /// **'Preparing report details'**
  String get preparingReportDesc;

  /// No description provided for @reportDetailsUploaded.
  ///
  /// In en, this message translates to:
  /// **'Report details uploaded'**
  String get reportDetailsUploaded;

  /// No description provided for @duplicateReportLinked.
  ///
  /// In en, this message translates to:
  /// **'Duplicate report detected, linked to existing report'**
  String get duplicateReportLinked;

  /// No description provided for @uploadedAttachmentCounter.
  ///
  /// In en, this message translates to:
  /// **'Uploaded attachment {current}/{total}'**
  String uploadedAttachmentCounter(int current, int total);

  /// No description provided for @uploadingMedia.
  ///
  /// In en, this message translates to:
  /// **'Uploading media'**
  String get uploadingMedia;

  /// No description provided for @mediaUploadFailedQueued.
  ///
  /// In en, this message translates to:
  /// **'Media upload failed, queued for retry'**
  String get mediaUploadFailedQueued;

  /// No description provided for @finalizingReport.
  ///
  /// In en, this message translates to:
  /// **'Finalizing report'**
  String get finalizingReport;

  /// No description provided for @pleaseWaitBeforeSending.
  ///
  /// In en, this message translates to:
  /// **'Please wait before sending another report'**
  String get pleaseWaitBeforeSending;

  /// No description provided for @hourlyReportLimitTitle.
  ///
  /// In en, this message translates to:
  /// **'Hourly report limit reached'**
  String get hourlyReportLimitTitle;

  /// No description provided for @uploadFailedError.
  ///
  /// In en, this message translates to:
  /// **'Upload failed: {error}'**
  String uploadFailedError(String error);

  /// No description provided for @openQueueToReview.
  ///
  /// In en, this message translates to:
  /// **'Open the queue to review retry status, error reason, and remove stuck items.'**
  String get openQueueToReview;

  /// No description provided for @arcAbbr.
  ///
  /// In en, this message translates to:
  /// **'ARC'**
  String get arcAbbr;

  /// No description provided for @arcFull.
  ///
  /// In en, this message translates to:
  /// **'ALERT  •  REPORT  •  COORDINATE'**
  String get arcFull;

  /// No description provided for @failedToTakePhoto.
  ///
  /// In en, this message translates to:
  /// **'Failed to take photo: {error}'**
  String failedToTakePhoto(String error);

  /// No description provided for @failedToPickPhoto.
  ///
  /// In en, this message translates to:
  /// **'Failed to pick photo: {error}'**
  String failedToPickPhoto(String error);

  /// No description provided for @syncingQueuedReports.
  ///
  /// In en, this message translates to:
  /// **'Syncing queued reports'**
  String get syncingQueuedReports;

  /// No description provided for @preparingPendingReports.
  ///
  /// In en, this message translates to:
  /// **'Preparing {count} pending report(s)'**
  String preparingPendingReports(int count);

  /// No description provided for @uploadingReportCount.
  ///
  /// In en, this message translates to:
  /// **'Uploading report {current} of {total}'**
  String uploadingReportCount(int current, int total);

  /// No description provided for @uploadingAttachments.
  ///
  /// In en, this message translates to:
  /// **'Uploading attachments'**
  String get uploadingAttachments;

  /// No description provided for @reportUpdateTitle.
  ///
  /// In en, this message translates to:
  /// **'Report update'**
  String get reportUpdateTitle;

  /// No description provided for @aboutTransparencyBody.
  ///
  /// In en, this message translates to:
  /// **'This app helps citizens report ocean hazards and helps authorities understand real-time conditions.\n\nWe prioritize privacy by limiting public exposure of personal details and by using privacy-safe map data for public views.'**
  String get aboutTransparencyBody;

  /// No description provided for @privacyBody.
  ///
  /// In en, this message translates to:
  /// **'What we collect: your phone (for login), your report description, time, and location.\n\nHow we use it: to store your report and show verified, privacy-safe information on the map and updates feed.'**
  String get privacyBody;

  /// No description provided for @reportSubmittedReason.
  ///
  /// In en, this message translates to:
  /// **'Report submitted'**
  String get reportSubmittedReason;

  /// No description provided for @reportVerifiedReason.
  ///
  /// In en, this message translates to:
  /// **'Report verified'**
  String get reportVerifiedReason;

  /// No description provided for @highRiskVerifiedReason.
  ///
  /// In en, this message translates to:
  /// **'High-risk report verified'**
  String get highRiskVerifiedReason;

  /// No description provided for @reportRejectedReason.
  ///
  /// In en, this message translates to:
  /// **'Report rejected'**
  String get reportRejectedReason;
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(lookupAppLocalizations(locale));
  }

  @override
  bool isSupported(Locale locale) => <String>[
    'bn',
    'en',
    'gu',
    'hi',
    'kn',
    'ml',
    'mr',
    'or',
    'ta',
    'te',
  ].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

AppLocalizations lookupAppLocalizations(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'bn':
      return AppLocalizationsBn();
    case 'en':
      return AppLocalizationsEn();
    case 'gu':
      return AppLocalizationsGu();
    case 'hi':
      return AppLocalizationsHi();
    case 'kn':
      return AppLocalizationsKn();
    case 'ml':
      return AppLocalizationsMl();
    case 'mr':
      return AppLocalizationsMr();
    case 'or':
      return AppLocalizationsOr();
    case 'ta':
      return AppLocalizationsTa();
    case 'te':
      return AppLocalizationsTe();
  }

  throw FlutterError(
    'AppLocalizations.delegate failed to load unsupported locale "$locale". This is likely '
    'an issue with the localizations generation tool. Please file an issue '
    'on GitHub with a reproducible sample app and the gen-l10n configuration '
    'that was used.',
  );
}
