import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'device_id_service.dart';
import 'storage_service.dart';
import 'zone_monitoring_settings_service.dart';

class PushTokenService {
  SupabaseClient get _supabase => Supabase.instance.client;

  Future<void> upsertToken({
    required String token,
    required bool enabled,
  }) async {
    if (!Platform.isAndroid) return;

    final userId = _supabase.auth.currentSession?.user.id ?? _supabase.auth.currentUser?.id;
    if (userId == null) return;

    final deviceId = await DeviceIdService().getOrCreate();
    final now = DateTime.now().toIso8601String();
    final languageCode = _resolveLanguageCode();
    final zoneMonitoringOptIn = await _resolveZoneMonitoringOptIn();

    try {
      await _supabase.from('push_tokens').upsert(
        {
          'user_id': userId,
          'device_id': deviceId,
          'platform': 'android',
          'token': token,
          'enabled': enabled,
          'language_code': languageCode,
          'zone_monitoring_opt_in': zoneMonitoringOptIn,
          'last_seen_at': now,
          'updated_at': now,
        },
        onConflict: 'user_id,device_id',
      );
    } catch (e) {
      if (kDebugMode) {
        // ignore: avoid_print
        print('Push token upsert failed: $e');
      }
    }
  }

  Future<void> setEnabled(bool enabled) async {
    if (!Platform.isAndroid) return;

    final userId = _supabase.auth.currentSession?.user.id ?? _supabase.auth.currentUser?.id;
    if (userId == null) return;

    final deviceId = await DeviceIdService().getOrCreate();
    final now = DateTime.now().toIso8601String();
    final languageCode = _resolveLanguageCode();
    final zoneMonitoringOptIn = await _resolveZoneMonitoringOptIn();

    try {
      await _supabase
          .from('push_tokens')
          .update({
            'enabled': enabled,
            'language_code': languageCode,
            'zone_monitoring_opt_in': zoneMonitoringOptIn,
            'last_seen_at': now,
            'updated_at': now,
          })
          .match({'user_id': userId, 'device_id': deviceId});
    } catch (e) {
      if (kDebugMode) {
        // ignore: avoid_print
        print('Push token enable/disable failed: $e');
      }
    }
  }

  Future<void> syncLanguageCode(String languageCode) async {
    if (!Platform.isAndroid) return;

    final userId = _supabase.auth.currentSession?.user.id ?? _supabase.auth.currentUser?.id;
    if (userId == null) return;

    final deviceId = await DeviceIdService().getOrCreate();
    final now = DateTime.now().toIso8601String();
    final zoneMonitoringOptIn = await _resolveZoneMonitoringOptIn();

    try {
      await _supabase
          .from('push_tokens')
          .update({
            'language_code': _normalizeLanguageCode(languageCode),
            'zone_monitoring_opt_in': zoneMonitoringOptIn,
            'last_seen_at': now,
            'updated_at': now,
          })
          .match({'user_id': userId, 'device_id': deviceId});
    } catch (e) {
      if (kDebugMode) {
        // ignore: avoid_print
        print('Push token language sync failed: $e');
      }
    }
  }

  Future<void> syncZoneMonitoringOptIn(bool enabled) async {
    if (!Platform.isAndroid) return;

    final userId = _supabase.auth.currentSession?.user.id ?? _supabase.auth.currentUser?.id;
    if (userId == null) return;

    final deviceId = await DeviceIdService().getOrCreate();
    final now = DateTime.now().toIso8601String();

    try {
      await _supabase
          .from('push_tokens')
          .update({
            'zone_monitoring_opt_in': enabled,
            'last_seen_at': now,
            'updated_at': now,
          })
          .match({'user_id': userId, 'device_id': deviceId});
    } catch (e) {
      if (kDebugMode) {
        // ignore: avoid_print
        print('Push token zone monitoring opt-in sync failed: $e');
      }
    }
  }

  String _resolveLanguageCode() {
    return _normalizeLanguageCode(StorageService.getLanguage() ?? 'en');
  }

  Future<bool> _resolveZoneMonitoringOptIn() {
    return ZoneMonitoringSettingsService().isEnabled();
  }

  String _normalizeLanguageCode(String languageCode) {
    switch (languageCode.trim().toLowerCase()) {
      case 'bn':
      case 'ta':
      case 'gu':
      case 'hi':
      case 'kn':
      case 'mr':
      case 'or':
      case 'te':
      case 'ml':
      case 'en':
        return languageCode.trim().toLowerCase();
      default:
        return 'en';
    }
  }
}
