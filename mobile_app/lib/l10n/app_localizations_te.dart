// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Telugu (`te`).
class AppLocalizationsTe extends AppLocalizations {
  AppLocalizationsTe([String locale = 'te']) : super(locale);

  @override
  String get appTitle => 'సివిల్ అలర్ట్ సిస్టమ్';

  @override
  String get profile => 'ప్రొఫైల్';

  @override
  String get profileAndReports => 'రిపోర్టులు';

  @override
  String get edit => 'సవరించండి';

  @override
  String get user => 'వినియోగదారు';

  @override
  String get phoneNotSet => 'ఫోన్ సెట్ చేయబడలేదు';

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
  String get noUploadedReportsYet =>
      'ఇప్పటివరకు ఎలాంటి రిపోర్టులు అప్లోడ్ కాలేదు';

  @override
  String get failedToLoadReports => 'రిపోర్టులను లోడ్ చేయలేకపోయాం';

  @override
  String get youreOffline => 'మీరు ఆఫ్లైన్లో ఉన్నారు';

  @override
  String get connectToInternetToLoadMyReports =>
      'నా నివేదికలను లోడ్ చేయడానికి ఇంటర్నెట్‌కు కనెక్ట్ చేయండి.';

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
  String get privacyReducePrecisionTitle =>
      'మ్యాప్ లొకేషన్ ఖచ్చితత్వాన్ని తగ్గించండి';

  @override
  String get privacyReducePrecisionSubtitle =>
      'ప్రారంభించబడితే, మీ రిపోర్ట్ మార్కర్‌లు మ్యాప్‌లో తగ్గిన స్థాన ఖచ్చితత్వంతో చూపబడతాయి.';

  @override
  String get faqQ1 => 'నేను ప్రమాదాన్ని ఎలా నివేదించగలను?';

  @override
  String get faqA1 =>
      'నివేదిక తెరువు, మీరు చూసే వాటిని వివరించండి మరియు సమర్పించండి.మీరు ఆఫ్‌లైన్‌లో ఉన్నట్లయితే, మీరు తిరిగి ఆన్‌లైన్‌లో ఉన్నప్పుడు అది క్యూలో ఉంచబడుతుంది మరియు అప్‌లోడ్ చేయబడుతుంది.';

  @override
  String get faqQ2 => 'నేను గ్యాలరీ నుండి ఎందుకు అప్‌లోడ్ చేయలేను?';

  @override
  String get faqA2 =>
      'నివేదికలను విశ్వసనీయంగా ఉంచడానికి, యాప్ లైవ్ క్యాప్చర్ (కెమెరా/రికార్డింగ్)ని మాత్రమే అనుమతిస్తుంది కాబట్టి పాత మీడియాను అప్‌లోడ్ చేయడం సాధ్యం కాదు.';

  @override
  String get faqQ3 => 'నా స్థానం ఎలా ఉపయోగించబడింది?';

  @override
  String get faqA3 =>
      'మీ స్థానం ప్రతిస్పందనదారులకు ప్రమాదాలు ఎక్కడ జరుగుతున్నాయో అర్థం చేసుకోవడానికి సహాయపడుతుంది.పబ్లిక్ వీక్షణ కోసం, స్థానాలు తగ్గిన ఖచ్చితత్వంతో చూపబడవచ్చు.';

  @override
  String get loginTitle => 'లాగిన్ / సైన్ అప్';

  @override
  String get signUpWithMobile =>
      'మీ రిజిస్టర్డ్ మొబైల్ నంబర్‌తో సైన్ అప్ చేయండి';

  @override
  String get otpIntro => 'మీ నంబర్‌ను ధృవీకరించడానికి మేము OTP పంపుతాము';

  @override
  String get mobileNumberLabel => 'మొబైల్ నంబర్ *';

  @override
  String get sendingLabel => 'పంపిస్తున్నాం...';

  @override
  String get sendOtp => 'OTP పంపండి';

  @override
  String get failedToSendOtp => 'OTPని పంపడంలో విఫలమైంది.';

  @override
  String get checkSupabasePhoneConfig =>
      'Supabase తనిఖీ చేయండి: ప్రమాణీకరణ → ప్రొవైడర్లు → ఫోన్ (ప్రారంభించబడింది) మరియు SMS ప్రొవైడర్ కాన్ఫిగర్ చేయబడింది (Twilio).';

