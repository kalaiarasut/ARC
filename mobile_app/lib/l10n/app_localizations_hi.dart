// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Hindi (`hi`).
class AppLocalizationsHi extends AppLocalizations {
  AppLocalizationsHi([String locale = 'hi']) : super(locale);

  @override
  String get appTitle => 'सिविल अलर्ट सिस्टम';

  @override
  String get profile => 'प्रोफाइल';

  @override
  String get profileAndReports => 'रिपोर्ट्स';

  @override
  String get edit => 'संपादित करें';

  @override
  String get user => 'उपयोगकर्ता';

  @override
  String get phoneNotSet => 'फ़ोन नंबर सेट नहीं है';

  @override
  String get syncNow => 'अभी सिंक करें';

  @override
  String get nothingToSync => 'सिंक करने के लिए कुछ नहीं है';

  @override
  String syncDone(Object succeeded, Object failed) {
    return 'सिंक पूरा हुआ: $succeeded सफल, $failed असफल';
  }

  @override
  String get offlineReports => 'ऑफलाइन रिपोर्ट्स';

  @override
  String get noPendingReports => 'कोई लंबित रिपोर्ट नहीं';

  @override
  String attemptsLabel(Object count) {
    return 'प्रयास: $count';
  }

  @override
  String get retry => 'फिर प्रयास करें';

  @override
  String get remove => 'हटाएं';

  @override
  String get myReports => 'मेरी रिपोर्ट्स';

  @override
  String get noUploadedReportsYet => 'अभी तक कोई रिपोर्ट अपलोड नहीं हुई है';

  @override
  String get failedToLoadReports => 'रिपोर्ट्स लोड नहीं हो सकीं';

  @override
  String get youreOffline => 'आप ऑफलाइन हैं';

  @override
  String get connectToInternetToLoadMyReports =>
      'मेरी रिपोर्ट लोड करने के लिए इंटरनेट से कनेक्ट करें।';

  @override
  String get settings => 'सेटिंग्स';

  @override
  String get helpFaq => 'सहायता / FAQ';

  @override
  String get aboutTransparency => 'जानकारी और पारदर्शिता';

  @override
  String get language => 'भाषा';

  @override
  String get privacyControls => 'भाषा और गोपनीयता नियंत्रण';

  @override
  String get privacy => 'गोपनीयता';

  @override
  String get chooseLanguage => 'भाषा चुनें';

  @override
  String get save => 'सहेजें';

  @override
  String get continueLabel => 'जारी रखें';

  @override
  String get languageComingSoon => 'यह भाषा जल्द उपलब्ध होगी।';

  @override
  String get updates => 'अपडेट्स';

  @override
  String pendingCount(Object count) {
    return '$count लंबित';
  }

  @override
  String get noUpdatesYet => 'अभी तक कोई अपडेट नहीं';

  @override
  String get failedToLoadUpdates => 'अपडेट्स लोड नहीं हो सके';

  @override
  String get helpTitle => 'सहायता / FAQ';

  @override
  String get aboutTitle => 'जानकारी और पारदर्शिता';

  @override
  String get privacyTitle => 'गोपनीयता नियंत्रण';

  @override
  String get privacyReducePrecisionTitle => 'मानचित्र स्थान सटीकता कम करें';

  @override
  String get privacyReducePrecisionSubtitle =>
      'यदि सक्षम किया गया है, तो आपके रिपोर्ट मार्कर मानचित्र पर कम स्थान परिशुद्धता के साथ दिखाए जाते हैं।';

  @override
  String get faqQ1 => 'मैं किसी ख़तरे की रिपोर्ट कैसे करूँ?';

  @override
  String get faqA1 =>
      'रिपोर्ट खोलें, आप जो देखते हैं उसका वर्णन करें और सबमिट करें।यदि आप ऑफ़लाइन हैं, तो इसे कतारबद्ध किया जाएगा और आपके वापस ऑनलाइन आने पर अपलोड किया जाएगा।';

  @override
  String get faqQ2 => 'मैं गैलरी से अपलोड क्यों नहीं कर सकता?';

