// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Gujarati (`gu`).
class AppLocalizationsGu extends AppLocalizations {
  AppLocalizationsGu([String locale = 'gu']) : super(locale);

  @override
  String get appTitle => 'સિવિલ એલર્ટ સિસ્ટમ';

  @override
  String get profile => 'પ્રોફાઇલ';

  @override
  String get profileAndReports => 'રિપોર્ટ્સ';

  @override
  String get edit => 'ફેરફાર કરો';

  @override
  String get user => 'વપરાશકર્તા';

  @override
  String get phoneNotSet => 'ફોન નંબર સેટ નથી';

  @override
  String get syncNow => 'હમણાં સિંક કરો';

  @override
  String get nothingToSync => 'સિંક કરવા માટે કંઈ નથી';

  @override
  String syncDone(Object succeeded, Object failed) {
    return 'સિંક પૂર્ણ થયું: $succeeded સફળ, $failed નિષ્ફળ';
  }

  @override
  String get offlineReports => 'ઑફલાઇન રિપોર્ટ્સ';

  @override
  String get noPendingReports => 'કોઈ પડતર રિપોર્ટ્સ નથી';

  @override
  String attemptsLabel(Object count) {
    return 'પ્રયાસો: $count';
  }

  @override
  String get retry => 'ફરી પ્રયાસ કરો';

  @override
  String get remove => 'દૂર કરો';

  @override
  String get myReports => 'મારા રિપોર્ટ્સ';

  @override
  String get noUploadedReportsYet => 'હજી સુધી કોઈ રિપોર્ટ્સ અપલોડ થયા નથી';

  @override
  String get failedToLoadReports => 'રિપોર્ટ્સ લોડ કરવામાં નિષ્ફળ';

  @override
  String get youreOffline => 'તમે ઑફલાઇન છો';

  @override
  String get connectToInternetToLoadMyReports =>
      'મારા રિપોર્ટ્સ જોવા માટે ઇન્ટરનેટ સાથે કનેક્ટ કરો.';

  @override
  String get settings => 'સેટિંગ્સ';

  @override
  String get helpFaq => 'મદદ / FAQ';

  @override
  String get aboutTransparency => 'વિશે અને પારદર્શિતા';

  @override
  String get language => 'ભાષા';

  @override
  String get privacyControls => 'ભાષા અને ગોપનીયતા સેટિંગ્સ';

  @override
  String get privacy => 'ગોપનીયતા';

  @override
  String get chooseLanguage => 'ભાષા પસંદ કરો';

  @override
  String get save => 'સેવ કરો';

  @override
  String get continueLabel => 'ચાલુ રાખો';

  @override
  String get languageComingSoon => 'આ ભાષા ટૂંક સમયમાં આવી રહી છે.';

  @override
  String get updates => 'અપડેટ્સ';

  @override
  String pendingCount(Object count) {
    return '$count પડતર';
  }

  @override
  String get noUpdatesYet => 'હજી સુધી કોઈ અપડેટ્સ નથી';

  @override
  String get failedToLoadUpdates => 'અપડેટ્સ લોડ કરવામાં નિષ્ફળ';

  @override
  String get helpTitle => 'મદદ / FAQ';

  @override
  String get aboutTitle => 'વિશે અને પારદર્શિતા';

  @override
  String get privacyTitle => 'ગોપનીયતા સેટિંગ્સ';

  @override
  String get privacyReducePrecisionTitle => 'નકશા સ્થાન સચોટતા ઘટાડો';

  @override
  String get privacyReducePrecisionSubtitle =>
      'જો સક્ષમ હોય, તો તમારા રિપોર્ટ મેકર્સ નકશા પર ઓછી સચોટતાસાથે બતાવવામાં આવશે.';

  @override
  String get faqQ1 => 'હું સંકટની કેવી રીતે રિપોર્ટ કરું?';

