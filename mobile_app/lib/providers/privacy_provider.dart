import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

final privacySettingsProvider = NotifierProvider<PrivacySettingsNotifier, PrivacySettings>(() {
  return PrivacySettingsNotifier();
});

class PrivacySettings {
  final bool reduceMapPrecision;

  const PrivacySettings({required this.reduceMapPrecision});

  PrivacySettings copyWith({bool? reduceMapPrecision}) {
    return PrivacySettings(
      reduceMapPrecision: reduceMapPrecision ?? this.reduceMapPrecision,
    );
  }
}

class PrivacySettingsNotifier extends Notifier<PrivacySettings> {
  static const _reducePrecisionKey = 'privacy_reduce_map_precision';

  @override
  PrivacySettings build() {
    _load();
    return const PrivacySettings(reduceMapPrecision: false);
  }

  Future<void> _load() async {
    final prefs = await SharedPreferences.getInstance();
    final value = prefs.getBool(_reducePrecisionKey);
    if (value != null) {
      state = state.copyWith(reduceMapPrecision: value);
    }
  }

  Future<void> setReduceMapPrecision(bool value) async {
    state = state.copyWith(reduceMapPrecision: value);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_reducePrecisionKey, value);
  }
}