  @override
  String get enterOtp => 'OTP నమోదు చేయండి';

  @override
  String sentToNumber(Object mobileNumber) {
    return 'Sent to $mobileNumber';
  }

  @override
  String get pleaseEnter6DigitOtp => 'దయచేసి 6 అంకెల OTP నమోదు చేయండి';

  @override
  String get otpVerificationFailed => 'OTP ధృవీకరణ విఫలమైంది.';

  @override
  String signInFailedWithError(Object error) {
    return 'Sign-in failed: $error';
  }

  @override
  String get didntReceiveOtp => 'OTP రాలేదా? ';

  @override
  String get otpResentSuccessfully => 'OTP విజయవంతంగా తిరిగి పంపబడింది';

  @override
  String failedToResendOtpWithError(Object error) {
    return 'Failed to resend OTP: $error';
  }

  @override
  String get resendWithTimer => 'మళ్లీ పంపండి (00:30)';

  @override
  String get savingLabel => 'సేవ్ అవుతోంది...';

  @override
  String get signedInSuccessfully => 'మీరు విజయవంతంగా\nలాగిన్ అయ్యారు';

  @override
  String get directingToDashboard =>
      'మేము మిమ్మల్ని డాష్‌బోర్డ్‌కి మళ్లించే వరకు దయచేసి వేచి ఉండండి...';

  @override
  String get whatsYourName => 'మీ పేరు ఏమిటి?';

  @override
  String get personalizeExperience =>
      'మీ అనుభవాన్ని వ్యక్తిగతీకరించడంలో మాకు సహాయపడండి';

  @override
  String get enterYourName => 'మీ పేరు నమోదు చేయండి';

  @override
  String get pleaseEnterValidName =>
      'దయచేసి చెల్లుబాటు అయ్యే పేరును నమోదు చేయండి (కనీసం 2 అక్షరాలు)';

  @override
  String get onboarding1Title => 'విపత్తుల సమయంలో\nమీ నమ్మకమైన తోడు';

  @override
  String get onboarding1Description =>
      'నిజ-సమయ హెచ్చరికలను పొందండి మరియు సముద్ర ప్రమాదాలు సంభవించినప్పుడు వాటిని నివేదించడం ద్వారా భద్రతకు సహకరించండి.';

  @override
  String get onboarding2Title => 'భద్రతను బలపరుస్తూ,\nఒక్కో అడుగు ముందుకు';

  @override
  String get onboarding2Description =>
      'ప్రాణాలను కాపాడేందుకు నిజ-సమయ ప్రమాద సమాచారాన్ని పంచుకుంటూ, సముద్రంపై అప్రమత్తంగా ఉండే కళ్ల నెట్‌వర్క్‌లో చేరండి.';

  @override
  String get onboarding3Title => 'సిద్ధత ఇప్పుడు\nమీ చేతుల్లో';

  @override
  String get onboarding3Description =>
      'సముద్ర ప్రమాదాలను నివేదించండి, కీలకమైన హెచ్చరికలను స్వీకరించండి మరియు చాలా ఆలస్యం కాకముందే సమాచారంతో ఉండండి.';

  @override
  String get skip => 'దాటవేయి';

  @override
  String get splashTitle => 'పౌర హెచ్చరిక';

  @override
  String get splashSubtitle => 'ఫోకస్డ్ హజార్డ్ డిటెక్షన్';

  @override
  String get hiWelcome => 'నమస్తే, స్వాగతం';

  @override
  String get togetherForOceanSafety => 'కోసం కలిసి\nసముద్ర భద్రత,\nకలిసి బలంగా';

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
  String get locationServicesOffTitle => 'స్థాన సేవలు ఆఫ్';

  @override
  String get enableLocationServicesForReporting =>
      'దయచేసి ప్రమాదాలను నివేదించడానికి స్థాన సేవలను (GPS) ప్రారంభించండి.అధికారులు త్వరగా స్పందించడంలో మీ స్థానం సహాయపడుతుంది.';