  @override
  String get faqA2 =>
      'रिपोर्ट को विश्वसनीय बनाए रखने के लिए, ऐप केवल लाइव कैप्चर (कैमरा/रिकॉर्डिंग) की अनुमति देता है इसलिए पुराने मीडिया को अपलोड नहीं किया जा सकता है।';

  @override
  String get faqQ3 => 'मेरे स्थान का उपयोग कैसे किया जाता है?';

  @override
  String get faqA3 =>
      'आपका स्थान उत्तरदाताओं को यह समझने में मदद करता है कि खतरे कहाँ हो रहे हैं।सार्वजनिक देखने के लिए, स्थानों को कम सटीकता के साथ दिखाया जा सकता है।';

  @override
  String get loginTitle => 'लॉग इन / साइन अप';

  @override
  String get signUpWithMobile => 'अपने पंजीकृत मोबाइल नंबर से साइन अप करें';

  @override
  String get otpIntro => 'आपके नंबर की पुष्टि के लिए हम OTP भेजेंगे';

  @override
  String get mobileNumberLabel => 'मोबाइल नंबर *';

  @override
  String get sendingLabel => 'भेजा जा रहा है...';

  @override
  String get sendOtp => 'OTP भेजें';

  @override
  String get failedToSendOtp => 'ओटीपी भेजने में विफल.';

  @override
  String get checkSupabasePhoneConfig =>
      'सुपाबेस की जाँच करें: प्रमाणीकरण → प्रदाता → फ़ोन (सक्षम) और एसएमएस प्रदाता कॉन्फ़िगर (ट्विलियो)।';

  @override
  String get enterOtp => 'OTP दर्ज करें';

  @override
  String sentToNumber(Object mobileNumber) {
    return 'Sent to $mobileNumber';
  }

  @override
  String get pleaseEnter6DigitOtp => 'कृपया 6 अंकों का OTP दर्ज करें';

  @override
  String get otpVerificationFailed => 'ओटीपी सत्यापन विफल रहा.';

  @override
  String signInFailedWithError(Object error) {
    return 'Sign-in failed: $error';
  }

  @override
  String get didntReceiveOtp => 'OTP नहीं मिला? ';

  @override
  String get otpResentSuccessfully => 'ओटीपी सफलतापूर्वक पुनः भेजा गया';

  @override
  String failedToResendOtpWithError(Object error) {
    return 'Failed to resend OTP: $error';
  }

  @override
  String get resendWithTimer => 'फिर भेजें (00:30)';

  @override
  String get savingLabel => 'सहेजा जा रहा है...';

  @override
  String get signedInSuccessfully => 'आप सफलतापूर्वक\nलॉग इन हो गए';

  @override
  String get directingToDashboard =>
      'कृपया प्रतीक्षा करें जब तक हम आपको डैशबोर्ड पर निर्देशित कर रहे हैं...';

  @override
  String get whatsYourName => 'आपका नाम क्या है?';

  @override
  String get personalizeExperience =>
      'अपने अनुभव को वैयक्तिकृत करने में हमारी सहायता करें';

  @override
  String get enterYourName => 'अपना नाम दर्ज करें';

  @override
  String get pleaseEnterValidName =>
      'कृपया एक वैध नाम दर्ज करें (कम से कम 2 अक्षर)';

  @override
  String get onboarding1Title => 'आपदा के समय\nआपका भरोसेमंद साथी';

  @override
  String get onboarding1Description =>
      'वास्तविक समय अलर्ट प्राप्त करें और समुद्री खतरों के घटित होने पर उनकी रिपोर्ट करके सुरक्षा में योगदान करें।';

  @override
  String get onboarding2Title => 'सुरक्षा को मजबूत बनाएं,\nकदम दर कदम';

  @override
  String get onboarding2Description =>
      'जीवन बचाने के लिए वास्तविक समय पर खतरे की जानकारी साझा करते हुए, समुद्र पर सतर्क नजर रखने वाले नेटवर्क में शामिल हों।';

  @override
  String get onboarding3Title => 'तैयारी अब\nआपकी उंगलियों पर';

  @override
  String get onboarding3Description =>
      'समुद्री खतरों की रिपोर्ट करें, महत्वपूर्ण अलर्ट प्राप्त करें, और बहुत देर होने से पहले सूचित रहें।';

