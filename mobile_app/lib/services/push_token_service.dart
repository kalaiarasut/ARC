import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'device_id_service.dart';
import 'storage_service.dart';

class PushTokenService {
  SupabaseClient get _supabase => Supabase.instance.client;

  Future<void> upsertToken({
    required String token,
    required bool enabled,
  }) async {
    if (!Platform.isAndroid) return;

    final userId = _supabase.auth.currentUser?.id;
    if (userId == null) return;

    final deviceId = await DeviceIdService().getOrCreate();
    final now = DateTime.now().toIso8601String();
    final languageCode = _resolveLanguageCode();

    try {
      await _supabase.from('push_tokens').upsert(
        {
          'user_id': userId,
          'device_id': deviceId,
          'platform': 'android',
          'token': token,
          'enabled': enabled,
          'language_code': languageCode,
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

    final userId = _supabase.auth.currentUser?.id;
    if (userId == null) return;

    final deviceId = await DeviceIdService().getOrCreate();
    final now = DateTime.now().toIso8601String();
    final languageCode = _resolveLanguageCode();

    try {
      await _supabase
          .from('push_tokens')
          .update({
            'enabled': enabled,
            'language_code': languageCode,
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

    final userId = _supabase.auth.currentUser?.id;
    if (userId == null) return;

    final deviceId = await DeviceIdService().getOrCreate();
    final now = DateTime.now().toIso8601String();

    try {
      await _supabase
          .from('push_tokens')
          .update({
            'language_code': _normalizeLanguageCode(languageCode),
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

  String _resolveLanguageCode() {
    return _normalizeLanguageCode(StorageService.getLanguage() ?? 'en');
  }

  String _normalizeLanguageCode(String languageCode) {
    switch (languageCode.trim().toLowerCase()) {
      case 'ta':
      case 'hi':
      case 'te':
      case 'ml':
      case 'en':
        return languageCode.trim().toLowerCase();
      default:
        return 'en';
    }
  }
}