  @override
  String get faqA1 => 'રિપોર્ટ ખોલો, તમે જે જુઓ છો તે વર્ણન કરો અને સબમિટ કરો.';

  @override
  String get faqQ2 => 'હું ગેલેરીમાંથી કેમ અપલોડ કરી શકતો નથી?';

  @override
  String get faqA2 =>
      'રિપોર્ટને વિશ્વાસપાત્ર રાખવા માટે, એપ્લિકેશન ફક્ત લાઇવ કેપ્ચરની મંજૂરી આપે છે.';

  @override
  String get faqQ3 => 'મારું સ્થાન કેવી રીતે વપરાય છે?';

  @override
  String get faqA3 =>
      'તમારું સ્થાન સમજવામાં મદદ કરે છે કે ક્યાં સંકટ આવી રહ્યું છે.';

  @override
  String get loginTitle => 'લૉગ-ઇન / સાઇન-અપ';

  @override
  String get signUpWithMobile => 'તમારા નોંધાયેલ મોબાઇલ નંબરથી સાઇન અપ કરો';

  @override
  String get otpIntro => 'તમારો નંબર ચકાસવા માટે અમે તમને એક OTP મોકલીશું';

  @override
  String get mobileNumberLabel => 'મોબાઇલ નંબર *';

  @override
  String get sendingLabel => 'મોકલી રહ્યું છે...';

  @override
  String get sendOtp => 'OTP મોકલો';

  @override
  String get failedToSendOtp => 'OTP મોકલવામાં નિષ્ફળ.';

  @override
  String get checkSupabasePhoneConfig => 'સુપરબેસ તપાસો.';

  @override
  String get enterOtp => 'OTP લખો';

  @override
  String sentToNumber(Object mobileNumber) {
    return 'Sent to $mobileNumber';
  }

  @override
  String get pleaseEnter6DigitOtp => 'કૃપા કરીને 6-અંકનો OTP લખો';

  @override
  String get otpVerificationFailed => 'OTP ચકાસણી નિષ્ફળ.';

  @override
  String signInFailedWithError(Object error) {
    return 'Sign-in failed: $error';
  }

  @override
  String get didntReceiveOtp => 'OTP મળ્યો નથી? ';

  @override
  String get otpResentSuccessfully => 'OTP સફળતાપૂર્વક ફરીથી મોકલાયો';

  @override
  String failedToResendOtpWithError(Object error) {
    return 'Failed to resend OTP: $error';
  }

  @override
  String get resendWithTimer => 'ફરીથી મોકલો (00:30)';

  @override
  String get savingLabel => 'શેવ થઈ રહ્યું છે...';

  @override
  String get signedInSuccessfully => 'તમે સફળતાપૂર્વક\nલૉગ-ઇન થયા છો';

  @override
  String get directingToDashboard =>
      'કૃપા કરીને રાહ જુઓ, અમે તમને ડેશબોર્ડ પર લઈ જઈ રહ્યા છીએ...';

  @override
  String get whatsYourName => 'તમારું નામ શું છે?';

  @override
  String get personalizeExperience =>
      'તમારા અનુભવને વ્યક્તિગત કરવામાં અમને સહાય કરો';

  @override
  String get enterYourName => 'તમારું નામ લખો';

  @override
  String get pleaseEnterValidName =>
      'કૃપા કરીને માન્ય નામ લખો (ઓછામાં ઓછા 2 અક્ષરો)';

  @override
  String get onboarding1Title => 'આપત્તિના સમયે\nતમારો વિશ્વાસુ સાથી';

  @override
  String get onboarding1Description =>
      'રિયલ-ટાઇમ એલર્ટ મેળવો અને દરિયામાં આવતા જોખમો વિશે જાણ કરી સુરક્ષામાં યોગદાન આપો.';

  @override
  String get onboarding2Title => 'સુરક્ષા મજબૂત બનાવીએ,\nસ્ટેપ બાય સ્ટેપ';

