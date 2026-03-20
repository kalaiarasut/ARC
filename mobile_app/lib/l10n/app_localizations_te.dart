import 'app_localizations_en.dart';

// ignore_for_file: type=lint

/// The translations for Telugu (`te`).
class AppLocalizationsTe extends AppLocalizationsEn {
  AppLocalizationsTe([String locale = 'te']) : super(locale);

  @override
  String get appTitle => 'సివిల్ అలర్ట్ సిస్టమ్';

  @override
  String get profile => 'ప్రొఫైల్';

  @override
  String get profileAndReports => 'రిపోర్టులు';

  @override
  String get settings => 'సెట్టింగ్స్';

  @override
  String get helpFaq => 'సహాయం / FAQ';

  @override
  String get aboutTransparency => 'సమాచారం మరియు పారదర్శకత';

  @override
  String get language => 'భాష';

  @override
  String get privacyControls => 'భాష మరియు గోప్యత నియంత్రణలు';

  @override
  String get privacy => 'గోప్యత';

  @override
  String get chooseLanguage => 'భాషను ఎంచుకోండి';

  @override
  String get save => 'సేవ్ చేయండి';

  @override
  String get continueLabel => 'కొనసాగించండి';

  @override
  String get languageComingSoon => 'ఈ భాష త్వరలో అందుబాటులోకి వస్తుంది.';

  @override
  String get updates => 'అప్డేట్స్';

  @override
  String get syncNow => 'ఇప్పుడే సింక్ చేయండి';

  @override
  String get nothingToSync => 'సింక్ చేయడానికి ఏమీ లేదు';

  @override
  String syncDone(Object succeeded, Object failed) {
    return 'సింక్ పూర్తైంది: $succeeded విజయవంతం, $failed విఫలం';
  }

  @override
  String get offlineReports => 'ఆఫ్లైన్ రిపోర్టులు';

  @override
  String get noPendingReports => 'పెండింగ్ రిపోర్టులు లేవు';

  @override
  String attemptsLabel(Object count) {
    return 'ప్రయత్నాలు: $count';
  }

  @override
  String get retry => 'మళ్లీ ప్రయత్నించండి';

  @override
  String get remove => 'తొలగించండి';

  @override
  String get myReports => 'నా రిపోర్టులు';

  @override
  String get noUploadedReportsYet => 'ఇప్పటివరకు ఎలాంటి రిపోర్టులు అప్లోడ్ కాలేదు';

  @override
  String get failedToLoadReports => 'రిపోర్టులను లోడ్ చేయలేకపోయాం';

  @override
  String get youreOffline => 'మీరు ఆఫ్లైన్లో ఉన్నారు';

  @override
  String get connectToInternetToLoadMyReports =>
      'నా రిపోర్టులను చూడడానికి ఇంటర్నెట్‌కి కనెక్ట్ అవండి.';

  @override
  String pendingCount(Object count) {
    return '$count పెండింగ్';
  }

  @override
  String get noUpdatesYet => 'ఇప్పటికీ అప్డేట్స్ లేవు';

  @override
  String get failedToLoadUpdates => 'అప్డేట్స్ లోడ్ కాలేదు';

  @override
  String get helpTitle => 'సహాయం / FAQ';

  @override
  String get aboutTitle => 'సమాచారం మరియు పారదర్శకత';

  @override
  String get privacyTitle => 'గోప్యత నియంత్రణలు';

  @override
  String get loginTitle => 'లాగిన్ / సైన్ అప్';

  @override
  String get signUpWithMobile =>
      'మీ నమోదు చేసిన మొబైల్ నంబర్‌తో సైన్ అప్ చేయండి';

  @override
  String get otpIntro => 'మీ నంబర్‌ను ధృవీకరించడానికి మేము OTP పంపుతాము';

  @override
  String get mobileNumberLabel => 'మొబైల్ నంబర్ *';

  @override
  String get sendingLabel => 'పంపిస్తున్నాం...';

  @override
  String get sendOtp => 'OTP పంపండి';

  @override
  String get enterOtp => 'OTP నమోదు చేయండి';

  @override
  String get pleaseEnter6DigitOtp => 'దయచేసి 6 అంకెల OTP నమోదు చేయండి';

  @override
  String get didntReceiveOtp => 'OTP రాలేదా? ';

  @override
  String get resendWithTimer => 'మళ్లీ పంపండి (00:30)';

  @override
  String get savingLabel => 'సేవ్ అవుతోంది...';

  @override
  String get signedInSuccessfully => 'మీరు విజయవంతంగా\nలాగిన్ అయ్యారు';

