import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../l10n/l10n.dart';
import '../models/map_marker_data.dart';
import '../providers/map_provider.dart';
import '../services/map_service.dart';
import '../theme/app_colors.dart';
import 'media_viewer_screen.dart';
import 'report_details_screen.dart';

enum _ReportWindow { now, week, month }

class ReportsScreen extends ConsumerStatefulWidget {
  const ReportsScreen({super.key});

  @override
  ConsumerState<ReportsScreen> createState() => _ReportsScreenState();
}

class _ReportsScreenState extends ConsumerState<ReportsScreen> {
  _ReportWindow _window = _ReportWindow.now;
  bool _loading = true;
  String? _error;
  List<MapMarkerData> _items = const [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  DateTime _sinceForWindow(_ReportWindow window) {
    final now = DateTime.now();
    switch (window) {
      case _ReportWindow.week:
        return now.subtract(const Duration(days: 7));
      case _ReportWindow.month:
        return now.subtract(const Duration(days: 30));
      case _ReportWindow.now:
        return now.subtract(const Duration(hours: 24));
    }
  }

  double _deltaDegreesForWindow(_ReportWindow window) {
    switch (window) {
      case _ReportWindow.week:
        return 1.8;
      case _ReportWindow.month:
        return 3.5;
      case _ReportWindow.now:
        return 0.9;
    }
  }

  Future<void> _load() async {
    try {
      setState(() {
        _loading = true;
        _error = null;
      });

      final loc = ref.read(userLocationProvider);
      double minLat = -90, maxLat = 90, minLon = -180, maxLon = 180;
      if (loc != null) {
        final d = _deltaDegreesForWindow(_window);
        minLat = (loc.latitude - d).clamp(-90, 90);
        maxLat = (loc.latitude + d).clamp(-90, 90);
        minLon = (loc.longitude - d).clamp(-180, 180);
        maxLon = (loc.longitude + d).clamp(-180, 180);
      }

      final items = await MapService().getReportsInBounds(
        minLat: minLat,
        maxLat: maxLat,
        minLon: minLon,
        maxLon: maxLon,
        limit: 200,
      );

      final since = _sinceForWindow(_window);
      final filtered = items.where((r) => r.timestamp.isAfter(since)).toList()
        ..sort((a, b) => b.timestamp.compareTo(a.timestamp));

      if (!mounted) return;
      setState(() {
        _items = filtered;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString();
        _items = const [];
      });
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Widget _filterChip(String label, bool selected, VoidCallback onTap) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
          decoration: BoxDecoration(
            color: selected ? AppColors.primaryBlue : Colors.white,
            borderRadius: BorderRadius.circular(20),
            border: selected ? null : Border.all(color: Colors.transparent),
          ),
          child: Row(
            children: [
              if (selected) ...[
                const Icon(Icons.notifications_active, color: Colors.white, size: 16),
                const SizedBox(width: 6),
              ],
              Text(
                label,
                style: TextStyle(
                  color: selected ? Colors.white : AppColors.textSecondary,
                  fontWeight: selected ? FontWeight.bold : FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      ),
    );
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
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: AppColors.textPrimary),
            onPressed: _loading ? null : _load,
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  _filterChip(context.l10n.filterNow, _window == _ReportWindow.now, () {
                    if (_window == _ReportWindow.now) return;
                    setState(() => _window = _ReportWindow.now);
                    _load();
                  }),
                  const SizedBox(width: 8),
                  _filterChip(context.l10n.filterLastWeek, _window == _ReportWindow.week, () {
                    if (_window == _ReportWindow.week) return;
                    setState(() => _window = _ReportWindow.week);
                    _load();
                  }),
                  const SizedBox(width: 8),
                  _filterChip(context.l10n.filterLastMonth, _window == _ReportWindow.month, () {
                    if (_window == _ReportWindow.month) return;
                    setState(() => _window = _ReportWindow.month);
                    _load();
                  }),
                ],
              ),
            ),
            const SizedBox(height: 16),
            if (_loading)
              const Expanded(
                child: Center(child: CircularProgressIndicator(color: AppColors.primaryBlue)),
              )
            else if (_error != null)
              Expanded(
                child: Center(
                  child: Text(
                    _error!,
                    textAlign: TextAlign.center,
                    style: const TextStyle(color: AppColors.textSecondary),
                  ),
                ),
              )
            else if (_items.isEmpty)
              Expanded(
                child: Center(
                  child: Text(
                    'No reports yet',
                    style: const TextStyle(color: AppColors.textSecondary),
                  ),
                ),
              )
            else
              Expanded(
                child: RefreshIndicator(
                  onRefresh: _load,
                  child: ListView.separated(
                    itemCount: _items.length,
                    separatorBuilder: (context, index) => const SizedBox(height: 12),
                    itemBuilder: (context, index) {
                      final r = _items[index];

                      final urls = r.mediaUrls;
                      final video = urls.firstWhere(
                        (u) => MediaViewerScreen.kindFromUrl(u) == MediaKind.video,
                        orElse: () => '',
                      );
                      final image = urls.firstWhere(
                        (u) => MediaViewerScreen.kindFromUrl(u) == MediaKind.image,
                        orElse: () => '',
                      );

                      Widget? preview;
                      if (video.isNotEmpty) {
                        preview = ClipRRect(
                          borderRadius: BorderRadius.circular(14),
                          child: Container(
                            height: 170,
                            width: double.infinity,
                            color: AppColors.greyOutline.withOpacity(0.22),
                            child: Stack(
                              fit: StackFit.expand,
                              children: [
                                Center(
                                  child: Icon(
                                    Icons.videocam,
                                    size: 44,
                                    color: AppColors.textPrimary.withOpacity(0.8),
                                  ),
                                ),
                                Positioned(
                                  right: 12,
                                  bottom: 12,
                                  child: Container(
                                    padding: const EdgeInsets.all(10),
                                    decoration: BoxDecoration(
                                      color: Colors.black.withOpacity(0.55),
                                      borderRadius: BorderRadius.circular(999),
                                    ),
                                    child: const Icon(Icons.play_arrow, size: 20, color: Colors.white),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        );
                      } else if (image.isNotEmpty) {
                        preview = ClipRRect(
                          borderRadius: BorderRadius.circular(14),
                          child: SizedBox(
                            height: 170,
                            width: double.infinity,
                            child: Image.network(
                              image,
                              fit: BoxFit.cover,
                              errorBuilder: (context, error, stackTrace) => Container(
                                color: AppColors.greyOutline.withOpacity(0.22),
                                child: const Icon(Icons.broken_image, color: AppColors.textSecondary),
                              ),
                            ),
                          ),
                        );
                      }

                      return InkWell(
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => ReportDetailsScreen(reportId: r.id, isOwnReport: false),
                            ),
                          );
                        },
                        borderRadius: BorderRadius.circular(18),
                        child: Container(
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(18),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              if (preview != null) ...[
                                preview,
                                const SizedBox(height: 12),
                              ],
                              Row(
                                children: [
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                    decoration: BoxDecoration(
                                      color: AppColors.primaryBlue.withOpacity(0.12),
                                      borderRadius: BorderRadius.circular(999),
                                    ),
                                    child: Text(
                                      r.urgencyLevel.toUpperCase(),
                                      style: const TextStyle(
                                        fontSize: 12,
                                        fontWeight: FontWeight.w700,
                                        color: AppColors.primaryBlue,
                                      ),
                                    ),
                                  ),
                                  const Spacer(),
                                  Text(
                                    '${r.timestamp.toLocal()}'.split('.').first,
                                    style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 10),
                              Text(
                                r.hazardType,
                                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                r.timeAgo,
                                style: const TextStyle(color: AppColors.textSecondary),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