  @override
  String get onboarding2Description =>
      'દરિયાઈ સલામતી માટે જોડાયેલ લોકોની કમ્યુનિટીમાં જોડાઓ અને જોખમો વિશે માહિતી શેર કરો.';

  @override
  String get onboarding3Title => 'તૈયારી હવે\nતમારા હાથ પર';

  @override
  String get onboarding3Description =>
      'જોખમો વિશે રિપોર્ટ કરો, એલર્ટ મેળવો અને સમય રહેતા માહિતગાર થાવ.';

  @override
  String get skip => 'છોડો';

  @override
  String get splashTitle => 'સિવિલ એલર્ટ';

  @override
  String get splashSubtitle => 'સચોટ જોખમ ઓળખ';

  @override
  String get hiWelcome => 'નમસ્તે, સ્વાગત છે 👋';

  @override
  String get togetherForOceanSafety =>
      'દરિયાઈ સુરક્ષા માટે\nએક થઈને,\nમજબૂત બનીએ';

  @override
  String get seeUpdates => 'અપડેટ્સ જુઓ';

  @override
  String get unusualActivity => 'રિપોર્ટ્સ';

  @override
  String get seeAll => 'બધા જુઓ';

  @override
  String get filterNow => 'હમણાં';

  @override
  String get filterLastWeek => 'ગયા અઠવાડિયે';

  @override
  String get filterLastMonth => 'ગયા મહિને';

  @override
  String get locationServicesOffTitle => 'સ્થાન સેવાઓ બંધ છે';

  @override
  String get enableLocationServicesForReporting =>
      'જોખમો રિપોર્ટ કરવા માટે કૃપા કરીને સ્થાન સેવાઓ ચાલુ કરો.';

  @override
  String get enableLocationServicesForCurrentLocation =>
      'તમારું વર્તમાન સ્થાન જોવા માટે GPS ચાલુ કરો.';

  @override
  String get permissionRequiredTitle => 'પરવાનગી જરૂરી';

  @override
  String get locationPermissionDeniedAllowInSettings =>
      'સ્થાન પરવાનગી નકારવામાં આવી છે. સેટિંગ્સમાં પરવાનગી આપો.';

  @override
  String get locationPermissionDeniedAllowForCurrentLocation =>
      'તમારું વર્તમાન સ્થાન માટે પરવાનગી આપો.';

  @override
  String get locationPermissionBlockedEnableInSettings =>
      'સ્થાન પરવાનગી બ્લોક કરવામાં આવી છે.';

  @override
  String get locationPermissionPermanentlyDeniedForReporting =>
      'સ્થાન પરવાનગી કાયમી રૂપે નકારી છે.';

  @override
  String get locationPermissionPermanentlyDeniedForCurrentLocation =>
      'તમારું વર્તમાન સ્થાન જોવા માટે પરવાનગી કાયમી રૂપે નકારી છે.';

  @override
  String get cancel => 'રદ કરો';

  @override
  String get notNow => 'હમણાં નહીં';

  @override
  String get openSettings => 'સેટિંગ્સ ખોલો';

  @override
  String errorGettingLocationWithError(Object error) {
    return 'Error getting location: $error';
  }

  @override
  String get gettingLocation => 'સ્થાન લઈ રહ્યું છે...';

  @override
  String get gettingYourLocation => 'તમારું સ્થાન મેળવી રહ્યું છે...';

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
      'ઑડિઓ રેકોર્ડ થઈ રહ્યું છે… રોકવા માટે ફરીથી ટેપ કરો.';

  @override
  String errorStartingAudioWithError(Object error) {
    return 'Error starting audio: $error';
  }

  @override
  String get pleaseSelectHazardType => 'કૃપા કરીને જોખમનો પ્રકાર પસંદ કરો';

  @override
  String get pleaseDescribeSituation => 'કૃપા કરીને પરિસ્થિતિનું વર્ણન કરો';

  @override
  String get waitingForLocation => 'સ્થાન માટે રાહ જોઈ રહ્યું છે...';

