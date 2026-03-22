import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:latlong2/latlong.dart';

import '../core/supabase_config.dart';
import '../models/official_advisory.dart';
import 'storage_service.dart';

class AdvisoryService {
  final SupabaseClient _supabase = SupabaseConfig.client;
  static const _defaultLanguageCode = 'en';

  String _resolveLanguageCode(String? requestedLanguageCode) {
    final code = (requestedLanguageCode ?? StorageService.getLanguage() ?? _defaultLanguageCode).trim().toLowerCase();
    switch (code) {
      case 'ta':
      case 'hi':
      case 'te':
      case 'ml':
      case 'en':
        return code;
      default:
        return _defaultLanguageCode;
    }
  }

  Future<OfficialAdvisory?> getById(String advisoryId, {String? languageCode}) async {
    final id = advisoryId.trim();
    if (id.isEmpty) return null;

    final response = await _supabase.rpc(
      'get_official_advisory_localized',
      params: {
        'p_advisory_id': id,
        'p_language_code': _resolveLanguageCode(languageCode),
      },
    );

    if (response == null) return null;
    if (response is List) {
      if (response.isEmpty) return null;
      return OfficialAdvisory.fromJson(response.first as Map<String, dynamic>);
    }

    return OfficialAdvisory.fromJson(response as Map<String, dynamic>);
  }

  Future<List<OfficialAdvisory>> getLatest({
    int limit = 30,
    LatLng? userLocation,
    String? languageCode,
  }) async {
    final safeLimit = limit < 1 ? 1 : limit;
    final resolvedLanguageCode = _resolveLanguageCode(languageCode);

    // If we have a user location, fetch a bigger window so distance-sorting has
    // enough candidates. Then we sort and take the closest `safeLimit`.
    final fetchLimit = userLocation == null ? safeLimit : (safeLimit < 120 ? 120 : safeLimit);

    final response = await _supabase.rpc(
      'get_official_advisories_localized',
      params: {
        'p_language_code': resolvedLanguageCode,
        'p_limit': fetchLimit,
        'p_offset': 0,
      },
    );

    final items = (response as List)
        .map((json) => OfficialAdvisory.fromJson(json as Map<String, dynamic>))
        .toList();

    const distance = Distance();

    // Filter out advisories that are targeted by radius if user is outside it
    items.removeWhere((a) {
      if (a.radiusKm == null || a.latitude == null || a.longitude == null) return false;
      if (userLocation == null) return true; // Hide targeted advisories if location unknown
      final d = distance.as(LengthUnit.Meter, userLocation, LatLng(a.latitude!, a.longitude!));
      return d > (a.radiusKm! * 1000);
    });

    if (userLocation == null) {
      return items.take(safeLimit).toList();
    }

    double distMeters(OfficialAdvisory a) {
      final lat = a.latitude;
      final lon = a.longitude;
      if (lat == null || lon == null) return double.infinity;
      return distance.as(LengthUnit.Meter, userLocation, LatLng(lat, lon));
    }

    items.sort((a, b) {
      final da = distMeters(a);
      final db = distMeters(b);
      final cmp = da.compareTo(db);
      if (cmp != 0) return cmp;
      // Tie-breaker: newest first.
      return b.publishedAt.compareTo(a.publishedAt);
    });

    return items.take(safeLimit).toList();
  }
}
