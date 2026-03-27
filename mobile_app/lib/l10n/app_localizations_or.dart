// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Oriya (`or`).
class AppLocalizationsOr extends AppLocalizations {
  AppLocalizationsOr([String locale = 'or']) : super(locale);

  @override
  String get appTitle => 'ସିଭିଲ୍ ଆଲର୍ଟ ସିଷ୍ଟମ୍';

  @override
  String get profile => 'ପ୍ରୋଫାଇଲ୍';

  @override
  String get profileAndReports => 'ରିପୋର୍ଟସ୍';

  @override
  String get edit => 'ସମ୍ପାଦନ କରନ୍ତୁ';

  @override
  String get user => 'ଉପଯୋଗକର୍ତ୍ତା';

  @override
  String get phoneNotSet => 'ଫୋନ୍ ସେଟ୍ ହୋଇନାହିଁ';

  @override
  String get syncNow => 'ବର୍ତ୍ତମାନ ସିଙ୍କ୍ କରନ୍ତୁ';

  @override
  String get nothingToSync => 'ସିଙ୍କ୍ କରିବାକୁ କିଛି ନାହିଁ';

  @override
  String syncDone(Object succeeded, Object failed) {
    return 'ସିଙ୍କ୍ ଶେଷ ହେଲା: $succeeded ସଫଳ, $failed ବିଫଳ';
  }

  @override
  String get offlineReports => 'ଅଫଲାଇନ୍ ରିପୋର୍ଟସ୍';

  @override
  String get noPendingReports => 'କୌଣସି ପେଣ୍ଡିଂ ରିପୋର୍ଟ ନାହିଁ';

  @override
  String attemptsLabel(Object count) {
    return 'ଚେଷ୍ଟା: $count';
  }

  @override
  String get retry => 'ପୁଣି ଚେଷ୍ଟା କରନ୍ତୁ';

  @override
  String get remove => 'ହଟାନ୍ତୁ';

  @override
  String get myReports => 'ମୋର ରିପୋର୍ଟସ୍';

  @override
  String get noUploadedReportsYet => 'ଏପର୍ଯ୍ୟନ୍ତ କୌଣସି ରିପୋର୍ଟ ଅପଲୋଡ୍ ହୋଇନାହିଁ';

  @override
  String get failedToLoadReports => 'ରିପୋର୍ଟସ୍ ଲୋଡ୍ କରିବାରେ ବିଫଳ';

  @override
  String get youreOffline => 'ଆପଣ ଅଫଲାଇନ୍ ଅଛନ୍ତି';

  @override
  String get connectToInternetToLoadMyReports =>
      'ମୋର ରିପୋର୍ଟସ୍ ଦେଖିବାକୁ ଇଣ୍ଟରନେଟ୍ ସହିତ ସଂଯୋଗ କରନ୍ତୁ।';

  @override
  String get settings => 'ସେଟିଙ୍ଗସ୍';

  @override
  String get helpFaq => 'ସାହାଯ୍ୟ / FAQ';

  @override
  String get aboutTransparency => 'ବିଷୟ ଏବଂ ସ୍ୱଚ୍ଛତା';

  @override
  String get language => 'ଭାଷା';

  @override
  String get privacyControls => 'ଭାଷା ଏବଂ ଗୋପନୀୟତା ନିୟନ୍ତ୍ରଣ';

  @override
  String get privacy => 'ଗୋପନୀୟତା';

  @override
  String get chooseLanguage => 'ଭାଷା ବାଛନ୍ତୁ';

  @override
  String get save => 'ସେଭ୍ କରନ୍ତୁ';

  @override
  String get continueLabel => 'ଆଗକୁ ବଢନ୍ତୁ';

  @override
  String get languageComingSoon => 'ଏହି ଭାଷା ଶୀଘ୍ର ଆସୁଛି।';

  @override
  String get updates => 'ଅପଡେଟ୍ସ୍';

  @override
  String pendingCount(Object count) {
    return '$count ପେଣ୍ଡିଂ';
  }

  @override
  String get noUpdatesYet => 'ଯାଏଁ କୌଣସି ଅପଡେଟ୍ ନାହିଁ';

  @override
  String get failedToLoadUpdates => 'ଅପଡେଟ୍ସ୍ ଲୋଡ୍ କରିବାରେ ବିଫଳ';

  @override
  String get helpTitle => 'ସାହାଯ୍ୟ / FAQ';

  @override
  String get aboutTitle => 'ବିଷୟ ଏବଂ ସ୍ୱଚ୍ଛତା';

  @override
  String get privacyTitle => 'ଗୋପନୀୟତା ନିୟନ୍ତ୍ରଣ';

  @override
  String get privacyReducePrecisionTitle => 'ମ୍ୟାପ୍ ସ୍ଥାନ ସଠିକତା କମ୍ କରନ୍ତୁ';

  @override
  String get privacyReducePrecisionSubtitle =>
      'ଯଦି ସକ୍ଷମ ହୁଏ, ଆପଣଙ୍କର ରିପୋର୍ଟ ମେକର୍ସ୍ ମ୍ୟାପରେ କମ୍ ସଠିକତା ସହିତ ଦେଖାଇବ।';

  @override
  String get faqQ1 => 'ମୁଁ ବିପଦର ରିପୋର୍ଟ କିପରି କରିବି?';

  @override
  String get faqA1 =>
      'ରିପୋର୍ଟ ଖୋଲନ୍ତୁ, ଆପଣ ଯାହା ଦେଖୁଛନ୍ତି ତାହା ବର୍ଣ୍ଣନା କରନ୍ତୁ ଏବଂ ସବମିଟ୍ କରନ୍ତୁ।';

