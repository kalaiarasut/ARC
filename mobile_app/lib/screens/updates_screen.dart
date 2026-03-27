import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:latlong2/latlong.dart';

import '../models/official_advisory.dart';
import '../models/advisory_category.dart';
import '../services/advisory_service.dart';
import '../services/offline_report_queue_service.dart';
import '../theme/app_colors.dart';
import '../l10n/l10n.dart';
import '../widgets/app_state_view.dart';
import '../widgets/advisory_filter_widgets.dart';
import '../providers/map_provider.dart';
import '../providers/language_provider.dart';
import '../providers/advisory_filter_provider.dart';
import 'advisory_details_screen.dart';
import 'queued_reports_screen.dart';

enum _TimeWindow { now, week, month }

final advisoryServiceProvider = Provider<AdvisoryService>((ref) => AdvisoryService());
final advisoriesProvider = FutureProvider<List<OfficialAdvisory>>((ref) async {
  final userLocation = ref.watch(userLocationProvider);
  final languageCode = ref.watch(languageCodeProvider);

  return ref.read(advisoryServiceProvider).getLatest(
        userLocation: userLocation,
        languageCode: languageCode,
        limit: 100,
      );
});

class UpdatesScreen extends ConsumerStatefulWidget {
  const UpdatesScreen({super.key});

  @override
  ConsumerState<UpdatesScreen> createState() => _UpdatesScreenState();
}

class _UpdatesScreenState extends ConsumerState<UpdatesScreen> {
  _TimeWindow _window = _TimeWindow.now;

  Color _severityColor(String severity) {
    switch (severity) {
      case 'warning':
        return AppColors.error;
      case 'watch':
        return AppColors.warning;
      default:
        return AppColors.primaryBlue;
    }
  }

  bool _hasContacts(OfficialAdvisory a) {
    return (a.contactPhone != null && a.contactPhone!.isNotEmpty) ||
           (a.contactWhatsapp != null && a.contactWhatsapp!.isNotEmpty) ||
           (a.contactHotline != null && a.contactHotline!.isNotEmpty);
  }

  String _timeAgo(DateTime dateTime) {
    final now = DateTime.now();
    final diff = now.difference(dateTime);

    if (diff.inMinutes < 1) return 'Just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    if (diff.inDays < 7) return '${diff.inDays}d ago';
    if (diff.inDays < 30) return '${(diff.inDays / 7).floor()}w ago';
    return '${(diff.inDays / 30).floor()}mo ago';
  }

  DateTime _sinceForWindow(_TimeWindow window) {
    final now = DateTime.now();
    switch (window) {
      case _TimeWindow.now:
        return now.subtract(const Duration(hours: 24));
      case _TimeWindow.week:
        return now.subtract(const Duration(days: 7));
      case _TimeWindow.month:
        return now.subtract(const Duration(days: 30));
    }
  }

  String _shortBody(String body) {
    final src = body.trim();
    if (src.isEmpty) return '';
    if (src.length <= 80) return src;
    return '${src.substring(0, 80)}...';
  }

