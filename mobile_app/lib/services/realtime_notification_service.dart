import 'dart:async';

import 'package:supabase_flutter/supabase_flutter.dart';

import '../core/supabase_config.dart';
import 'notification_service.dart';
import 'notification_settings_service.dart';

class RealtimeNotificationService {
  static final RealtimeNotificationService instance = RealtimeNotificationService._();
  RealtimeNotificationService._();

  final SupabaseClient _supabase = SupabaseConfig.client;
  final NotificationSettingsService _settings = NotificationSettingsService();

  RealtimeChannel? _advisoriesChannel;
  RealtimeChannel? _reportsChannel;
  StreamSubscription<AuthState>? _authSub;

  bool _started = false;

  Future<void> start() async {
    if (_started) return;
    _started = true;

    await NotificationService.instance.initialize();

    // Restart subscriptions on auth changes.
    _authSub = _supabase.auth.onAuthStateChange.listen((data) {
      // ignore: discarded_futures
      _restart();
    });

    await _restart();
  }

  Future<void> stop() async {
    _started = false;
    await _authSub?.cancel();
    _authSub = null;

    await _advisoriesChannel?.unsubscribe();
    await _reportsChannel?.unsubscribe();
    _advisoriesChannel = null;
    _reportsChannel = null;
  }

  Future<void> _restart() async {
    await _advisoriesChannel?.unsubscribe();
    await _reportsChannel?.unsubscribe();
    _advisoriesChannel = null;
    _reportsChannel = null;

    final enabled = await _settings.isEnabled();
    if (!enabled) return;

    final userId = _supabase.auth.currentUser?.id;

    // Advisories: notify on new advisory inserts.
    _advisoriesChannel = _supabase.channel('realtime:official_advisories');
    _advisoriesChannel!
        .onPostgresChanges(
          event: PostgresChangeEvent.insert,
          schema: 'public',
          table: 'official_advisories',
          callback: (payload) async {
            final row = payload.newRecord;
            final title = (row['title'] as String?) ?? 'New advisory';
            final severity = (row['severity'] as String?) ?? '';
            final region = (row['region'] as String?) ?? '';

            await NotificationService.instance.show(
              id: DateTime.now().millisecondsSinceEpoch.remainder(1 << 30),
              title: severity.isEmpty ? 'Advisory' : 'Advisory: ${severity.toUpperCase()}',
              body: region.isEmpty ? title : '$title ($region)',
            );
          },
        )
        .subscribe();

    // Report status changes: notify only for current user's reports.
    if (userId != null) {
      _reportsChannel = _supabase.channel('realtime:hazard_reports:$userId');
      _reportsChannel!
          .onPostgresChanges(
            event: PostgresChangeEvent.update,
            schema: 'public',
            table: 'hazard_reports',
            filter: PostgresChangeFilter(
              type: PostgresChangeFilterType.eq,
              column: 'user_id',
              value: userId,
            ),
            callback: (payload) async {
              final newRow = payload.newRecord;
              final oldRow = payload.oldRecord;

              final newStatus = newRow['status']?.toString();
              final oldStatus = oldRow['status']?.toString();
              if (newStatus == null || newStatus == oldStatus) return;

              final hazardType = (newRow['hazard_type'] as String?) ?? 'Report';

              await NotificationService.instance.show(
                id: DateTime.now().millisecondsSinceEpoch.remainder(1 << 30),
                title: 'Report update',
                body: '$hazardType is now ${newStatus.toUpperCase()}',
              );
            },
          )
          .subscribe();
    }
  }
}