  @override
  String get faqQ2 => 'ମୁଁ ଗ୍ୟାଲେରିରୁ କାହିଁକି ଅପଲୋଡ୍ କରିପାରିବି ନାହିଁ?';

  @override
  String get faqA2 =>
      'ରିପୋର୍ଟ ବିଶ୍ୱସନୀୟ ରଖିବାକୁ, ଏହି ଆପ୍ କେବଳ ଲାଇଭ୍ କ୍ୟାପଚର୍ ଅନୁମତି ଦିଏ।';

  @override
  String get faqQ3 => 'ମୋର ସ୍ଥାନ କିପରି ବ୍ୟବହୃତ ହୁଏ?';

  @override
  String get faqA3 =>
      'କେଉଁଠି ବିପଦ ଘଟୁଛି ତାହା ବୁଝିବାରେ ଆପଣଙ୍କ ସ୍ଥାନ ସାହାଯ୍ୟ କରେ।';

  @override
  String get loginTitle => 'ଲଗ୍-ଇନ୍ / ସାଇନ୍-ଅପ୍';

  @override
  String get signUpWithMobile =>
      'ଆପଣଙ୍କ ପଞ୍ଜୀକୃତ ମୋବାଇଲ୍ ନମ୍ବର ସହିତ ସାଇନ୍ ଅପ୍ କରନ୍ତୁ';

  @override
  String get otpIntro =>
      'ଆପଣଙ୍କର ନମ୍ବର ଯାଞ୍ଚ କରିବାକୁ ଆମେ ଆପଣଙ୍କୁ ଏକ OTP ପଠାଇବୁ';

  @override
  String get mobileNumberLabel => 'ମୋବାଇଲ୍ ନମ୍ବର *';

  @override
  String get sendingLabel => 'ପଠାଯାଉଛି...';

  @override
  String get sendOtp => 'OTP ପଠାନ୍ତୁ';

  @override
  String get failedToSendOtp => 'OTP ପଠାଇବାରେ ବିଫଳ।';

  @override
  String get checkSupabasePhoneConfig => 'ସୁପରବେସ ଯାଞ୍ଚ କରନ୍ତୁ।';

  @override
  String get enterOtp => 'OTP ପ୍ରବେଶ କରନ୍ତୁ';

  @override
  String sentToNumber(Object mobileNumber) {
    return 'Sent to $mobileNumber';
  }

  @override
  String get pleaseEnter6DigitOtp => 'ଦୟାକରି 6-ଅଙ୍କ ବିଶିଷ୍ଟ OTP ପ୍ରବେଶ କରନ୍ତୁ';

  @override
  String get otpVerificationFailed => 'OTP ଯାଞ୍ଚ ବିଫଳ ହେଲା।';

  @override
  String signInFailedWithError(Object error) {
    return 'Sign-in failed: $error';
  }

  @override
  String get didntReceiveOtp => 'OTP ପାଇଲେ ନାହିଁ? ';

  @override
  String get otpResentSuccessfully => 'OTP ସଫଳତାର ସହ ପୁଣି ପଠାଯାଇଛି';

  @override
  String failedToResendOtpWithError(Object error) {
    return 'Failed to resend OTP: $error';
  }

  @override
  String get resendWithTimer => 'ପୁଣି ପଠାନ୍ତୁ (00:30)';

  @override
  String get savingLabel => 'ସେଭ୍ କରାଯାଉଛି...';

  @override
  String get signedInSuccessfully => 'ଆପଣ ସଫଳତାର ସହ\nଲଗ୍-ଇନ୍ କରିଛନ୍ତି';

  @override
  String get directingToDashboard =>
      'ଦୟାକରି ଅପେକ୍ଷା କରନ୍ତୁ, ଆମେ ଆପଣଙ୍କୁ ଡ୍ୟାସବୋର୍ଡକୁ ନେଇଯାଉଛୁ...';

  @override
  String get whatsYourName => 'ଆପଣଙ୍କର ନାମ କଣ?';

  @override
  String get personalizeExperience =>
      'ଆପଣଙ୍କ ଅନୁଭବକୁ ବ୍ୟକ୍ତିଗତ କରିବାକୁ ସାହାଯ୍ୟ କରନ୍ତୁ';

  @override
  String get enterYourName => 'ଆପଣଙ୍କର ନାମ ପ୍ରବେଶ କରନ୍ତୁ';

  @override
  String get pleaseEnterValidName =>
      'ଦୟାକରି ଏକ ବୈଧ ନାମ ପ୍ରବେଶ କରନ୍ତୁ (ସର୍ବନିମ୍ନ 2 ଅକ୍ଷର)';

  @override
  String get onboarding1Title => 'ବିପର୍ଯ୍ୟୟ ସମୟରେ\nଆପଣଙ୍କର ବିଶ୍ୱସ୍ତ ସାଥୀ';

  @override
  String get onboarding1Description =>
      'ରିୟଲ୍-ଟାଇମ୍ ଆଲର୍ଟ ପ୍ରାପ୍ତ କରନ୍ତୁ ଏବଂ ସମୁଦ୍ରର ବିପଦ ରିପୋର୍ଟ କରି ସୁରକ୍ଷା ପାଇଁ ସହଯୋଗ କରନ୍ତୁ।';

  @override
  String get onboarding2Title => 'ସୁରକ୍ଷା ବଢାନ୍ତୁ,\nଗୋଟିଏ ଗୋଟିଏ ପଦକ୍ଷେପ';

