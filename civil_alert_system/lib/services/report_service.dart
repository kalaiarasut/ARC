import 'package:image_picker/image_picker.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../core/supabase_config.dart';
import '../models/hazard_report.dart';

class ReportService {
  final SupabaseClient _supabase = SupabaseConfig.client;

  String _contentTypeFallback(XFile file) {
    final mt = file.mimeType;
    if (mt != null && mt.isNotEmpty) return mt;

    final lower = file.name.toLowerCase();
    if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
    if (lower.endsWith('.png')) return 'image/png';
    if (lower.endsWith('.webp')) return 'image/webp';
    if (lower.endsWith('.heic')) return 'image/heic';
    if (lower.endsWith('.mp4')) return 'video/mp4';
    if (lower.endsWith('.mov')) return 'video/quicktime';
    if (lower.endsWith('.mp3')) return 'audio/mpeg';
    if (lower.endsWith('.wav')) return 'audio/wav';
    return 'application/octet-stream';
  }

  /// Phase 1: Insert report WITHOUT media
  /// Returns the DB-generated report ID
  Future<String> insertReport(HazardReport report) async {
    try {
      final response = await _supabase
          .from('hazard_reports')
          .insert(report.toJson())
          .select('id')
          .single();

      return response['id'] as String;
    } on PostgrestException catch (e) {
      // Check for duplicate client_id (idempotency)
      if (e.code == '23505') {
        // Unique violation - report already exists
        final existing = await _supabase
            .from('hazard_reports')
            .select('id')
            .eq('client_id', report.clientId)
            .single();
        return existing['id'] as String;
      }
      rethrow;
    }
  }

  /// Phase 2: Upload media file to Supabase Storage
  /// Returns the public URL
  Future<String> uploadMedia(
    XFile file,
    String reportId,
    String userId, {
    int? index,
  }) async {
    // Deterministic path helps retries be idempotent.
    final safeIndex = index ?? 0;
    final fileName = 'media_${safeIndex}_${file.name}';
    final filePath = '$userId/$reportId/$fileName';

    try {
      // Read file bytes
      final bytes = await file.readAsBytes();

      // Upload to Supabase Storage
      await _supabase.storage.from('hazard-media').uploadBinary(
            filePath,
            bytes,
            fileOptions: FileOptions(
              contentType: _contentTypeFallback(file),
              upsert: true,
            ),
          );

      // Get public URL
      final url = _supabase.storage.from('hazard-media').getPublicUrl(filePath);

      return url;
    } catch (e) {
      throw Exception('Failed to upload media: $e');
    }
  }

  /// Phase 3: Update report with media URLs and mark upload as complete
  Future<void> updateReportMedia(
    String reportId,
    List<String> mediaUrls,
  ) async {
    await _supabase.from('hazard_reports').update({
      'media_urls': mediaUrls,
      'upload_complete': true,
    }).eq('id', reportId);
  }

  /// Fetch recent reports (for Map page)
  Future<List<HazardReport>> getRecentReports({int limit = 50}) async {
    final response = await _supabase
        .from('hazard_reports')
        .select()
        .order('created_at', ascending: false)
        .limit(limit);

    return (response as List)
        .map((json) => HazardReport.fromJson(json))
        .toList();
  }

  /// Fetch the authenticated user's own reports (for Profile page)
  Future<List<HazardReport>> getMyReports({
    required String userId,
    int limit = 50,
  }) async {
    final response = await _supabase
        .from('hazard_reports')
        .select()
        .eq('user_id', userId)
        .order('created_at', ascending: false)
        .limit(limit);

    return (response as List)
        .map((json) => HazardReport.fromJson(json))
        .toList();
  }

  /// Get reports near a location (using PostGIS)
  Future<List<HazardReport>> getReportsNearLocation({
    required double latitude,
    required double longitude,
    required double radiusMeters,
    int limit = 50,
  }) async {
    // Use PostGIS ST_DWithin for radius query
    final response = await _supabase.rpc(
      'get_reports_near_location',
      params: {
        'lat': latitude,
        'lon': longitude,
        'radius_meters': radiusMeters,
        'result_limit': limit,
      },
    );

    return (response as List)
        .map((json) => HazardReport.fromJson(json))
        .toList();
  }
}
