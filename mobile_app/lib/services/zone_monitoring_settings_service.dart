import 'package:shared_preferences/shared_preferences.dart';

class ZoneMonitoringSettingsService {
  static const String _keyEnabled = 'zone_monitoring_enabled';

  Future<bool> isEnabled() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(_keyEnabled) ?? false;
  }

  Future<void> setEnabled(bool enabled) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_keyEnabled, enabled);
  }
}
