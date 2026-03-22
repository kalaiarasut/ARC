import 'package:flutter/material.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:latlong2/latlong.dart';
import 'package:video_player/video_player.dart';
import '../l10n/l10n.dart';
import '../theme/app_colors.dart';
import 'report_screen.dart';
import 'map_screen.dart';
import '../services/offline_report_queue_service.dart';
import 'profile_screen.dart';
import 'updates_screen.dart';
import 'settings_screen.dart';
import 'notifications_screen.dart';
import '../models/official_advisory.dart';
import '../models/advisory_category.dart';
import '../services/advisory_service.dart';
import '../providers/map_provider.dart';
import '../providers/language_provider.dart';
import '../services/map_service.dart';
import '../services/home_feed_bootstrap_service.dart';
import '../models/map_marker_data.dart';
import 'report_details_screen.dart';
import 'reports_screen.dart';
import 'media_viewer_screen.dart';

class HomeScreen extends ConsumerStatefulWidget {
  final HomeFeedWindow? initialReportWindow;
  final List<MapMarkerData>? initialLiveReports;
  final LatLng? initialUserLocation;

  const HomeScreen({
    super.key,
    this.initialReportWindow,
    this.initialLiveReports,
    this.initialUserLocation,
  });

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  int _selectedIndex = 0;
  String _userName = '';
  List<OfficialAdvisory> _liveAdvisories = const [];

  HomeFeedWindow _reportWindow = HomeFeedWindow.now;
  bool _didApplyStartupWindowFallback = false;
  String? _selectedHazard;
  String? _selectedUrgency;
  List<MapMarkerData> _liveReports = const [];

  ProviderSubscription<LatLng?>? _locationSub;
  ProviderSubscription<String>? _languageSub;

  @override
  void initState() {
    super.initState();
    _loadUserName();
    if (widget.initialUserLocation != null) {
      _setUserLocationAfterBuild(widget.initialUserLocation!);
    } else {
      _loadLastKnownLocationSilently();
    }
    _loadLiveAdvisories(locationOverride: widget.initialUserLocation);

    if (widget.initialReportWindow != null) {
      _reportWindow = widget.initialReportWindow!;
      _didApplyStartupWindowFallback = true;
    }
    if (widget.initialLiveReports != null) {
      _liveReports = widget.initialLiveReports!;
    }

    if (widget.initialLiveReports == null) {
      _loadLiveReports(
        applyStartupWindowFallback: true,
        locationOverride: widget.initialUserLocation,
      );
    }

    // If location becomes available later (e.g. map screen updates it), refresh report feed.
    _locationSub = ref.listenManual<LatLng?>(userLocationProvider, (prev, next) {
      if (next != null && (prev == null || prev != next)) {
        _loadLiveReports();
      }
    });

    _languageSub = ref.listenManual<String>(languageCodeProvider, (prev, next) {
      if (prev != null && prev != next) {
        _loadLiveAdvisories();
      }
    });
  }

  @override
  void dispose() {
    _locationSub?.close();
    _languageSub?.close();
    super.dispose();
  }

  Future<void> _loadLastKnownLocationSilently() async {
    try {
      final perm = await Geolocator.checkPermission();
      final hasPermission = perm == LocationPermission.always || perm == LocationPermission.whileInUse;
      if (!hasPermission) return;

      final pos = await Geolocator.getLastKnownPosition();
      if (pos == null) return;

      final loc = LatLng(pos.latitude, pos.longitude);
      _setUserLocationAfterBuild(loc);
    } catch (_) {
      // Ignore; we only use this to improve sorting.
    }
  }

