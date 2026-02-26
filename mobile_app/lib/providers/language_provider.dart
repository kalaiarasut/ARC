import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter/widgets.dart';
import '../services/storage_service.dart';

// Language code provider (e.g., 'en', 'ta')
final languageCodeProvider = NotifierProvider<LanguageCodeNotifier, String>(() {
  return LanguageCodeNotifier();
});

// Locale provider for MaterialApp
final localeProvider = Provider<Locale>((ref) {
  final code = ref.watch(languageCodeProvider);
  return Locale(code);
});

class LanguageCodeNotifier extends Notifier<String> {
  @override
  String build() {
    _loadLanguage();
    return 'en';
  }

  // Load saved language
  Future<void> _loadLanguage() async {
    final savedCode = StorageService.getLanguage();
    if (savedCode != null && savedCode.trim().isNotEmpty) {
      state = savedCode;
    }
  }

  // Set language code
  Future<void> setLanguageCode(String code) async {
    state = code;
    await StorageService.saveLanguage(code);
  }
}