  @override
  String get enableLocationServicesForCurrentLocation =>
      'స్థాన సేవలు నిలిపివేయబడ్డాయి.మీ ప్రస్తుత స్థానాన్ని చూపడానికి GPSని ప్రారంభించండి.';

  @override
  String get permissionRequiredTitle => 'అనుమతి అవసరం';

  @override
  String get locationPermissionDeniedAllowInSettings =>
      'స్థాన అనుమతి నిరాకరించబడింది.దయచేసి సెట్టింగ్‌లలో యాక్సెస్‌ని అనుమతించండి.';

  @override
  String get locationPermissionDeniedAllowForCurrentLocation =>
      'స్థాన అనుమతి నిరాకరించబడింది.మీ ప్రస్తుత స్థానాన్ని చూపడానికి యాక్సెస్‌ను అనుమతించండి.';

  @override
  String get locationPermissionBlockedEnableInSettings =>
      'స్థాన అనుమతి బ్లాక్ చేయబడింది.యాప్ సెట్టింగ్‌లలో దీన్ని ప్రారంభించండి.';

  @override
  String get locationPermissionPermanentlyDeniedForReporting =>
      'స్థాన అనుమతి శాశ్వతంగా తిరస్కరించబడింది.దయచేసి ప్రమాదాలను నివేదించడానికి యాప్ సెట్టింగ్‌లలో దీన్ని ప్రారంభించండి.';

  @override
  String get locationPermissionPermanentlyDeniedForCurrentLocation =>
      'స్థాన అనుమతి శాశ్వతంగా తిరస్కరించబడింది.దయచేసి మీ ప్రస్తుత స్థానాన్ని చూపడానికి యాప్ సెట్టింగ్‌లలో దీన్ని ప్రారంభించండి.';

  @override
  String get cancel => 'రద్దు చేయి';

  @override
  String get notNow => 'ఇప్పుడు కాదు';

  @override
  String get openSettings => 'సెట్టింగ్‌లను తెరవండి';

  @override
  String errorGettingLocationWithError(Object error) {
    return 'Error getting location: $error';
  }

  @override
  String get gettingLocation => 'స్థానాన్ని పొందుతోంది...';

  @override
  String get gettingYourLocation => 'మీ స్థానాన్ని పొందుతోంది...';

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
      'ఆడియోను రికార్డ్ చేస్తోంది... ఆపడానికి మళ్లీ నొక్కండి.';

  @override
  String errorStartingAudioWithError(Object error) {
    return 'Error starting audio: $error';
  }

  @override
  String get pleaseSelectHazardType => 'దయచేసి ప్రమాద రకాన్ని ఎంచుకోండి';

  @override
  String get pleaseDescribeSituation => 'దయచేసి పరిస్థితిని వివరించండి';

  @override
  String get waitingForLocation => 'స్థానం కోసం వేచి ఉంది...';

  @override
  String get pleaseEnterPeopleAtRisk =>
      'దయచేసి ప్రమాదంలో ఉన్న వ్యక్తుల అంచనాను నమోదు చేయండి';

  @override
  String get noInternetReportQueued =>
      'ఇంటర్నెట్ కనెక్షన్ లేదు.నివేదిక క్యూలో ఉంటుంది.';

  @override
  String get profileNeededTitle => 'ప్రొఫైల్ అవసరం';

  @override
  String get profileNeededBody =>
      'దయచేసి నివేదికను సమర్పించే ముందు మీ ఫోన్ నంబర్‌ను జోడించండి.';

  @override
  String get addNow => 'ఇప్పుడు జోడించండి';

  @override
  String get reportSavedMediaUploadFailedRetry =>
      'నివేదిక సేవ్ చేయబడింది!మీడియా అప్‌లోడ్ విఫలమైంది, తర్వాత మళ్లీ ప్రయత్నిస్తుంది.';

  @override
  String get reportSubmittedSuccessfully =>
      'నివేదిక విజయవంతంగా సమర్పించబడింది!🎉';

  @override
  String errorWithError(Object error) {
    return 'Error: $error';
  }

  @override
  String get retryGps => 'GPSని మళ్లీ ప్రయత్నించండి';

  @override
  String get reportHazard => 'ప్రమాదాన్ని నివేదించండి';

  @override
  String get whatAreYouSeeing => 'మీరు ఏమి చూస్తున్నారు?';

