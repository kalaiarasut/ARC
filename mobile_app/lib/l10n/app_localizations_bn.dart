// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Bengali Bangla (`bn`).
class AppLocalizationsBn extends AppLocalizations {
  AppLocalizationsBn([String locale = 'bn']) : super(locale);

  @override
  String get appTitle => 'সিভিল অ্যালার্ট সিস্টেম';

  @override
  String get profile => 'প্রোফাইল';

  @override
  String get profileAndReports => 'রিপোর্টস';

  @override
  String get edit => 'সম্পাদনা করুন';

  @override
  String get user => 'ব্যবহারকারী';

  @override
  String get phoneNotSet => 'ফোন নম্বর সেট করা নেই';

  @override
  String get syncNow => 'এখনই সিঙ্ক করুন';

  @override
  String get nothingToSync => 'সিঙ্ক করার কিছু নেই';

  @override
  String syncDone(Object succeeded, Object failed) {
    return 'সিঙ্ক সম্পন্ন হয়েছে: $succeeded সফল, $failed ব্যর্থ';
  }

  @override
  String get offlineReports => 'অফলাইন রিপোর্টস';

  @override
  String get noPendingReports => 'কোনো অপেক্ষমাণ রিপোর্ট নেই';

  @override
  String attemptsLabel(Object count) {
    return 'চেষ্টা: $count';
  }

  @override
  String get retry => 'পুনরায় চেষ্টা করুন';

  @override
  String get remove => 'সরিয়ে ফেলুন';

  @override
  String get myReports => 'আমার রিপোর্টস';

  @override
  String get noUploadedReportsYet => 'এখনও কোনো রিপোর্ট আপলোড করা হয়নি';

  @override
  String get failedToLoadReports => 'রিপোর্টস লোড করা যায়নি';

  @override
  String get youreOffline => 'আপনি অফলাইনে আছেন';

  @override
  String get connectToInternetToLoadMyReports =>
      'আমার রিপোর্টস দেখতে ইন্টারনেটের সাথে সংযোগ করুন।';

  @override
  String get settings => 'সেটিংস';

  @override
  String get helpFaq => 'সাহায্য / FAQ';

  @override
  String get aboutTransparency => 'তথ্য ও স্বচ্ছতা';

  @override
  String get language => 'ভাষা';

  @override
  String get privacyControls => 'ভাষা ও গোপনীয়তা সেটিংস';

  @override
  String get privacy => 'গোপনীয়তা';

  @override
  String get chooseLanguage => 'ভাষা নির্বাচন করুন';

  @override
  String get save => 'সংরক্ষণ করুন';

  @override
  String get continueLabel => 'চালিয়ে যান';

  @override
  String get languageComingSoon => 'এই ভাষাটি শীঘ্রই আসছে।';

  @override
  String get updates => 'আপডেটস';

  @override
  String pendingCount(Object count) {
    return '$count অপেক্ষমাণ';
  }

  @override
  String get noUpdatesYet => 'এখনও কোনো আপডেট নেই';

  @override
  String get failedToLoadUpdates => 'আপডেটস লোড করা যায়নি';

  @override
  String get helpTitle => 'সাহায্য / FAQ';

  @override
  String get aboutTitle => 'তথ্য ও স্বচ্ছতা';

  @override
  String get privacyTitle => 'গোপনীয়তা সেটিংস';

  @override
  String get privacyReducePrecisionTitle =>
      'ম্যাপ লোকায়তনের সঠিকতা হ্রাস করুন';

  @override
  String get privacyReducePrecisionSubtitle =>
      'অফ করা থাকলে, ম্যাপে আপনার রিপোর্টস কম সঠিকতায় দেখানো হবে।';

  @override
  String get faqQ1 => 'কীভাবে হ্যাজার্ড রিপোর্ট করব?';

  @override
  String get faqA1 =>
      'রিপোর্ট খুলুন, এবং আপনি যা দেখছেন তা বর্ণনা করে জমা দিন।';

  @override
  String get faqQ2 => 'গ্যালারি থেকে কেন ছবি আপলোড করা যায় না?';

  @override
  String get faqA2 =>
      'রিপোর্টস বিশ্বস্ত রাখতে, এই অ্যাপটি শুধুমাত্র লাইভ ক্যাপচার সমর্থন করে।';

  @override
  String get faqQ3 => 'আমার লোকেশন কীভাবে ব্যবহৃত হয়?';

