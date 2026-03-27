// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Marathi (`mr`).
class AppLocalizationsMr extends AppLocalizations {
  AppLocalizationsMr([String locale = 'mr']) : super(locale);

  @override
  String get appTitle => 'सिव्हिल अलर्ट सिस्टीम';

  @override
  String get profile => 'प्रोफाइल';

  @override
  String get profileAndReports => 'अहवाल';

  @override
  String get edit => 'संपादित करा';

  @override
  String get user => 'वापरकर्ता';

  @override
  String get phoneNotSet => 'फोन नंबर सेट केलेला नाही';

  @override
  String get syncNow => 'आता सिंक करा';

  @override
  String get nothingToSync => 'सिंक करण्यासाठी काहीही नाही';

  @override
  String syncDone(Object succeeded, Object failed) {
    return 'सिंक पूर्ण झाले: $succeeded यशस्वी, $failed अयशस्वी';
  }

  @override
  String get offlineReports => 'ऑफलाइन अहवाल';

  @override
  String get noPendingReports => 'कोणतेही प्रलंबित अहवाल नाहीत';

  @override
  String attemptsLabel(Object count) {
    return 'प्रयत्न: $count';
  }

  @override
  String get retry => 'पुन्हा प्रयत्न करा';

  @override
  String get remove => 'काढून टाका';

  @override
  String get myReports => 'माझे अहवाल';

  @override
  String get noUploadedReportsYet => 'अद्याप कोणतेही अहवाल अपलोड केलेले नाहीत';

  @override
  String get failedToLoadReports => 'अहवाल लोड करण्यात अयशस्वी';

  @override
  String get youreOffline => 'तुम्ही ऑफलाइन आहात';

  @override
  String get connectToInternetToLoadMyReports =>
      'माझे अहवाल पाहण्यासाठी इंटरनेटशी कनेक्ट करा.';

  @override
  String get settings => 'सेटिंग्ज';

  @override
  String get helpFaq => 'मदत / FAQ';

  @override
  String get aboutTransparency => 'माहिती आणि पारदर्शकता';

  @override
  String get language => 'भाषा';

  @override
  String get privacyControls => 'भाषा आणि प्रायव्हसी नियंत्रणे';

  @override
  String get privacy => 'प्रायव्हसी';

  @override
  String get chooseLanguage => 'भाषा निवडा';

  @override
  String get save => 'सेव्ह करा';

  @override
  String get continueLabel => 'पुढे जा';

  @override
  String get languageComingSoon => 'ही भाषा लवकरच येत आहे.';

  @override
  String get updates => 'अपडेट्स';

  @override
  String pendingCount(Object count) {
    return '$count प्रलंबित';
  }

  @override
  String get noUpdatesYet => 'अद्याप कोणतेही अपडेट नाही';

  @override
  String get failedToLoadUpdates => 'अपडेट लोड करण्यात अयशस्वी';

  @override
  String get helpTitle => 'मदत / FAQ';

  @override
  String get aboutTitle => 'माहिती आणि पारदर्शकता';

  @override
  String get privacyTitle => 'प्रायव्हसी नियंत्रणे';

  @override
  String get privacyReducePrecisionTitle => 'नकाशा लोकेशन अचूकता कमी करा';

  @override
  String get privacyReducePrecisionSubtitle =>
      'सक्षम केल्यास, तुमचे रिपोर्ट मेकर नकाशावर कमी अचूकतेसह दर्शविले जातील.';

  @override
  String get faqQ1 => 'मी धोक्याची नोंद कशी करू?';

  @override
  String get faqA1 =>
      'अहवाल उघडा, तुम्हाला काय दिसत आहे ते वर्णन करा आणि सबमिट करा.';

  @override
  String get faqQ2 => 'मी गॅलरीतून का अपलोड करू शकत नाही?';

  @override
  String get faqA2 =>
      'अहवाल विश्वासार्ह ठेवण्यासाठी, हे अ‍ॅप केवळ थेट कॅप्चर (कॅमेरा/रेकॉर्डिंग) ला परवानगी देते.';

  @override
  String get faqQ3 => 'माझे लोकेशन कशासाठी वापरले जाते?';