  @override
  String get pleaseEnterPeopleAtRisk =>
      'જોખમમાં હોય તેવા લોકોનો અંદાજ દાખલ કરો';

  @override
  String get noInternetReportQueued =>
      'ઇન્ટરનેટ કનેક્શન નથી. રિપોર્ટ પડતર રહેશે.';

  @override
  String get profileNeededTitle => 'પ્રોફાઇલ જરૂરી છે';

  @override
  String get profileNeededBody =>
      'રિપોર્ટ સબમિટ કરતા પહેલાં તમારો ફોન નંબર ઉમેરો.';

  @override
  String get addNow => 'હમણાં ઉમેરો';

  @override
  String get reportSavedMediaUploadFailedRetry =>
      'રિપોર્ટ સેવ થયો! મીડિયા અપલોડ નિષ્ફળ ગયું, પછી ફરી પ્રયાસ કરીશું.';

  @override
  String get reportSubmittedSuccessfully => 'રિપોર્ટ સફળતાપૂર્વક સબમિટ થયો! 🎉';

  @override
  String errorWithError(Object error) {
    return 'Error: $error';
  }

  @override
  String get retryGps => 'GPS ફરી પ્રયાસ કરો';

  @override
  String get reportHazard => 'જોખમ અંગે રિપોર્ટ કરો';

  @override
  String get whatAreYouSeeing => 'તમે શું જુઓ છો?';

  @override
  String get reportHelpsKeepSafe =>
      'તમારો રિપોર્ટ દરેકને સુરક્ષિત રાખવામાં મદદ કરે છે';

  @override
  String get hazardTypeRequired => 'જોખમનો પ્રકાર *';

  @override
  String get descriptionRequired => 'વર્ણન *';

  @override
  String get describeWhatYouSeeHint => 'તમે જે જુઓ છો તેનું વર્ણન કરો...';

  @override
  String get location => 'સ્થાન';

  @override
  String get time => 'સમય';

  @override
  String get addMediaOptional => 'મીડિયા ઉમેરો (વૈકલ્પિક)';

  @override
  String get camera => 'કેમેરા';

  @override
  String get record => 'રેકોર્ડ';

  @override
  String get recordAudio => 'ઑડિઓ રેકોર્ડ કરો';

  @override
  String get stopAudio => 'ઑડિઓ રોકો';

  @override
  String get highRiskSituation => 'ઉચ્ચ જોખમની સ્થિતિ';

  @override
  String get peopleAtRiskEstimate => 'જોખમમાં હોય તેવા લોકો (અંદાજપડતું)';

  @override
  String get urgencyLow => 'ઓછું';

  @override
  String get urgencyMedium => 'મધ્યમ';

  @override
  String get urgencyHigh => 'વધારે';

  @override
  String get submitReport => 'રિપોર્ટ સબમિટ કરો';

  @override
  String get close => 'બંધ કરો';

  @override
  String get moreDetails => 'વધુ વિગતો';

  @override
  String get hazardHighWaves => 'ઉંચા મોજા';

  @override
  String get hazardTsunami => 'સુનામી';

  @override
  String get hazardStorm => 'તોફાન';

  @override
  String get hazardFlood => 'પૂર';

  @override
  String get hazardOther => 'અન્ય';

  @override
  String get homeTab => 'હોમ';

  @override
  String get mapTab => 'નકશો';

  @override
  String get updatesTab => 'અપડેટ્સ';

  @override
  String get profileTab => 'રિપોર્ટ્સ';

  @override
  String get liveNews => 'જીવંત સમાચાર';

  @override
  String get sampleHazardHeadline => 'પેસિફિક કિનારે ઉંચા મોજા';

  @override
  String get sampleDate => 'રવિ, 11 જૂન 2024';

  @override
  String get sampleTimeAgo => '3 મિનિટ પહેલા';

  @override
  String get queuedReportStuck => 'અટવાયેલું';