  @override
  String get faqA3 => 'কোথায় ঝুঁকি ঘটেছে তা বোঝাতে আপনার লোকেশন সাহায্য করে।';

  @override
  String get loginTitle => 'লগ ইন / সাইন আপ';

  @override
  String get signUpWithMobile =>
      'আপনার নিবন্ধিত মোবাইল নম্বর দিয়ে সাইন আপ করুন';

  @override
  String get otpIntro => 'আপনার নম্বর যাচাই করতে আমরা আপনাকে একটি OTP পাঠাব';

  @override
  String get mobileNumberLabel => 'মোবাইল নম্বর *';

  @override
  String get sendingLabel => 'পাঠানো হচ্ছে...';

  @override
  String get sendOtp => 'OTP পাঠান';

  @override
  String get failedToSendOtp => 'OTP পাঠানো যায়নি।';

  @override
  String get checkSupabasePhoneConfig => 'সুপারবেস চেক করুন।';

  @override
  String get enterOtp => 'OTP দিন';

  @override
  String sentToNumber(Object mobileNumber) {
    return 'Sent to $mobileNumber';
  }

  @override
  String get pleaseEnter6DigitOtp => 'অনুগ্রহ করে 6-সংখ্যার OTP লিখুন';

  @override
  String get otpVerificationFailed => 'OTP যাচাইকরণ ব্যর্থ হয়েছে।';

  @override
  String signInFailedWithError(Object error) {
    return 'Sign-in failed: $error';
  }

  @override
  String get didntReceiveOtp => 'OTP পাননি? ';

  @override
  String get otpResentSuccessfully => 'OTP সফলভাবে পুনরায় পাঠানো হয়েছে';

  @override
  String failedToResendOtpWithError(Object error) {
    return 'Failed to resend OTP: $error';
  }

  @override
  String get resendWithTimer => 'পুনরায় পাঠান (০0:৩0)';

  @override
  String get savingLabel => 'সংরক্ষণ করা হচ্ছে...';

  @override
  String get signedInSuccessfully => 'আপনি সফলভাবে\nসাইন ইন করেছেন';

  @override
  String get directingToDashboard =>
      'অনুগ্রহ করে অপেক্ষা করুন, আমরা আপনাকে ড্যাশবোর্ডে নিয়ে যাচ্ছি...';

  @override
  String get whatsYourName => 'আপনার নাম কি?';

  @override
  String get personalizeExperience =>
      'আপনার অভিজ্ঞতা ব্যক্তিগতকৃত করতে সাহায্য করুন';

  @override
  String get enterYourName => 'আপনার নাম লিখুন';

  @override
  String get pleaseEnterValidName =>
      'অনুগ্রহ করে একটি বৈধ নাম লিখুন (কমপক্ষে দুটি অক্ষর)';

  @override
  String get onboarding1Title => 'দুর্যোগের সময়ে\nআপনার বিশ্বস্ত সঙ্গী';

  @override
  String get onboarding1Description =>
      'রিয়েল-টাইম অ্যালার্ট পান এবং ঘটমান সমুদ্রীয় হ্যাজার্ড রিপোর্ট করে সুরক্ষায় অবদান রাখুন।';

  @override
  String get onboarding2Title => 'সুরক্ষা জোরদার করুন,\nধাপে ধাপে';

  @override
  String get onboarding2Description =>
      'সাগরের উপর সজাগ দৃষ্টি রাখা এক নেটওয়ার্কের সাথে যোগ দিন, ঝুঁকি শেয়ার করুন।';

  @override
  String get onboarding3Title => 'প্রস্তুতি এখন\nআপনার হাতের মুঠোয়';

  @override
  String get onboarding3Description =>
      'ঝুঁকিগুলোর রিপোর্ট করুন, গুরুত্বপূর্ণ অ্যালার্টগুলো পান এবং সময় ফুরিয়ে যাওয়ার আগেই জানুন।';

  @override
  String get skip => 'এড়িয়ে যান';

  @override
  String get splashTitle => 'সিভিল অ্যালার্ট';

  @override
  String get splashSubtitle => 'নিখুঁত ঝুঁকি শনাক্তকরণ';

  @override
  String get hiWelcome => 'হ্যালো, স্বাগতম 👋';

  @override
  String get togetherForOceanSafety =>
      'সমুদ্র সুরক্ষার জন্য\nএকত্রিত হই,\nশক্তিশালী হই';