  @override
  String get skip => 'छोड़ें';

  @override
  String get splashTitle => 'नागरिक चेतावनी';

  @override
  String get splashSubtitle => 'केंद्रित खतरे का पता लगाना';

  @override
  String get hiWelcome => 'नमस्ते, स्वागत है';

  @override
  String get togetherForOceanSafety =>
      'के लिए एक साथ\nमहासागर सुरक्षा,\nएक साथ मजबूत';

  @override
  String get seeUpdates => 'अपडेट देखें';

  @override
  String get unusualActivity => 'रिपोर्ट्स';

  @override
  String get seeAll => 'सब देखें';

  @override
  String get filterNow => 'अभी';

  @override
  String get filterLastWeek => 'पिछला सप्ताह';

  @override
  String get filterLastMonth => 'पिछला महीना';

  @override
  String get locationServicesOffTitle => 'स्थान सेवाएँ बंद';

  @override
  String get enableLocationServicesForReporting =>
      'खतरों की रिपोर्ट करने के लिए कृपया स्थान सेवाएं (जीपीएस) सक्षम करें।आपका स्थान अधिकारियों को त्वरित प्रतिक्रिया देने में सहायता करता है।';

  @override
  String get enableLocationServicesForCurrentLocation =>
      'स्थान सेवाएँ बंद हैं.अपना वर्तमान स्थान दिखाने के लिए जीपीएस सक्षम करें।';

  @override
  String get permissionRequiredTitle => 'अनुमति आवश्यक है';

  @override
  String get locationPermissionDeniedAllowInSettings =>
      'स्थान की अनुमति अस्वीकृत.कृपया सेटिंग्स में पहुंच की अनुमति दें।';

  @override
  String get locationPermissionDeniedAllowForCurrentLocation =>
      'स्थान की अनुमति अस्वीकृत.अपना वर्तमान स्थान दिखाने के लिए पहुंच की अनुमति दें।';

  @override
  String get locationPermissionBlockedEnableInSettings =>
      'स्थान अनुमति अवरुद्ध है.इसे ऐप सेटिंग में सक्षम करें।';

  @override
  String get locationPermissionPermanentlyDeniedForReporting =>
      'स्थान की अनुमति स्थायी रूप से अस्वीकार कर दी गई है.खतरों की रिपोर्ट करने के लिए कृपया इसे ऐप सेटिंग में सक्षम करें।';

  @override
  String get locationPermissionPermanentlyDeniedForCurrentLocation =>
      'स्थान की अनुमति स्थायी रूप से अस्वीकार कर दी गई है.अपना वर्तमान स्थान दिखाने के लिए कृपया इसे ऐप सेटिंग में सक्षम करें।';

  @override
  String get cancel => 'रद्द करना';

  @override
  String get notNow => 'अभी नहीं';

  @override
  String get openSettings => 'खुली सेटिंग';

  @override
  String errorGettingLocationWithError(Object error) {
    return 'Error getting location: $error';
  }

  @override
  String get gettingLocation => 'स्थान प्राप्त हो रहा है...';

  @override
  String get gettingYourLocation => 'आपका स्थान प्राप्त हो रहा है...';

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
      'ऑडियो रिकॉर्ड किया जा रहा है... रोकने के लिए दोबारा टैप करें।';

  @override
  String errorStartingAudioWithError(Object error) {
    return 'Error starting audio: $error';
  }

  @override
  String get pleaseSelectHazardType => 'कृपया ख़तरे का प्रकार चुनें';

  @override
  String get pleaseDescribeSituation => 'कृपया स्थिति का वर्णन करें';

  @override
  String get waitingForLocation => 'स्थान की प्रतीक्षा है...';

  @override
  String get pleaseEnterPeopleAtRisk =>
      'कृपया जोखिम वाले लोगों का अनुमान दर्ज करें';

  @override
  String get noInternetReportQueued =>
      'कोई इंटरनेट कनेक्शन नहीं।रिपोर्ट कतारबद्ध हो जाएगी.';

  @override
  String get profileNeededTitle => 'प्रोफ़ाइल की आवश्यकता है';

  @override
  String get profileNeededBody =>
      'कृपया रिपोर्ट सबमिट करने से पहले अपना फ़ोन नंबर जोड़ें।';

