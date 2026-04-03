import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:latlong2/latlong.dart';
import 'package:video_player/video_player.dart';

import '../l10n/l10n.dart';
import '../models/hazard_report.dart';
import '../models/map_marker_data.dart';
import '../providers/map_provider.dart';
import '../core/supabase_config.dart';
import '../services/map_service.dart';
import '../services/report_service.dart';
import '../theme/app_colors.dart';
import 'media_viewer_screen.dart';
import 'report_details_screen.dart';

enum _ReportWindow { now, week, month }

enum _ReportsMode { community, mine }

class ReportsScreen extends ConsumerStatefulWidget {
  const ReportsScreen({super.key});

  @override
  ConsumerState<ReportsScreen> createState() => _ReportsScreenState();
}

class _ReportsScreenState extends ConsumerState<ReportsScreen> {
  _ReportWindow _window = _ReportWindow.now;
  _ReportsMode _mode = _ReportsMode.community;
  DateTime _selectedFilterDate = DateTime.now();
  bool _showWeekDaysDropdown = false;
  bool _showInlineCalendar = false;
  bool _loading = true;
  String? _error;
  List<MapMarkerData> _items = const [];
  List<HazardReport> _myItems = const [];
  final ReportService _reportService = ReportService();

  @override
  void initState() {
    super.initState();
    _load();
  }

  DateTime _sinceForWindow(_ReportWindow window) {
    final end = _endForWindow(window);
    switch (window) {
      case _ReportWindow.week:
        return end.subtract(const Duration(days: 7));
      case _ReportWindow.month:
        return end.subtract(const Duration(days: 30));
      case _ReportWindow.now:
        return end.subtract(const Duration(hours: 24));
    }
  }

  DateTime _endForWindow(_ReportWindow window) {
    if (window == _ReportWindow.now) return DateTime.now();
    return DateTime(
      _selectedFilterDate.year,
      _selectedFilterDate.month,
      _selectedFilterDate.day,
      23,
      59,
      59,
      999,
    );
  }

  String _formatFilterDate(DateTime date) {
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    return '${date.day} ${months[date.month - 1]} ${date.year}';
  }

  DateTime _startOfWeek(DateTime date) {
    final local = DateTime(date.year, date.month, date.day);
    final daysFromSunday = local.weekday % 7;
    return local.subtract(Duration(days: daysFromSunday));
  }

  String _fullMonthLabel(DateTime date) {
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    return '${months[date.month - 1]} ${date.year}';
  }