  @override
  String get seeUpdates => 'আপডেটস দেখুন';

  @override
  String get unusualActivity => 'রিপোর্টস';

  @override
  String get seeAll => 'সব দেখুন';

  @override
  String get filterNow => 'এখন';

  @override
  String get filterLastWeek => 'গত সপ্তাহে';

  @override
  String get filterLastMonth => 'গত মাসে';

  @override
  String get locationServicesOffTitle => 'লোকেশন সার্ভিস অফ আছে';

  @override
  String get enableLocationServicesForReporting =>
      'হ্যাজার্ড রিপোর্ট করতে লোকেশন সার্ভিস (GPS) অন করুন।';

  @override
  String get enableLocationServicesForCurrentLocation =>
      'আপনার বর্তমান জায়গা দেখতে GPS অন করুন।';

  @override
  String get permissionRequiredTitle => 'অনুমতি প্রয়োজন';

  @override
  String get locationPermissionDeniedAllowInSettings =>
      'লোকেশন পারমিশন দেওয়া হয়নি। সেটিংসে গিয়ে অনুমতি দিন।';

  @override
  String get locationPermissionDeniedAllowForCurrentLocation =>
      'বর্তমান লোকেশন দেখতে পারমিশন দিন।';

  @override
  String get locationPermissionBlockedEnableInSettings =>
      'লোকেশন পারমিশন ব্লক করা আছে।';

  @override
  String get locationPermissionPermanentlyDeniedForReporting =>
      'লোকেশন পারমিশন স্থায়ীভাবে ব্লক করা আছে।';

  @override
  String get locationPermissionPermanentlyDeniedForCurrentLocation =>
      'বর্তমান লোকেশন দেখতে পারমিশন ব্লক করা আছে।';

  @override
  String get cancel => 'বাতিল করুন';

  @override
  String get notNow => 'এখন নয়';

  @override
  String get openSettings => 'সেটিংস খুলুন';

  @override
  String errorGettingLocationWithError(Object error) {
    return 'Error getting location: $error';
  }

  @override
  String get gettingLocation => 'লোকেশন নেওয়া হচ্ছে...';

  @override
  String get gettingYourLocation => 'আপনার লোকেশন নেওয়া হচ্ছে...';

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
      'অডিও রেকর্ড হচ্ছে… থামাতে আবার ট্যাপ করুন।';

  @override
  String errorStartingAudioWithError(Object error) {
    return 'Error starting audio: $error';
  }

  @override
  String get pleaseSelectHazardType => 'একটি হ্যাজার্ডের ধরন নির্বাচন করুন';

  @override
  String get pleaseDescribeSituation => 'অনুগ্রহ করে পরিস্থিতি বর্ণনা করুন';

  @override
  String get waitingForLocation => 'লোকেশনর জন্য অপেক্ষা করা হচ্ছে...';

  @override
  String get pleaseEnterPeopleAtRisk =>
      'ঝুঁকিপূর্ণ লোকজনের সংখ্যা অনুমান করে লিখুন';

  @override
  String get noInternetReportQueued =>
      'ইন্টারনেট সংযোগ নেই। রিপোর্ট পরে পাঠানো হবে।';

  @override
  String get profileNeededTitle => 'প্রোফাইল প্রয়োজন';

  @override
  String get profileNeededBody => 'রিপোর্ট জমা দেওয়ার আগে ফোন নম্বর যোগ করুন।';

  @override
  String get addNow => 'এখন যোগ করুন';

  @override
  String get reportSavedMediaUploadFailedRetry =>
      'রিপোর্ট সেভ হয়েছে! মিডিয়া আপলোড ব্যর্থ হয়েছে, পরে আবার চেষ্টা করা হবে।';

  @override
  String get reportSubmittedSuccessfully =>
      'রিপোর্ট সফলভাবে জমা দেওয়া হয়েছে! 🎉';

  @override
  String errorWithError(Object error) {
    return 'Error: $error';
  }

  @override
  String get retryGps => 'GPS পুনরায় চেষ্টা করুন';

  @override
  String get reportHazard => 'রিস্ক রিপোর্ট করুন';

  @override
  String get whatAreYouSeeing => 'আপনি কী দেখছেন?';

  @override
  String get reportHelpsKeepSafe =>
      'আপনার রিপোর্ট সবাইকে সুরক্ষিত রাখতে সাহায্য করে';

