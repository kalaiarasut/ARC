import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:latlong2/latlong.dart';

import '../core/supabase_config.dart';
import '../models/official_advisory.dart';

class AdvisoryService {
  final SupabaseClient _supabase = SupabaseConfig.client;

  Future<List<OfficialAdvisory>> getLatest({
    int limit = 30,
    LatLng? userLocation,
  }) async {
    final safeLimit = limit < 1 ? 1 : limit;

    // If we have a user location, fetch a bigger window so distance-sorting has
    // enough candidates. Then we sort and take the closest `safeLimit`.
    final fetchLimit = userLocation == null ? safeLimit : (safeLimit < 120 ? 120 : safeLimit);

    final response = await _supabase
        .from('official_advisories')
        .select()
        .order('published_at', ascending: false)
        .limit(fetchLimit);

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
