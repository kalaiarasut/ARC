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
  String get locationServicesOffTitle => 'Location Services Disabled';

  @override
  String get enableLocationServicesForReporting =>
      'Please enable location services (GPS) to report hazards. Your location helps authorities respond quickly.';

  @override
  String get enableLocationServicesForCurrentLocation =>
      'Please enable location services to view your current location.';

  @override
  String get permissionRequiredTitle => 'Permission Required';

  @override
  String get locationPermissionDeniedAllowInSettings =>
      'Location permission denied. Please allow access in settings.';

  @override
  String get locationPermissionDeniedAllowForCurrentLocation =>
      'Allow location permission to view your current location';

  @override
  String get locationPermissionBlockedEnableInSettings =>
      'Location permissions blocked. Enable them in Settings.';

  @override
  String get locationPermissionPermanentlyDeniedForReporting =>
      'Location permission is permanently denied. Please enable it in app settings to report hazards.';

  @override
  String get locationPermissionPermanentlyDeniedForCurrentLocation =>
      'Location permissions are permanently denied. Please allow them in settings.';

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
  String get urgencyHigh => 'High (Critical)';

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

  @override
  String get queuedReportStuck => 'Stuck';

  @override
  String get queuedReportPendingUpload => 'Pending upload';

  @override
  String get queuedReportReadyToRetry => 'Ready to retry';

  @override
  String get queuedReportWaitingForRetry => 'Waiting for retry';

  @override
  String get removeQueuedReportTitle => 'Remove queued report?';

  @override
  String get removeQueuedReportContent =>
      'This will delete the offline copy and stop future retries for this report.';

  @override
  String get queuedReportRemoved => 'Queued report removed';

  @override
  String get themeLight => 'Light';

  @override
  String get themeDark => 'Dark';

  @override
  String get themeSystem => 'System';

  @override
  String get notifications => 'Notifications';

  @override
  String get logOutTitle => 'Log out?';

  @override
  String get logOut => 'Log out';

  @override
  String get similarReportExists =>
      'Similar report already exists nearby. We linked your submission to it.';

  @override
  String get sendingReportsTooQuickly =>
      'You are sending reports too quickly. Please wait 30 seconds and try again.';

  @override
  String get hourlyReportLimitReached =>
      'Hourly report limit reached. Please try again later.';

  @override
  String get couldNotOpenMaps => 'Could not open maps';

  @override
  String get navigate => 'Navigate';

  @override
  String get reportDetailsNotAvailable =>
      'Report details are not available yet';

  @override
  String get viewQueue => 'View queue';

  @override
  String get achievements => 'Achievements';

  @override
  String get leaderboard => 'Leaderboard';

  @override
  String get chooseFromGallery => 'Choose from gallery';

  @override
  String get downloadOfflineRegion => 'Download Offline Region';

  @override
  String get radius => 'Radius';

  @override
  String get download => 'Download';

  @override
  String get deleteRegionTitle => 'Delete Region?';

  @override
  String deleteRegionContent(Object name, Object count) {
    return 'Remove \"$name\" and its $count cached tiles?';
  }

  @override
  String get delete => 'Delete';

  @override
  String get media => 'Media';

  @override
  String get failedToLoadImage => 'Failed to load image';

  @override
  String get unsupportedMediaType => 'Unsupported media type';

  @override
  String get noVerifiedRiskZones => 'No verified risk zones in this area yet.';

  @override
  String get filterAllHazards => 'All Hazards';

  @override
  String get filterRipCurrent => 'Rip Current';

  @override
  String get filterPollution => 'Pollution';

  @override
  String get filterEarthquake => 'Earthquake';

  @override
  String get mobileNumberHint => '12345 67890';

  @override
  String distanceInKm(Object r) {
    return '$r km';
  }

  @override
  String get filterCommunity => 'Community';

  @override
  String get filterMySubmitted => 'My Submitted';

  @override
  String get noReportsYet => 'No reports yet';

  @override
  String get noSubmittedReportsYet => 'No submitted reports yet';

  @override
  String failedToLoadAdvisory(String error) {
    return 'Failed to load advisory: $error';
  }

  @override
  String get advisoryNotFound => 'Advisory not found.';

  @override
  String distanceKmAway(String km) {
    return '$km km away';
  }

  @override
  String distanceMAway(String m) {
    return '$m m away';
  }

  @override
  String get low => 'LOW';

  @override
  String get justNow => 'Just now';

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
  String get leaderboardTitle => 'Leaderboard';

  @override
  String error(String errorMsg) {
    return 'Error: $errorMsg';
  }

  @override
  String get noLeaderboardData => 'No leaderboard data yet';

  @override
  String get startReportingToClimb => 'Start reporting to climb the ranks!';

  @override
  String pointsAbbrev(int points) {
    return '$points pts';
  }

  @override
  String reportCountDesc(int count) {
    return '$count reports';
  }

  @override
  String get you => 'YOU';

  @override
  String get achievementsTitle => 'Achievements';

  @override
  String get earnedBadges => 'Earned Badges';

  @override
  String get lockedBadges => 'Locked Badges';

  @override
  String get pointsHistory => 'Points History';

  @override
  String get totalPoints => 'Total Points';

  @override
  String get verified => 'Verified';

  @override
  String get rate => 'Rate';

  @override
  String get badges => 'Badges';

  @override
  String get submitFirstReportBadge =>
      'Submit your first report to earn a badge!';

  @override
  String get allBadgesEarned => '🎉 All badges earned!';

  @override
  String get noPointsHistoryYet => 'No points history yet';

  @override
  String get earned => '✅ Earned!';

  @override
  String get notYetEarned => '🔒 Not yet earned';

  @override
  String get ok => 'OK';

  @override
  String get filterAllUrgencies => 'All Urgencies';

  @override
  String get filtersTitle => 'Filters';

  @override
  String get timeRangeTitle => 'Time Range';

  @override
  String get twentyFourHours => '24 hours';

  @override
  String daysNumber(int days) {
    return '$days days';
  }

  @override
  String get showRiskZonesTitle => 'Show Risk Zones';

  @override
  String get displayHazardHotspots => 'Display hazard hotspots';

  @override
  String get highRiskOnlyTitle => 'High Risk Only';

  @override
  String get showOnlyCriticalReports => 'Show only critical reports';

  @override
  String get mediaViewerTitle => 'Media Viewer';

  @override
  String mediaViewerError(String error) {
    return 'Failed to load media: $error';
  }

  @override
  String get loadingText => 'Loading...';

  @override
  String urgencyLevelText(String level) {
    return '$level Urgency';
  }

  @override
  String get highRiskBadge => 'HIGH RISK';

  @override
  String get mediaTitle => 'Media';

  @override
  String get playLabel => 'Play';

  @override
  String get pauseLabel => 'Pause';

  @override
  String get notificationsTitle => 'Notifications';

  @override
  String reportStatusTitle(String status) {
    return 'Report $status';
  }

  @override
  String reportStatusBody(String hazardType, String status) {
    return 'Your $hazardType report has been $status.';
  }

  @override
  String get noNotificationsYet => 'No notifications yet';

  @override
  String get downloadOfflineRegionTitle => 'Download Offline Region';

  @override
  String get downloadOfflineRegionDesc =>
      'Downloads map tiles around your current location for offline use.';

  @override
  String get regionNameLabel => 'Region Name';

  @override
  String get radiusLabel => 'Radius';

  @override
  String get cancelLabel => 'Cancel';

  @override
  String get downloadLabel => 'Download';

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
  String get deleteLabel => 'Delete';

  @override
  String get offlineMapsTitle => 'Offline Maps';

  @override
  String get downloadingTiles => 'Downloading tiles...';

  @override
  String get offlineMapInfoDesc =>
      'Map tiles you view online are automatically cached for offline use. Download regions for full offline coverage.';

  @override
  String get noOfflineRegionsYet => 'No offline regions yet';

  @override
  String get tapToDownloadRegion => 'Tap + to download a region';

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
      'Review retry status, error reason, and remove stuck items here.';

  @override
  String get duplicateReportDetected =>
      'Similar report already exists nearby. We linked your submission to it.';

  @override
  String get uploadTimelineCompleted =>
      'Your upload timeline has been completed and saved.';

  @override
  String get doneLabel => 'Done';

  @override
  String get rateLimitMinInterval =>
      'You are sending reports too quickly. Please wait 30 seconds and try again.';

  @override
  String get rateLimitHourly =>
      'Hourly report limit reached. Please try again later.';

  @override
  String get uploadingReportTitle => 'Uploading your report';

  @override
  String get preparingReportDesc => 'Preparing report details';

  @override
  String get reportDetailsUploaded => 'Report details uploaded';

  @override
  String get duplicateReportLinked =>
      'Duplicate report detected, linked to existing report';

  @override
  String uploadedAttachmentCounter(int current, int total) {
    return 'Uploaded attachment $current/$total';
  }

  @override
  String get uploadingMedia => 'Uploading media';

  @override
  String get mediaUploadFailedQueued => 'Media upload failed, queued for retry';

  @override
  String get finalizingReport => 'Finalizing report';

  @override
  String get pleaseWaitBeforeSending =>
      'Please wait before sending another report';

  @override
  String get hourlyReportLimitTitle => 'Hourly report limit reached';

  @override
  String uploadFailedError(String error) {
    return 'Upload failed: $error';
  }

  @override
  String get openQueueToReview =>
      'Open the queue to review retry status, error reason, and remove stuck items.';

  @override
  String get arcAbbr => 'ARC';

  @override
  String get arcFull => 'ALERT  •  REPORT  •  COORDINATE';

  @override
  String failedToTakePhoto(String error) {
    return 'Failed to take photo: $error';
  }

  @override
  String failedToPickPhoto(String error) {
    return 'Failed to pick photo: $error';
  }

  @override
  String get syncingQueuedReports => 'Syncing queued reports';

  @override
  String preparingPendingReports(int count) {
    return 'Preparing $count pending report(s)';
  }

  @override
  String uploadingReportCount(int current, int total) {
    return 'Uploading report $current of $total';
  }

  @override
  String get uploadingAttachments => 'Uploading attachments';

  @override
  String get reportUpdateTitle => 'Report update';

  @override
  String get aboutTransparencyBody =>
      'This app helps citizens report ocean hazards and helps authorities understand real-time conditions.\n\nWe prioritize privacy by limiting public exposure of personal details and by using privacy-safe map data for public views.';

  @override
  String get privacyBody =>
      'What we collect: your phone (for login), your report description, time, and location.\n\nHow we use it: to store your report and show verified, privacy-safe information on the map and updates feed.';

  @override
  String get reportSubmittedReason => 'Report submitted';

  @override
  String get reportVerifiedReason => 'Report verified';

  @override
  String get highRiskVerifiedReason => 'High-risk report verified';

  @override
  String get reportRejectedReason => 'Report rejected';

  @override
  String get achievementsAndBadges => 'Achievements & Badges';

  @override
  String get offlineMaps => 'Offline Maps';

  @override
  String get filterSeverity => 'Severity';

  @override
  String get filterCategory => 'Category';

  @override
  String get filterNearMe => 'Near me';

  @override
  String get filterAllSeverities => 'All Severities';

  @override
  String get filterAllCategories => 'All Categories';

  @override
  String get filterWarning => 'Warning';

  @override
  String get filterWatch => 'Watch';

  @override
  String get filterInfo => 'Info';

  @override
  String get filtersLabel => 'Filters';

  @override
  String get filterClearAll => 'Clear all';

  @override
  String get filterSearchRegion => 'Search region...';

  @override
  String get filterSearchByRegion => 'Search by region';

  @override
  String get filterStatus => 'Status';

  @override
  String get filterActiveOnly => 'Active only';

  @override
  String get filterIncludeExpired => 'Include expired';

  @override
  String get filterAdditional => 'Additional Filters';

  @override
  String get filterHasContact => 'Has contact info';

  @override
  String get filterTranslatedOnly => 'Translated only';

  @override
  String get filterApply => 'Apply Filters';

  @override
  String get sortLabel => 'Sort';

  @override
  String get sortMostRelevant => 'Most relevant';

  @override
  String get sortNewest => 'Newest';

  @override
  String get sortNearest => 'Nearest';

  @override
  String filterActiveCount(int count) {
    return '$count active';
  }
}