  @override
  String get hazardTypeRequired => 'হ্যাজার্ডের ধরন *';

  @override
  String get descriptionRequired => 'বিবরণ *';

  @override
  String get describeWhatYouSeeHint => 'আপনি কী দেখছেন তা বর্ণনা করুন...';

  @override
  String get location => 'লোকেশন';

  @override
  String get time => 'সময়';

  @override
  String get addMediaOptional => 'মিডিয়া যুক্ত করুন (ঐচ্ছিক)';

  @override
  String get camera => 'ক্যামেরা';

  @override
  String get record => 'রেকর্ড';

  @override
  String get recordAudio => 'অডিও রেকর্ড করুন';

  @override
  String get stopAudio => 'অডিও থামান';

  @override
  String get highRiskSituation => 'উচ্চ ঝুঁকির পরিস্থিতি';

  @override
  String get peopleAtRiskEstimate => 'ঝুঁকিপূর্ণ লোকজনের সংখ্যা (অনুমান)';

  @override
  String get urgencyLow => 'কম';

  @override
  String get urgencyMedium => 'মাঝারি';

  @override
  String get urgencyHigh => 'বেশি';

  @override
  String get submitReport => 'রিপোর্ট জমা দিন';

  @override
  String get close => 'বন্ধ করুন';

  @override
  String get moreDetails => 'আরও বিস্তারিত';

  @override
  String get hazardHighWaves => 'উঁচু ঢেউ';

  @override
  String get hazardTsunami => 'সুনামি';

  @override
  String get hazardStorm => 'ঝড়';

  @override
  String get hazardFlood => 'বন্যা';

  @override
  String get hazardOther => 'অন্যান্য';

  @override
  String get homeTab => 'হোম';

  @override
  String get mapTab => 'ম্যাপ';

  @override
  String get updatesTab => 'আপডেটস';

  @override
  String get profileTab => 'রিপোর্টস';

  @override
  String get liveNews => 'সরাসরি খবর';

  @override
  String get sampleHazardHeadline => 'প্যাসিফিক উপকূলে উঁচু ঢেউ';

  @override
  String get sampleDate => 'রবি, ১১ জুন ২০২৪';

  @override
  String get sampleTimeAgo => '৩ মিনিট আগে';

  @override
  String get queuedReportStuck => 'আটকে আছে';

  @override
  String get queuedReportPendingUpload => 'আপলোডের অপেক্ষায়';

  @override
  String get queuedReportReadyToRetry => 'পুনরায় চেষ্টা করতে প্রস্তুত';

  @override
  String get queuedReportWaitingForRetry => 'পুনরায় চেষ্টার অপেক্ষায়';

  @override
  String get removeQueuedReportTitle => 'অপেক্ষমাণ রিপোর্ট মুছে ফেলবেন?';

  @override
  String get removeQueuedReportContent =>
      'এটি অফলাইন কপি মুছে ফেলবে এবং পুনরায় চেষ্টা বন্ধ হবে।';

  @override
  String get queuedReportRemoved => 'অপেক্ষমাণ রিপোর্ট সরানো হয়েছে';

  @override
  String get themeLight => 'হালকা';

  @override
  String get themeDark => 'গাঢ়';

  @override
  String get themeSystem => 'সিস্টেম';

  @override
  String get notifications => 'বিজ্ঞপ্তি';

  @override
  String get logOutTitle => 'লগ আউট করবেন?';

  @override
  String get logOut => 'লগ আউট';

  @override
  String get similarReportExists =>
      'কাছাকাছি অনুরূপ রিপোর্ট আছে। আমরা আপনারটি এর সাথে যুক্ত করেছি।';

  @override
  String get sendingReportsTooQuickly =>
      'আপনি খুব দ্রুত রিপোর্ট পাঠাচ্ছেন। ৩০ সেকেন্ড অপেক্ষা করুন।';

  @override
  String get hourlyReportLimitReached =>
      'ঘণ্টায় রিপোর্ট করার সীমা শেষ। পরে আবার চেষ্টা করুন।';

  @override
  String get couldNotOpenMaps => 'ম্যাপ খোলা যায়নি';

  @override
  String get navigate => 'নেভিগেট করুন';

  @override
  String get reportDetailsNotAvailable => 'রিপোর্টের বিস্তারিত তথ্য এখনও আসেনি';

  @override
  String get viewQueue => 'কিউ দেখুন';