  /// Apply filters to the advisory list
  List<OfficialAdvisory> _applyFilters(
    List<OfficialAdvisory> advisories,
    AdvisoryFilterState filterState,
    LatLng? userLocation,
    String languageCode,
  ) {
    var filtered = advisories.toList();

    // Time window filter
    final since = _sinceForWindow(_window);
    filtered = filtered.where((a) => a.publishedAt.isAfter(since)).toList();

    // Expired filter (by default, only show active)
    if (!filterState.showExpired) {
      final now = DateTime.now();
      filtered = filtered.where((a) {
        if (a.expiresAt == null) return true;
        return a.expiresAt!.isAfter(now);
      }).toList();
    }

    // Severity filter
    if (filterState.severity != null) {
      filtered = filtered.where((a) => a.severity == filterState.severity).toList();
    }

    // Category filter
    if (filterState.category != null) {
      filtered = filtered.where((a) {
        final cat = advisoryCategoryFromString(a.category);
        return cat == filterState.category;
      }).toList();
    }

    // Near me filter (within 50km)
    if (filterState.nearMeOnly && userLocation != null) {
      const distance = Distance();
      const maxDistance = 50000.0; // 50km
      filtered = filtered.where((a) {
        if (a.latitude == null || a.longitude == null) return false;
        final d = distance.as(
          LengthUnit.Meter,
          userLocation,
          LatLng(a.latitude!, a.longitude!),
        );
        return d <= maxDistance;
      }).toList();
    }

    // Has contact filter
    if (filterState.hasContactOnly) {
      filtered = filtered.where((a) => _hasContacts(a)).toList();
    }

    // Translated only filter
    if (filterState.translatedOnly) {
      filtered = filtered.where((a) {
        return a.displayLanguage != a.sourceLanguage;
      }).toList();
    }

    // Region search filter
    if (filterState.regionSearch.isNotEmpty) {
      final query = filterState.regionSearch.toLowerCase();
      filtered = filtered.where((a) {
        final region = (a.region ?? '').toLowerCase();
        final title = a.title.toLowerCase();
        final body = a.body.toLowerCase();
        return region.contains(query) || title.contains(query) || body.contains(query);
      }).toList();
    }

    // Apply sorting
    filtered = _applySorting(filtered, filterState.sortOption, userLocation);

    return filtered;
  }

  /// Apply sorting to the advisory list
  List<OfficialAdvisory> _applySorting(
    List<OfficialAdvisory> advisories,
    AdvisorySortOption sortOption,
    LatLng? userLocation,
  ) {
    final sorted = advisories.toList();

    switch (sortOption) {
      case AdvisorySortOption.newest:
        sorted.sort((a, b) => b.publishedAt.compareTo(a.publishedAt));
        break;
      case AdvisorySortOption.nearest:
        if (userLocation != null) {
          const distance = Distance();
          sorted.sort((a, b) {
            final aLat = a.latitude;
            final aLng = a.longitude;
            final bLat = b.latitude;
            final bLng = b.longitude;
            if (aLat == null || aLng == null) return 1;
            if (bLat == null || bLng == null) return -1;
            final dA = distance.as(LengthUnit.Meter, userLocation, LatLng(aLat, aLng));
            final dB = distance.as(LengthUnit.Meter, userLocation, LatLng(bLat, bLng));
            return dA.compareTo(dB);
          });
        }
        break;
      case AdvisorySortOption.mostRelevant:
        sorted.sort((a, b) {
          int severityWeight(String sev) {
            switch (sev) {
              case 'warning':
                return 3;
              case 'watch':
                return 2;
              default:
                return 1;
            }
          }
          final sevCompare = severityWeight(b.severity).compareTo(severityWeight(a.severity));
          if (sevCompare != 0) return sevCompare;
          return b.publishedAt.compareTo(a.publishedAt);
        });
        break;
    }

    return sorted;
  }