  Future<void> _pickWeekDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _selectedFilterDate,
      firstDate: DateTime.now().subtract(const Duration(days: 365 * 2)),
      lastDate: DateTime.now(),
      helpText: 'Select Week Date',
    );
    if (picked == null) return;
    setState(() => _selectedFilterDate = picked);
    _load();
  }

  Widget _buildWeekSelectorCard() {
    final weekStart = _startOfWeek(_selectedFilterDate);
    final days = List.generate(
      7,
      (index) => weekStart.add(Duration(days: index)),
    );
    const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    final today = DateTime.now();
    final canGoNextWeek =
        _startOfWeek(_selectedFilterDate.add(const Duration(days: 7))).isBefore(
          DateTime(
            today.year,
            today.month,
            today.day,
          ).add(const Duration(days: 1)),
        );

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(12, 10, 12, 10),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.greyOutline.withOpacity(0.35)),
      ),
      child: Column(
        children: [
          InkWell(
            borderRadius: BorderRadius.circular(12),
            onTap: () =>
                setState(() => _showWeekDaysDropdown = !_showWeekDaysDropdown),
            child: Row(
              children: [
                Icon(
                  Icons.view_week_outlined,
                  color: Theme.of(context).brightness == Brightness.dark
                      ? AppColors.darkTextSecondary
                      : AppColors.textSecondary,
                  size: 18,
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Week',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: Theme.of(context).brightness == Brightness.dark
                          ? AppColors.darkTextPrimary
                          : AppColors.textPrimary,
                    ),
                  ),
                ),
                Icon(
                  _showWeekDaysDropdown
                      ? Icons.keyboard_arrow_up
                      : Icons.keyboard_arrow_down,
                  color: Theme.of(context).brightness == Brightness.dark
                      ? AppColors.darkTextSecondary
                      : AppColors.textSecondary,
                ),
              ],
            ),
          ),
          if (_showWeekDaysDropdown) ...[
            const SizedBox(height: 10),
            Row(
              children: [
                IconButton(
                  visualDensity: VisualDensity.compact,
                  splashRadius: 18,
                  icon: Icon(
                    Icons.chevron_left,
                    color: Theme.of(context).brightness == Brightness.dark
                        ? AppColors.darkTextPrimary
                        : AppColors.textPrimary,
                  ),
                  onPressed: () {
                    setState(
                      () => _selectedFilterDate = _selectedFilterDate.subtract(
                        const Duration(days: 7),
                      ),
                    );
                    _load();
                  },
                ),
                Expanded(
                  child: Text(
                    _fullMonthLabel(_selectedFilterDate),
                    style: TextStyle(
                      fontSize: 17,
                      fontWeight: FontWeight.w700,
                      color: Theme.of(context).brightness == Brightness.dark
                          ? AppColors.darkTextPrimary
                          : AppColors.textPrimary,
                    ),
                  ),
                ),
                IconButton(
                  visualDensity: VisualDensity.compact,
                  splashRadius: 18,
                  icon: Icon(
                    Icons.calendar_today_outlined,
                    color: Theme.of(context).brightness == Brightness.dark
                        ? AppColors.darkTextSecondary
                        : AppColors.textSecondary,
                    size: 19,
                  ),
                  onPressed: _pickWeekDate,
                ),
                IconButton(
                  visualDensity: VisualDensity.compact,
                  splashRadius: 18,
                  icon: Icon(
                    Icons.chevron_right,
                    color: canGoNextWeek
                        ? AppColors.textPrimary
                        : AppColors.textSecondary.withOpacity(0.5),
                  ),
                  onPressed: canGoNextWeek
                      ? () {
                          final nextDate = _selectedFilterDate.add(
                            const Duration(days: 7),
                          );
                          final normalizedToday = DateTime(
                            today.year,
                            today.month,
                            today.day,
                          );
                          setState(
                            () => _selectedFilterDate =
                                nextDate.isAfter(normalizedToday)
                                ? normalizedToday
                                : nextDate,
                          );
                          _load();
                        }
                      : null,
                ),
              ],
            ),
            const SizedBox(height: 4),
            Row(
              children: List.generate(7, (index) {
                final day = days[index];
                final selected =
                    day.year == _selectedFilterDate.year &&
                    day.month == _selectedFilterDate.month &&
                    day.day == _selectedFilterDate.day;
                final isCurrentMonth = day.month == _selectedFilterDate.month;

                return Expanded(
                  child: InkWell(
                    borderRadius: BorderRadius.circular(16),
                    onTap: () {
                      setState(() => _selectedFilterDate = day);
                      _load();
                    },
                    child: Padding(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 2,
                        vertical: 4,
                      ),
                      child: Container(
                        height: 62,
                        decoration: BoxDecoration(
                          color: selected
                              ? AppColors.primaryBlue
                              : Colors.transparent,
                          borderRadius: BorderRadius.circular(14),
                          border: selected
                              ? null
                              : Border.all(
                                  color: AppColors.greyOutline.withOpacity(
                                    0.35,
                                  ),
                                ),
                        ),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              dayNames[index],
                              style: TextStyle(
                                fontSize: 12,
                                color: selected
                                    ? Colors.white
                                    : AppColors.textSecondary,
                                fontWeight: selected
                                    ? FontWeight.w700
                                    : FontWeight.w500,
                              ),
                            ),
                            const SizedBox(height: 5),
                            Text(
                              '${day.day}',
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: selected
                                    ? FontWeight.w700
                                    : FontWeight.w600,
                                color: selected
                                    ? Colors.white
                                    : (isCurrentMonth
                                          ? AppColors.textPrimary
                                          : AppColors.textSecondary.withOpacity(
                                              0.65,
                                            )),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                );
              }),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildMonthSelectorCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(12, 10, 12, 10),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(16),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () => setState(() => _showInlineCalendar = !_showInlineCalendar),
        child: Row(
          children: [
            Icon(
              Icons.calendar_today_outlined,
              color: Theme.of(context).brightness == Brightness.dark
                  ? AppColors.darkTextSecondary
                  : AppColors.textSecondary,
              size: 18,
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                'Date: ${_formatFilterDate(_selectedFilterDate)}',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: Theme.of(context).brightness == Brightness.dark
                      ? AppColors.darkTextPrimary
                      : AppColors.textPrimary,
                ),
              ),
            ),
            Icon(
              _showInlineCalendar
                  ? Icons.keyboard_arrow_up
                  : Icons.keyboard_arrow_down,
              color: Theme.of(context).brightness == Brightness.dark
                  ? AppColors.darkTextSecondary
                  : AppColors.textSecondary,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInlineMonthCalendar() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(16),
      ),
      child: CalendarDatePicker(
        initialDate: _selectedFilterDate,
        firstDate: DateTime.now().subtract(const Duration(days: 365 * 2)),
        lastDate: DateTime.now(),
        onDateChanged: (date) {
          setState(() => _selectedFilterDate = date);
          _load();
        },
      ),
    );
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

      if (_mode == _ReportsMode.mine) {
        final userId = SupabaseConfig.client.auth.currentSession?.user.id ?? SupabaseConfig.client.auth.currentUser?.id;
        if (userId == null) {
          if (!mounted) return;
          setState(() {
            _myItems = const [];
          });
          return;
        }

        final items = await _reportService.getMyReports(
          userId: userId,
          limit: 200,
        );
        final since = _sinceForWindow(_window);
        final filtered = items.where((r) => r.createdAt.isAfter(since)).toList()
          ..sort((a, b) => b.createdAt.compareTo(a.createdAt));

        if (!mounted) return;
        setState(() {
          _myItems = filtered;
        });
        return;
      }

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
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
          decoration: BoxDecoration(
            color: selected ? AppColors.primaryBlue : Colors.white,
            borderRadius: BorderRadius.circular(20),
            border: selected ? null : Border.all(color: Colors.transparent),
          ),
          child: Center(
            child: Text(
              label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                fontSize: 13,
                color: selected ? Colors.white : AppColors.textSecondary,
                fontWeight: selected ? FontWeight.bold : FontWeight.w600,
              ),
            ),
          ),
        ),
      ),
    );
  }

  String _shortDescription(String description) {
    final src = description.trim();
    if (src.isEmpty) return '';
    if (src.length <= 140) return src;
    return '${src.substring(0, 140).trimRight()}.....';
  }

  Widget _buildReportMediaPreview(
    MapMarkerData report, {
    required double height,
    double borderRadius = 16,
  }) {
    final urls = report.mediaUrls;
    final video = urls.firstWhere(
      (u) => MediaViewerScreen.kindFromUrl(u) == MediaKind.video,
      orElse: () => '',
    );
    final image = urls.firstWhere(
      (u) => MediaViewerScreen.kindFromUrl(u) == MediaKind.image,
      orElse: () => '',
    );

    if (video.isNotEmpty) {
      return _VideoReportThumbnail(
        videoUrl: video,
        fallbackImageUrl: image.isNotEmpty ? image : null,
        height: height,
        borderRadius: borderRadius,
      );
    }

    if (image.isNotEmpty) {
      return ClipRRect(
        borderRadius: BorderRadius.circular(borderRadius),
        child: SizedBox(
          height: height,
          width: double.infinity,
          child: Image.network(
            image,
            fit: BoxFit.cover,
            errorBuilder: (context, error, stackTrace) => Container(
              color: AppColors.greyOutline.withOpacity(0.22),
              child: Icon(
                Icons.broken_image,
                color: Theme.of(context).brightness == Brightness.dark
                    ? AppColors.darkTextSecondary
                    : AppColors.textSecondary,
              ),
            ),
          ),
        ),
      );
    }

    return ClipRRect(
      borderRadius: BorderRadius.circular(borderRadius),
      child: Container(
        height: height,
        width: double.infinity,
        color: AppColors.greyOutline.withOpacity(0.22),
        child: Icon(
          Icons.image_not_supported_outlined,
          color: Theme.of(context).brightness == Brightness.dark
              ? AppColors.darkTextPrimary
              : AppColors.textPrimary.withOpacity(0.7),
          size: 36,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: Icon(
            Icons.arrow_back_ios,
            color: Theme.of(context).brightness == Brightness.dark
                ? AppColors.darkTextPrimary
                : AppColors.textPrimary,
          ),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          context.l10n.profileAndReports,
          style: TextStyle(
            color: Theme.of(context).brightness == Brightness.dark
                ? AppColors.darkTextPrimary
                : AppColors.textPrimary,
            fontWeight: FontWeight.bold,
          ),
        ),
        actions: [
          IconButton(
            icon: Icon(
              Icons.refresh,
              color: Theme.of(context).brightness == Brightness.dark
                  ? AppColors.darkTextPrimary
                  : AppColors.textPrimary,
            ),
            onPressed: _loading ? null : _load,
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: _filterChip(
                    context.l10n.filterCommunity,
                    _mode == _ReportsMode.community,
                    () {
                      if (_mode == _ReportsMode.community) return;
                      setState(() => _mode = _ReportsMode.community);
                      _load();
                    },
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: _filterChip(
                    context.l10n.filterMySubmitted,
                    _mode == _ReportsMode.mine,
                    () {
                      if (_mode == _ReportsMode.mine) return;
                      setState(() => _mode = _ReportsMode.mine);
                      _load();
                    },
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: _filterChip(
                    context.l10n.filterNow,
                    _window == _ReportWindow.now,
                    () {
                      if (_window == _ReportWindow.now) return;
                      setState(() {
                        _window = _ReportWindow.now;
                        _showWeekDaysDropdown = false;
                        _showInlineCalendar = false;
                      });
                      _load();
                    },
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: _filterChip(
                    context.l10n.filterLastWeek,
                    _window == _ReportWindow.week,
                    () {
                      if (_window == _ReportWindow.week) return;
                      setState(() {
                        _window = _ReportWindow.week;
                        _showWeekDaysDropdown = false;
                        _showInlineCalendar = false;
                      });
                      _load();
                    },
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: _filterChip(
                    context.l10n.filterLastMonth,
                    _window == _ReportWindow.month,
                    () {
                      if (_window == _ReportWindow.month) return;
                      setState(() {
                        _window = _ReportWindow.month;
                        _showWeekDaysDropdown = false;
                      });
                      _load();
                    },
                  ),
                ),
              ],
            ),
            if (_window == _ReportWindow.week) ...[
              const SizedBox(height: 10),
              _buildWeekSelectorCard(),
            ] else if (_window == _ReportWindow.month) ...[
              const SizedBox(height: 10),
              _buildMonthSelectorCard(),
              if (_showInlineCalendar) ...[
                const SizedBox(height: 10),
                _buildInlineMonthCalendar(),
              ],
            ],
            const SizedBox(height: 16),
            if (_loading)
              const Expanded(
                child: Center(
                  child: CircularProgressIndicator(
                    color: AppColors.primaryBlue,
                  ),
                ),
              )
            else if (_error != null)
              Expanded(
                child: Center(
                  child: Text(
                    _error!,
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: Theme.of(context).brightness == Brightness.dark
                          ? AppColors.darkTextSecondary
                          : AppColors.textSecondary,
                    ),
                  ),
                ),
              )
            else if (_mode == _ReportsMode.community && _items.isEmpty)
              Expanded(
                child: Center(
                  child: Text(
                    context.l10n.noReportsYet,
                    style: TextStyle(
                      color: Theme.of(context).brightness == Brightness.dark
                          ? AppColors.darkTextSecondary
                          : AppColors.textSecondary,
                    ),
                  ),
                ),
              )
            else if (_mode == _ReportsMode.mine && _myItems.isEmpty)
              Expanded(
                child: Center(
                  child: Text(
                    context.l10n.noSubmittedReportsYet,
                    style: TextStyle(
                      color: Theme.of(context).brightness == Brightness.dark
                          ? AppColors.darkTextSecondary
                          : AppColors.textSecondary,
                    ),
                  ),
                ),
              )
            else
              Expanded(
                child: RefreshIndicator(
                  onRefresh: _load,
                  child: _mode == _ReportsMode.community
                      ? ListView.separated(
                          itemCount: _items.length,
                          separatorBuilder: (context, index) =>
                              const SizedBox(height: 12),
                          itemBuilder: (context, index) {
                            final r = _items[index];
                            final loc = ref.read(userLocationProvider);
                            String distanceText = '';
                            if (loc != null) {
                              final d = Distance();
                              final meters = d.as(
                                LengthUnit.Meter,
                                loc,
                                r.location,
                              );
                              distanceText = meters >= 1000
                                  ? '${(meters / 1000).toStringAsFixed(1)} km away'
                                  : '${meters.toStringAsFixed(0)} m away';
                            }

                            final urgency = r.urgencyLevel.trim();
                            final urgencyColor =
                                urgency.toLowerCase() == 'critical'
                                ? AppColors.error
                                : urgency.toLowerCase() == 'high'
                                ? AppColors.warning
                                : AppColors.primaryBlue;
                            final shortDescription = _shortDescription(
                              r.description,
                            );

                            return InkWell(
                              onTap: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (_) => ReportDetailsScreen(
                                      reportId: r.id,
                                      isOwnReport: false,
                                    ),
                                  ),
                                );
                              },
                              borderRadius: BorderRadius.circular(18),
                              child: Container(
                                decoration: BoxDecoration(
                                  color: Theme.of(context).cardColor,
                                  borderRadius: BorderRadius.circular(18),
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    _buildReportMediaPreview(
                                      r,
                                      height: 210,
                                      borderRadius: 18,
                                    ),
                                    Padding(
                                      padding: const EdgeInsets.fromLTRB(
                                        16,
                                        12,
                                        16,
                                        10,
                                      ),
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Row(
                                            children: [
                                              Container(
                                                padding:
                                                    const EdgeInsets.symmetric(
                                                      horizontal: 10,
                                                      vertical: 6,
                                                    ),
                                                decoration: BoxDecoration(
                                                  color: urgencyColor
                                                      .withOpacity(0.12),
                                                  borderRadius:
                                                      BorderRadius.circular(
                                                        999,
                                                      ),
                                                ),
                                                child: Text(
                                                  urgency.isEmpty
                                                      ? 'LOW'
                                                      : urgency.toUpperCase(),
                                                  style: TextStyle(
                                                    fontSize: 11,
                                                    fontWeight: FontWeight.w800,
                                                    color: urgencyColor,
                                                  ),
                                                ),
                                              ),
                                              const SizedBox(width: 10),
                                              Expanded(
                                                child: Text(
                                                  r.hazardType,
                                                  maxLines: 1,
                                                  overflow:
                                                      TextOverflow.ellipsis,
                                                  style: const TextStyle(
                                                    fontSize: 17,
                                                    fontWeight: FontWeight.bold,
                                                  ),
                                                ),
                                              ),
                                            ],
                                          ),
                                          if (shortDescription.isNotEmpty) ...[
                                            const SizedBox(height: 8),
                                            Text(
                                              shortDescription,
                                              maxLines: 2,
                                              overflow: TextOverflow.ellipsis,
                                              style: TextStyle(
                                                color:
                                                    Theme.of(
                                                          context,
                                                        ).brightness ==
                                                        Brightness.dark
                                                    ? AppColors
                                                          .darkTextSecondary
                                                    : AppColors.textSecondary,
                                              ),
                                            ),
                                          ],
                                          const SizedBox(height: 8),
                                          Row(
                                            children: [
                                              Text(
                                                r.timeAgo,
                                                style: TextStyle(
                                                  fontSize: 12,
                                                  color:
                                                      Theme.of(
                                                            context,
                                                          ).brightness ==
                                                          Brightness.dark
                                                      ? AppColors
                                                            .darkTextSecondary
                                                      : AppColors.textSecondary,
                                                ),
                                              ),
                                              const Spacer(),
                                              if (distanceText.isNotEmpty)
                                                Text(
                                                  distanceText,
                                                  style: TextStyle(
                                                    fontSize: 12,
                                                    color:
                                                        Theme.of(
                                                              context,
                                                            ).brightness ==
                                                            Brightness.dark
                                                        ? AppColors
                                                              .darkTextSecondary
                                                        : AppColors
                                                              .textSecondary,
                                                  ),
                                                ),
                                            ],
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        )
                      : ListView.separated(
                          itemCount: _myItems.length,
                          separatorBuilder: (context, index) =>
                              const SizedBox(height: 12),
                          itemBuilder: (context, index) {
                            final report = _myItems[index];
                            final status = report.status.toLowerCase();
                            final statusColor = status == 'verified'
                                ? AppColors.success
                                : (status == 'resolved'
                                      ? AppColors.secondaryCyan
                                      : AppColors.warning);

                            return InkWell(
                              onTap: () {
                                if (report.id == null || report.id!.isEmpty) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(
                                      content: Text(
                                        context.l10n.reportDetailsNotAvailable,
                                      ),
                                    ),
                                  );
                                  return;
                                }
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (_) => ReportDetailsScreen(
                                      reportId: report.id!,
                                      isOwnReport: true,
                                    ),
                                  ),
                                );
                              },
                              borderRadius: BorderRadius.circular(16),
                              child: Container(
                                padding: const EdgeInsets.all(14),
                                decoration: BoxDecoration(
                                  color: Theme.of(context).cardColor,
                                  borderRadius: BorderRadius.circular(16),
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        Expanded(
                                          child: Text(
                                            report.hazardType,
                                            style: const TextStyle(
                                              fontSize: 16,
                                              fontWeight: FontWeight.bold,
                                            ),
                                          ),
                                        ),
                                        Container(
                                          padding: const EdgeInsets.symmetric(
                                            horizontal: 10,
                                            vertical: 6,
                                          ),
                                          decoration: BoxDecoration(
                                            color: statusColor.withOpacity(
                                              0.12,
                                            ),
                                            borderRadius: BorderRadius.circular(
                                              999,
                                            ),
                                          ),
                                          child: Text(
                                            report.status,
                                            style: TextStyle(
                                              fontSize: 12,
                                              fontWeight: FontWeight.w700,
                                              color: statusColor,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 8),
                                    Text(
                                      report.description,
                                      maxLines: 2,
                                      overflow: TextOverflow.ellipsis,
                                      style: TextStyle(
                                        color:
                                            Theme.of(context).brightness ==
                                                Brightness.dark
                                            ? AppColors.darkTextSecondary
                                            : AppColors.textSecondary,
                                      ),
                                    ),
                                    const SizedBox(height: 10),
                                    Text(
                                      '${report.createdAt.toLocal()}'
                                          .split('.')
                                          .first,
                                      style: TextStyle(
                                        fontSize: 12,
                                        color:
                                            Theme.of(context).brightness ==
                                                Brightness.dark
                                            ? AppColors.darkTextSecondary
                                            : AppColors.textSecondary,
                                      ),
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

class _VideoReportThumbnail extends StatefulWidget {
  final String videoUrl;
  final String? fallbackImageUrl;
  final double height;
  final double borderRadius;

  const _VideoReportThumbnail({
    required this.videoUrl,
    this.fallbackImageUrl,
    required this.height,
    required this.borderRadius,
  });

  @override
  State<_VideoReportThumbnail> createState() => _VideoReportThumbnailState();
}

class _VideoReportThumbnailState extends State<_VideoReportThumbnail> {
  VideoPlayerController? _controller;
  bool _ready = false;

  @override
  void initState() {
    super.initState();
    _init();
  }

  Future<void> _init() async {
    try {
      final controller = VideoPlayerController.networkUrl(
        Uri.parse(widget.videoUrl),
      );
      await controller.initialize();
      await controller.pause();
      await controller.setVolume(0);
      if (!mounted) {
        await controller.dispose();
        return;
      }
      setState(() {
        _controller = controller;
        _ready = true;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() => _ready = false);
    }
  }

  @override
  void dispose() {
    _controller?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(widget.borderRadius),
      child: SizedBox(
        height: widget.height,
        width: double.infinity,
        child: Stack(
          fit: StackFit.expand,
          children: [
            if (_ready && _controller != null)
              FittedBox(
                fit: BoxFit.cover,
                child: SizedBox(
                  width: _controller!.value.size.width,
                  height: _controller!.value.size.height,
                  child: VideoPlayer(_controller!),
                ),
              )
            else if (widget.fallbackImageUrl != null &&
                widget.fallbackImageUrl!.trim().isNotEmpty)
              Image.network(
                widget.fallbackImageUrl!,
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) => Container(
                  color: AppColors.greyOutline.withOpacity(0.22),
                  child: Center(
                    child: Icon(
                      Icons.videocam,
                      size: 44,
                      color: Theme.of(context).brightness == Brightness.dark
                          ? AppColors.darkTextPrimary
                          : AppColors.textPrimary.withOpacity(0.8),
                    ),
                  ),
                ),
              )
            else
              Container(
                color: AppColors.greyOutline.withOpacity(0.22),
                child: Center(
                  child: Icon(
                    Icons.videocam,
                    size: 44,
                    color: Theme.of(context).brightness == Brightness.dark
                        ? AppColors.darkTextPrimary
                        : AppColors.textPrimary.withOpacity(0.8),
                  ),
                ),
              ),
            Positioned(
              right: 12,
              bottom: 12,
              child: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.black.withOpacity(0.55),
                  borderRadius: BorderRadius.circular(999),
                ),
                child: const Icon(
                  Icons.play_arrow,
                  size: 20,
                  color: Colors.white,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