  @override
  String get reportHelpsKeepSafe =>
      'మీ నివేదిక ప్రతి ఒక్కరినీ సురక్షితంగా ఉంచడంలో సహాయపడుతుంది';

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

  @override
  String get liveNews => 'లైవ్ వార్తలు';

  @override
  String get sampleHazardHeadline => 'పసిఫిక్ తీరంలో ఎత్తైన అలలు';

  @override
  String get sampleDate => 'ఆది, 11 జూన్ 2024';

  @override
  String get sampleTimeAgo => '3 నిమిషాల క్రితం';

  @override
  String get queuedReportStuck => 'ఆగిపోయింది';

  @override
  String get queuedReportPendingUpload => 'అప్‌లోడ్ పెండింగ్‌లో ఉంది';

  @override
  String get queuedReportReadyToRetry => 'మళ్లీ ప్రయత్నించడానికి సిద్ధంగా ఉంది';

  @override
  String get queuedReportWaitingForRetry => 'మళ్లీ ప్రయత్నించడానికి వేచి ఉంది';

  @override
  String get removeQueuedReportTitle => 'క్యూలో ఉన్న నివేదికను తీసివేయాలా?';

  @override
  String get removeQueuedReportContent =>
      'ఇది ఆఫ్‌లైన్ కాపీని తొలగించి భవిష్యత్తు ప్రయత్నాలను ఆపివేస్తుంది.';

  @override
  String get queuedReportRemoved => 'క్యూలో ఉన్న నివేదిక తీసివేయబడింది';

  @override
  String get themeLight => 'వెలుతురు';

  @override
  String get themeDark => 'చీకటి';

  @override
  String get themeSystem => 'సిస్టమ్';

  @override
  String get notifications => 'నోటిఫికేషన్‌లు';

  @override
  String get logOutTitle => 'లాగౌట్ చేయాలా?';

  @override
  String get logOut => 'లాగౌట్';

  @override
  String get similarReportExists =>
      'దగ్గరలో ఇలాంటి నివేదిక ఉంది. మీ నివేదిక దానికి లింక్ చేయబడింది.';

  @override
  String get sendingReportsTooQuickly =>
      'మీరు చాలా వేగంగా రిపోర్టులు పంపుతున్నారు. 30 సెకన్లు ఆపండి.';

  @override
  String get hourlyReportLimitReached =>
      'గంటకు రిపోర్ట్ పరిమితి ముగిసింది. తర్వాత మళ్లీ ప్రయత్నించండి.';

  @override
  String get couldNotOpenMaps => 'మ్యాప్ తెరవలేకపోయాము';

  @override
  String get navigate => 'నావిగేట్ చేయండి';

  @override
  String get reportDetailsNotAvailable =>
      'నివేదిక వివరాలు ఇంకా అందుబాటులో లేవు';

  @override
  String get viewQueue => 'క్యూ చూడండి';

  @override
  String get achievements => 'సాధనలు';

  @override
  String get leaderboard => 'లీడర్‌బోర్డ్';

  @override
  String get chooseFromGallery => 'గ్యాలరీ నుండి ఎంచుకోండి';

  @override
  String get downloadOfflineRegion => 'ఆఫ్‌లైన్ ప్రాంతాన్ని డౌన్‌లోడ్ చేయండి';

  @override
  String get radius => 'వ్యాసార్థం';

  @override
  String get download => 'డౌన్‌లోడ్';

  @override
  String get deleteRegionTitle => 'ప్రాంతాన్ని తీసివేయాలా?';

  @override
  String deleteRegionContent(Object name, Object count) {
    return '\"$name\" మరియు దాని $count కాష్ చేయబడిన టైల్స్‌ని తీసివేయాలా?';
  }

  @override
  String get delete => 'తొలగించు';

  @override
  String get media => 'మీడియా';

  @override
  String get failedToLoadImage => 'చిత్రాన్ని లోడ్ చేయలేకపోయాము';

  @override
  String get unsupportedMediaType => 'మద్దతు లేని మీడియా రకం';

  @override
  String get noVerifiedRiskZones =>
      'ఈ ప్రాంతంలో ఇంకా ధృవీకరించబడిన ప్రమాద ప్రాంతాలు లేవు.';

