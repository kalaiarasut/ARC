import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter/widgets.dart';
import '../services/storage_service.dart';
import '../services/push_token_service.dart';

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
    final savedCode = StorageService.getLanguage();
    if (savedCode != null && savedCode.trim().isNotEmpty) {
      return savedCode.trim().toLowerCase();
    }
    return 'en';
  }

  // Set language code
  Future<void> setLanguageCode(String code) async {
    final normalizedCode = code.trim().toLowerCase();
    state = normalizedCode;
    await StorageService.saveLanguage(normalizedCode);
    await PushTokenService().syncLanguageCode(normalizedCode);
  }
}