  @override
  String get faqA3 =>
      'धोके कोठे घडत आहेत हे समजून घेण्यासाठी मदतीला तुमचे लोकेशन उपयुक्त आहे.';

  @override
  String get loginTitle => 'लॉग-इन / साइन-अप';

  @override
  String get signUpWithMobile => 'तुमच्या नोंदणीकृत मोबाईल नंबरने साइन-अप करा';

  @override
  String get otpIntro => 'तुमचा नंबर पडताळण्यासाठी आम्ही तुम्हाला एक OTP पाठवू';

  @override
  String get mobileNumberLabel => 'मोबाईल नंबर *';

  @override
  String get sendingLabel => 'पाठवत आहे...';

  @override
  String get sendOtp => 'OTP पाठवा';

  @override
  String get failedToSendOtp => 'OTP पाठवण्यात अयशस्वी.';

  @override
  String get checkSupabasePhoneConfig => 'सुपरबेस चेक करा.';

  @override
  String get enterOtp => 'OTP प्रविष्ट करा';

  @override
  String sentToNumber(Object mobileNumber) {
    return 'Sent to $mobileNumber';
  }

  @override
  String get pleaseEnter6DigitOtp => 'कृपया ६ अंकी OTP टाका';

  @override
  String get otpVerificationFailed => 'OTP पडताळणी अयशस्वी.';

  @override
  String signInFailedWithError(Object error) {
    return 'Sign-in failed: $error';
  }

  @override
  String get didntReceiveOtp => 'OTP मिळाला नाही? ';

  @override
  String get otpResentSuccessfully => 'OTP यशस्वीरित्या पुन्हा पाठवला';

  @override
  String failedToResendOtpWithError(Object error) {
    return 'Failed to resend OTP: $error';
  }

  @override
  String get resendWithTimer => 'पुन्हा पाठवा (00:30)';

  @override
  String get savingLabel => 'सेव्ह करत आहे...';

  @override
  String get signedInSuccessfully => 'तुमचे यशस्वीरित्या\nलॉग-इन झाले आहे';

  @override
  String get directingToDashboard =>
      'कृपया प्रतीक्षा करा, आम्ही तुम्हाला डॅशबोर्डवर घेऊन जात आहोत...';

  @override
  String get whatsYourName => 'तुमचे नाव काय आहे?';

  @override
  String get personalizeExperience =>
      'तुमचा अनुभव वैयक्तिकृत करण्यासाठी आम्हाला मदत करा';

  @override
  String get enterYourName => 'तुमचे नाव टाका';

  @override
  String get pleaseEnterValidName => 'कृपया एक वैध नाव टाका (किमान २ अक्षरे)';

  @override
  String get onboarding1Title => 'आपत्तीच्या वेळी\nतुमचा विश्वासू साथी';

  @override
  String get onboarding1Description =>
      'रिअल-टाइम अलर्ट मिळवा आणि समुद्रातील धोक्याची माहिती त्वरीत नोंदवून सुरक्षेत योगदान द्या.';

  @override
  String get onboarding2Title => 'सुरक्षितता वाढवूया,\nपावलापावलाने';

  @override
  String get onboarding2Description =>
      'समुद्रावर लक्ष ठेवणाऱ्या जागरूक लोकांच्या समुदायात सामील व्हा आणि धोक्याची माहिती शेअर करा.';

  @override
  String get onboarding3Title => 'तयारी आता\nतुमच्या बोटांच्या टोकावर';

  @override
  String get onboarding3Description =>
      'धोक्यांची नोंद करा, महत्त्वाचे अलर्ट्स मिळवा आणि वेळेपूर्वी माहिती करून घ्या.';

  @override
  String get skip => 'पुढे चला';

  @override
  String get splashTitle => 'सिव्हिल अलर्ट';

  @override
  String get splashSubtitle => 'अचूक धोका ओळख';

  @override
  String get hiWelcome => 'नमस्कार, स्वागत आहे 👋';

  @override
  String get togetherForOceanSafety =>
      'समुद्र सुरक्षेसाठी\nएकत्र येऊया,\nमजबूत होऊया';