  @override
  String get filterAllHazards => 'అన్ని ప్రమాదాలు';

  @override
  String get filterRipCurrent => 'రిప్ కరెంట్';

  @override
  String get filterPollution => 'కాలుష్యం';

  @override
  String get filterEarthquake => 'భూకంపం';

  @override
  String get mobileNumberHint => '12345 67890';

  @override
  String distanceInKm(Object r) {
    return '$r కి.మీ.';
  }

  @override
  String get filterCommunity => 'సంఘం';

  @override
  String get filterMySubmitted => 'నా సమర్పణలు';

  @override
  String get noReportsYet => 'ఇంకా నివేదికలు లేవు';

  @override
  String get noSubmittedReportsYet => 'ఇంకా నివేదికలు సమర్పించబడలేదు';

  @override
  String failedToLoadAdvisory(String error) {
    return 'Failed to load advisory: $error';
  }

  @override
  String get advisoryNotFound => 'సలహా కనుగొనబడలేదు.';

  @override
  String distanceKmAway(String km) {
    return '$km km away';
  }

  @override
  String distanceMAway(String m) {
    return '$m మీ దూరంలో ఉంది';
  }

  @override
  String get low => 'తక్కువ';

  @override
  String get justNow => 'ఇప్పుడే';

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
  String get leaderboardTitle => 'లీడర్‌బోర్డ్';

  @override
  String error(String errorMsg) {
    return 'లోపం: $errorMsg';
  }

  @override
  String get noLeaderboardData => 'లీడర్‌బోర్డ్ డేటా ఇంకా లేదు';

  @override
  String get startReportingToClimb =>
      'ర్యాంక్‌లను అధిరోహించడానికి నివేదించడం ప్రారంభించండి!';

  @override
  String pointsAbbrev(int points) {
    return '$points pts';
  }

  @override
  String reportCountDesc(int count) {
    return '$count reports';
  }

  @override
  String get you => 'మీరు';

  @override
  String get achievementsTitle => 'విజయాలు';

  @override
  String get earnedBadges => 'సంపాదించిన బ్యాడ్జీలు';

  @override
  String get lockedBadges => 'లాక్ చేయబడిన బ్యాడ్జ్‌లు';

  @override
  String get pointsHistory => 'పాయింట్ల చరిత్ర';

  @override
  String get totalPoints => 'మొత్తం పాయింట్లు';

  @override
  String get verified => 'ధృవీకరించబడింది';

  @override
  String get rate => 'రేట్ చేయండి';

  @override
  String get badges => 'బ్యాడ్జీలు';

  @override
  String get submitFirstReportBadge =>
      'బ్యాడ్జ్‌ని సంపాదించడానికి మీ మొదటి నివేదికను సమర్పించండి!';

  @override
  String get allBadgesEarned => '🎉 అన్ని బ్యాడ్జ్‌లు సంపాదించబడ్డాయి!';

  @override
  String get noPointsHistoryYet => 'ఇంకా పాయింట్ల చరిత్ర లేదు';

  @override
  String get earned => '✅ సంపాదించారు!';

  @override
  String get notYetEarned => '🔒 ఇంకా సంపాదించలేదు';

  @override
  String get ok => 'సరే';

  @override
  String get filterAllUrgencies => 'అన్ని అత్యవసరాలు';

  @override
  String get filtersTitle => 'ఫిల్టర్లు';

  @override
  String get timeRangeTitle => 'సమయ పరిధి';

  @override
  String get twentyFourHours => '24 గంటలు';

  @override
  String daysNumber(int days) {
    return '$days days';
  }

  @override
  String get showRiskZonesTitle => 'రిస్క్ జోన్‌లను చూపించు';

  @override
  String get displayHazardHotspots => 'ప్రమాదకర హాట్‌స్పాట్‌లను ప్రదర్శించండి';

  @override
  String get highRiskOnlyTitle => 'అధిక ప్రమాదం మాత్రమే';

  @override
  String get showOnlyCriticalReports => 'క్లిష్టమైన నివేదికలను మాత్రమే చూపించు';

  @override
  String get mediaViewerTitle => 'మీడియా వ్యూయర్';