  @override
  String get addNow => 'अभी जोड़ें';

  @override
  String get reportSavedMediaUploadFailedRetry =>
      'रिपोर्ट सहेजी गई!मीडिया अपलोड विफल, बाद में पुनः प्रयास करेंगे।';

  @override
  String get reportSubmittedSuccessfully =>
      'रिपोर्ट सफलतापूर्वक प्रस्तुत की गई!🎉';

  @override
  String errorWithError(Object error) {
    return 'Error: $error';
  }

  @override
  String get retryGps => 'जीपीएस पुनः प्रयास करें';

  @override
  String get reportHazard => 'खतरे की रिपोर्ट करें';

  @override
  String get whatAreYouSeeing => 'आप क्या देख रहे हैं?';

  @override
  String get reportHelpsKeepSafe =>
      'आपकी रिपोर्ट सभी को सुरक्षित रखने में मदद करती है';

  @override
  String get hazardTypeRequired => 'खतरे का प्रकार *';

  @override
  String get descriptionRequired => 'विवरण *';

  @override
  String get describeWhatYouSeeHint => 'जो आप देख रहे हैं उसे लिखें...';

  @override
  String get location => 'स्थान';

  @override
  String get time => 'समय';

  @override
  String get addMediaOptional => 'मीडिया जोड़ें (वैकल्पिक)';

  @override
  String get camera => 'कैमरा';

  @override
  String get record => 'रिकॉर्ड';

  @override
  String get recordAudio => 'ऑडियो रिकॉर्ड करें';

  @override
  String get stopAudio => 'ऑडियो रोकें';

  @override
  String get highRiskSituation => 'उच्च जोखिम स्थिति';

  @override
  String get peopleAtRiskEstimate => 'जोखिम में लोग (अनुमान)';

  @override
  String get urgencyLow => 'कम';

  @override
  String get urgencyMedium => 'मध्यम';

  @override
  String get urgencyHigh => 'उच्च';

  @override
  String get submitReport => 'रिपोर्ट भेजें';

  @override
  String get close => 'बंद करें';

  @override
  String get moreDetails => 'और विवरण';

  @override
  String get hazardHighWaves => 'ऊंची लहरें';

  @override
  String get hazardTsunami => 'सुनामी';

  @override
  String get hazardStorm => 'तूफान';

  @override
  String get hazardFlood => 'बाढ़';

  @override
  String get hazardOther => 'अन्य';

  @override
  String get homeTab => 'होम';

  @override
  String get mapTab => 'मानचित्र';

  @override
  String get updatesTab => 'अपडेट्स';

  @override
  String get profileTab => 'रिपोर्ट्स';

  @override
  String get liveNews => 'लाइव समाचार';

  @override
  String get sampleHazardHeadline => 'प्रशांत तट पर ऊंची लहरें';

  @override
  String get sampleDate => 'रवि, 11 जून 2024';

  @override
  String get sampleTimeAgo => '3 मिनट पहले';

  @override
  String get queuedReportStuck => 'अटक गया';

  @override
  String get queuedReportPendingUpload => 'अपलोड के लिए लंबित';

  @override
  String get queuedReportReadyToRetry => 'पुनः प्रयास के लिए तैयार';

  @override
  String get queuedReportWaitingForRetry => 'पुनः प्रयास की प्रतीक्षा';

  @override
  String get removeQueuedReportTitle => 'क्या कतारबद्ध रिपोर्ट हटा दें?';

  @override
  String get removeQueuedReportContent =>
      'यह ऑफ़लाइन कॉपी हटा देगा और भविष्य के प्रयास रोक देगा।';

  @override
  String get queuedReportRemoved => 'कतारबद्ध रिपोर्ट हटा दी गई';

  @override
  String get themeLight => 'लाइट';

  @override
  String get themeDark => 'डार्क';

  @override
  String get themeSystem => 'सिस्टम';

  @override
  String get notifications => 'नोटिफ़िकेशन';

  @override
  String get logOutTitle => 'क्या लॉग आउट करें?';

  @override
  String get logOut => 'लॉग आउट';