  @override
  String get onboarding2Description =>
      'ସମୁଦ୍ରକୁ ଦେଖୁଥିବା ଲୋକଙ୍କ ନେଟୱାର୍କରେ ଯୋଗ ଦିଅନ୍ତୁ ଏବଂ ବିପଦ ବିଷୟରେ ଜଣାନ୍ତୁ।';

  @override
  String get onboarding3Title => 'ପ୍ରସ୍ତୁତି ଏବେ\nଆପଣଙ୍କ ହାତରେ';

  @override
  String get onboarding3Description =>
      'ବିପଦର ରିପୋର୍ଟ କରନ୍ତୁ, ଜରୁରୀ ଆଲର୍ଟସ୍ ପ୍ରାପ୍ତ କରନ୍ତୁ ଏବଂ ସମୟ ଥାଉ ଥାଉ ସଚେତନ ରୁହନ୍ତୁ।';

  @override
  String get skip => 'ବାଦ ଦିଅନ୍ତୁ';

  @override
  String get splashTitle => 'ସିଭିଲ୍ ଆଲର୍ଟ';

  @override
  String get splashSubtitle => 'ସଠିକ୍ ବିପଦ ଅନୁସନ୍ଧାନ';

  @override
  String get hiWelcome => 'ହେଲୋ, ସ୍ୱାଗତମ୍ 👋';

  @override
  String get togetherForOceanSafety =>
      'ସମୁଦ୍ର ସୁରକ୍ଷା ପାଇଁ\nଆମେ ଏକାଠି,\nଶକ୍ତିଶାଳୀ';

  @override
  String get seeUpdates => 'ଅପଡେଟ୍ସ୍ ଦେଖନ୍ତୁ';

  @override
  String get unusualActivity => 'ରିପୋର୍ଟସ୍';

  @override
  String get seeAll => 'ସବୁ ଦେଖନ୍ତୁ';

  @override
  String get filterNow => 'ଏବେ';

  @override
  String get filterLastWeek => 'ଗତ ସପ୍ତାହରେ';

  @override
  String get filterLastMonth => 'ଗତ ମାସରେ';

  @override
  String get locationServicesOffTitle => 'ସ୍ଥାନ ସେବା ବନ୍ଦ ଅଛି';

  @override
  String get enableLocationServicesForReporting =>
      'ବିପଦ ରିପୋର୍ଟ କରିବାକୁ ଦୟାକରି ଲୋକେସନ ସେବା ଅନ୍ କରନ୍ତୁ।';

  @override
  String get enableLocationServicesForCurrentLocation =>
      'ଆପଣଙ୍କର ବର୍ତ୍ତମାନର ସ୍ଥାନ ଦେଖିବାକୁ GPS ଅନ୍ କରନ୍ତୁ।';

  @override
  String get permissionRequiredTitle => 'ଅନୁମତି ଦରକାର';

  @override
  String get locationPermissionDeniedAllowInSettings =>
      'ଲୋକେସନ ପାଇଁ ଅନୁମତି ଦିଆଯାଇନାହିଁ। ସେଟିଙ୍ଗ୍ସରେ ଅନୁମତି ଦିଅନ୍ତୁ।';

  @override
  String get locationPermissionDeniedAllowForCurrentLocation =>
      'ବର୍ତ୍ତମାନର ସ୍ଥାନ ଦେଖାଇବା ପାଇଁ ଅନୁମତି ଦିଅନ୍ତୁ।';

  @override
  String get locationPermissionBlockedEnableInSettings =>
      'ଲୋକେସନ ପାଇଁ ଅନୁମତି ବ୍ଳକ ଅଛି।';

  @override
  String get locationPermissionPermanentlyDeniedForReporting =>
      'ଲୋକେସନ ଅନୁମତି ସ୍ଥାୟୀ ଭାବରେ ନାମଞ୍ଜୁର କରାଯାଇଛି।';

  @override
  String get locationPermissionPermanentlyDeniedForCurrentLocation =>
      'ଲୋକେସନ ଅନୁମତି ସ୍ଥାୟୀ ଭାବରେ ବ୍ଳକ ଅଛି।';

  @override
  String get cancel => 'ବାତିଲ କରନ୍ତୁ';

  @override
  String get notNow => 'ଏବେ ନୁହେଁ';

  @override
  String get openSettings => 'ସେଟିଙ୍ଗସ୍ ଖୋଲନ୍ତୁ';

  @override
  String errorGettingLocationWithError(Object error) {
    return 'Error getting location: $error';
  }

  @override
  String get gettingLocation => 'ସ୍ଥାନ ପ୍ରାପ୍ତ ହେଉଛି...';

  @override
  String get gettingYourLocation => 'ଆପଣଙ୍କର ସ୍ଥାନ ପ୍ରାପ୍ତ ହେଉଛି...';

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
      'ଅଡିଓ ରେକର୍ଡ ହେଉଛି... ବନ୍ଦ କରିବାକୁ ପୁଣି ଟ୍ୟାପ୍ କରନ୍ତୁ।';

  @override
  String errorStartingAudioWithError(Object error) {
    return 'Error starting audio: $error';
  }

  @override
  String get pleaseSelectHazardType => 'ଦୟାକରି ଏକ ବିପଦର ପ୍ରକାର ବାଛନ୍ତୁ';

  @override
  String get pleaseDescribeSituation => 'ଦୟାକରି ପରିସ୍ଥିତି ବର୍ଣ୍ଣନା କରନ୍ତୁ';

