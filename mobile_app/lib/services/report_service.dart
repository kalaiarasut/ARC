import 'package:flutter_image_compress/flutter_image_compress.dart';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:video_compress/video_compress.dart';
import '../core/supabase_config.dart';
import '../models/hazard_report.dart';
import 'device_id_service.dart';

class ReportService {
  final SupabaseClient _supabase = SupabaseConfig.client;
  final DeviceIdService _deviceIdService = DeviceIdService();

  bool _isImage(XFile file) {
    final mt = file.mimeType;
    if (mt != null && mt.startsWith('image/')) return true;
    final lower = file.name.toLowerCase();
    return lower.endsWith('.jpg') ||
        lower.endsWith('.jpeg') ||
        lower.endsWith('.png') ||
        lower.endsWith('.webp') ||
        lower.endsWith('.heic');
  }

  bool _isVideo(XFile file) {
    final mt = file.mimeType;
    if (mt != null && mt.startsWith('video/')) return true;
    final lower = file.name.toLowerCase();
    return lower.endsWith('.mp4') || lower.endsWith('.mov') || lower.endsWith('.mkv');
  }

  Future<XFile> _processMediaForUpload(XFile file) async {
    try {
      if (_isImage(file)) {
        final size = await file.length();
        if (size <= 500 * 1024) return file;

        final dir = await getTemporaryDirectory();
        final targetPath = p.join(
          dir.path,
          '${DateTime.now().millisecondsSinceEpoch}_compressed${p.extension(file.path)}',
        );

        final compressed = await FlutterImageCompress.compressAndGetFile(
          file.path,
          targetPath,
          quality: 70,
          minWidth: 1024,
          minHeight: 1024,
        );

        return compressed != null ? XFile(compressed.path) : file;
      }

      if (_isVideo(file)) {
        final size = await file.length();
        // Avoid re-encoding very small clips.
        if (size <= 3 * 1024 * 1024) return file;

        final info = await VideoCompress.compressVideo(
          file.path,
          quality: VideoQuality.MediumQuality,
          deleteOrigin: false,
          includeAudio: true,
        );

        final out = info?.file;
        if (out == null) return file;
        return XFile(out.path);
      }

      // Audio: recorded as AAC at low bitrate (already compressed).
      return file;
    } catch (_) {
      return file;
    }
  }

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
    // Prefer the anti-spam RPC if it exists.
    try {
      final deviceId = await _deviceIdService.getOrCreate();

      final response = await _supabase.rpc(
        'create_hazard_report',
        params: {
          'p_client_id': report.clientId,
          'p_user_phone': report.userPhone,
          'p_user_name': report.userName,
          'p_hazard_type': report.hazardType,
          'p_description': report.description,
          'p_latitude': report.latitude,
          'p_longitude': report.longitude,
          'p_is_high_risk': report.isHighRisk,
          'p_people_at_risk': report.peopleAtRisk,
          'p_urgency_level': report.urgencyLevel,
          'p_event_time': report.eventTime.toIso8601String(),
          'p_device_id': deviceId,
        },
      );

      if (response is String) return response;
      if (response is Map && response['id'] != null) return response['id'].toString();
      return response.toString();
    } on PostgrestException catch (e) {
      // If RPC isn't deployed yet, fall back to direct insert.
      final msg = e.message.toLowerCase();
      final details = (e.details ?? '').toString().toLowerCase();
      final isMissingRpc = msg.contains('create_hazard_report') || details.contains('create_hazard_report');

      if (isMissingRpc) {
        final response = await _supabase
            .from('hazard_reports')
            .insert(report.toJson())
            .select('id')
            .single();
        return response['id'] as String;
      }

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
    final originalName = file.name;
    final fileName = 'media_${safeIndex}_$originalName';
    final filePath = '$userId/$reportId/$fileName';

    try {
      final processed = await _processMediaForUpload(file);

      final finalSize = await processed.length();
      if (finalSize > 10 * 1024 * 1024) {
        throw Exception('File $originalName exceeds 10MB limit after compression');
      }

      // Read file bytes
      final bytes = await processed.readAsBytes();

      // Upload to Supabase Storage
      await _supabase.storage.from('hazard-media').uploadBinary(
            filePath,
            bytes,
            fileOptions: FileOptions(
              contentType: _contentTypeFallback(processed),
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

  /// Lightweight metadata fetch used by UI logic (duplicate/rate-limit messaging).
  Future<Map<String, dynamic>?> getReportMetaById(String reportId) async {
    final response = await _supabase
        .from('hazard_reports')
        .select('id, client_id, created_at, status')
        .eq('id', reportId)
        .maybeSingle();

    if (response == null) return null;
    return Map<String, dynamic>.from(response);
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

  /// Fetch a single report that belongs to the authenticated user.
  ///
  /// This relies on RLS: "Users can view own reports".
  Future<HazardReport> getOwnReportById({required String reportId}) async {
    final response = await _supabase.from('hazard_reports').select().eq('id', reportId).single();
    return HazardReport.fromJson(Map<String, dynamic>.from(response));
  }

  /// Fetch a privacy-safe, verified report detail view for public map.
  ///
  /// This requires a SECURITY DEFINER RPC (see `supabase/migrations/006_get_verified_report_details.sql`).
  Future<HazardReport> getVerifiedReportDetailsById({required String reportId}) async {
    final response = await _supabase.rpc(
      'get_verified_report_details',
      params: {
        'report_uuid': reportId,
      },
    );

    // Depending on client/runtime, RPC may return a single row as Map or as List<Map>.
    Map<String, dynamic>? json;
    if (response is Map) {
      json = response.map((k, v) => MapEntry(k.toString(), v));
    } else if (response is List && response.isNotEmpty) {
      final first = response.first;
      if (first is Map) {
        json = first.map((k, v) => MapEntry(k.toString(), v));
      }
    }

    if (json == null) {
      throw Exception('No verified report details found');
    }

    return HazardReport.fromPublicJson(json);
  }
}