  @override
  String get queuedReportPendingUpload => 'અપલોડ બાકી છે';

  @override
  String get queuedReportReadyToRetry => 'ફરી પ્રયાસ કરવા માટે તૈયાર';

  @override
  String get queuedReportWaitingForRetry => 'ફરી પ્રયાસની રાહ જોવાય છે';

  @override
  String get removeQueuedReportTitle => 'કતારમાં રહેલ રિપોર્ટ દૂર કરવો છે?';

  @override
  String get removeQueuedReportContent =>
      'આ ઑફલાઇન કૉપિ કાઢી નાખશે અને ભવિષ્યના પ્રયાસો રોકશે.';

  @override
  String get queuedReportRemoved => 'કતારમાં રહેલ રિપોર્ટ દૂર કર્યો';

  @override
  String get themeLight => 'લાઇટ';

  @override
  String get themeDark => 'ડાર્ક';

  @override
  String get themeSystem => 'સિસ્ટમ';

  @override
  String get notifications => 'સૂચનાઓ';

  @override
  String get logOutTitle => 'લૉગ આઉટ કરવું છે?';

  @override
  String get logOut => 'લૉગ આઉટ';

  @override
  String get similarReportExists =>
      'નજીકમાં સમાન રિપોર્ટ છે. અમે તમારો રિપોર્ટ તેમાં જોડી દીધો છે.';

  @override
  String get sendingReportsTooQuickly =>
      'તમે ખૂબ ઝડપથી રિપોર્ટ મોકલી રહ્યા છો. 30 સેકન્ડ રાહ જુઓ.';

  @override
  String get hourlyReportLimitReached =>
      'કલાક દીઠ રિપોર્ટની મર્યાદા પૂરી થઈ. પછી પ્રયાસ કરો.';

  @override
  String get couldNotOpenMaps => 'નકશા ખોલી શકાયા નથી';

  @override
  String get navigate => 'નેવિગેટ કરો';

  @override
  String get reportDetailsNotAvailable => 'રિપોર્ટની વિગતો હજુ ઉપલબ્ધ નથી';

  @override
  String get viewQueue => 'કતાર જુઓ';

  @override
  String get achievements => 'સિદ્ધિઓ';

  @override
  String get leaderboard => 'લીડરબોર્ડ';

  @override
  String get chooseFromGallery => 'ગેલેરીમાંથી પસંદ કરો';

  @override
  String get downloadOfflineRegion => 'ઑફલાઇન વિસ્તાર ડાઉનલોડ કરો';

  @override
  String get radius => 'ત્રિજ્યા';

  @override
  String get download => 'ડાઉનલોડ';

  @override
  String get deleteRegionTitle => 'વિસ્તાર દૂર કરવો છે?';

  @override
  String deleteRegionContent(Object name, Object count) {
    return '\"$name\" અને તેની $count કેશ્ડ ટાઇલ્સને દૂર કરવી છે?';
  }

  @override
  String get delete => 'દૂર કરો';

  @override
  String get media => 'મીડિયા';

  @override
  String get failedToLoadImage => 'ચિત્ર લોડ કરવામાં નિષ્ફળ';

  @override
  String get unsupportedMediaType => 'અસમર્થિત મીડિયા પ્રકાર';

  @override
  String get noVerifiedRiskZones =>
      'આ વિસ્તારમાં હજુ કોઈ ચકાસાયેલ જોખમી ક્ષેત્રો નથી.';

  @override
  String get filterAllHazards => 'બધા જોખમો';

  @override
  String get filterRipCurrent => 'રિપ કરંટ';

  @override
  String get filterPollution => 'પ્રદૂષણ';

  @override
  String get filterEarthquake => 'ભૂકંપ';

  @override
  String get mobileNumberHint => '12345 67890';

  @override
  String distanceInKm(Object r) {
    return '$r કિમી';
  }

  @override
  String get filterCommunity => 'સમુદાય';