  @override
  String get seeUpdates => 'अपडेट्स पाहा';

  @override
  String get unusualActivity => 'अहवाल';

  @override
  String get seeAll => 'सर्व पाहा';

  @override
  String get filterNow => 'आता';

  @override
  String get filterLastWeek => 'गेल्या आठवड्यात';

  @override
  String get filterLastMonth => 'गेल्या महिन्यात';

  @override
  String get locationServicesOffTitle => 'लोकेशन सर्व्हिस बंद आहे';

  @override
  String get enableLocationServicesForReporting =>
      'धोक्याची नोंद करण्यासाठी कृपया लोकेशन सर्व्हिसेस (GPS) सुरु करा.';

  @override
  String get enableLocationServicesForCurrentLocation =>
      'तुमचे सध्याचे लोकेशन बघण्यासाठी GPS सुरु करा.';

  @override
  String get permissionRequiredTitle => 'परवानगी आवश्यक';

  @override
  String get locationPermissionDeniedAllowInSettings =>
      'लोकेशन परवानगी नाकारली गेली आहे. सेटिंग्समध्ये परवानगी द्या.';

  @override
  String get locationPermissionDeniedAllowForCurrentLocation =>
      'लोकेशन परवानगी नाकारली गेली आहे. सध्याच्या लोकेशनसाठी परवानगी द्या.';

  @override
  String get locationPermissionBlockedEnableInSettings =>
      'लोकेशन परवानगी ब्लॉक केली आहे. अ‍ॅप सेटिंग्समध्ये जाऊन ती सुरु करा.';

  @override
  String get locationPermissionPermanentlyDeniedForReporting =>
      'लोकेशन परवानगी कायमची नाकारली गेली आहे.';

  @override
  String get locationPermissionPermanentlyDeniedForCurrentLocation =>
      'लोकेशन परवानगी कायमची नाकारली गेली आहे. सध्याचे लोकेशन पाहण्यासाठी सेटिंग्स सुरु करा.';

  @override
  String get cancel => 'रद्द करा';

  @override
  String get notNow => 'आता नको';

  @override
  String get openSettings => 'सेटिंग्ज उघडा';

  @override
  String errorGettingLocationWithError(Object error) {
    return 'Error getting location: $error';
  }

  @override
  String get gettingLocation => 'लोकेशन घेत आहे...';

  @override
  String get gettingYourLocation => 'तुमचे लोकेशन घेत आहे...';

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
      'ऑडिओ रेकॉर्डिंग सुरू आहे... थांबवण्यासाठी पुन्हा टॅप करा.';

  @override
  String errorStartingAudioWithError(Object error) {
    return 'Error starting audio: $error';
  }

  @override
  String get pleaseSelectHazardType => 'कृपया धोक्याचा प्रकार निवडा';

  @override
  String get pleaseDescribeSituation => 'कृपया परिस्थितीचे वर्णन करा';

  @override
  String get waitingForLocation => 'लोकेशनची वाट पाहत आहे...';

  @override
  String get pleaseEnterPeopleAtRisk => 'धोक्यात असलेल्या लोकांचा अंदाज नोंदवा';

  @override
  String get noInternetReportQueued =>
      'इंटरनेट कनेक्शन नाही. तुमचा अहवाल रांगेत सेव्ह केला जाईल.';

  @override
  String get profileNeededTitle => 'प्रोफाइल आवश्यक आहे';

  @override
  String get profileNeededBody =>
      'अहवाल सबमिट करण्यापूर्वी कृपया तुमचा मोबाईल नंबर नोंदवा.';

  @override
  String get addNow => 'आता नोंदवा';

  @override
  String get reportSavedMediaUploadFailedRetry =>
      'अहवाल सेव्ह झाला! मीडिया अपलोड अयशस्वी झाले, नंतर पुन्हा प्रयत्न केला जाईल.';

  @override
  String get reportSubmittedSuccessfully => 'अहवाल यशस्वीरित्या सबमिट झाला! 🎉';

  @override
  String errorWithError(Object error) {
    return 'Error: $error';
  }

