import 'dart:io';

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

  static Box<dynamic> _box() => Hive.box(boxName);

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
    final List<Map<String, dynamic>> existingMedia = existing is Map
        ? List<Map<String, dynamic>>.from((existing['media'] as List?) ?? const [])
        : <Map<String, dynamic>>[];

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

    await _box().put(jobKey, {
      'clientId': report.clientId,
      'attempts': attempts,
      'lastError': lastError,
      'createdAt': (existing is Map && existing['createdAt'] != null)
          ? existing['createdAt']
          : DateTime.now().toIso8601String(),
      'updatedAt': DateTime.now().toIso8601String(),
      'report': report.toQueueJson(),
      'media': merged,
    });
  }

  static List<Map<String, dynamic>> getAllJobs() {
    final jobs = <Map<String, dynamic>>[];
    for (final key in _box().keys) {
      final value = _box().get(key);
      if (value is Map) {
        jobs.add(Map<String, dynamic>.from(value));
      }
    }
    return jobs;
  }

  static Future<void> remove(String clientId) async {
    await _box().delete(clientId);
  }

  static Future<void> incrementAttempts(String clientId, {String? lastError}) async {
    final value = _box().get(clientId);
    if (value is! Map) return;

    final updated = Map<String, dynamic>.from(value);
    updated['attempts'] = (updated['attempts'] as int? ?? 0) + 1;
    updated['lastError'] = lastError;
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