  @override
  String get waitingForLocation => 'ସ୍ଥାନ ପାଇଁ ଅପେକ୍ଷା କରାଯାଉଛି...';

  @override
  String get pleaseEnterPeopleAtRisk =>
      'କେତେ ଲୋକ ବିପଦରେ ଅଛନ୍ତି ତାହାର ଆକଳନ ଲେଖନ୍ତୁ';

  @override
  String get noInternetReportQueued =>
      'ଇଣ୍ଟରନେଟ୍ ସଂଯୋଗ ନାହିଁ। ରିପୋର୍ଟ ସେଭ୍ ହୋଇ ରହିବ।';

  @override
  String get profileNeededTitle => 'ପ୍ରୋଫାଇଲ୍ ଦରକାର';

  @override
  String get profileNeededBody =>
      'ରିପୋର୍ଟ ଦାବା କରିବା ପୂର୍ବରୁ ଆପଣଙ୍କ ଫୋନ୍ ନମ୍ବର ଯୋଡ଼ନ୍ତୁ।';

  @override
  String get addNow => 'ଏବେ ଯୋଡନ୍ତୁ';

  @override
  String get reportSavedMediaUploadFailedRetry =>
      'ରିପୋର୍ଟ ସେଭ୍ ହେଲା! ମିଡିଆ ଅପଲୋଡ୍ ବିଫଳ, ପରେ ପୁଣି ଚେଷ୍ଟା କରାଯିବ।';

  @override
  String get reportSubmittedSuccessfully => 'ରିପୋର୍ଟ ସଫଳତାର ସହ ଦାଖଲ ହୋଇଛି! 🎉';

  @override
  String errorWithError(Object error) {
    return 'Error: $error';
  }

  @override
  String get retryGps => 'GPS ପୁନ ry ଚେଷ୍ଟା କରନ୍ତୁ |';

  @override
  String get reportHazard => 'ବିପଦର ରିପୋର୍ଟ କରନ୍ତୁ';

  @override
  String get whatAreYouSeeing => 'ଆପଣ କଣ ଦେଖୁଛନ୍ତି?';

  @override
  String get reportHelpsKeepSafe =>
      'ଆପଣଙ୍କର ରିପୋର୍ଟ ସମସ୍ତଙ୍କୁ ସୁରକ୍ଷିତ ରଖିବାରେ ସାହାଯ୍ୟ କରେ';

  @override
  String get hazardTypeRequired => 'ବିପଦର ପ୍ରକାର *';

  @override
  String get descriptionRequired => 'ବିବରଣୀ *';

  @override
  String get describeWhatYouSeeHint =>
      'ଆପଣ ଯାହା ଦେଖୁଛନ୍ତି ତାହା ବର୍ଣ୍ଣନା କରନ୍ତୁ...';

  @override
  String get location => 'ସ୍ଥାନ';

  @override
  String get time => 'ସಮಯ';

  @override
  String get addMediaOptional => 'ମିଡିଆ ଯୋଡନ୍ତୁ (ଇଚ୍ଛାଧୀନ)';

  @override
  String get camera => 'କ୍ୟାମେରା';

  @override
  String get record => 'ରେକର୍ଡ';

  @override
  String get recordAudio => 'ଅଡିଓ ରେକର୍ଡ କରନ୍ତୁ';

  @override
  String get stopAudio => 'ଅଡିଓ ବନ୍ଦ କରନ୍ତୁ';

  @override
  String get highRiskSituation => 'ଅଧିକ ବିପଦ ସ୍ଥିତି';

  @override
  String get peopleAtRiskEstimate => 'ବିପଦରେ ଥିବା ଲୋକଙ୍କ ସଂଖ୍ୟା (ଆକଳନ)';

  @override
  String get urgencyLow => 'କମ୍';

  @override
  String get urgencyMedium => 'ମଧ୍ୟମ';

  @override
  String get urgencyHigh => 'ଅଧିକ';

  @override
  String get submitReport => 'ରିପୋର୍ଟ ଦାଖଲ କରନ୍ତୁ';

  @override
  String get close => 'ବନ୍ଦ କରନ୍ତୁ';

  @override
  String get moreDetails => 'ଅଧିକ ବିବରଣୀ';

  @override
  String get hazardHighWaves => 'ଉଚ୍ଚ ଲହଡି';

  @override
  String get hazardTsunami => 'ସୁନାମି';

  @override
  String get hazardStorm => 'ଝଡ';

  @override
  String get hazardFlood => 'ବନ୍ୟା';

  @override
  String get hazardOther => 'ଅନ୍ୟାନ୍ୟ';

  @override
  String get homeTab => 'ହୋମ୍';

  @override
  String get mapTab => 'ମ୍ୟାପ୍';

  @override
  String get updatesTab => 'ଅପଡେଟ୍ସ୍';

  @override
  String get profileTab => 'ରିପୋର୍ଟସ୍';

  @override
  String get liveNews => 'ଲାଇଭ୍ ଖବର';

  @override
  String get sampleHazardHeadline => 'ପ୍ରଶାନ୍ତ ଉପକୂଳରେ ଉଚ୍ଚ ଲହଡ଼ି';

  @override
  String get sampleDate => 'ରବି, ୧୧ ଜୁନ୍ ୨୦୨୪';

  @override
  String get sampleTimeAgo => '୩ ମିନିଟ୍ ପୂର୍ବେ';

  @override
  String get queuedReportStuck => 'ଅଟକି ରହିଛି';