  @override
  String get filterMySubmitted => 'મારું સબમિટ કરેલ';

  @override
  String get noReportsYet => 'હજુ કોઈ રિપોર્ટ નથી';

  @override
  String get noSubmittedReportsYet => 'હજુ સુધી કોઈ રિપોર્ટ સબમિટ કરાયો નથી';

  @override
  String failedToLoadAdvisory(String error) {
    return 'Failed to load advisory: $error';
  }

  @override
  String get advisoryNotFound => 'એડવાઈઝરી મળી નથી.';

  @override
  String distanceKmAway(String km) {
    return '$km km away';
  }

  @override
  String distanceMAway(String m) {
    return '$m મીટર દૂર';
  }

  @override
  String get low => 'નીચું';

  @override
  String get justNow => 'હમણાં જ';

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
  String get leaderboardTitle => 'લીડરબોર્ડ';

  @override
  String error(String errorMsg) {
    return 'ભૂલ: $errorMsg';
  }

  @override
  String get noLeaderboardData => 'હજુ સુધી કોઈ લીડરબોર્ડ ડેટા નથી';

  @override
  String get startReportingToClimb => 'રેન્ક પર ચઢવા માટે જાણ કરવાનું શરૂ કરો!';

  @override
  String pointsAbbrev(int points) {
    return '$points pts';
  }

  @override
  String reportCountDesc(int count) {
    return '$count reports';
  }

  @override
  String get you => 'તમે';

  @override
  String get achievementsTitle => 'સિદ્ધિઓ';

  @override
  String get earnedBadges => 'મેળવેલ બેજ';

  @override
  String get lockedBadges => 'લૉક કરેલ બેજેસ';

  @override
  String get pointsHistory => 'પોઈન્ટ્સ ઈતિહાસ';

  @override
  String get totalPoints => 'કુલ પોઈન્ટ';

  @override
  String get verified => 'ચકાસાયેલ';

  @override
  String get rate => 'દર';

  @override
  String get badges => 'બેજ';

  @override
  String get submitFirstReportBadge =>
      'બેજ મેળવવા માટે તમારી પ્રથમ રિપોર્ટ સબમિટ કરો!';

  @override
  String get allBadgesEarned => '🎉 બધા બેજ કમાયા!';

  @override
  String get noPointsHistoryYet => 'હજુ સુધી કોઈ પોઈન્ટ ઈતિહાસ નથી';

  @override
  String get earned => '✅ કમાયા!';

  @override
  String get notYetEarned => '🔒 હજી કમાયા નથી';

  @override
  String get ok => 'ઠીક છે';

  @override
  String get filterAllUrgencies => 'તમામ તાકીદ';

  @override
  String get filtersTitle => 'ફિલ્ટર્સ';

  @override
  String get timeRangeTitle => 'સમય શ્રેણી';

  @override
  String get twentyFourHours => '24 કલાક';

  @override
  String daysNumber(int days) {
    return '$days days';
  }

  @override
  String get showRiskZonesTitle => 'જોખમ ઝોન બતાવો';

  @override
  String get displayHazardHotspots => 'જોખમી હોટસ્પોટ્સ દર્શાવો';

  @override
  String get highRiskOnlyTitle => 'માત્ર ઉચ્ચ જોખમ';

  @override
  String get showOnlyCriticalReports => 'માત્ર જટિલ અહેવાલો બતાવો';

  @override
  String get mediaViewerTitle => 'મીડિયા દર્શક';

  @override
  String mediaViewerError(String error) {
    return 'Failed to load media: $error';
  }

  @override
  String get loadingText => 'લોડ કરી રહ્યું છે...';

  @override
  String urgencyLevelText(String level) {
    return '$level Urgency';
  }

  @override
  String get highRiskBadge => 'ઉચ્ચ જોખમ';

  @override
  String get mediaTitle => 'મીડિયા';

  @override
  String get playLabel => 'રમો';