  @override
  String mediaViewerError(String error) {
    return 'Failed to load media: $error';
  }

  @override
  String get loadingText => 'లోడ్ అవుతోంది...';

  @override
  String urgencyLevelText(String level) {
    return '$level Urgency';
  }

  @override
  String get highRiskBadge => 'అధిక ప్రమాదం';

  @override
  String get mediaTitle => 'మీడియా';

  @override
  String get playLabel => 'ఆడండి';

  @override
  String get pauseLabel => 'పాజ్ చేయండి';

  @override
  String get notificationsTitle => 'నోటిఫికేషన్‌లు';

  @override
  String reportStatusTitle(String status) {
    return 'Report $status';
  }

  @override
  String reportStatusBody(String hazardType, String status) {
    return 'Your $hazardType report has been $status.';
  }

  @override
  String get noNotificationsYet => 'ఇంకా నోటిఫికేషన్‌లు లేవు';

  @override
  String get downloadOfflineRegionTitle =>
      'ఆఫ్‌లైన్ ప్రాంతాన్ని డౌన్‌లోడ్ చేయండి';

  @override
  String get downloadOfflineRegionDesc =>
      'ఆఫ్‌లైన్ ఉపయోగం కోసం మీ ప్రస్తుత స్థానం చుట్టూ ఉన్న మ్యాప్ టైల్స్ డౌన్‌లోడ్ చేస్తుంది.';

  @override
  String get regionNameLabel => 'ప్రాంతం పేరు';

  @override
  String get radiusLabel => 'వ్యాసార్థం';

  @override
  String get cancelLabel => 'రద్దు చేయి';

  @override
  String get downloadLabel => 'డౌన్‌లోడ్ చేయండి';

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
  String get deleteLabel => 'తొలగించు';

  @override
  String get offlineMapsTitle => 'ఆఫ్‌లైన్ మ్యాప్స్';

  @override
  String get downloadingTiles => 'టైల్స్ డౌన్‌లోడ్ అవుతోంది...';

  @override
  String get offlineMapInfoDesc =>
      'మీరు ఆన్‌లైన్‌లో వీక్షించే మ్యాప్ టైల్స్ ఆఫ్‌లైన్ ఉపయోగం కోసం స్వయంచాలకంగా కాష్ చేయబడతాయి.పూర్తి ఆఫ్‌లైన్ కవరేజీ కోసం ప్రాంతాలను డౌన్‌లోడ్ చేయండి.';

  @override
  String get noOfflineRegionsYet => 'ఇంకా ఆఫ్‌లైన్ ప్రాంతాలు లేవు';

  @override
  String get tapToDownloadRegion =>
      'ప్రాంతాన్ని డౌన్‌లోడ్ చేయడానికి + నొక్కండి';

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
      'పునఃప్రయత్న స్థితి, ఎర్రర్ కారణాన్ని సమీక్షించండి మరియు ఇక్కడ నిలిచిపోయిన అంశాలను తీసివేయండి.';

  @override
  String get duplicateReportDetected =>
      'ఇలాంటి నివేదిక ఇప్పటికే సమీపంలో ఉంది.మేము మీ సమర్పణను దానికి లింక్ చేసాము.';

  @override
  String get uploadTimelineCompleted =>
      'మీ అప్‌లోడ్ టైమ్‌లైన్ పూర్తయింది మరియు సేవ్ చేయబడింది.';

  @override
  String get doneLabel => 'పూర్తయింది';

  @override
  String get rateLimitMinInterval =>
      'మీరు చాలా త్వరగా నివేదికలను పంపుతున్నారు.దయచేసి 30 సెకన్లు వేచి ఉండి, మళ్లీ ప్రయత్నించండి.';

  @override
  String get rateLimitHourly =>
      'గంట వారీ నివేదిక పరిమితిని చేరుకున్నారు.దయచేసి తర్వాత మళ్లీ ప్రయత్నించండి.';

  @override
  String get uploadingReportTitle => 'మీ నివేదికను అప్‌లోడ్ చేస్తోంది';

  @override
  String get preparingReportDesc => 'నివేదిక వివరాలను సిద్ధం చేస్తోంది';

  @override
  String get reportDetailsUploaded => 'నివేదిక వివరాలు అప్‌లోడ్ చేయబడ్డాయి';