  void _setUserLocationAfterBuild(LatLng location) {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      ref.read(userLocationProvider.notifier).update(location);
    });
  }

  Future<void> _loadUserName() async {
    final prefs = await SharedPreferences.getInstance();
    final name = prefs.getString('user_name');
    if (name != null && mounted) {
      setState(() => _userName = name);
    }
  }

  Future<void> _loadLiveAdvisories({LatLng? locationOverride}) async {
    try {
      final loc = locationOverride ?? ref.read(userLocationProvider);
      final items = await AdvisoryService().getLatest(limit: 10, userLocation: loc);
      if (!mounted) return;
      setState(() => _liveAdvisories = items);
    } catch (_) {
      // Ignore offline / network errors.
    }
  }

  DateTime _sinceForWindow(HomeFeedWindow window) {
    final now = DateTime.now();
    switch (window) {
      case HomeFeedWindow.week:
        return now.subtract(const Duration(days: 7));
      case HomeFeedWindow.month:
        return now.subtract(const Duration(days: 30));
      case HomeFeedWindow.now:
        return now.subtract(const Duration(hours: 24));
    }
  }

  double _deltaDegreesForWindow(HomeFeedWindow window) {
    // Approximate viewport radius around user location for home feed.
    // Keeps results locally relevant while still showing enough items.
    switch (window) {
      case HomeFeedWindow.week:
        return 1.8;
      case HomeFeedWindow.month:
        return 3.5;
      case HomeFeedWindow.now:
        return 0.9;
    }
  }

  Future<List<MapMarkerData>> _fetchLiveReportsForWindow(HomeFeedWindow window, {required LatLng? loc}) async {
    final since = _sinceForWindow(window);

    double minLat = -90, maxLat = 90, minLon = -180, maxLon = 180;
    if (loc != null) {
      final d = _deltaDegreesForWindow(window);
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

    final filtered = items
        .where((r) => r.timestamp.isAfter(since))
        .where((r) => _selectedHazard == null || r.hazardType == _selectedHazard)
        .where((r) =>
            _selectedUrgency == null ||
            (_selectedUrgency == 'High' &&
                (r.urgencyLevel.toLowerCase() == 'high' ||
                    r.urgencyLevel.toLowerCase() == 'critical')) ||
            (_selectedUrgency != 'High' &&
                r.urgencyLevel.toLowerCase() == _selectedUrgency!.toLowerCase()))
        .toList()
      ..sort((a, b) => b.timestamp.compareTo(a.timestamp));

    return filtered.take(10).toList();
  }

  Future<void> _loadLiveReports({
    bool applyStartupWindowFallback = false,
    LatLng? locationOverride,
  }) async {
    try {
      final loc = locationOverride ?? ref.read(userLocationProvider);

      final shouldApplyStartupFallback = applyStartupWindowFallback &&
          !_didApplyStartupWindowFallback &&
          _reportWindow == HomeFeedWindow.now &&
          _selectedHazard == null &&
          _selectedUrgency == null;

      if (shouldApplyStartupFallback) {
        _didApplyStartupWindowFallback = true;
        final fallbackOrder = [HomeFeedWindow.now, HomeFeedWindow.week, HomeFeedWindow.month];

        HomeFeedWindow resolvedWindow = HomeFeedWindow.month;
        List<MapMarkerData> resolvedItems = const [];

        for (final window in fallbackOrder) {
          final items = await _fetchLiveReportsForWindow(window, loc: loc);
          resolvedWindow = window;
          resolvedItems = items;
          if (items.isNotEmpty) break;
        }

        if (!mounted) return;
        setState(() {
          _reportWindow = resolvedWindow;
          _liveReports = resolvedItems;
        });
        return;
      }

      final items = await _fetchLiveReportsForWindow(_reportWindow, loc: loc);
      if (!mounted) return;
      setState(() {
        _liveReports = items;
      });
    } catch (_) {
      // Ignore offline/network errors.
      if (!mounted) return;
      setState(() {
        _liveReports = const [];
      });
    }
  }

  String _timeAgo(DateTime dt) {
    final diff = DateTime.now().difference(dt);
    if (diff.inMinutes < 1) return 'Just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes} min ago';
    if (diff.inHours < 24) return '${diff.inHours} hr ago';
    return '${diff.inDays} days ago';
  }

  String _shortDescription(String description) {
    final text = description.trim();
    final src = text;
    if (src.isEmpty) return '';
    if (src.length <= 70) return src;
    return '${src.substring(0, 70)}.......';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor, // Light greyish-blue bg
      body: SafeArea(
        bottom: false,
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 100), // Bottom padding for FAB
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 1. Header
              Row(
                children: [
                   const CircleAvatar(
                    radius: 24,
                    backgroundImage: NetworkImage('https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&auto=format&fit=crop'),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          context.l10n.hiWelcome,
                          style: TextStyle(
                            fontSize: 12,
                            color: Theme.of(context).brightness == Brightness.dark ? AppColors.darkTextSecondary : AppColors.textSecondary,
                          ),
                        ),
                        Text(
                          _userName.isEmpty ? context.l10n.user : _userName,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: Theme.of(context).brightness == Brightness.dark ? AppColors.darkTextPrimary : AppColors.textPrimary,
                          ),
                        ),
                      ],
                    ),
                  ),
                  ValueListenableBuilder(
                    valueListenable: Hive.box(OfflineReportQueueService.boxName).listenable(),
                    builder: (context, box, _) {
                      final count = box.length;
                      if (count == 0) return const SizedBox.shrink();
                      return Flexible(
                        child: Container(
                          margin: const EdgeInsets.only(right: 8),
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                          decoration: BoxDecoration(
                            color: AppColors.warning.withOpacity(0.15),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: AppColors.warning.withOpacity(0.35)),
                          ),
                          child: Text(
                            context.l10n.pendingCount(count),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: Theme.of(context).brightness == Brightness.dark ? AppColors.darkTextPrimary : AppColors.textPrimary,
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                  _buildHeaderIcon(Icons.search),
                  const SizedBox(width: 8),
                  GestureDetector(
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => const NotificationsScreen()),
                      );
                    },
                    child: _buildHeaderIcon(Icons.notifications_outlined, hasBadge: true),
                  ),
                  const SizedBox(width: 8),
                  GestureDetector(
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => const SettingsScreen()),
                      );
                    },
                    child: _buildHeaderIcon(Icons.settings_outlined),
                  ),
                ],
              ),
              
              const SizedBox(height: 24),

              // 2. Hero Banner (Sea Theme)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFFE0F7FA), Color(0xFFB2EBF2)], // Light Cyan Gradient
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(24),
                ),
                child: Row(
                  children: [
                    Expanded(
                      flex: 3,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            context.l10n.togetherForOceanSafety,
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: AppColors.primaryBlue,
                              height: 1.2,
                            ),
                          ),
                          const SizedBox(height: 16),
                          SizedBox(
                            height: 36,
                            child: ElevatedButton(
                              onPressed: () {
                                  Navigator.push(
                                    context,
                                    MaterialPageRoute(builder: (_) => const UpdatesScreen()),
                                  );
                              },
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppColors.primaryBlue,
                                foregroundColor: Colors.white,
                                elevation: 0,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(20),
                                ),
                                padding: const EdgeInsets.symmetric(horizontal: 16),
                              ),
                              child: Text(context.l10n.seeUpdates),
                            ),
                          ),
                        ],
                      ),
                    ),
                    Expanded(
                      flex: 2,
                      child: Image.network(
                        'https://cdn-icons-png.flaticon.com/512/2909/2909355.png', // Placceholder Illustration
                        height: 100,
                        fit: BoxFit.contain,
                        errorBuilder: (c, e, s) => const Icon(Icons.people, size: 60, color: AppColors.secondaryCyan),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),

              // 3. Disaster Information Header
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      context.l10n.unusualActivity,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: Theme.of(context).brightness == Brightness.dark ? AppColors.darkTextPrimary : AppColors.textPrimary,
                      ),
                    ),
                  ),
                  TextButton(
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => const ReportsScreen()),
                      );
                    },
                    child: Text(
                      context.l10n.seeAll,
                      style: TextStyle(color: Theme.of(context).brightness == Brightness.dark ? AppColors.darkTextSecondary : AppColors.textSecondary),
                    ),
                  ),
                ],
              ),

              // 4. Filters
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: [
                    _buildFilterChip(
                      context.l10n.filterNow,
                      _reportWindow == HomeFeedWindow.now,
                      onTap: () {
                        if (_reportWindow == HomeFeedWindow.now) return;
                        setState(() => _reportWindow = HomeFeedWindow.now);
                        _loadLiveReports();
                      },
                    ),
                    const SizedBox(width: 8),
                    _buildFilterChip(
                      context.l10n.filterLastWeek,
                      _reportWindow == HomeFeedWindow.week,
                      onTap: () {
                        if (_reportWindow == HomeFeedWindow.week) return;
                        setState(() => _reportWindow = HomeFeedWindow.week);
                        _loadLiveReports();
                      },
                    ),
                    const SizedBox(width: 8),
                    _buildFilterChip(
                      context.l10n.filterLastMonth,
                      _reportWindow == HomeFeedWindow.month,
                      onTap: () {
                        if (_reportWindow == HomeFeedWindow.month) return;
                        setState(() => _reportWindow = HomeFeedWindow.month);
                        _loadLiveReports();
                      },
                    ),
                    const SizedBox(width: 8),
                    _buildHazardFilter(),
                    const SizedBox(width: 8),
                    _buildUrgencyFilter(),
                  ],
                ),
              ),

              const SizedBox(height: 16),

              // Live reports preview (from citizens)
              if (_liveReports.isEmpty)
                Padding(
                  padding: const EdgeInsets.only(bottom: 16),
                  child: Text(
                    'No reports yet',
                    style: TextStyle(color: Theme.of(context).brightness == Brightness.dark ? AppColors.darkTextSecondary : AppColors.textSecondary),
                  ),
                )
              else
                SizedBox(
                  height: 255,
                  child: ListView.separated(
                    scrollDirection: Axis.horizontal,
                    itemCount: _liveReports.length,
                    separatorBuilder: (context, index) => const SizedBox(width: 12),
                    itemBuilder: (context, index) {
                      final r = _liveReports[index];
                      final loc = ref.read(userLocationProvider);
                      String distanceText = '';
                      if (loc != null) {
                        const d = Distance();
                        final meters = d.as(LengthUnit.Meter, loc, r.location);
                        distanceText = meters >= 1000
                            ? '${(meters / 1000).toStringAsFixed(1)} km away'
                            : '${meters.toStringAsFixed(0)} m away';
                      }

                      final urgency = (r.urgencyLevel).trim();
                      final urgencyColor = urgency.toLowerCase() == 'critical'
                          ? AppColors.error
                          : urgency.toLowerCase() == 'high'
                              ? AppColors.warning
                              : AppColors.primaryBlue;

                      return GestureDetector(
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => ReportDetailsScreen(reportId: r.id, isOwnReport: false),
                            ),
                          );
                        },
                        child: Container(
                          width: 285,
                          decoration: BoxDecoration(
                            color: Theme.of(context).cardColor,
                            borderRadius: BorderRadius.circular(16),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.05),
                                blurRadius: 10,
                                offset: const Offset(0, 4),
                              ),
                            ],
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _buildReportMediaPreview(r, height: 130, borderRadius: 16),
                              Padding(
                                padding: const EdgeInsets.fromLTRB(14, 12, 14, 8),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                          decoration: BoxDecoration(
                                            color: urgencyColor.withOpacity(0.12),
                                            borderRadius: BorderRadius.circular(999),
                                          ),
                                          child: Text(
                                            urgency.isEmpty ? 'LOW' : urgency.toUpperCase(),
                                            style: TextStyle(
                                              fontSize: 10.5,
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
                                            overflow: TextOverflow.ellipsis,
                                            style: TextStyle(
                                              fontSize: 13.5,
                                              fontWeight: FontWeight.bold,
                                              color: Theme.of(context).brightness == Brightness.dark ? AppColors.darkTextPrimary : AppColors.textPrimary,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 8),
                                    if (_shortDescription(r.description).isNotEmpty)
                                      Text(
                                        _shortDescription(r.description),
                                        maxLines: 2,
                                        overflow: TextOverflow.ellipsis,
                                        style: TextStyle(fontSize: 12.5, color: Theme.of(context).brightness == Brightness.dark ? AppColors.darkTextSecondary : AppColors.textSecondary),
                                      ),
                                    if (_shortDescription(r.description).isNotEmpty)
                                      const SizedBox(height: 10),
                                    Row(
                                      children: [
                                        Text(
                                          _timeAgo(r.timestamp),
                                          style: TextStyle(fontSize: 12, color: Theme.of(context).brightness == Brightness.dark ? AppColors.darkTextSecondary : AppColors.textSecondary),
                                        ),
                                        const Spacer(),
                                        if (distanceText.isNotEmpty)
                                          Text(
                                            distanceText,
                                            style: TextStyle(fontSize: 12, color: Theme.of(context).brightness == Brightness.dark ? AppColors.darkTextSecondary : AppColors.textSecondary),
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
                  ),
                ),

              const SizedBox(height: 24),

              // 6. Live News
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      context.l10n.liveNews,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: Theme.of(context).brightness == Brightness.dark ? AppColors.darkTextPrimary : AppColors.textPrimary,
                      ),
                    ),
                  ),
                  TextButton(
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => const UpdatesScreen()),
                      );
                    },
                    child: Text(
                      context.l10n.seeAll,
                      style: TextStyle(color: Theme.of(context).brightness == Brightness.dark ? AppColors.darkTextSecondary : AppColors.textSecondary),
                    ),
                  ),
                ],
              ),

              if (_liveAdvisories.isEmpty)
                Padding(
                  padding: const EdgeInsets.only(top: 10),
                  child: Text(
                    context.l10n.noUpdatesYet,
                    style: TextStyle(color: Theme.of(context).brightness == Brightness.dark ? AppColors.darkTextSecondary : AppColors.textSecondary),
                  ),
                )
              else
                SizedBox(
                  height: 140,
                  child: ListView.separated(
                    scrollDirection: Axis.horizontal,
                    itemCount: _liveAdvisories.length,
                    separatorBuilder: (context, index) => const SizedBox(width: 12),
                    itemBuilder: (context, index) {
                      final a = _liveAdvisories[index];
                      final languageCode = Localizations.localeOf(context).languageCode;
                      return GestureDetector(
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(builder: (_) => const UpdatesScreen()),
                          );
                        },
                        child: Container(
                          width: 220,
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: Theme.of(context).cardColor,
                            borderRadius: BorderRadius.circular(16),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.05),
                                blurRadius: 10,
                                offset: const Offset(0, 4),
                              ),
                            ],
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                decoration: BoxDecoration(
                                  color: AppColors.primaryBlue.withOpacity(0.12),
                                  borderRadius: BorderRadius.circular(999),
                                ),
                                child: Text(
                                  advisorySeverityLabelForLanguage(a.severity, languageCode).toUpperCase(),
                                  style: const TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w800,
                                    color: AppColors.primaryBlue,
                                  ),
                                ),
                              ),
                              const SizedBox(height: 10),
                              Text(
                                a.title,
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.bold,
                                  color: Theme.of(context).brightness == Brightness.dark ? AppColors.darkTextPrimary : AppColors.textPrimary,
                                ),
                              ),
                              const SizedBox(height: 8),
                              if (a.region != null && a.region!.trim().isNotEmpty)
                                Text(
                                  a.region!,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: TextStyle(fontSize: 12, color: Theme.of(context).brightness == Brightness.dark ? AppColors.darkTextSecondary : AppColors.textSecondary),
                                ),
                              const Spacer(),
                              Text(
                                _timeAgo(a.publishedAt),
                                style: TextStyle(fontSize: 12, color: Theme.of(context).brightness == Brightness.dark ? AppColors.darkTextSecondary : AppColors.textSecondary),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),
            ],
          ),
        ),
      ),
      
      // Bottom Navigation Bar with FAB
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          // Navigate to Report Screen
          Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => const ReportScreen()),
          );
        },
        backgroundColor: AppColors.primaryBlue, // Sea Blue FAB
        elevation: 4,
        child: const Icon(Icons.phone_in_talk, color: Colors.white, size: 28), // Or Report icon
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerDocked,
      bottomNavigationBar: BottomAppBar(
        shape: const CircularNotchedRectangle(),
        notchMargin: 8.0,
        color: Colors.white,
        elevation: 10,
        child: SizedBox(
          height: 60,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              Expanded(child: _buildNavItem(Icons.home_filled, context.l10n.homeTab, 0)),
              Expanded(child: _buildNavItem(Icons.map_outlined, context.l10n.mapTab, 1)),
              const SizedBox(width: 48), // Space for FAB
              Expanded(child: _buildNavItem(Icons.article_outlined, context.l10n.updatesTab, 2)),
              Expanded(child: _buildNavItem(Icons.person_outline, context.l10n.profileTab, 3)),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeaderIcon(IconData icon, {bool hasBadge = false}) {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        shape: BoxShape.circle,
      ),
      child: Stack(
        children: [
          Icon(icon, color: Theme.of(context).brightness == Brightness.dark ? AppColors.darkTextPrimary : AppColors.textPrimary, size: 24),
          if (hasBadge)
            Positioned(
              right: 0,
              top: 0,
              child: Container(
                width: 8,
                height: 8,
                decoration: BoxDecoration(
                  color: AppColors.error,
                  shape: BoxShape.circle,
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildReportMediaPreview(
    MapMarkerData report, {
    required double height,
    double borderRadius = 12,
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
              child: Icon(Icons.broken_image, color: Theme.of(context).brightness == Brightness.dark ? AppColors.darkTextSecondary : AppColors.textSecondary),
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
          color: Theme.of(context).brightness == Brightness.dark ? AppColors.darkTextPrimary : AppColors.textPrimary.withOpacity(0.7),
          size: 34,
        ),
      ),
    );
  }

  Widget _buildFilterChip(String label, bool isSelected, {required VoidCallback onTap}) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
          decoration: BoxDecoration(
            color: isSelected ? AppColors.primaryBlue : Colors.white,
            borderRadius: BorderRadius.circular(20),
            border: isSelected ? null : Border.all(color: Colors.transparent),
          ),
          child: Row(
            children: [
              if (isSelected) ...[
                Icon(Icons.notifications_active, color: Theme.of(context).cardColor, size: 16),
                const SizedBox(width: 6),
              ],
              Text(
                label,
                style: TextStyle(
                  color: isSelected ? Colors.white : AppColors.textSecondary,
                  fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDropdownFilterChip(String label, bool isSelected) {
    return Material(
      color: Colors.transparent,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primaryBlue : Theme.of(context).cardColor,
          borderRadius: BorderRadius.circular(20),
          border: isSelected ? null : Border.all(color: Colors.transparent),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              label,
              style: TextStyle(
                color: isSelected ? Colors.white : AppColors.textSecondary,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
              ),
            ),
            const SizedBox(width: 4),
            Icon(Icons.arrow_drop_down, size: 18, color: isSelected ? Colors.white : AppColors.textSecondary),
          ],
        ),
      ),
    );
  }

  Widget _buildHazardFilter() {
    return PopupMenuButton<String?>(
      onSelected: (val) {
        setState(() => _selectedHazard = val);
        _loadLiveReports();
      },
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      itemBuilder: (ctx) => [
        const PopupMenuItem(value: null, child: Text('All Hazards')),
        const PopupMenuItem(value: 'High Waves', child: Text('High Waves')),
        const PopupMenuItem(value: 'Tsunami', child: Text('Tsunami')),
        const PopupMenuItem(value: 'Storm', child: Text('Storm')),
        const PopupMenuItem(value: 'Flood', child: Text('Flood')),
        const PopupMenuItem(value: 'Rip Current', child: Text('Rip Current')),
        const PopupMenuItem(value: 'Pollution', child: Text('Pollution')),
        const PopupMenuItem(value: 'Earthquake', child: Text('Earthquake')),
      ],
      child: _buildDropdownFilterChip(_selectedHazard ?? 'Hazards', _selectedHazard != null),
    );
  }

  Widget _buildUrgencyFilter() {
    return PopupMenuButton<String?>(
      onSelected: (val) {
        setState(() => _selectedUrgency = val);
        _loadLiveReports();
      },
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      itemBuilder: (ctx) => [
        const PopupMenuItem(value: null, child: Text('All Urgencies')),
        const PopupMenuItem(value: 'High', child: Text('High (Critical)')),
        const PopupMenuItem(value: 'Medium', child: Text('Medium')),
        const PopupMenuItem(value: 'Low', child: Text('Low')),
      ],
      child: _buildDropdownFilterChip(_selectedUrgency ?? 'Urgency', _selectedUrgency != null),
    );
  }

  Widget _buildNavItem(IconData icon, String label, int index) {
    final isSelected = _selectedIndex == index;
    return InkWell(
      onTap: () {
        if (index == 1) {
          // Navigate to Map screen
          Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => const MapScreen()),
          );
        } else if (index == 3) {
          Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => const ProfileScreen()),
          );
        } else if (index == 2) {
          Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => const UpdatesScreen()),
          );
        } else {
          setState(() => _selectedIndex = index);
        }
      },
      child: Column(
        mainAxisSize: MainAxisSize.min,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            icon,
            color: isSelected ? AppColors.primaryBlue : AppColors.textSecondary,
          ),
          const SizedBox(height: 4),
          Text(
            label,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            softWrap: false,
            style: TextStyle(
              fontSize: 10,
               color: isSelected ? AppColors.primaryBlue : AppColors.textSecondary,
               fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
            ),
          )
        ],
      ),
    );
  }
}

class _VideoReportThumbnail extends StatefulWidget {
  final String videoUrl;
  final double height;
  final double borderRadius;

  const _VideoReportThumbnail({
    required this.videoUrl,
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
      final controller = VideoPlayerController.networkUrl(Uri.parse(widget.videoUrl));
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
            else
              Container(
                color: AppColors.greyOutline.withOpacity(0.22),
                child: Center(
                  child: Icon(
                    Icons.videocam,
                    size: 34,
                    color: Theme.of(context).brightness == Brightness.dark ? AppColors.darkTextPrimary : AppColors.textPrimary.withOpacity(0.8),
                  ),
                ),
              ),
            Positioned(
              right: 10,
              bottom: 10,
              child: Container(
                padding: const EdgeInsets.all(7),
                decoration: BoxDecoration(
                  color: Colors.black.withOpacity(0.55),
                  borderRadius: BorderRadius.circular(999),
                ),
                child: const Icon(Icons.play_arrow, size: 18, color: Colors.white),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