  @override
  String get pauseLabel => 'વિરામ';

  @override
  String get notificationsTitle => 'સૂચનાઓ';

  @override
  String reportStatusTitle(String status) {
    return 'Report $status';
  }

  @override
  String reportStatusBody(String hazardType, String status) {
    return 'Your $hazardType report has been $status.';
  }

  @override
  String get noNotificationsYet => 'હજુ સુધી કોઈ સૂચનાઓ નથી';

  @override
  String get downloadOfflineRegionTitle => 'ઑફલાઇન પ્રદેશ ડાઉનલોડ કરો';

  @override
  String get downloadOfflineRegionDesc =>
      'ઑફલાઇન ઉપયોગ માટે તમારા વર્તમાન સ્થાનની આસપાસ નકશા ટાઇલ્સ ડાઉનલોડ કરે છે.';

  @override
  String get regionNameLabel => 'પ્રદેશનું નામ';

  @override
  String get radiusLabel => 'ત્રિજ્યા';

  @override
  String get cancelLabel => 'રદ કરો';

  @override
  String get downloadLabel => 'ડાઉનલોડ કરો';

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
  String get deleteLabel => 'કાઢી નાખો';

  @override
  String get offlineMapsTitle => 'ઑફલાઇન નકશા';

  @override
  String get downloadingTiles => 'ટાઇલ્સ ડાઉનલોડ કરી રહ્યાં છીએ...';

  @override
  String get offlineMapInfoDesc =>
      'તમે ઑનલાઇન જુઓ છો તે નકશા ટાઇલ્સ ઑફલાઇન ઉપયોગ માટે આપમેળે કૅશ કરવામાં આવે છે.સંપૂર્ણ ઑફલાઇન કવરેજ માટે પ્રદેશો ડાઉનલોડ કરો.';

  @override
  String get noOfflineRegionsYet => 'હજી સુધી કોઈ ઑફલાઇન પ્રદેશો નથી';

  @override
  String get tapToDownloadRegion => 'પ્રદેશ ડાઉનલોડ કરવા માટે + પર ટૅપ કરો';

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
      'પુનઃપ્રયાસની સ્થિતિ, ભૂલના કારણની સમીક્ષા કરો અને અટવાયેલી વસ્તુઓને અહીં દૂર કરો.';

  @override
  String get duplicateReportDetected =>
      'સમાન રિપોર્ટ પહેલેથી જ નજીકમાં અસ્તિત્વમાં છે.અમે તમારા સબમિશનને તેની સાથે લિંક કર્યું છે.';

  @override
  String get uploadTimelineCompleted =>
      'તમારી અપલોડ સમયરેખા પૂર્ણ અને સાચવવામાં આવી છે.';

  @override
  String get doneLabel => 'થઈ ગયું';

  @override
  String get rateLimitMinInterval =>
      'તમે ખૂબ ઝડપથી રિપોર્ટ્સ મોકલી રહ્યાં છો.કૃપા કરીને 30 સેકન્ડ રાહ જુઓ અને ફરી પ્રયાસ કરો.';

  @override
  String get rateLimitHourly =>
      'કલાકદીઠ રિપોર્ટ મર્યાદા પહોંચી.કૃપા કરીને પછીથી ફરી પ્રયાસ કરો.';

  @override
  String get uploadingReportTitle => 'તમારો રિપોર્ટ અપલોડ કરી રહ્યાં છીએ';

  @override
  String get preparingReportDesc => 'રિપોર્ટની વિગતો તૈયાર કરી રહ્યાં છીએ';

  @override
  String get reportDetailsUploaded => 'રિપોર્ટ વિગતો અપલોડ કરી';

  @override
  String get duplicateReportLinked =>
      'ડુપ્લિકેટ રિપોર્ટ મળ્યો, હાલના રિપોર્ટ સાથે લિંક કરેલ છે';

  @override
  String uploadedAttachmentCounter(int current, int total) {
    return 'Uploaded attachment $current/$total';
  }