  @override
  String get similarReportExists =>
      'आसपास पहले से ही समान रिपोर्ट है। हमने आपकी रिपोर्ट को इससे जोड़ दिया है।';

  @override
  String get sendingReportsTooQuickly =>
      'आप बहुत तेज़ी से रिपोर्ट भेज रहे हैं। कृपया 30 सेकंड प्रतीक्षा करें।';

  @override
  String get hourlyReportLimitReached =>
      'प्रति घंटे रिपोर्ट सीमा पूरी हुई। कृपया बाद में प्रयास करें।';

  @override
  String get couldNotOpenMaps => 'मैप नहीं खुल सका';

  @override
  String get navigate => 'नेविगेट करें';

  @override
  String get reportDetailsNotAvailable => 'रिपोर्ट का विवरण अभी उपलब्ध नहीं है';

  @override
  String get viewQueue => 'कतार देखें';

  @override
  String get achievements => 'उपलब्धियां';

  @override
  String get leaderboard => 'लीडरबोर्ड';

  @override
  String get chooseFromGallery => 'गैलरी से चुनें';

  @override
  String get downloadOfflineRegion => 'ऑफ़लाइन क्षेत्र डाउनलोड करें';

  @override
  String get radius => 'दायरा';

  @override
  String get download => 'डाउनलोड';

  @override
  String get deleteRegionTitle => 'क्या क्षेत्र हटाएं?';

  @override
  String deleteRegionContent(Object name, Object count) {
    return 'क्या \"$name\" और उसकी $count कैश्ड टाइल्स हटाएं?';
  }

  @override
  String get delete => 'मिटाएं';

  @override
  String get media => 'मीडिया';

  @override
  String get failedToLoadImage => 'चित्र लोड नहीं हो सका';

  @override
  String get unsupportedMediaType => 'असमर्थित मीडिया प्रकार';

  @override
  String get noVerifiedRiskZones =>
      'इस क्षेत्र में अभी तक कोई सत्यापित जोखिम क्षेत्र नहीं हैं।';

  @override
  String get filterAllHazards => 'सभी खतरे';

  @override
  String get filterRipCurrent => 'रिप करंट';

  @override
  String get filterPollution => 'प्रदूषण';

  @override
  String get filterEarthquake => 'भूकंप';

  @override
  String get mobileNumberHint => '12345 67890';

  @override
  String distanceInKm(Object r) {
    return '$r किमी';
  }

  @override
  String get filterCommunity => 'समुदाय';

  @override
  String get filterMySubmitted => 'मेरे द्वारा प्रस्तुत';

  @override
  String get noReportsYet => 'अभी तक कोई रिपोर्ट नहीं';

  @override
  String get noSubmittedReportsYet => 'अभी तक कोई रिपोर्ट सबमिट नहीं की गई';

  @override
  String failedToLoadAdvisory(String error) {
    return 'Failed to load advisory: $error';
  }

  @override
  String get advisoryNotFound => 'सलाह नहीं मिली.';

  @override
  String distanceKmAway(String km) {
    return '$km km away';
  }

  @override
  String distanceMAway(String m) {
    return '$m मी दूर';
  }

  @override
  String get low => 'कम';

