import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/storage_service.dart';

// Language state provider
final languageProvider = NotifierProvider<LanguageNotifier, String>(() {
  return LanguageNotifier();
});

class LanguageNotifier extends Notifier<String> {
  @override
  String build() {
    _loadLanguage();
    return 'English';
  }

  // Load saved language
  Future<void> _loadLanguage() async {
    final savedLanguage = StorageService.getLanguage();
    if (savedLanguage != null) {
      state = savedLanguage;
    }
  }

  // Set language
  Future<void> setLanguage(String language) async {
    state = language;
    await StorageService.saveLanguage(language);
  }
}