  @override
  String get retryGps => 'GPS पुन्हा प्रयत्न करा';

  @override
  String get reportHazard => 'धोक्याची नोंद करा';

  @override
  String get whatAreYouSeeing => 'तुम्हाला काय दिसत आहे?';

  @override
  String get reportHelpsKeepSafe =>
      'तुमचा अहवाल सर्वांना सुरक्षित ठेवण्यास मदत करतो';

  @override
  String get hazardTypeRequired => 'धोक्याचा प्रकार *';

  @override
  String get descriptionRequired => 'वर्णन *';

  @override
  String get describeWhatYouSeeHint =>
      'तुम्हाला काय दिसत आहे त्याचे वर्णन करा...';

  @override
  String get location => 'लोकेशन';

  @override
  String get time => 'वेळ';

  @override
  String get addMediaOptional => 'मीडिया जोडा (पर्यायी)';

  @override
  String get camera => 'कॅमेरा';

  @override
  String get record => 'रेकॉर्ड';

  @override
  String get recordAudio => 'ऑडिओ रेकॉर्ड करा';

  @override
  String get stopAudio => 'ऑडिओ थांबवा';

  @override
  String get highRiskSituation => 'अति-धोकादायक परिस्थिती';

  @override
  String get peopleAtRiskEstimate => 'धोक्यात असलेले लोक (अंदाजित)';

  @override
  String get urgencyLow => 'कमी';

  @override
  String get urgencyMedium => 'मध्यम';

  @override
  String get urgencyHigh => 'उच्च';

  @override
  String get submitReport => 'अहवाल सबमिट करा';

  @override
  String get close => 'बंद करा';

  @override
  String get moreDetails => 'अधिक माहिती';

  @override
  String get hazardHighWaves => 'उंच लाटा';

  @override
  String get hazardTsunami => 'त्सुनामी';

  @override
  String get hazardStorm => 'वादळ';

  @override
  String get hazardFlood => 'पूर';

  @override
  String get hazardOther => 'इतर';

  @override
  String get homeTab => 'होम';

  @override
  String get mapTab => 'नकाशा';

  @override
  String get updatesTab => 'अपडेट्स';

  @override
  String get profileTab => 'अहवाल';

  @override
  String get liveNews => 'थेट बातम्या';

  @override
  String get sampleHazardHeadline => 'पॅसिफिक किनाऱ्यावर उंच लाटा';

  @override
  String get sampleDate => 'रवी, ११ जून २०२४';

  @override
  String get sampleTimeAgo => '३ मिनिटांपूर्वी';

  @override
  String get queuedReportStuck => 'अडकले';

  @override
  String get queuedReportPendingUpload => 'अपलोड प्रलंबित';

  @override
  String get queuedReportReadyToRetry => 'पुन्हा प्रयत्न करण्यास तयार';

  @override
  String get queuedReportWaitingForRetry => 'पुन्हा प्रयत्नाची प्रतीक्षा';

  @override
  String get removeQueuedReportTitle => 'रांगेत असलेला अहवाल काढायचा?';

  @override
  String get removeQueuedReportContent =>
      'हे ऑफलाइन कॉपी काढून टाकेल आणि भविष्यातील प्रयत्न थांबवेल.';

  @override
  String get queuedReportRemoved => 'रांगेत असलेला अहवाल काढला';

  @override
  String get themeLight => 'लाईट';

  @override
  String get themeDark => 'डार्क';

  @override
  String get themeSystem => 'सिस्टीम';

  @override
  String get notifications => 'सूचना';

  @override
  String get logOutTitle => 'लॉग आउट करायचे?';

  @override
  String get logOut => 'लॉग आउट';

  @override
  String get similarReportExists =>
      'जवळपास आधीपासूनच समान अहवाल आहे. आम्ही तुमचा अहवाल त्याला जोडला आहे.';

  @override
  String get sendingReportsTooQuickly =>
      'तुम्ही खूप वेगाने अहवाल पाठवत आहात. कृपया 30 सेकंद थांबा.';

  @override
  String get hourlyReportLimitReached =>
      'ताशी अहवाल मर्यादा पूर्ण झाली. कृपया नंतर प्रयत्न करा.';