  @override
  String get achievements => 'অর্জন';

  @override
  String get leaderboard => 'লিডারবোর্ড';

  @override
  String get chooseFromGallery => 'গ্যালারি থেকে বাছুন';

  @override
  String get downloadOfflineRegion => 'অফলাইন এলাকা ডাউনলোড করুন';

  @override
  String get radius => 'ব্যাসার্ধ';

  @override
  String get download => 'ডাউনলোড';

  @override
  String get deleteRegionTitle => 'এলাকা মুছে ফেলবেন?';

  @override
  String deleteRegionContent(Object name, Object count) {
    return '\"$name\" এবং এর $count টি ক্যাশ করা টাইল মুছে ফেলবেন?';
  }

  @override
  String get delete => 'মুছে ফেলুন';

  @override
  String get media => 'মিডিয়া';

  @override
  String get failedToLoadImage => 'ছবি লোড করা যায়নি';

  @override
  String get unsupportedMediaType => 'সমর্থিত নয় এমন মিডিয়া ধরণ';

  @override
  String get noVerifiedRiskZones =>
      'এই এলাকায় এখনও কোন যাচাইকৃত ঝুঁকিপূর্ণ স্থান নেই।';

  @override
  String get filterAllHazards => 'সব হ্যাজার্ড';

  @override
  String get filterRipCurrent => 'রিপ কারেন্ট';

  @override
  String get filterPollution => 'দূষণ';

  @override
  String get filterEarthquake => 'ভূমিকম্প';

  @override
  String get mobileNumberHint => '12345 67890';

  @override
  String distanceInKm(Object r) {
    return '$r কি.মি.';
  }

  @override
  String get filterCommunity => 'কমিউনিটি';

  @override
  String get filterMySubmitted => 'আমার জমা দেওয়া';

  @override
  String get noReportsYet => 'এখনো কোনো রিপোর্ট নেই';

  @override
  String get noSubmittedReportsYet => 'এখনো কোনো রিপোর্ট জমা দেওয়া হয়নি';

  @override
  String failedToLoadAdvisory(String error) {
    return 'Failed to load advisory: $error';
  }

  @override
  String get advisoryNotFound => 'পরামর্শ পাওয়া যায়নি.';

  @override
  String distanceKmAway(String km) {
    return '$km km away';
  }

  @override
  String distanceMAway(String m) {
    return '$m মি দূরে';
  }

  @override
  String get low => 'কম';

  @override
  String get justNow => 'এইমাত্র';

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
  String get leaderboardTitle => 'লিডারবোর্ড';

  @override
  String error(String errorMsg) {
    return 'ত্রুটি: $errorMsg';
  }

  @override
  String get noLeaderboardData => 'এখনও কোনো লিডারবোর্ড ডেটা নেই';

  @override
  String get startReportingToClimb => 'পদে আরোহণ রিপোর্টিং শুরু করুন!';

  @override
  String pointsAbbrev(int points) {
    return '$points pts';
  }

  @override
  String reportCountDesc(int count) {
    return '$count reports';
  }

  @override
  String get you => 'আপনি';

  @override
  String get achievementsTitle => 'অর্জন';

  @override
  String get earnedBadges => 'অর্জিত ব্যাজ';

  @override
  String get lockedBadges => 'লক করা ব্যাজ';

  @override
  String get pointsHistory => 'পয়েন্ট ইতিহাস';

  @override
  String get totalPoints => 'মোট পয়েন্ট';

  @override
  String get verified => 'যাচাই করা হয়েছে';

  @override
  String get rate => 'হার';

  @override
  String get badges => 'ব্যাজ';

  @override
  String get submitFirstReportBadge =>
      'একটি ব্যাজ অর্জন করতে আপনার প্রথম প্রতিবেদন জমা দিন!';

  @override
  String get allBadgesEarned => '🎉 সমস্ত ব্যাজ অর্জিত!';

  @override
  String get noPointsHistoryYet => 'এখনও কোন পয়েন্ট ইতিহাস';

  @override
  String get earned => '✅ অর্জিত!';

  @override
  String get notYetEarned => '🔒 এখনো আয় হয়নি';

  @override
  String get ok => 'ঠিক আছে';

  @override
  String get filterAllUrgencies => 'সমস্ত জরুরী';

  @override
  String get filtersTitle => 'ফিল্টার';