  @override
  String get duplicateReportLinked =>
      'నకిలీ నివేదిక కనుగొనబడింది, ఇప్పటికే ఉన్న నివేదికకు లింక్ చేయబడింది';

  @override
  String uploadedAttachmentCounter(int current, int total) {
    return 'Uploaded attachment $current/$total';
  }

  @override
  String get uploadingMedia => 'మీడియాను అప్‌లోడ్ చేస్తోంది';

  @override
  String get mediaUploadFailedQueued =>
      'మీడియా అప్‌లోడ్ విఫలమైంది, మళ్లీ ప్రయత్నించడానికి క్యూలో ఉంది';

  @override
  String get finalizingReport => 'తుది నివేదిక';

  @override
  String get pleaseWaitBeforeSending =>
      'దయచేసి మరొక నివేదికను పంపే ముందు వేచి ఉండండి';

  @override
  String get hourlyReportLimitTitle =>
      'గంట వారీ నివేదిక పరిమితిని చేరుకున్నారు';

  @override
  String uploadFailedError(String error) {
    return 'Upload failed: $error';
  }

  @override
  String get openQueueToReview =>
      'మళ్లీ ప్రయత్నించే స్థితి, ఎర్రర్ కారణం మరియు నిలిచిపోయిన అంశాలను తీసివేయడానికి క్యూను తెరవండి.';

  @override
  String get arcAbbr => 'ARC';

  @override
  String get arcFull => 'హెచ్చరిక • నివేదిక • సమన్వయం';

  @override
  String failedToTakePhoto(String error) {
    return 'Failed to take photo: $error';
  }

  @override
  String failedToPickPhoto(String error) {
    return 'Failed to pick photo: $error';
  }

  @override
  String get syncingQueuedReports => 'వరుసలో ఉన్న నివేదికలను సమకాలీకరించడం';

  @override
  String preparingPendingReports(int count) {
    return 'Preparing $count pending report(s)';
  }

  @override
  String uploadingReportCount(int current, int total) {
    return 'Uploading report $current of $total';
  }

  @override
  String get uploadingAttachments => 'జోడింపులను అప్‌లోడ్ చేస్తోంది';

  @override
  String get reportUpdateTitle => 'నవీకరణను నివేదించండి';

  @override
  String get aboutTransparencyBody =>
      'ఈ యాప్ పౌరులు సముద్ర ప్రమాదాలను నివేదించడంలో సహాయపడుతుంది మరియు అధికారులు నిజ-సమయ పరిస్థితులను అర్థం చేసుకోవడంలో సహాయపడుతుంది.\n\nవ్యక్తిగత వివరాల పబ్లిక్ ఎక్స్‌పోజర్‌ను పరిమితం చేయడం ద్వారా మరియు పబ్లిక్ వీక్షణల కోసం గోప్యత-సురక్షిత మ్యాప్ డేటాను ఉపయోగించడం ద్వారా మేము గోప్యతకు ప్రాధాన్యత ఇస్తాము.';

  @override
  String get privacyBody =>
      'మేము సేకరించేది: మీ ఫోన్ (లాగిన్ కోసం), మీ రిపోర్ట్ వివరణ, సమయం మరియు స్థానం.\n\nమేము దానిని ఎలా ఉపయోగిస్తాము: మీ నివేదికను నిల్వ చేయడానికి మరియు మ్యాప్ మరియు అప్‌డేట్‌ల ఫీడ్‌లో ధృవీకరించబడిన, గోప్యత-సురక్షిత సమాచారాన్ని చూపడానికి.';

  @override
  String get reportSubmittedReason => 'నివేదిక సమర్పించబడింది';

  @override
  String get reportVerifiedReason => 'నివేదిక ధృవీకరించబడింది';

  @override
  String get highRiskVerifiedReason => 'అధిక-ప్రమాద నివేదిక ధృవీకరించబడింది';

  @override
  String get reportRejectedReason => 'నివేదిక తిరస్కరించబడింది';

  @override
  String get achievementsAndBadges => 'సాధనలు & బ్యాడ్జీలు';

  @override
  String get offlineMaps => 'ఆఫ్‌లైన్ మ్యాప్‌లు';

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