  @override
  String get uploadingMedia => 'મીડિયા અપલોડ કરી રહ્યું છે';

  @override
  String get mediaUploadFailedQueued =>
      'મીડિયા અપલોડ નિષ્ફળ થયું, ફરી પ્રયાસ માટે કતારબદ્ધ';

  @override
  String get finalizingReport => 'અહેવાલને અંતિમ સ્વરૂપ આપી રહ્યું છે';

  @override
  String get pleaseWaitBeforeSending =>
      'અન્ય રિપોર્ટ મોકલતા પહેલા કૃપા કરીને રાહ જુઓ';

  @override
  String get hourlyReportLimitTitle => 'કલાકદીઠ રિપોર્ટ મર્યાદા પહોંચી';

  @override
  String uploadFailedError(String error) {
    return 'Upload failed: $error';
  }

  @override
  String get openQueueToReview =>
      'પુનઃપ્રયાસની સ્થિતિ, ભૂલનું કારણ અને અટવાયેલી વસ્તુઓને દૂર કરવા માટે કતાર ખોલો.';

  @override
  String get arcAbbr => 'એઆરસી';

  @override
  String get arcFull => 'ચેતવણી • અહેવાલ • સંકલન';

  @override
  String failedToTakePhoto(String error) {
    return 'Failed to take photo: $error';
  }

  @override
  String failedToPickPhoto(String error) {
    return 'Failed to pick photo: $error';
  }

  @override
  String get syncingQueuedReports => 'કતારબદ્ધ અહેવાલો સમન્વયિત કરી રહ્યાં છે';

  @override
  String preparingPendingReports(int count) {
    return 'Preparing $count pending report(s)';
  }

  @override
  String uploadingReportCount(int current, int total) {
    return 'Uploading report $current of $total';
  }

  @override
  String get uploadingAttachments => 'જોડાણો અપલોડ કરી રહ્યાં છીએ';

  @override
  String get reportUpdateTitle => 'રિપોર્ટ અપડેટ';

  @override
  String get aboutTransparencyBody =>
      'આ એપ્લિકેશન નાગરિકોને સમુદ્રના જોખમોની જાણ કરવામાં મદદ કરે છે અને સત્તાવાળાઓને વાસ્તવિક સમયની પરિસ્થિતિઓ સમજવામાં મદદ કરે છે.\n\nઅમે વ્યક્તિગત વિગતોના જાહેર સંપર્કને મર્યાદિત કરીને અને જાહેર દૃશ્યો માટે ગોપનીયતા-સલામત નકશા ડેટાનો ઉપયોગ કરીને ગોપનીયતાને પ્રાથમિકતા આપીએ છીએ.';

  @override
  String get privacyBody =>
      'અમે શું એકત્રિત કરીએ છીએ: તમારો ફોન (લૉગિન માટે), તમારું રિપોર્ટ વર્ણન, સમય અને સ્થાન.\n\nઅમે તેનો ઉપયોગ કેવી રીતે કરીએ છીએ: તમારો રિપોર્ટ સંગ્રહિત કરવા અને નકશા અને અપડેટ્સ ફીડ પર ચકાસાયેલ, ગોપનીયતા-સલામત માહિતી બતાવવા માટે.';

  @override
  String get reportSubmittedReason => 'રિપોર્ટ સબમિટ કરવામાં આવ્યો';

  @override
  String get reportVerifiedReason => 'રિપોર્ટ ચકાસાયેલ';

  @override
  String get highRiskVerifiedReason => 'ઉચ્ચ-જોખમ રિપોર્ટ ચકાસાયેલ';

  @override
  String get reportRejectedReason => 'રિપોર્ટ નકારવામાં આવ્યો';

  @override
  String get achievementsAndBadges => 'સિદ્ધિઓ અને બેજ';

  @override
  String get offlineMaps => 'ઑફલાઇન નકશા';

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