  Widget _timeChip(String label, bool selected, VoidCallback onTap) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          decoration: BoxDecoration(
            color: selected
                ? (isDark ? AppColors.darkPrimaryBlue : AppColors.primaryBlue)
                : (isDark ? AppColors.darkCard : Colors.white),
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
                color: selected
                    ? Colors.white
                    : (isDark ? AppColors.darkTextSecondary : AppColors.textSecondary),
                fontWeight: selected ? FontWeight.bold : FontWeight.w600,
              ),
            ),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final advisories = ref.watch(advisoriesProvider);
    final filterState = ref.watch(advisoryFilterProvider);
    final userLocation = ref.watch(userLocationProvider);
    final languageCode = Localizations.localeOf(context).languageCode;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios, color: isDark ? AppColors.darkTextPrimary : AppColors.textPrimary),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          context.l10n.updates,
          style: TextStyle(color: isDark ? AppColors.darkTextPrimary : AppColors.textPrimary, fontWeight: FontWeight.bold),
        ),
        actions: [
          ValueListenableBuilder(
            valueListenable: Hive.box(OfflineReportQueueService.boxName).listenable(),
            builder: (context, box, _) {
              final count = box.length;
              if (count == 0) return const SizedBox.shrink();
              return Padding(
                padding: const EdgeInsets.only(right: 12),
                child: Center(
                  child: InkWell(
                    borderRadius: BorderRadius.circular(16),
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => const QueuedReportsScreen()),
                      );
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        color: AppColors.warning.withOpacity(0.15),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: AppColors.warning.withOpacity(0.35)),
                      ),
                      child: Text(
                        context.l10n.pendingCount(count),
                        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                      ),
                    ),
                  ),
                ),
              );
            },
          )
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        child: Column(
          children: [
            // Time window filters (Now, Last week, Last month)
            Row(
              children: [
                Expanded(child: _timeChip(context.l10n.filterNow, _window == _TimeWindow.now, () {
                  if (_window != _TimeWindow.now) setState(() => _window = _TimeWindow.now);
                })),
                const SizedBox(width: 8),
                Expanded(child: _timeChip(context.l10n.filterLastWeek, _window == _TimeWindow.week, () {
                  if (_window != _TimeWindow.week) setState(() => _window = _TimeWindow.week);
                })),
                const SizedBox(width: 8),
                Expanded(child: _timeChip(context.l10n.filterLastMonth, _window == _TimeWindow.month, () {
                  if (_window != _TimeWindow.month) setState(() => _window = _TimeWindow.month);
                })),
              ],
            ),
            const SizedBox(height: 8),

            // Sticky filter bar
            AdvisoryFilterBar(
              onFilterTap: () => showAdvisoryFilterBottomSheet(context),
            ),

            // Active filters row
            const ActiveFiltersRow(),

            // Advisory list
            Expanded(
              child: advisories.when(
                data: (items) {
                  final filteredItems = _applyFilters(items, filterState, userLocation, languageCode);

                  if (filteredItems.isEmpty) {
                    return Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            filterState.hasActiveFilters ? Icons.filter_alt_off : Icons.inbox_outlined,
                            size: 48,
                            color: isDark ? AppColors.darkTextSecondary : AppColors.textSecondary,
                          ),
                          const SizedBox(height: 12),
                          Text(
                            context.l10n.noUpdatesYet,
                            style: TextStyle(color: isDark ? AppColors.darkTextSecondary : AppColors.textSecondary),
                          ),
                          if (filterState.hasActiveFilters) ...[
                            const SizedBox(height: 12),
                            TextButton(
                              onPressed: () => ref.read(advisoryFilterProvider.notifier).clearAll(),
                              child: Text(context.l10n.filterClearAll),
                            ),
                          ],
                        ],
                      ),
                    );
                  }

                  return RefreshIndicator(
                    onRefresh: () async {
                      ref.invalidate(advisoriesProvider);
                      await ref.read(advisoriesProvider.future);
                    },
                    child: ListView.separated(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      itemCount: filteredItems.length,
                      separatorBuilder: (_, _) => const SizedBox(height: 10),
                      itemBuilder: (context, index) {
                        final a = filteredItems[index];
                        return _buildCompactAdvisoryCard(context, a, languageCode, userLocation);
                      },
                    ),
                  );
                },
                error: (e, _) => Center(
                  child: AppStateView(
                    icon: Icons.wifi_off,
                    title: context.l10n.failedToLoadUpdates,
                    message: e.toString().toLowerCase().contains('socket') || e.toString().toLowerCase().contains('failed host')
                        ? context.l10n.youreOffline
                        : e.toString(),
                    actionLabel: context.l10n.retry,
                    onAction: () async {
                      ref.invalidate(advisoriesProvider);
                      await ref.read(advisoriesProvider.future);
                    },
                  ),
                ),
                loading: () => const Center(child: CircularProgressIndicator(color: AppColors.primaryBlue)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCompactAdvisoryCard(
    BuildContext context,
    OfficialAdvisory a,
    String languageCode,
    LatLng? userLocation,
  ) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final sevColor = _severityColor(a.severity);

    // Calculate distance if location available
    String? distanceText;
    if (userLocation != null && a.latitude != null && a.longitude != null) {
      const distance = Distance();
      final meters = distance.as(LengthUnit.Meter, userLocation, LatLng(a.latitude!, a.longitude!));
      distanceText = meters >= 1000
          ? '${(meters / 1000).toStringAsFixed(1)} km'
          : '${meters.toStringAsFixed(0)} m';
    }

    return InkWell(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => AdvisoryDetailsScreen(advisoryId: a.id)),
        );
      },
      borderRadius: BorderRadius.circular(14),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Theme.of(context).cardColor,
          borderRadius: BorderRadius.circular(14),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top row: Severity badge + Category + Time
            Row(
              children: [
                // Severity badge
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: sevColor.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    advisorySeverityLabelForLanguage(a.severity, languageCode).toUpperCase(),
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w800,
                      color: sevColor,
                    ),
                  ),
                ),
                // Category badge
                if (a.category.isNotEmpty) ...[
                  const SizedBox(width: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                    decoration: BoxDecoration(
                      color: isDark
                          ? AppColors.darkOutline.withOpacity(0.3)
                          : AppColors.greyOutline.withOpacity(0.4),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      advisoryCategoryLabelForLanguage(
                        advisoryCategoryFromString(a.category),
                        languageCode,
                      ),
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w600,
                        color: isDark ? AppColors.darkTextSecondary : AppColors.textSecondary,
                      ),
                    ),
                  ),
                ],
                const Spacer(),
                // Time ago
                Text(
                  _timeAgo(a.publishedAt),
                  style: TextStyle(
                    fontSize: 11,
                    color: isDark ? AppColors.darkTextSecondary : AppColors.textSecondary,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),

            // Title
            Text(
              a.title,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.bold,
                height: 1.2,
              ),
            ),

            // Body preview
            if (a.body.isNotEmpty) ...[
              const SizedBox(height: 6),
              Text(
                _shortBody(a.body),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontSize: 13,
                  color: isDark ? AppColors.darkTextSecondary : AppColors.textSecondary,
                  height: 1.3,
                ),
              ),
            ],

            // Bottom row: Region/Location + Distance + Contact indicator
            const SizedBox(height: 8),
            Row(
              children: [
                // Region
                if ((a.region ?? '').isNotEmpty)
                  Expanded(
                    child: Row(
                      children: [
                        Icon(
                          Icons.location_on_outlined,
                          size: 12,
                          color: isDark ? AppColors.darkTextSecondary : AppColors.textSecondary,
                        ),
                        const SizedBox(width: 3),
                        Flexible(
                          child: Text(
                            a.region!,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                              fontSize: 11,
                              color: isDark ? AppColors.darkTextSecondary : AppColors.textSecondary,
                            ),
                          ),
                        ),
                      ],
                    ),
                  )
                else
                  const Spacer(),

                // Distance
                if (distanceText != null) ...[
                  const SizedBox(width: 8),
                  Text(
                    distanceText,
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w500,
                      color: isDark ? AppColors.darkTextSecondary : AppColors.textSecondary,
                    ),
                  ),
                ],

                // Contact indicator
                if (_hasContacts(a)) ...[
                  const SizedBox(width: 8),
                  Icon(
                    Icons.phone_outlined,
                    size: 13,
                    color: isDark ? AppColors.darkSecondaryCyan : AppColors.secondaryCyan,
                  ),
                ],

                // Translated indicator
                if (a.displayLanguage != a.sourceLanguage) ...[
                  const SizedBox(width: 6),
                  Icon(
                    Icons.translate,
                    size: 13,
                    color: isDark ? AppColors.darkTextSecondary : AppColors.textSecondary,
                  ),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }
}