  @override
  String get timeRangeTitle => 'সময় পরিসীমা';

  @override
  String get twentyFourHours => '24 ঘন্টা';

  @override
  String daysNumber(int days) {
    return '$days days';
  }

  @override
  String get showRiskZonesTitle => 'রিস্ক জোন দেখান';

  @override
  String get displayHazardHotspots => 'বিপজ্জনক হটস্পট প্রদর্শন করুন';

  @override
  String get highRiskOnlyTitle => 'শুধুমাত্র উচ্চ ঝুঁকি';

  @override
  String get showOnlyCriticalReports => 'শুধুমাত্র সমালোচনামূলক রিপোর্ট দেখান';

  @override
  String get mediaViewerTitle => 'মিডিয়া ভিউয়ার';

  @override
  String mediaViewerError(String error) {
    return 'Failed to load media: $error';
  }

  @override
  String get loadingText => 'লোড হচ্ছে...';

  @override
  String urgencyLevelText(String level) {
    return '$level Urgency';
  }

  @override
  String get highRiskBadge => 'উচ্চ ঝুঁকি';

  @override
  String get mediaTitle => 'মিডিয়া';

  @override
  String get playLabel => 'খেলা';

  @override
  String get pauseLabel => 'বিরতি';

  @override
  String get notificationsTitle => 'বিজ্ঞপ্তি';

  @override
  String reportStatusTitle(String status) {
    return 'Report $status';
  }

  @override
  String reportStatusBody(String hazardType, String status) {
    return 'Your $hazardType report has been $status.';
  }

  @override
  String get noNotificationsYet => 'এখনও কোন বিজ্ঞপ্তি নেই';

  @override
  String get downloadOfflineRegionTitle => 'অফলাইন অঞ্চল ডাউনলোড করুন';

  @override
  String get downloadOfflineRegionDesc =>
      'অফলাইন ব্যবহারের জন্য আপনার বর্তমান অবস্থানের চারপাশে মানচিত্র টাইলস ডাউনলোড করে।';

  @override
  String get regionNameLabel => 'অঞ্চলের নাম';

  @override
  String get radiusLabel => 'ব্যাসার্ধ';

  @override
  String get cancelLabel => 'বাতিল করুন';

  @override
  String get downloadLabel => 'ডাউনলোড করুন';

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
  String get deleteLabel => 'মুছে দিন';

  @override
  String get offlineMapsTitle => 'অফলাইন মানচিত্র';

  @override
  String get downloadingTiles => 'টাইলস ডাউনলোড হচ্ছে...';

  @override
  String get offlineMapInfoDesc =>
      'আপনি অনলাইনে দেখেন মানচিত্র টাইলগুলি অফলাইনে ব্যবহারের জন্য স্বয়ংক্রিয়ভাবে ক্যাশ করা হয়৷সম্পূর্ণ অফলাইন কভারেজের জন্য অঞ্চলগুলি ডাউনলোড করুন।';

  @override
  String get noOfflineRegionsYet => 'এখনও কোনো অফলাইন অঞ্চল নেই৷';

  @override
  String get tapToDownloadRegion => 'একটি অঞ্চল ডাউনলোড করতে + আলতো চাপুন';

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
      'পুনঃপ্রচেষ্টার স্থিতি, ত্রুটির কারণ পর্যালোচনা করুন এবং এখানে আটকে থাকা আইটেমগুলি সরান৷';

  @override
  String get duplicateReportDetected =>
      'অনুরূপ রিপোর্ট ইতিমধ্যে কাছাকাছি বিদ্যমান আছে.আমরা এটি আপনার জমা লিঙ্ক.';

  @override
  String get uploadTimelineCompleted =>
      'আপনার আপলোড টাইমলাইন সম্পূর্ণ এবং সংরক্ষিত হয়েছে.';

  @override
  String get doneLabel => 'সম্পন্ন';

  @override
  String get rateLimitMinInterval =>
      'আপনি খুব দ্রুত রিপোর্ট পাঠাচ্ছেন.অনুগ্রহ করে 30 সেকেন্ড অপেক্ষা করুন এবং আবার চেষ্টা করুন।';

  @override
  String get rateLimitHourly =>
      'ঘন্টায় রিপোর্ট সীমা পৌঁছেছে.পরে আবার চেষ্টা করুন.';

  @override
  String get uploadingReportTitle => 'আপনার রিপোর্ট আপলোড করা হচ্ছে';

