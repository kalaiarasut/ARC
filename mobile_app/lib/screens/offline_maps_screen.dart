import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_map_tile_caching/flutter_map_tile_caching.dart';
import 'package:latlong2/latlong.dart';
import '../theme/app_colors.dart';
import '../services/tile_caching_service.dart';
import '../l10n/l10n.dart';
import '../l10n/app_localizations.dart';

class OfflineMapsScreen extends StatefulWidget {
  const OfflineMapsScreen({super.key});

  @override
  State<OfflineMapsScreen> createState() => _OfflineMapsScreenState();
}

class _OfflineMapsScreenState extends State<OfflineMapsScreen> {
  List<StoreInfo> _regions = [];
  bool _loading = true;
  bool _downloading = false;
  double _downloadProgress = 0;
  int _downloadedTiles = 0;
  int _totalTiles = 0;
  StreamSubscription<DownloadProgress>? _downloadSub;

  @override
  void initState() {
    super.initState();
    _loadRegions();
  }

  @override
  void dispose() {
    _downloadSub?.cancel();
    super.dispose();
  }

  Future<void> _loadRegions() async {
    setState(() => _loading = true);
    try {
      final regions = await TileCachingService.getDownloadedRegions();
      if (!mounted) return;
      setState(() {
        _regions = regions;
        _loading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() => _loading = false);
    }
  }

  Future<void> _showDownloadDialog() async {
    final nameController = TextEditingController(text: 'My Area');
    double selectedRadius = 10;

    final result = await showDialog<({String name, double radius})>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          title: Text(context.l10n.downloadOfflineRegionTitle),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                context.l10n.downloadOfflineRegionDesc,
                style: TextStyle(fontSize: 13, color: Theme.of(context).brightness == Brightness.dark ? AppColors.darkTextSecondary : AppColors.textSecondary),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: nameController,
                decoration: InputDecoration(
                  labelText: context.l10n.regionNameLabel,
                  border: const OutlineInputBorder(),
                  isDense: true,
                ),
              ),
              const SizedBox(height: 16),
              Text(context.l10n.radiusLabel, style: const TextStyle(fontWeight: FontWeight.w600)),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                children: [5.0, 10.0, 25.0].map((r) {
                  final isSelected = selectedRadius == r;
                  return ChoiceChip(
                    label: Text('${r.toInt()} km'),
                    selected: isSelected,
                    selectedColor: AppColors.primaryBlue,
                    labelStyle: TextStyle(
                      color: isSelected ? Colors.white : AppColors.textPrimary,
                      fontWeight: FontWeight.w600,
                    ),
                    onSelected: (_) => setDialogState(() => selectedRadius = r),
                  );
                }).toList(),
              ),
              const SizedBox(height: 12),
              Text(
                _estimateTiles(selectedRadius, context.l10n),
                style: TextStyle(fontSize: 12, color: Theme.of(context).brightness == Brightness.dark ? AppColors.darkTextSecondary : AppColors.textSecondary),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: Text(context.l10n.cancelLabel),
            ),
            ElevatedButton(
              onPressed: () => Navigator.pop(ctx, (name: nameController.text.trim(), radius: selectedRadius)),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primaryBlue,
                foregroundColor: Theme.of(context).cardColor,
              ),
              child: Text(context.l10n.downloadLabel),
            ),
          ],
        ),
      ),
    );

    if (result == null || result.name.isEmpty) return;
    _startDownload(result.name, result.radius);
  }

  String _estimateTiles(double radiusKm, AppLocalizations l10n) {
    // Rough estimate: ~4^(zoom) tiles per km² at zoom 16
    final areaSqKm = 3.14 * radiusKm * radiusKm;
    final estimate = (areaSqKm * 50).round(); // Rough approximation
    return l10n.estimatedTiles(estimate, (estimate * 0.015).toStringAsFixed(1));
  }

  void _startDownload(String name, double radiusKm) {
    // Use a fixed center (user's current location would be better, but for simplicity use a default)
    // In a real implementation, you'd get the user's current location
    // For now, we'll use the map's current center or a default
    final center = LatLng(12.9716, 77.5946); // Default; ideally pass from map

    setState(() {
      _downloading = true;
      _downloadProgress = 0;
      _downloadedTiles = 0;
      _totalTiles = 0;
    });

    final storeName = 'offline_${name.replaceAll(RegExp(r'[^a-zA-Z0-9]'), '_').toLowerCase()}';

    _downloadSub?.cancel();
    _downloadSub = TileCachingService.downloadRegion(
      name: storeName,
      center: center,
      radiusKm: radiusKm,
    ).listen(
      (progress) {
        if (!mounted) return;
        setState(() {
          _downloadedTiles = progress.attemptedTiles;
          _totalTiles = progress.maxTiles;
          _downloadProgress = _totalTiles > 0 ? _downloadedTiles / _totalTiles : 0;
        });
      },
      onDone: () {
        if (!mounted) return;
        setState(() => _downloading = false);
        _loadRegions();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(context.l10n.downloadSuccessMsg(name)),
            backgroundColor: Colors.green,
          ),
        );
      },
      onError: (e) {
        if (!mounted) return;
        setState(() => _downloading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(context.l10n.downloadFailedMsg(e.toString())),
            backgroundColor: AppColors.error,
          ),
        );
      },
    );
  }

  Future<void> _deleteRegion(StoreInfo region) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(context.l10n.deleteRegionTitle),
        content: Text(context.l10n.deleteRegionDesc(region.name, region.tileCount)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: Text(context.l10n.cancelLabel)),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: Text(context.l10n.deleteLabel, style: const TextStyle(color: AppColors.error)),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    await TileCachingService.deleteRegion(region.name);
    _loadRegions();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios, color: Theme.of(context).brightness == Brightness.dark ? AppColors.darkTextPrimary : AppColors.textPrimary),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          context.l10n.offlineMapsTitle,
          style: TextStyle(color: Theme.of(context).brightness == Brightness.dark ? AppColors.darkTextPrimary : AppColors.textPrimary, fontWeight: FontWeight.bold),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.add_circle_outline, color: AppColors.primaryBlue),
            onPressed: _downloading ? null : _showDownloadDialog,
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                // Download progress
                if (_downloading)
                  Container(
                    margin: const EdgeInsets.all(16),
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Theme.of(context).cardColor,
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            ),
                            const SizedBox(width: 10),
                            Text(
                              context.l10n.downloadingTiles,
                              style: const TextStyle(fontWeight: FontWeight.w600),
                            ),
                            const Spacer(),
                            Text(
                              '$_downloadedTiles / $_totalTiles',
                              style: TextStyle(fontSize: 12, color: Theme.of(context).brightness == Brightness.dark ? AppColors.darkTextSecondary : AppColors.textSecondary),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        LinearProgressIndicator(
                          value: _downloadProgress,
                          backgroundColor: Colors.grey[200],
                          color: AppColors.primaryBlue,
                          borderRadius: BorderRadius.circular(4),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          '${(_downloadProgress * 100).toStringAsFixed(1)}%',
                          style: TextStyle(fontSize: 12, color: Theme.of(context).brightness == Brightness.dark ? AppColors.darkTextSecondary : AppColors.textSecondary),
                        ),
                      ],
                    ),
                  ),

                // Info card
                Container(
                  margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: AppColors.primaryBlue.withOpacity(0.08),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.info_outline, color: AppColors.primaryBlue, size: 20),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          context.l10n.offlineMapInfoDesc,
                          style: TextStyle(fontSize: 12.5, color: AppColors.primaryBlue.withOpacity(0.8)),
                        ),
                      ),
                    ],
                  ),
                ),

                // Regions list
                Expanded(
                  child: _regions.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.map_outlined, size: 56, color: Colors.grey[400]),
                              const SizedBox(height: 12),
                              Text(
                                context.l10n.noOfflineRegionsYet,
                                style: TextStyle(color: Theme.of(context).brightness == Brightness.dark ? AppColors.darkTextSecondary : AppColors.textSecondary, fontSize: 16),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                context.l10n.tapToDownloadRegion,
                                style: TextStyle(color: Theme.of(context).brightness == Brightness.dark ? AppColors.darkTextSecondary : AppColors.textSecondary, fontSize: 13),
                              ),
                            ],
                          ),
                        )
                      : ListView.separated(
                          padding: const EdgeInsets.all(16),
                          itemCount: _regions.length,
                          separatorBuilder: (_, __) => const SizedBox(height: 8),
                          itemBuilder: (context, index) {
                            final region = _regions[index];
                            return Container(
                              padding: const EdgeInsets.all(14),
                              decoration: BoxDecoration(
                                color: Theme.of(context).cardColor,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Row(
                                children: [
                                  const Icon(Icons.map, size: 32, color: AppColors.primaryBlue),
                                  const SizedBox(width: 16),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          region.name,
                                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                                        ),
                                        const SizedBox(height: 4),
                                        Text(
                                          '${region.tileCount} tiles downloaded',
                                          style: const TextStyle(color: Colors.grey, fontSize: 13),
                                        ),
                                      ],
                                    ),
                                  ),
                                  IconButton(
                                    icon: const Icon(Icons.delete_outline, color: AppColors.error),
                                    onPressed: () => _deleteRegion(region),
                                  ),
                                ],
                              ),
                            );
                          },
                        ),
                ),
              ],
            ),
    );
  }
}