  @override
  String get queuedReportPendingUpload => 'ଅପଲୋଡ୍ ବାକି ଅଛି';

  @override
  String get queuedReportReadyToRetry => 'ପୁଣି ଚେଷ୍ଟା ପାଇଁ ପ୍ରସ୍ତୁତ';

  @override
  String get queuedReportWaitingForRetry => 'ପୁଣି ଚେଷ୍ଟା ପାଇଁ ଅପେକ୍ଷା କରାଯାଉଛି';

  @override
  String get removeQueuedReportTitle => 'ଧାଡ଼ିରେ ଥିବା ରିପୋର୍ଟ ହଟାଇବେ କି?';

  @override
  String get removeQueuedReportContent =>
      'ଏହା ଅଫଲାଇନ୍ କପି ଡିଲିଟ୍ କରିବ ଏବଂ ଭବିଷ୍ୟତ ଚେଷ୍ଟା ବନ୍ଦ କରିବ।';

  @override
  String get queuedReportRemoved => 'ଧାଡ଼ିରେ ଥିବା ରିପୋର୍ଟ ହଟାଗଲା';

  @override
  String get themeLight => 'ଲାଲ୍';

  @override
  String get themeDark => 'ଅନ୍ଧାର';

  @override
  String get themeSystem => 'ସିଷ୍ଟମ୍';

  @override
  String get notifications => 'ନୋଟିଫିକେସନ୍';

  @override
  String get logOutTitle => 'ଲଗ୍ ଆଉଟ୍ କରିବେ କି?';

  @override
  String get logOut => 'ଲଗ୍ ଆଉଟ୍';

  @override
  String get similarReportExists =>
      'ପାଖରେ ସମାନ ରିପୋର୍ଟ ଅଛି। ଆମେ ଆପଣଙ୍କ ରିପୋର୍ଟକୁ ଏହା ସହ ଯୋଡିଛୁ।';

  @override
  String get sendingReportsTooQuickly =>
      'ଆପଣ ବହୁତ ଶୀଘ୍ର ରିପୋର୍ଟ ପଠାଉଛନ୍ତି। ୩୦ ସେକେଣ୍ଡ୍ ଅପେକ୍ଷା କରନ୍ତୁ।';

  @override
  String get hourlyReportLimitReached =>
      'ଘଣ୍ଟାକିଆ ରିପୋର୍ଟ ସୀମା ଶେଷ। ପରେ ପୁଣି ଚେଷ୍ଟା କରନ୍ତୁ।';

  @override
  String get couldNotOpenMaps => 'ମ୍ୟାପ୍ ଖୋଲିପାରିଲୁ ନାହିଁ';

  @override
  String get navigate => 'ନେଭିଗେଟ୍ କରନ୍ତୁ';

  @override
  String get reportDetailsNotAvailable =>
      'ରିପୋର୍ଟ ବିବରଣୀ ଏପର୍ଯ୍ୟନ୍ତ ଉପଲବ୍ଧ ନାହିଁ';

  @override
  String get viewQueue => 'ଧାଡ଼ି ଦେଖନ୍ତୁ';

  @override
  String get achievements => 'ସଫଳତା';

  @override
  String get leaderboard => 'ଲିଡରବୋର୍ଡ';

  @override
  String get chooseFromGallery => 'ଗ୍ୟାଲେରୀରୁ ବାଛନ୍ତୁ';

  @override
  String get downloadOfflineRegion => 'ଅଫଲାଇନ୍ ଅଞ୍ଚଳ ଡାଉନଲୋଡ୍ କରନ୍ତୁ';

  @override
  String get radius => 'ବ୍ୟାସାର୍ଦ୍ଧ';

  @override
  String get download => 'ଡାଉନଲୋଡ୍';

  @override
  String get deleteRegionTitle => 'ଅଞ୍ଚଳ ଡିଲିଟ୍ କରିବେ କି?';

  @override
  String deleteRegionContent(Object name, Object count) {
    return '\"$name\" ଏବଂ ଏହାର $count କ୍ୟାସ୍ ଟାଇଲ୍ସ ଡିଲିଟ୍ କରିବେ?';
  }

  @override
  String get delete => 'ଡିଲିଟ୍ କରନ୍ତୁ';

  @override
  String get media => 'ମିଡିଆ';

  @override
  String get failedToLoadImage => 'ଚିତ୍ର ଲୋଡ୍ କରିବାରେ ବିଫଳ';

  @override
  String get unsupportedMediaType => 'ଅସମର୍ଥିତ ମିଡିଆ ପ୍ରକାର';

  @override
  String get noVerifiedRiskZones =>
      'ଏହି ଅଞ୍ଚଳରେ ଏପର୍ଯ୍ୟନ୍ତ କୌଣସି ପ୍ରମାଣିତ ବିପଦମୟ ସ୍ଥାନ ନାହିଁ।';

  @override
  String get filterAllHazards => 'ସମସ୍ତ ବିପଦ';

  @override
  String get filterRipCurrent => 'ରିପ୍ କରେଣ୍ଟ';

  @override
  String get filterPollution => 'ପ୍ରଦୂଷଣ';

  @override
  String get filterEarthquake => 'ଭୂମିକମ୍ପ';

  @override
  String get mobileNumberHint => '12345 67890';

  @override
  String distanceInKm(Object r) {
    return '$r କି.ମି.';
  }

  @override
  String get filterCommunity => 'ସମୁଦାୟ';

  @override
  String get filterMySubmitted => 'ମୋର ଦାଖଲ ହୋଇଥିବା';