  @override
  String get preparingReportDesc => 'প্রতিবেদনের বিবরণ প্রস্তুত করা হচ্ছে';

  @override
  String get reportDetailsUploaded => 'রিপোর্ট বিশদ আপলোড করা হয়েছে';

  @override
  String get duplicateReportLinked =>
      'ডুপ্লিকেট রিপোর্ট শনাক্ত করা হয়েছে, বিদ্যমান রিপোর্টের সাথে লিঙ্ক করা হয়েছে';

  @override
  String uploadedAttachmentCounter(int current, int total) {
    return 'Uploaded attachment $current/$total';
  }

  @override
  String get uploadingMedia => 'মিডিয়া আপলোড করা হচ্ছে';

  @override
  String get mediaUploadFailedQueued =>
      'মিডিয়া আপলোড ব্যর্থ হয়েছে, আবার চেষ্টা করার জন্য সারিবদ্ধ৷';

  @override
  String get finalizingReport => 'প্রতিবেদন চূড়ান্ত করা';

  @override
  String get pleaseWaitBeforeSending => 'অন্য রিপোর্ট পাঠানোর আগে অপেক্ষা করুন';

  @override
  String get hourlyReportLimitTitle => 'ঘন্টায় রিপোর্ট সীমা পৌঁছেছে';

  @override
  String uploadFailedError(String error) {
    return 'Upload failed: $error';
  }

  @override
  String get openQueueToReview =>
      'পুনরায় চেষ্টা করার স্থিতি, ত্রুটির কারণ পর্যালোচনা করতে এবং আটকে থাকা আইটেমগুলি সরাতে সারি খুলুন৷';

  @override
  String get arcAbbr => 'এআরসি';

  @override
  String get arcFull => 'সতর্কতা • রিপোর্ট • সমন্বয়';

  @override
  String failedToTakePhoto(String error) {
    return 'Failed to take photo: $error';
  }

  @override
  String failedToPickPhoto(String error) {
    return 'Failed to pick photo: $error';
  }

  @override
  String get syncingQueuedReports => 'সারিবদ্ধ রিপোর্ট সিঙ্ক করা হচ্ছে';

  @override
  String preparingPendingReports(int count) {
    return 'Preparing $count pending report(s)';
  }

  @override
  String uploadingReportCount(int current, int total) {
    return 'Uploading report $current of $total';
  }

  @override
  String get uploadingAttachments => 'সংযুক্তি আপলোড করা হচ্ছে';

  @override
  String get reportUpdateTitle => 'রিপোর্ট আপডেট';

  @override
  String get aboutTransparencyBody =>
      'এই অ্যাপটি নাগরিকদের সমুদ্রের বিপদগুলি রিপোর্ট করতে সাহায্য করে এবং কর্তৃপক্ষকে রিয়েল-টাইম পরিস্থিতি বুঝতে সাহায্য করে।\n\nআমরা ব্যক্তিগত তথ্যের সর্বজনীন প্রকাশ সীমাবদ্ধ করে এবং সর্বজনীন মতামতের জন্য গোপনীয়তা-নিরাপদ ম্যাপ ডেটা ব্যবহার করে গোপনীয়তাকে অগ্রাধিকার দিই।';

  @override
  String get privacyBody =>
      'আমরা যা সংগ্রহ করি: আপনার ফোন (লগইন করার জন্য), আপনার রিপোর্টের বিবরণ, সময় এবং অবস্থান।\n\nআমরা এটি কীভাবে ব্যবহার করি: আপনার রিপোর্ট সংরক্ষণ করতে এবং ম্যাপ ও আপডেট ফিডে যাচাইকৃত, গোপনীয়তা-নিরাপদ তথ্য দেখাতে।';

  @override
  String get reportSubmittedReason => 'রিপোর্ট জমা দেওয়া হয়েছে';

  @override
  String get reportVerifiedReason => 'রিপোর্টের সত্যতা যাচাই করা হয়েছে';

  @override
  String get highRiskVerifiedReason =>
      'উচ্চ-ঝুঁকির রিপোর্টের সত্যতা যাচাই করা হয়েছে';

  @override
  String get reportRejectedReason => 'রিপোর্ট প্রত্যাখ্যাত';

  @override
  String get achievementsAndBadges => 'অর্জন এবং ব্যাজ';

  @override
  String get offlineMaps => 'অফলাইন ম্যাপস';
}