  @override
  String get justNow => 'बस अब';

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
    return 'त्रुटि: $errorMsg';
  }

  @override
  String get noLeaderboardData => 'अभी तक कोई लीडरबोर्ड डेटा नहीं';

  @override
  String get startReportingToClimb =>
      'रैंक पर चढ़ने के लिए रिपोर्टिंग शुरू करें!';

  @override
  String pointsAbbrev(int points) {
    return '$points pts';
  }

  @override
  String reportCountDesc(int count) {
    return '$count reports';
  }

  @override
  String get you => 'आप';

  @override
  String get achievementsTitle => 'उपलब्धियों';

  @override
  String get earnedBadges => 'अर्जित बैज';

  @override
  String get lockedBadges => 'बंद बैज';

  @override
  String get pointsHistory => 'अंक इतिहास';

  @override
  String get totalPoints => 'कुल अंक';

  @override
  String get verified => 'सत्यापित';

  @override
  String get rate => 'दर';

  @override
  String get badges => 'बैज';

  @override
  String get submitFirstReportBadge =>
      'बैज अर्जित करने के लिए अपनी पहली रिपोर्ट सबमिट करें!';

  @override
  String get allBadgesEarned => '🎉 सभी बैज अर्जित!';

  @override
  String get noPointsHistoryYet => 'अभी तक कोई अंक इतिहास नहीं';

  @override
  String get earned => '✅ अर्जित!';

  @override
  String get notYetEarned => '🔒 अभी कमाई नहीं हुई';

  @override
  String get ok => 'ठीक है';

  @override
  String get filterAllUrgencies => 'सभी अत्यावश्यकताएँ';

  @override
  String get filtersTitle => 'फिल्टर';

  @override
  String get timeRangeTitle => 'समय सीमा';

  @override
  String get twentyFourHours => '24 घंटे';

  @override
  String daysNumber(int days) {
    return '$days days';
  }

  @override
  String get showRiskZonesTitle => 'जोखिम क्षेत्र दिखाएँ';

  @override
  String get displayHazardHotspots => 'ख़तरे वाले हॉटस्पॉट प्रदर्शित करें';

  @override
  String get highRiskOnlyTitle => 'केवल उच्च जोखिम';

  @override
  String get showOnlyCriticalReports => 'केवल आलोचनात्मक रिपोर्ट दिखाएँ';

  @override
  String get mediaViewerTitle => 'मीडिया दर्शक';

  @override
  String mediaViewerError(String error) {
    return 'Failed to load media: $error';
  }

  @override
  String get loadingText => 'लोड हो रहा है...';

  @override
  String urgencyLevelText(String level) {
    return '$level Urgency';
  }

  @override
  String get highRiskBadge => 'भारी जोखिम';

  @override
  String get mediaTitle => 'मिडिया';

  @override
  String get playLabel => 'खेल';

  @override
  String get pauseLabel => 'विराम';

  @override
  String get notificationsTitle => 'सूचनाएं';

  @override
  String reportStatusTitle(String status) {
    return 'Report $status';
  }

  @override
  String reportStatusBody(String hazardType, String status) {
    return 'Your $hazardType report has been $status.';
  }

  @override
  String get noNotificationsYet => 'अभी तक कोई सूचना नहीं';

  @override
  String get downloadOfflineRegionTitle => 'ऑफ़लाइन क्षेत्र डाउनलोड करें';

  @override
  String get downloadOfflineRegionDesc =>
      'ऑफ़लाइन उपयोग के लिए आपके वर्तमान स्थान के आसपास मानचित्र टाइलें डाउनलोड करता है।';

  @override
  String get regionNameLabel => 'क्षेत्र का नाम';

  @override
  String get radiusLabel => 'RADIUS';

  @override
  String get cancelLabel => 'रद्द करना';

  @override
  String get downloadLabel => 'डाउनलोड करना';

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
  String get deleteLabel => 'मिटाना';

  @override
  String get offlineMapsTitle => 'ऑफ़लाइन मानचित्र';

  @override
  String get downloadingTiles => 'टाइल्स डाउनलोड हो रही है...';

  @override
  String get offlineMapInfoDesc =>
      'आपके द्वारा ऑनलाइन देखी जाने वाली मानचित्र टाइलें ऑफ़लाइन उपयोग के लिए स्वचालित रूप से कैश हो जाती हैं।पूर्ण ऑफ़लाइन कवरेज के लिए क्षेत्र डाउनलोड करें।';

  @override
  String get noOfflineRegionsYet => 'अभी तक कोई ऑफ़लाइन क्षेत्र नहीं है';

  @override
  String get tapToDownloadRegion =>
      'किसी क्षेत्र को डाउनलोड करने के लिए + टैप करें';

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
      'पुनः प्रयास की स्थिति, त्रुटि कारण की समीक्षा करें और अटके हुए आइटम यहां हटाएं।';

  @override
  String get duplicateReportDetected =>
      'ऐसी ही रिपोर्ट पास में पहले से मौजूद है.हमने आपके सबमिशन को इससे लिंक किया है।';

  @override
  String get uploadTimelineCompleted =>
      'आपकी अपलोड टाइमलाइन पूरी हो गई है और सहेज ली गई है.';

  @override
  String get doneLabel => 'हो गया';

  @override
  String get rateLimitMinInterval =>
      'आप रिपोर्ट बहुत जल्दी भेज रहे हैं.कृपया 30 सेकंड प्रतीक्षा करें और पुनः प्रयास करें।';

  @override
  String get rateLimitHourly =>
      'प्रति घंटा रिपोर्ट की सीमा पूरी हो गई.कृपया बाद में पुन: प्रयास करें।';

  @override
  String get uploadingReportTitle => 'अपनी रिपोर्ट अपलोड कर रहा हूँ';

  @override
  String get preparingReportDesc => 'रिपोर्ट विवरण तैयार करना';

  @override
  String get reportDetailsUploaded => 'रिपोर्ट विवरण अपलोड किया गया';

  @override
  String get duplicateReportLinked =>
      'डुप्लिकेट रिपोर्ट का पता चला, मौजूदा रिपोर्ट से लिंक किया गया';

  @override
  String uploadedAttachmentCounter(int current, int total) {
    return 'Uploaded attachment $current/$total';
  }

  @override
  String get uploadingMedia => 'मीडिया अपलोड हो रहा है';

  @override
  String get mediaUploadFailedQueued =>
      'मीडिया अपलोड विफल, पुनः प्रयास के लिए कतार में';

  @override
  String get finalizingReport => 'रिपोर्ट को अंतिम रूप दिया जा रहा है';

  @override
  String get pleaseWaitBeforeSending =>
      'कृपया दूसरी रिपोर्ट भेजने से पहले प्रतीक्षा करें';

  @override
  String get hourlyReportLimitTitle => 'प्रति घंटा रिपोर्ट की सीमा पूरी हो गई';

  @override
  String uploadFailedError(String error) {
    return 'Upload failed: $error';
  }

  @override
  String get openQueueToReview =>
      'पुनः प्रयास की स्थिति, त्रुटि कारण की समीक्षा करने और अटकी हुई वस्तुओं को हटाने के लिए कतार खोलें।';

  @override
  String get arcAbbr => 'आर्क';

  @override
  String get arcFull => 'चेतावनी • रिपोर्ट • समन्वय करें';

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
      'पंक्तिबद्ध रिपोर्टों को समन्वयित किया जा रहा है';

  @override
  String preparingPendingReports(int count) {
    return 'Preparing $count pending report(s)';
  }

  @override
  String uploadingReportCount(int current, int total) {
    return 'Uploading report $current of $total';
  }

  @override
  String get uploadingAttachments => 'अटेचमेंट अपलोड हो रहे हैं';

  @override
  String get reportUpdateTitle => 'रिपोर्ट अद्यतन';

  @override
  String get aboutTransparencyBody =>
      'यह ऐप नागरिकों को समुद्र के खतरों की रिपोर्ट करने में मदद करता है और अधिकारियों को रीयल-टाइम स्थितियों को समझने में मदद करता है।\n\nहम व्यक्तिगत विवरणों के सार्वजनिक जोखिम को सीमित करके और सार्वजनिक दृश्यों के लिए गोपनीयता-सुरक्षित मानचित्र डेटा का उपयोग करके गोपनीयता को प्राथमिकता देते हैं।';

  @override
  String get privacyBody =>
      'हम क्या जानकारी एकत्र करते हैं: आपका फोन (लॉगिन के लिए), आपका रिपोर्ट विवरण, समय और स्थान।\n\nहम इसका उपयोग कैसे करते हैं: आपकी रिपोर्ट को सहेजने और मानचित्र और अपडेट फ़ीड पर सत्यापित, गोपनीयता-सुरक्षित जानकारी दिखाने के लिए।';

  @override
  String get reportSubmittedReason => 'रिपोर्ट सबमिट की गई';

  @override
  String get reportVerifiedReason => 'रिपोर्ट सत्यापित';

  @override
  String get highRiskVerifiedReason => 'उच्च-जोखिम रिपोर्ट सत्यापित';

  @override
  String get reportRejectedReason => 'रिपोर्ट अस्वीकृत';

  @override
  String get achievementsAndBadges => 'उपलब्धियां और बैज';

  @override
  String get offlineMaps => 'ऑफ़लाइन मैप्स';
}