  @override
  String get noReportsYet => 'ଏପର୍ଯ୍ୟନ୍ତ କୌଣସି ରିପୋର୍ଟ ନାହିଁ';

  @override
  String get noSubmittedReportsYet => 'ଏପର୍ଯ୍ୟନ୍ତ କୌଣସି ରିପୋର୍ଟ ଦାଖଲ ହୋଇନାହିଁ';

  @override
  String failedToLoadAdvisory(String error) {
    return 'Failed to load advisory: $error';
  }

  @override
  String get advisoryNotFound => 'ପରାମର୍ଶଦାତା ମିଳିଲା ନାହିଁ |';

  @override
  String distanceKmAway(String km) {
    return '$km km away';
  }

  @override
  String distanceMAway(String m) {
    return '$m m ଦୂରରେ |';
  }

  @override
  String get low => 'କମ୍';

  @override
  String get justNow => 'ବର୍ତ୍ତମାନ';

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
  String get leaderboardTitle => 'ଲିଡବୋର୍ଡ |';

  @override
  String error(String errorMsg) {
    return 'ତ୍ରୁଟି: $errorMsg';
  }

  @override
  String get noLeaderboardData =>
      'ଏପର୍ଯ୍ୟନ୍ତ କ leader ଣସି ଲିଡବୋର୍ଡ ତଥ୍ୟ ନାହିଁ |';

  @override
  String get startReportingToClimb =>
      'ରାଙ୍କ ଉପରକୁ ଚ to ିବା ପାଇଁ ରିପୋର୍ଟ କରିବା ଆରମ୍ଭ କରନ୍ତୁ!';

  @override
  String pointsAbbrev(int points) {
    return '$points pts';
  }

  @override
  String reportCountDesc(int count) {
    return '$count reports';
  }

  @override
  String get you => 'ତୁମେ';

  @override
  String get achievementsTitle => 'ସଫଳତା';

  @override
  String get earnedBadges => 'ରୋଜଗାର ବ୍ୟାଜ୍';

  @override
  String get lockedBadges => 'ଲକ୍ ବ୍ୟାଜ୍ |';

  @override
  String get pointsHistory => 'ପଏଣ୍ଟ ଇତିହାସ |';

  @override
  String get totalPoints => 'ମୋଟ ପଏଣ୍ଟ |';

  @override
  String get verified => 'ଯାଞ୍ଚ ହୋଇଛି |';

  @override
  String get rate => 'ହାର';

  @override
  String get badges => 'ବ୍ୟାଜ୍';

  @override
  String get submitFirstReportBadge =>
      'ଏକ ବ୍ୟାଜ୍ ରୋଜଗାର କରିବାକୁ ଆପଣଙ୍କର ପ୍ରଥମ ରିପୋର୍ଟ ଦାଖଲ କରନ୍ତୁ!';

  @override
  String get allBadgesEarned => '🎉 ସମସ୍ତ ବ୍ୟାଜ୍ ଅର୍ଜନ!';

  @override
  String get noPointsHistoryYet =>
      'ଏପର୍ଯ୍ୟନ୍ତ କ points ଣସି ବିନ୍ଦୁ ଇତିହାସ ନାହିଁ |';

  @override
  String get earned => 'ରୋଜଗାର!';

  @override
  String get notYetEarned => 'Yet ଏପର୍ଯ୍ୟନ୍ତ ରୋଜଗାର ହୋଇନାହିଁ |';

  @override
  String get ok => 'ଠିକ ଅଛି |';

  @override
  String get filterAllUrgencies => 'ସମସ୍ତ ଜରୁରୀକାଳୀନ ପରିସ୍ଥିତି |';

  @override
  String get filtersTitle => 'ଫିଲ୍ଟର୍ |';

  @override
  String get timeRangeTitle => 'ସମୟ ପରିସର |';

  @override
  String get twentyFourHours => '24 ଘଣ୍ଟା |';

  @override
  String daysNumber(int days) {
    return '$days days';
  }

  @override
  String get showRiskZonesTitle => 'ରିସ୍କ ଜୋନ୍ ଦେଖାନ୍ତୁ |';

  @override
  String get displayHazardHotspots => 'ବିପଜ୍ଜନକ ହଟସ୍ପଟ୍ ପ୍ରଦର୍ଶନ କରନ୍ତୁ |';

  @override
  String get highRiskOnlyTitle => 'କେବଳ ଉଚ୍ଚ ବିପଦ |';

  @override
  String get showOnlyCriticalReports => 'କେବଳ ଜଟିଳ ରିପୋର୍ଟଗୁଡିକ ଦେଖାନ୍ତୁ |';

  @override
  String get mediaViewerTitle => 'ମିଡିଆ ଭ୍ୟୁୟର୍ |';

  @override
  String mediaViewerError(String error) {
    return 'Failed to load media: $error';
  }

  @override
  String get loadingText => 'ଲୋଡିଂ ...';

  @override
  String urgencyLevelText(String level) {
    return '$level Urgency';
  }

  @override
  String get highRiskBadge => 'ଉଚ୍ଚ ବିପଦ';

  @override
  String get mediaTitle => 'ମିଡିଆ |';

  @override
  String get playLabel => 'ଖେଳନ୍ତୁ |';

  @override
  String get pauseLabel => 'ବିରାମ';

  @override
  String get notificationsTitle => 'ବିଜ୍ଞପ୍ତିଗୁଡିକ';

  @override
  String reportStatusTitle(String status) {
    return 'Report $status';
  }