  @override
  String get couldNotOpenMaps => 'नकाशा उघडू शकला नाही';

  @override
  String get navigate => 'नेव्हिगेट करा';

  @override
  String get reportDetailsNotAvailable => 'अहवालाचा तपशील अद्याप उपलब्ध नाही';

  @override
  String get viewQueue => 'रांग पहा';

  @override
  String get achievements => 'उपलब्धी';

  @override
  String get leaderboard => 'लीडरबोर्ड';

  @override
  String get chooseFromGallery => 'गॅलरीतून निवडा';

  @override
  String get downloadOfflineRegion => 'ऑफलाइन प्रदेश डाउनलोड करा';

  @override
  String get radius => 'त्रिज्या';

  @override
  String get download => 'डाउनलोड';

  @override
  String get deleteRegionTitle => 'प्रदेश हटवायचा?';

  @override
  String deleteRegionContent(Object name, Object count) {
    return '\"$name\" आणि त्याच्या $count कॅश केलेल्या टाइल्स काढून टाकायच्या?';
  }

  @override
  String get delete => 'हटवा';

  @override
  String get media => 'माध्यमे';

  @override
  String get failedToLoadImage => 'चित्र लोड करण्यात अयशस्वी';

  @override
  String get unsupportedMediaType => 'असमर्थित मीडिया प्रकार';

  @override
  String get noVerifiedRiskZones =>
      'या भागात अद्याप कोणतीही सत्यापित धोकादायक क्षेत्रे नाहीत.';

  @override
  String get filterAllHazards => 'सर्व धोके';

  @override
  String get filterRipCurrent => 'रिप करंट';

  @override
  String get filterPollution => 'प्रदूषण';

  @override
  String get filterEarthquake => 'भूकंप';

  @override
  String get mobileNumberHint => '१२३४५ ६७८९०';

  @override
  String distanceInKm(Object r) {
    return '$r किमी';
  }

  @override
  String get filterCommunity => 'समुदाय';

  @override
  String get filterMySubmitted => 'माझे सबमिट केलेले';

  @override
  String get noReportsYet => 'अद्याप कोणतेही अहवाल नाहीत';

  @override
  String get noSubmittedReportsYet => 'अद्याप कोणताही अहवाल सबमिट केलेला नाही';

  @override
  String failedToLoadAdvisory(String error) {
    return 'Failed to load advisory: $error';
  }

  @override
  String get advisoryNotFound => 'सल्लागार सापडला नाही.';

  @override
  String distanceKmAway(String km) {
    return '$km km away';
  }

  @override
  String distanceMAway(String m) {
    return '$m मी दूर';
  }

  @override
  String get low => 'कमी';

  @override
  String get justNow => 'आत्ताच';

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
  String get leaderboardTitle => 'लीडरबोर्ड';

  @override
  String error(String errorMsg) {
    return 'एरर: $errorMsg';
  }

  @override
  String get noLeaderboardData => 'अद्याप लीडरबोर्ड डेटा नाही';

  @override
  String get startReportingToClimb => 'रँक चढण्यासाठी अहवाल देणे सुरू करा!';

  @override
  String pointsAbbrev(int points) {
    return '$points pts';
  }

  @override
  String reportCountDesc(int count) {
    return '$count reports';
  }

  @override
  String get you => 'आपण';

  @override
  String get achievementsTitle => 'उपलब्धी';

  @override
  String get earnedBadges => 'मिळवलेले बॅज';

  @override
  String get lockedBadges => 'लॉक केलेले बॅज';

  @override
  String get pointsHistory => 'गुण इतिहास';

  @override
  String get totalPoints => 'एकूण गुण';

  @override
  String get verified => 'सत्यापित';

  @override
  String get rate => 'रेट करा';

  @override
  String get badges => 'बॅज';

  @override
  String get submitFirstReportBadge =>
      'बॅज मिळवण्यासाठी तुमचा पहिला अहवाल सबमिट करा!';

  @override
  String get allBadgesEarned => '🎉 सर्व बॅज मिळवले!';

