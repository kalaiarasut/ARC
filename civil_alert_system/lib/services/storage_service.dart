import 'package:hive_flutter/hive_flutter.dart';

class StorageService {
  static const String _languageBox = 'languageBox';
  static const String _languageKey = 'selectedLanguage';
  static const String _reportQueueBox = 'reportQueueBox';

  // Initialize Hive
  static Future<void> initialize() async {
    await Hive.initFlutter();
    await Hive.openBox(_languageBox);
    await Hive.openBox(_reportQueueBox);
  }

  // Save selected language
  static Future<void> saveLanguage(String language) async {
    final box = Hive.box(_languageBox);
    await box.put(_languageKey, language);
  }

  // Get selected language
  static String? getLanguage() {
    final box = Hive.box(_languageBox);
    return box.get(_languageKey) as String?;
  }

  // Clear all data
  static Future<void> clearAll() async {
    final box = Hive.box(_languageBox);
    await box.clear();

    final reportQueue = Hive.box(_reportQueueBox);
    await reportQueue.clear();
  }
}