  @override
  String reportStatusBody(String hazardType, String status) {
    return 'Your $hazardType report has been $status.';
  }

  @override
  String get noNotificationsYet =>
      'ଏପର୍ଯ୍ୟନ୍ତ କ ifications ଣସି ବିଜ୍ଞପ୍ତି ନାହିଁ |';

  @override
  String get downloadOfflineRegionTitle => 'ଅଫଲାଇନ୍ ଅଞ୍ଚଳ ଡାଉନଲୋଡ୍ କରନ୍ତୁ |';

  @override
  String get downloadOfflineRegionDesc =>
      'ଅଫଲାଇନ୍ ବ୍ୟବହାର ପାଇଁ ତୁମର ସାମ୍ପ୍ରତିକ ଅବସ୍ଥାନ ଚାରିପାଖରେ ମାନଚିତ୍ର ଟାଇଲ୍ ଡାଉନଲୋଡ୍ କରେ |';

  @override
  String get regionNameLabel => 'ଅଞ୍ଚଳ ନାମ';

  @override
  String get radiusLabel => 'ରେଡିଓ';

  @override
  String get cancelLabel => 'ବାତିଲ୍ କରନ୍ତୁ |';

  @override
  String get downloadLabel => 'ଡାଉନଲୋଡ୍ କରନ୍ତୁ |';

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
  String get deleteLabel => 'ବିଲୋପ କରନ୍ତୁ |';

  @override
  String get offlineMapsTitle => 'ଅଫଲାଇନ୍ ମାନଚିତ୍ରଗୁଡିକ |';

  @override
  String get downloadingTiles => 'ଟାଇଲ୍ ଡାଉନଲୋଡ୍ ...';

  @override
  String get offlineMapInfoDesc =>
      'ଆପଣ ଅନଲାଇନରେ ଦେଖୁଥିବା ମାନଚିତ୍ର ଟାଇଲଗୁଡିକ ଅଫଲାଇନ୍ ବ୍ୟବହାର ପାଇଁ ସ୍ୱୟଂଚାଳିତ ଭାବରେ କ୍ୟାଚ୍ ହୋଇଥାଏ |ସମ୍ପୂର୍ଣ୍ଣ ଅଫଲାଇନ୍ କଭରେଜ୍ ପାଇଁ ଅଞ୍ଚଳଗୁଡିକ ଡାଉନଲୋଡ୍ କରନ୍ତୁ |';

  @override
  String get noOfflineRegionsYet =>
      'ଏପର୍ଯ୍ୟନ୍ତ କ offline ଣସି ଅଫଲାଇନ୍ ଅଞ୍ଚଳ ନାହିଁ |';

  @override
  String get tapToDownloadRegion =>
      'ଏକ ଅଞ୍ଚଳ ଡାଉନଲୋଡ୍ କରିବାକୁ + ଟ୍ୟାପ୍ କରନ୍ତୁ |';

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
      'ପୁନ ret ଚେଷ୍ଟା ସ୍ଥିତି, ତ୍ରୁଟି କାରଣ ସମୀକ୍ଷା କରନ୍ତୁ ଏବଂ ଏଠାରେ ଅଟକି ରହିଥିବା ଆଇଟମଗୁଡିକ ଅପସାରଣ କରନ୍ତୁ |';

  @override
  String get duplicateReportDetected =>
      'ସେହିଭଳି ରିପୋର୍ଟ ନିକଟରେ ଅଛି |ଆମେ ତୁମର ଉପସ୍ଥାପନାକୁ ଏହା ସହିତ ଲିଙ୍କ୍ କରିଛୁ |';

  @override
  String get uploadTimelineCompleted =>
      'ତୁମର ଅପଲୋଡ୍ ଟାଇମଲାଇନ୍ ସମାପ୍ତ ହୋଇଛି ଏବଂ ସେଭ୍ ହୋଇଛି |';

  @override
  String get doneLabel => 'ସମାପ୍ତ';

  @override
  String get rateLimitMinInterval =>
      'ଆପଣ ବହୁତ ଶୀଘ୍ର ରିପୋର୍ଟ ପଠାଉଛନ୍ତି |ଦୟାକରି 30 ସେକେଣ୍ଡ ଅପେକ୍ଷା କରନ୍ତୁ ଏବଂ ପୁନର୍ବାର ଚେଷ୍ଟା କରନ୍ତୁ |';

  @override
  String get rateLimitHourly =>
      'ଘଣ୍ଟା ରିପୋର୍ଟ ସୀମା ପହଞ୍ଚିଛି |ଦୟାକରି ପରେ ପୁନର୍ବାର ଚେଷ୍ଟା କରନ୍ତୁ |';

  @override
  String get uploadingReportTitle => 'ଆପଣଙ୍କର ରିପୋର୍ଟ ଅପଲୋଡ୍ କରୁଛି |';

  @override
  String get preparingReportDesc => 'ରିପୋର୍ଟ ବିବରଣୀ ପ୍ରସ୍ତୁତ କରୁଛି |';

  @override
  String get reportDetailsUploaded =>
      'ଅପଲୋଡ୍ ହୋଇଥିବା ବିବରଣୀଗୁଡିକ ରିପୋର୍ଟ କରନ୍ତୁ |';

  @override
  String get duplicateReportLinked =>
      'ନକଲି ରିପୋର୍ଟ ଚିହ୍ନଟ ହୋଇଛି, ବିଦ୍ୟମାନ ରିପୋର୍ଟ ସହିତ ଲିଙ୍କ୍ ହୋଇଛି |';