  @override
  String get noPointsHistoryYet => 'अद्याप गुणांचा इतिहास नाही';

  @override
  String get earned => '✅ कमावले!';

  @override
  String get notYetEarned => '🔒 अजून कमावले नाही';

  @override
  String get ok => 'ठीक आहे';

  @override
  String get filterAllUrgencies => 'सर्व निकड';

  @override
  String get filtersTitle => 'फिल्टर';

  @override
  String get timeRangeTitle => 'वेळ श्रेणी';

  @override
  String get twentyFourHours => '24 तास';

  @override
  String daysNumber(int days) {
    return '$days days';
  }

  @override
  String get showRiskZonesTitle => 'जोखीम झोन दाखवा';

  @override
  String get displayHazardHotspots => 'धोक्याचे हॉटस्पॉट प्रदर्शित करा';

  @override
  String get highRiskOnlyTitle => 'फक्त उच्च धोका';

  @override
  String get showOnlyCriticalReports => 'फक्त गंभीर अहवाल दाखवा';

  @override
  String get mediaViewerTitle => 'मीडिया दर्शक';

  @override
  String mediaViewerError(String error) {
    return 'Failed to load media: $error';
  }

  @override
  String get loadingText => 'लोड करत आहे...';

  @override
  String urgencyLevelText(String level) {
    return '$level Urgency';
  }

  @override
  String get highRiskBadge => 'उच्च धोका';

  @override
  String get mediaTitle => 'मीडिया';

  @override
  String get playLabel => 'खेळा';

  @override
  String get pauseLabel => 'विराम द्या';

  @override
  String get notificationsTitle => 'सूचना';

  @override
  String reportStatusTitle(String status) {
    return 'Report $status';
  }

  @override
  String reportStatusBody(String hazardType, String status) {
    return 'Your $hazardType report has been $status.';
  }

  @override
  String get noNotificationsYet => 'अद्याप कोणत्याही सूचना नाहीत';

  @override
  String get downloadOfflineRegionTitle => 'ऑफलाइन प्रदेश डाउनलोड करा';

  @override
  String get downloadOfflineRegionDesc =>
      'ऑफलाइन वापरासाठी तुमच्या वर्तमान स्थानाभोवतीच्या नकाशा टाइल्स डाउनलोड करते.';

  @override
  String get regionNameLabel => 'प्रदेशाचे नाव';

  @override
  String get radiusLabel => 'त्रिज्या';

  @override
  String get cancelLabel => 'रद्द करा';

  @override
  String get downloadLabel => 'डाउनलोड करा';

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
  String get deleteLabel => 'हटवा';

  @override
  String get offlineMapsTitle => 'ऑफलाइन नकाशे';

  @override
  String get downloadingTiles => 'टाइल डाउनलोड करत आहे...';

  @override
  String get offlineMapInfoDesc =>
      'तुम्ही ऑनलाइन पाहता नकाशा टाइल्स ऑफलाइन वापरासाठी आपोआप कॅश केल्या जातात.संपूर्ण ऑफलाइन कव्हरेजसाठी प्रदेश डाउनलोड करा.';

  @override
  String get noOfflineRegionsYet => 'अद्याप कोणतेही ऑफलाइन प्रदेश नाहीत';

  @override
  String get tapToDownloadRegion => 'प्रदेश डाउनलोड करण्यासाठी + वर टॅप करा';

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
      'पुन्हा प्रयत्न स्थिती, त्रुटी कारणाचे पुनरावलोकन करा आणि अडकलेले आयटम येथे काढा.';

  @override
  String get duplicateReportDetected =>
      'तत्सम अहवाल आधीपासून जवळपास अस्तित्वात आहे.आम्ही तुमच्या सबमिशनचा दुवा जोडला आहे.';

  @override
  String get uploadTimelineCompleted =>
      'तुमची अपलोड टाइमलाइन पूर्ण झाली आणि जतन केली गेली.';

  @override
  String get doneLabel => 'झाले';

  @override
  String get rateLimitMinInterval =>
      'तुम्ही खूप लवकर अहवाल पाठवत आहात.कृपया ३० सेकंद प्रतीक्षा करा आणि पुन्हा प्रयत्न करा.';

