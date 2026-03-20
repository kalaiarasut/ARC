import 'app_localizations_en.dart';

// ignore_for_file: type=lint

/// The translations for Hindi (`hi`).
class AppLocalizationsHi extends AppLocalizationsEn {
  AppLocalizationsHi([String locale = 'hi']) : super(locale);

  @override
  String get appTitle => 'सिविल अलर्ट सिस्टम';

  @override
  String get profile => 'प्रोफाइल';

  @override
  String get profileAndReports => 'रिपोर्ट्स';

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
      'मेरी रिपोर्ट्स देखने के लिए इंटरनेट से जुड़ें।';

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
  String get loginTitle => 'लॉग इन / साइन अप';

  @override
  String get signUpWithMobile =>
      'अपने पंजीकृत मोबाइल नंबर से साइन अप करें';

  @override
  String get otpIntro => 'आपके नंबर की पुष्टि के लिए हम OTP भेजेंगे';

  @override
  String get mobileNumberLabel => 'मोबाइल नंबर *';

  @override
  String get sendingLabel => 'भेजा जा रहा है...';

  @override
  String get sendOtp => 'OTP भेजें';

  @override
  String get enterOtp => 'OTP दर्ज करें';

  @override
  String get pleaseEnter6DigitOtp => 'कृपया 6 अंकों का OTP दर्ज करें';

  @override
  String get didntReceiveOtp => 'OTP नहीं मिला? ';

  @override
  String get resendWithTimer => 'फिर भेजें (00:30)';

  @override
  String get savingLabel => 'सहेजा जा रहा है...';

  @override
  String get signedInSuccessfully => 'आप सफलतापूर्वक\nलॉग इन हो गए';

  @override
  String get directingToDashboard =>
      'कृपया प्रतीक्षा करें, हम आपको डैशबोर्ड पर ले जा रहे हैं...';

  @override
  String get whatsYourName => 'आपका नाम क्या है?';

  @override
  String get personalizeExperience =>
      'अपने अनुभव को व्यक्तिगत बनाने में हमारी मदद करें';

  @override
  String get enterYourName => 'अपना नाम दर्ज करें';

  @override
  String get pleaseEnterValidName =>
      'कृपया मान्य नाम दर्ज करें (कम से कम 2 अक्षर)';

  @override
  String get onboarding1Title => 'आपदा के समय\nआपका भरोसेमंद साथी';

  @override
  String get onboarding1Description =>
      'रियल-टाइम अलर्ट पाएं और समुद्री खतरों की रिपोर्ट देकर सुरक्षा में योगदान दें।';

  @override
  String get onboarding2Title => 'सुरक्षा को सशक्त बनाना,\nएक कदम एक समय';

  @override
  String get onboarding2Description =>
      'समुद्र पर नज़र रखने वाले लोगों के नेटवर्क से जुड़ें और जीवन बचाने वाली खतरे की जानकारी साझा करें।';

  @override
  String get onboarding3Title => 'तैयारी अब\nआपकी उंगलियों पर';

  @override
  String get onboarding3Description =>
      'समुद्री खतरों की रिपोर्ट करें, जरूरी अलर्ट पाएं और समय रहते सतर्क रहें।';

  @override
  String get skip => 'छोड़ें';

  @override
  String get hiWelcome => 'नमस्ते, स्वागत है';

  @override
  String get togetherForOceanSafety =>
      'समुद्री सुरक्षा के लिए\nएक साथ,\nऔर मजबूत';

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
  String get reportHazard => 'खतरे की रिपोर्ट करें';

  @override
  String get whatAreYouSeeing => 'आप क्या देख रहे हैं?';

  @override
  String get reportHelpsKeepSafe =>
      'आपकी रिपोर्ट सबको सुरक्षित रखने में मदद करती है';

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
}
