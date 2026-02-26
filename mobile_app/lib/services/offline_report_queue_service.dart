import 'dart:io';
import 'dart:math';

import 'package:hive_flutter/hive_flutter.dart';
import 'package:image_picker/image_picker.dart';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';

import '../models/hazard_report.dart';

/// Offline-first queue for hazard reports + media.
///
/// Stores a durable job keyed by [HazardReport.clientId] so retries are idempotent.
class OfflineReportQueueService {
  static const String boxName = 'reportQueueBox';

  static const int maxAutoAttempts = 8;

  static Box<dynamic> _box() => Hive.box(boxName);

  static DateTime? _parseDateTime(dynamic value) {
    if (value is DateTime) return value;
    if (value is String) return DateTime.tryParse(value);
    return null;
  }

  static Duration _computeBackoff(int attempts) {
    // attempts: 1 => 30s, 2 => 60s, 3 => 120s ... capped.
    const baseSeconds = 30;
    const maxDelay = Duration(hours: 6);

    final exp = max(0, attempts - 1);
    final seconds = baseSeconds * pow(2, exp).toInt();
    final delay = Duration(seconds: seconds);

    // Small deterministic-ish jitter (0-15s) to avoid thundering herd.
    final jitterSeconds = min(15, attempts * 2);
    final jitter = Duration(seconds: jitterSeconds);

    final withJitter = delay + jitter;
    return withJitter > maxDelay ? maxDelay : withJitter;
  }

  static Map<String, dynamic> _asStringKeyedMap(dynamic value) {
    if (value is Map) {
      return value.map((k, v) => MapEntry(k.toString(), v));
    }
    return <String, dynamic>{};
  }

  /// Returns number of pending jobs.
  static int pendingCount() => _box().length;

  /// Enqueue a report for later upload.
  ///
  /// Copies media into app documents dir so it survives restarts.
  static Future<void> enqueue({
    required HazardReport report,
    required List<XFile> media,
    String? lastError,
  }) async {
    final jobKey = report.clientId;

    final existing = _box().get(jobKey);
    final existingMedia = <Map<String, dynamic>>[];
    if (existing is Map) {
      final rawMedia = existing['media'];
      if (rawMedia is List) {
        for (final item in rawMedia) {
          if (item is Map) {
            existingMedia.add(Map<String, dynamic>.from(item));
          }
        }
      }
    }

    final copiedMedia = await _copyMediaToPersistentStorage(report.clientId, media);

    // Merge existing + new, de-dupe by path.
    final merged = <Map<String, dynamic>>[];
    final seenPaths = <String>{};

    for (final item in [...existingMedia, ...copiedMedia]) {
      final path = item['path'] as String?;
      if (path == null) continue;
      if (seenPaths.add(path)) merged.add(item);
    }

    final attempts = existing is Map ? (existing['attempts'] as int? ?? 0) : 0;
    final existingNextAttemptAt = existing is Map ? _parseDateTime(existing['nextAttemptAt']) : null;

    await _box().put(jobKey, {
      'clientId': report.clientId,
      'attempts': attempts,
      'lastError': lastError,
      'lastErrorCode': existing is Map ? existing['lastErrorCode'] : null,
      'lastAttemptAt': existing is Map ? existing['lastAttemptAt'] : null,
      'nextAttemptAt': (existingNextAttemptAt ?? DateTime.now()).toIso8601String(),
      'createdAt': (existing is Map && existing['createdAt'] != null)
          ? existing['createdAt']
          : DateTime.now().toIso8601String(),
      'updatedAt': DateTime.now().toIso8601String(),
      'report': report.toQueueJson(),
      'media': merged,
    });
  }

  static bool isDue(Map<String, dynamic> job, {DateTime? now}) {
    final current = now ?? DateTime.now();
    final next = _parseDateTime(job['nextAttemptAt']);
    if (next == null) return true;
    return !next.isAfter(current);
  }

  static List<Map<String, dynamic>> getAllJobs() {
    final jobs = <Map<String, dynamic>>[];
    for (final key in _box().keys) {
      final value = _box().get(key);
      if (value is Map) {
        jobs.add(_asStringKeyedMap(value));
      }
    }
    return jobs;
  }

  static Future<void> remove(String clientId) async {
    await _box().delete(clientId);
  }

  static Future<void> incrementAttempts(
    String clientId, {
    String? lastError,
    String? lastErrorCode,
  }) async {
    final value = _box().get(clientId);
    if (value is! Map) return;

    final updated = _asStringKeyedMap(value);
    final attempts = (updated['attempts'] as int? ?? 0) + 1;
    updated['attempts'] = attempts;
    updated['lastError'] = lastError;
    updated['lastErrorCode'] = lastErrorCode;
    updated['lastAttemptAt'] = DateTime.now().toIso8601String();
    updated['nextAttemptAt'] = DateTime.now().add(_computeBackoff(attempts)).toIso8601String();
    updated['updatedAt'] = DateTime.now().toIso8601String();

    await _box().put(clientId, updated);
  }

  static Future<List<Map<String, dynamic>>> _copyMediaToPersistentStorage(
    String clientId,
    List<XFile> media,
  ) async {
    if (media.isEmpty) return const [];

    final docsDir = await getApplicationDocumentsDirectory();
    final targetDir = Directory(p.join(docsDir.path, 'queued_media', clientId));
    if (!await targetDir.exists()) {
      await targetDir.create(recursive: true);
    }

    final copied = <Map<String, dynamic>>[];
    for (var index = 0; index < media.length; index++) {
      final file = media[index];
      final ext = p.extension(file.path);
      final safeExt = ext.isEmpty ? '.bin' : ext;
      final targetPath = p.join(targetDir.path, 'media_${DateTime.now().millisecondsSinceEpoch}_$index$safeExt');

      try {
        await File(file.path).copy(targetPath);
        copied.add({
          'path': targetPath,
          'name': file.name,
          'mimeType': file.mimeType,
          'index': index,
        });
      } catch (_) {
        // If copy fails, fall back to original path (best-effort).
        copied.add({
          'path': file.path,
          'name': file.name,
          'mimeType': file.mimeType,
          'index': index,
        });
      }
    }

    return copied;
  }
}