  @override
  String uploadedAttachmentCounter(int current, int total) {
    return 'Uploaded attachment $current/$total';
  }

  @override
  String get uploadingMedia => 'ମିଡିଆ ଅପଲୋଡ୍ କରୁଛି |';

  @override
  String get mediaUploadFailedQueued =>
      'ମିଡିଆ ଅପଲୋଡ୍ ବିଫଳ ହେଲା, ପୁନ ry ଚେଷ୍ଟା ପାଇଁ ଧାଡିରେ |';

  @override
  String get finalizingReport => 'ଅନ୍ତିମ ରିପୋର୍ଟ';

  @override
  String get pleaseWaitBeforeSending =>
      'ଅନ୍ୟ ଏକ ରିପୋର୍ଟ ପଠାଇବା ପୂର୍ବରୁ ଦୟାକରି ଅପେକ୍ଷା କରନ୍ତୁ |';

  @override
  String get hourlyReportLimitTitle => 'ଘଣ୍ଟା ରିପୋର୍ଟ ସୀମା ପହଞ୍ଚିଛି |';

  @override
  String uploadFailedError(String error) {
    return 'Upload failed: $error';
  }

  @override
  String get openQueueToReview =>
      'ପୁନ ry ଚେଷ୍ଟା, ତ୍ରୁଟି କାରଣ, ଏବଂ ଅଟକି ରହିଥିବା ଆଇଟମଗୁଡିକ ଅପସାରଣ କରିବାକୁ ଧାଡି ଖୋଲ |';

  @override
  String get arcAbbr => 'ARC';

  @override
  String get arcFull => 'ଆଲର୍ଟ • ରିପୋର୍ଟ • ସମନ୍ୱୟ |';

  @override
  String failedToTakePhoto(String error) {
    return 'Failed to take photo: $error';
  }

  @override
  String failedToPickPhoto(String error) {
    return 'Failed to pick photo: $error';
  }

  @override
  String get syncingQueuedReports => 'ଧାଡି ରିପୋର୍ଟଗୁଡିକ ସିଙ୍କ୍ କରୁଛି |';

  @override
  String preparingPendingReports(int count) {
    return 'Preparing $count pending report(s)';
  }

  @override
  String uploadingReportCount(int current, int total) {
    return 'Uploading report $current of $total';
  }

  @override
  String get uploadingAttachments => 'ସଂଲଗ୍ନଗୁଡିକ ଅପଲୋଡ୍ କରୁଛି |';

  @override
  String get reportUpdateTitle => 'ଅଦ୍ୟତନ ରିପୋର୍ଟ କରନ୍ତୁ |';

  @override
  String get aboutTransparencyBody =>
      'ଏହି ଆପ୍ ନାଗରିକମାନଙ୍କୁ ସମୁଦ୍ର ବିପଦ ରିପୋର୍ଟ କରିବାରେ ସାହାଯ୍ୟ କରେ ଏବଂ କର୍ତ୍ତୃପକ୍ଷଙ୍କୁ ରିଅଲ୍-ଟାଇମ୍ ପରିସ୍ଥିତି ବୁଝିବାରେ ସାହାଯ୍ୟ କରେ।\n\nଆମେ ବ୍ୟକ୍ତିଗତ ବିବରଣୀର ସାର୍ବଜନୀନ ପ୍ରକାଶକୁ ସୀମିତ କରି ଏବଂ ସାର୍ବଜନୀନ ଦୃଶ୍ୟ ପାଇଁ ଗୋପନୀୟତା-ସୁରକ୍ଷିତ ମାନଚିତ୍ର ଡାଟା ବ୍ୟବହାର କରି ଗୋପନୀୟତାକୁ ପ୍ରାଧାନ୍ୟ ଦେଉ।';

  @override
  String get privacyBody =>
      'ଆମେ କ\'ଣ ସଂଗ୍ରହ କରୁ: ଆପଣଙ୍କ ଫୋନ୍ (ଲଗଇନ୍ ପାଇଁ), ଆପଣଙ୍କ ରିପୋର୍ଟ ବିବରଣୀ, ସମୟ ଏବଂ ସ୍ଥାନ।\n\nଆମେ ଏହାକୁ କିପରି ବ୍ୟବହାର କରୁ: ଆପଣଙ୍କ ରିପୋର୍ଟ ସଂରକ୍ଷଣ କରିବାକୁ ଏବଂ ମାନଚିତ୍ର ତଥା ଅପଡେଟ୍ ଫିଡରେ ଯାଞ୍ଚ ହୋଇଥିବା, ଗୋପନୀୟତା-ସୁରକ୍ଷିତ ତଥ୍ୟ ଦେଖାଇବାକୁ।';

  @override
  String get reportSubmittedReason => 'ରିପୋର୍ଟ ଦାଖଲ ହୋଇଛି';

  @override
  String get reportVerifiedReason => 'ରିପୋର୍ଟ ଯାଞ୍ଚ ହୋଇଛି';

  @override
  String get highRiskVerifiedReason => 'ଉଚ୍ଚ-ବିପଦ ରିପୋର୍ଟ ଯାଞ୍ଚ ହୋଇଛି';

  @override
  String get reportRejectedReason => 'ରିପୋର୍ଟ ପ୍ରତ୍ୟାଖ୍ୟାନ ହୋଇଛି';

  @override
  String get achievementsAndBadges => 'ସଫଳତା ଏବଂ ବ୍ୟାଜ୍';

  @override
  String get offlineMaps => 'ଅଫଲାଇନ୍ ମାନଚିତ୍ର';

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
