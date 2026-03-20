import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_en.dart';
import 'app_localizations_hi.dart';
import 'app_localizations_ml.dart';
import 'app_localizations_te.dart';
import 'app_localizations_ta.dart';

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
    Locale('en'),
    Locale('hi'),
    Locale('ml'),
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
  /// **'Location Services Off'**
  String get locationServicesOffTitle;

  /// No description provided for @enableLocationServicesForReporting.
  ///
  /// In en, this message translates to:
  /// **'Please enable location services (GPS) to report hazards. Your location helps authorities respond quickly.'**
  String get enableLocationServicesForReporting;

  /// No description provided for @enableLocationServicesForCurrentLocation.
  ///
  /// In en, this message translates to:
  /// **'Location services are off. Enable GPS to show your current location.'**
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
  /// **'Location permission denied. Allow access to show your current location.'**
  String get locationPermissionDeniedAllowForCurrentLocation;

  /// No description provided for @locationPermissionBlockedEnableInSettings.
  ///
  /// In en, this message translates to:
  /// **'Location permission is blocked. Enable it in app settings.'**
  String get locationPermissionBlockedEnableInSettings;

  /// No description provided for @locationPermissionPermanentlyDeniedForReporting.
  ///
  /// In en, this message translates to:
  /// **'Location permission is permanently denied. Please enable it in app settings to report hazards.'**
  String get locationPermissionPermanentlyDeniedForReporting;

  /// No description provided for @locationPermissionPermanentlyDeniedForCurrentLocation.
  ///
  /// In en, this message translates to:
  /// **'Location permission is permanently denied. Please enable it in app settings to show your current location.'**
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
  /// **'High'**
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
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(lookupAppLocalizations(locale));
  }

  @override
  bool isSupported(Locale locale) =>
      <String>['en', 'hi', 'ml', 'ta', 'te'].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

AppLocalizations lookupAppLocalizations(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'en':
      return AppLocalizationsEn();
    case 'hi':
      return AppLocalizationsHi();
    case 'ml':
      return AppLocalizationsMl();
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
