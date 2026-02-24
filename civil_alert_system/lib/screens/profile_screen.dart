import 'dart:async';
import 'dart:io';

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/material.dart';
import 'package:hive_flutter/hive_flutter.dart';

import '../core/supabase_config.dart';
import '../models/hazard_report.dart';
import '../models/citizen_stats.dart';
import '../services/offline_report_queue_service.dart';
import '../services/report_sync_service.dart';
import '../services/report_service.dart';
import '../services/gamification_service.dart';
import '../theme/app_colors.dart';
import '../l10n/l10n.dart';
import 'report_details_screen.dart';
import 'achievements_screen.dart';
import 'leaderboard_screen.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final ReportSyncService _syncService = ReportSyncService();
  final ReportService _reportService = ReportService();
  final GamificationService _gamificationService = GamificationService();

  Future<List<HazardReport>>? _myReportsFuture;

  bool _isOnline = true;
  StreamSubscription<List<ConnectivityResult>>? _connectivitySub;
  CitizenStats? _stats;

  @override
  void initState() {
    super.initState();
    _initConnectivity();
    _refreshMyReports();
    _loadStats();
  }

  Future<void> _initConnectivity() async {
    final initial = await Connectivity().checkConnectivity();
    if (!mounted) return;
    setState(() => _isOnline = !initial.contains(ConnectivityResult.none));

    _connectivitySub = Connectivity().onConnectivityChanged.listen((results) {
      final online = !results.contains(ConnectivityResult.none);
      if (!mounted) return;
      final changed = online != _isOnline;
      setState(() => _isOnline = online);
      if (changed && online) {
        _refreshMyReports();
      }
    });
  }

  @override
  void dispose() {
    _connectivitySub?.cancel();
    super.dispose();
  }

  void _refreshMyReports() {
    final userId = SupabaseConfig.client.auth.currentUser?.id;
    if (userId == null) {
      setState(() => _myReportsFuture = Future.value(const []));
      return;
    }

    // If we're offline, avoid throwing a DNS/Socket exception just to render the UI.
    if (!_isOnline) {
      setState(() => _myReportsFuture = Future.value(const []));
      return;
    }

    setState(() {
      _myReportsFuture = _reportService.getMyReports(userId: userId);
    });
  }

  Future<void> _loadStats() async {
    final userId = SupabaseConfig.client.auth.currentUser?.id;
    if (userId == null || !_isOnline) return;
    try {
      final stats = await _gamificationService.getCitizenStats(userId);
      if (!mounted) return;
      setState(() => _stats = stats);
    } catch (_) {
      // Non-critical, silently fail
    }
  }

  Future<void> _syncNow() async {
    final result = await _syncService.syncPendingReports(force: true);
    if (!mounted) return;

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          result.attempted == 0
              ? context.l10n.nothingToSync
              : context.l10n.syncDone(result.succeeded, result.failed),
        ),
        backgroundColor: result.failed == 0 ? AppColors.success : AppColors.warning,
      ),
    );

    _refreshMyReports();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF7F9FB),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios, color: AppColors.textPrimary),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          context.l10n.profileAndReports,
          style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold),
        ),
      ),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Gamification Stats Card
            if (_stats != null) ...[
              _buildGamificationCard(_stats!),
              const SizedBox(height: 16),
            ],
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: _syncNow,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primaryBlue,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      elevation: 0,
                    ),
                    icon: const Icon(Icons.sync),
                    label: Text(context.l10n.syncNow),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            Text(
              context.l10n.offlineReports,
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Expanded(
              child: ValueListenableBuilder(
                valueListenable: Hive.box(OfflineReportQueueService.boxName).listenable(),
                builder: (context, box, _) {
                  if (box.isEmpty) {
                    return Center(
                      child: Text(
                        context.l10n.noPendingReports,
                        style: const TextStyle(color: AppColors.textSecondary),
                      ),
                    );
                  }

                  final keys = box.keys.toList();
                  return ListView.builder(
                    itemCount: keys.length,
                    itemBuilder: (context, index) {
                      final key = keys[index];
                      final job = box.get(key);
                      if (job is! Map) return const SizedBox.shrink();

                      Map<String, dynamic> asStringKeyedMap(dynamic value) {
                        if (value is Map) {
                          return value.map(
                            (k, v) => MapEntry(k.toString(), v),
                          );
                        }
                        return <String, dynamic>{};
                      }

                      final jobMap = asStringKeyedMap(job);
                      final report = asStringKeyedMap(jobMap['report']);

                      final hazardType = report['hazardType']?.toString() ?? 'Unknown';
                      final description = report['description']?.toString() ?? '';
                      final attempts = (jobMap['attempts'] as num?)?.toInt() ?? 0;
                      final lastError = jobMap['lastError']?.toString();
                      final lastErrorCode = jobMap['lastErrorCode']?.toString();
                      final nextAttemptAtRaw = jobMap['nextAttemptAt']?.toString();
                      final nextAttemptAt = nextAttemptAtRaw == null ? null : DateTime.tryParse(nextAttemptAtRaw);

                      String friendlyReason(String? code) {
                        switch (code) {
                          case 'network':
                            return "Network error";
                          case 'timeout':
                            return "Request timed out";
                          case 'auth':
                            return "Login required";
                          case 'permission':
                            return "Permission denied";
                          case 'file_missing':
                            return "Missing media file";
                          case 'rate_limited':
                            return "Too many reports (rate limited)";
                          case 'duplicate':
                            return "Duplicate report detected";
                          case 'unknown':
                          default:
                            return "Upload failed";
                        }
                      }

                      return Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Expanded(
                                  child: Text(
                                    hazardType,
                                    style: const TextStyle(fontWeight: FontWeight.bold),
                                  ),
                                ),
                                Text(
                                  context.l10n.attemptsLabel(attempts),
                                  style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Text(
                              description,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(color: AppColors.textSecondary),
                            ),
                            if (lastError != null && lastError.trim().isNotEmpty) ...[
                              const SizedBox(height: 8),
                              if (lastErrorCode != null && lastErrorCode.trim().isNotEmpty)
                                Text(
                                  friendlyReason(lastErrorCode),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(color: AppColors.error, fontSize: 12, fontWeight: FontWeight.w700),
                                ),
                              Text(
                                lastError,
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(color: AppColors.error, fontSize: 12),
                              ),
                            ],
                            if (nextAttemptAt != null) ...[
                              const SizedBox(height: 6),
                              Text(
                                'Next retry: ${nextAttemptAt.toLocal()}'.split('.').first,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                              ),
                            ],
                            const SizedBox(height: 10),
                            Row(
                              children: [
                                TextButton.icon(
                                  onPressed: _syncNow,
                                  icon: const Icon(Icons.sync, size: 18),
                                  label: Text(context.l10n.retry),
                                ),
                                const Spacer(),
                                TextButton.icon(
                                  onPressed: () async {
                                    await OfflineReportQueueService.remove(key.toString());
                                  },
                                  icon: const Icon(Icons.delete_outline, size: 18),
                                  label: Text(context.l10n.remove),
                                  style: TextButton.styleFrom(foregroundColor: AppColors.error),
                                ),
                              ],
                            ),
                          ],
                        ),
                      );
                    },
                  );
                },
              ),
            ),
            const SizedBox(height: 16),
            Text(
              context.l10n.myReports,
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            SizedBox(
              height: 220,
              child: FutureBuilder<List<HazardReport>>(
                future: _myReportsFuture,
                builder: (context, snapshot) {
                  final data = snapshot.data;
                  if (snapshot.connectionState == ConnectionState.waiting) {
                    return const Center(child: CircularProgressIndicator());
                  }
                  if (snapshot.hasError) {
                    final err = snapshot.error;
                    final errText = err?.toString() ?? '';
                    final isNetworkError =
                        err is SocketException || errText.contains('SocketException') || errText.contains('Failed host lookup');
                    if (!_isOnline || isNetworkError) {
                      return Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              context.l10n.youreOffline,
                              style: const TextStyle(color: AppColors.textSecondary, fontWeight: FontWeight.w600),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              context.l10n.connectToInternetToLoadMyReports,
                              style: const TextStyle(color: AppColors.textSecondary),
                              textAlign: TextAlign.center,
                            ),
                            const SizedBox(height: 10),
                            TextButton.icon(
                              onPressed: _refreshMyReports,
                              icon: const Icon(Icons.refresh, size: 18),
                              label: Text(context.l10n.retry),
                            ),
                          ],
                        ),
                      );
                    }
                    return Center(
                      child: Text(
                        '${context.l10n.failedToLoadReports}: ${snapshot.error}',
                        style: const TextStyle(color: AppColors.textSecondary),
                      ),
                    );
                  }
                  if (data == null || data.isEmpty) {
                    return Center(
                      child: Text(
                        context.l10n.noUploadedReportsYet,
                        style: const TextStyle(color: AppColors.textSecondary),
                      ),
                    );
                  }

                  return ListView.separated(
                    itemCount: data.length,
                    separatorBuilder: (_, _) => const SizedBox(height: 8),
                    itemBuilder: (context, index) {
                      final report = data[index];
                      final hazardType = report.hazardType;
                      final status = report.status;
                      final createdAt = report.createdAt;

                      final statusColor = status == 'verified'
                          ? AppColors.success
                          : (status == 'resolved' ? AppColors.secondaryCyan : AppColors.warning);

                      return InkWell(
                        borderRadius: BorderRadius.circular(14),
                        onTap: () {
                          final reportId = report.id;
                          if (reportId == null || reportId.isEmpty) return;
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => ReportDetailsScreen(reportId: reportId, isOwnReport: true),
                            ),
                          );
                        },
                        child: Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(14),
                          ),
                          child: Row(
                            children: [
                              Container(
                                width: 10,
                                height: 10,
                                decoration: BoxDecoration(color: statusColor, shape: BoxShape.circle),
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(hazardType, style: const TextStyle(fontWeight: FontWeight.bold)),
                                    const SizedBox(height: 2),
                                    Text(
                                      '${createdAt.toLocal()}'.split('.').first,
                                      style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                                    ),
                                  ],
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                decoration: BoxDecoration(
                                  color: statusColor.withOpacity(0.12),
                                  borderRadius: BorderRadius.circular(999),
                                ),
                                child: Text(
                                  status,
                                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: statusColor),
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildGamificationCard(CitizenStats stats) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF088395), Color(0xFF05BFDB)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF088395).withOpacity(0.3),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          Row(
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '${stats.totalPoints} pts',
                    style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w800, color: Colors.white),
                  ),
                  if (stats.rank > 0)
                    Text(
                      'Rank #${stats.rank}',
                      style: const TextStyle(fontSize: 13, color: Colors.white70),
                    ),
                ],
              ),
              const Spacer(),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    '${stats.badges.length} badges',
                    style: const TextStyle(fontSize: 13, color: Colors.white),
                  ),
                  Text(
                    '${stats.verifiedCount} verified',
                    style: const TextStyle(fontSize: 13, color: Colors.white70),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () => Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const AchievementsScreen()),
                  ),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.white,
                    side: const BorderSide(color: Colors.white54),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    padding: const EdgeInsets.symmetric(vertical: 8),
                  ),
                  child: const Text('Achievements', style: TextStyle(fontSize: 13)),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: OutlinedButton(
                  onPressed: () => Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const LeaderboardScreen()),
                  ),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.white,
                    side: const BorderSide(color: Colors.white54),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    padding: const EdgeInsets.symmetric(vertical: 8),
                  ),
                  child: const Text('Leaderboard', style: TextStyle(fontSize: 13)),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