  @override
  String get directingToDashboard =>
      'దయచేసి వేచి ఉండండి, మేము మిమ్మల్ని డ్యాష్‌బోర్డ్‌కు తీసుకెళ్తున్నాము...';

  @override
  String get whatsYourName => 'మీ పేరు ఏమిటి?';

  @override
  String get personalizeExperience =>
      'మీ అనుభవాన్ని వ్యక్తిగతీకరించడానికి మాకు సహాయపడండి';

  @override
  String get enterYourName => 'మీ పేరు నమోదు చేయండి';

  @override
  String get pleaseEnterValidName =>
      'దయచేసి సరైన పేరు నమోదు చేయండి (కనీసం 2 అక్షరాలు)';

  @override
  String get onboarding1Title => 'విపత్తుల సమయంలో\nమీ నమ్మకమైన తోడు';

  @override
  String get onboarding1Description =>
      'రియల్-టైమ్ అలర్ట్స్ పొందండి మరియు సముద్ర ప్రమాదాలను నివేదించి భద్రతకు తోడ్పడండి.';

  @override
  String get onboarding2Title => 'భద్రతను బలపరుస్తూ,\nఒక్కో అడుగు ముందుకు';

  @override
  String get onboarding2Description =>
      'సముద్రాన్ని గమనించే ప్రజల నెట్‌వర్క్‌లో చేరి, ప్రాణాలను కాపాడే ప్రమాద సమాచారాన్ని పంచుకోండి.';

  @override
  String get onboarding3Title => 'సిద్ధత ఇప్పుడు\nమీ చేతుల్లో';

  @override
  String get onboarding3Description =>
      'సముద్ర ప్రమాదాలను నివేదించండి, కీలక అలర్ట్స్ పొందండి, ముందుగానే అప్రమత్తంగా ఉండండి.';

  @override
  String get skip => 'దాటవేయి';

  @override
  String get hiWelcome => 'నమస్తే, స్వాగతం';

  @override
  String get togetherForOceanSafety =>
      'సముద్ర భద్రత కోసం\nకలిసి,\nఇంకా బలంగా';

  @override
  String get seeUpdates => 'అప్డేట్స్ చూడండి';

  @override
  String get unusualActivity => 'రిపోర్టులు';

  @override
  String get seeAll => 'అన్నీ చూడండి';

  @override
  String get filterNow => 'ఇప్పుడు';

  @override
  String get filterLastWeek => 'గత వారం';

  @override
  String get filterLastMonth => 'గత నెల';

  @override
  String get reportHazard => 'ప్రమాదాన్ని నివేదించండి';

  @override
  String get whatAreYouSeeing => 'మీరు ఏమి చూస్తున్నారు?';

  @override
  String get reportHelpsKeepSafe =>
      'మీ రిపోర్టు అందరినీ సురక్షితంగా ఉంచడానికి సహాయపడుతుంది';

  @override
  String get hazardTypeRequired => 'ప్రమాద రకం *';

  @override
  String get descriptionRequired => 'వివరణ *';

  @override
  String get describeWhatYouSeeHint => 'మీరు చూస్తున్నది వివరించండి...';

  @override
  String get location => 'స్థానం';

  @override
  String get time => 'సమయం';

  @override
  String get addMediaOptional => 'మీడియా జోడించండి (ఐచ్చికం)';

  @override
  String get camera => 'కెమెరా';

  @override
  String get record => 'రికార్డ్';

  @override
  String get recordAudio => 'ఆడియో రికార్డ్ చేయండి';

  @override
  String get stopAudio => 'ఆడియో ఆపండి';

  @override
  String get highRiskSituation => 'అధిక ప్రమాద స్థితి';

  @override
  String get peopleAtRiskEstimate => 'ప్రమాదంలో ఉన్న వారి అంచనా';

  @override
  String get urgencyLow => 'తక్కువ';

  @override
  String get urgencyMedium => 'మధ్యస్థ';

  @override
  String get urgencyHigh => 'ఎక్కువ';

  @override
  String get submitReport => 'రిపోర్టు పంపండి';

  @override
  String get close => 'మూసివేయండి';

  @override
  String get moreDetails => 'మరిన్ని వివరాలు';

  @override
  String get hazardHighWaves => 'ఎత్తైన అలలు';

  @override
  String get hazardTsunami => 'సునామీ';

  @override
  String get hazardStorm => 'తుఫాను';

  @override
  String get hazardFlood => 'వరద';

  @override
  String get hazardOther => 'ఇతర';

  @override
  String get homeTab => 'హోమ్';

  @override
  String get mapTab => 'మ్యాప్';

  @override
  String get updatesTab => 'అప్డేట్స్';

  @override
  String get profileTab => 'రిపోర్టులు';
}