  @override
  String get rateLimitHourly =>
      'प्रति तास अहवाल मर्यादा गाठली.कृपया नंतर पुन्हा प्रयत्न करा.';

  @override
  String get uploadingReportTitle => 'तुमचा अहवाल अपलोड करत आहे';

  @override
  String get preparingReportDesc => 'अहवाल तपशील तयार करत आहे';

  @override
  String get reportDetailsUploaded => 'अहवाल तपशील अपलोड केला';

  @override
  String get duplicateReportLinked =>
      'डुप्लिकेट अहवाल आढळला, विद्यमान अहवालाशी लिंक केला आहे';

  @override
  String uploadedAttachmentCounter(int current, int total) {
    return 'Uploaded attachment $current/$total';
  }

  @override
  String get uploadingMedia => 'मीडिया अपलोड करत आहे';

  @override
  String get mediaUploadFailedQueued =>
      'मीडिया अपलोड अयशस्वी, पुन्हा प्रयत्न करण्यासाठी रांगेत';

  @override
  String get finalizingReport => 'अंतिम अहवाल';

  @override
  String get pleaseWaitBeforeSending =>
      'कृपया दुसरा अहवाल पाठवण्यापूर्वी प्रतीक्षा करा';

  @override
  String get hourlyReportLimitTitle => 'प्रति तास अहवाल मर्यादा गाठली';

  @override
  String uploadFailedError(String error) {
    return 'Upload failed: $error';
  }

  @override
  String get openQueueToReview =>
      'पुन्हा प्रयत्न स्थितीचे पुनरावलोकन करण्यासाठी रांग उघडा, त्रुटीचे कारण आणि अडकलेले आयटम काढा.';

  @override
  String get arcAbbr => 'ARC';

  @override
  String get arcFull => 'सूचना • अहवाल • समन्वय';

  @override
  String failedToTakePhoto(String error) {
    return 'Failed to take photo: $error';
  }

  @override
  String failedToPickPhoto(String error) {
    return 'Failed to pick photo: $error';
  }

  @override
  String get syncingQueuedReports => 'रांगेतील अहवाल समक्रमित करत आहे';

  @override
  String preparingPendingReports(int count) {
    return 'Preparing $count pending report(s)';
  }

  @override
  String uploadingReportCount(int current, int total) {
    return 'Uploading report $current of $total';
  }

  @override
  String get uploadingAttachments => 'संलग्नक अपलोड करत आहे';

  @override
  String get reportUpdateTitle => 'अहवाल अद्यतन';

  @override
  String get aboutTransparencyBody =>
      'हे अॅप नागरिकांना महासागरातील धोक्यांची तक्रार करण्यास मदत करते आणि अधिकाऱ्यांना रिअल-टाइम परिस्थिती समजून घेण्यास मदत करते.\n\nआम्ही वैयक्तिक तपशीलांचे सार्वजनिक प्रदर्शन मर्यादित करून आणि सार्वजनिक दृश्यांसाठी गोपनीयता-सुरक्षित नकाशा डेटा वापरून गोपनीयतेला प्राधान्य देतो.';

  @override
  String get privacyBody =>
      'आम्ही काय जमा करतो: तुमचा फोन (लॉगिनसाठी), तुमचे अहवाल वर्णन, वेळ आणि स्थान.\n\nआम्ही त्याचा वापर कसा करतो: तुमचा अहवाल संग्रहित करण्यासाठी आणि नकाशावर आणि अपडेट फीडवर सत्यापित, गोपनीयता-सुरक्षित माहिती दर्शविण्यासाठी.';

  @override
  String get reportSubmittedReason => 'अहवाल सबमिट केला';

  @override
  String get reportVerifiedReason => 'अहवाल सत्यापित';

  @override
  String get highRiskVerifiedReason => 'उच्च-जोखीम अहवाल सत्यापित';

  @override
  String get reportRejectedReason => 'अहवाल नाकारला';

  @override
  String get achievementsAndBadges => 'उपलब्धी आणि बॅजेस';

  @override
  String get offlineMaps => 'ऑफलाइन नकाशे';

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
