import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:image_picker/image_picker.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:http/http.dart' as http;
import 'package:path_provider/path_provider.dart';
import 'package:record/record.dart';
import 'dart:async';
import 'dart:io';
import 'package:path/path.dart' as path;
import '../l10n/l10n.dart';
import '../theme/app_colors.dart';
import '../widgets/primary_button.dart';
import '../models/hazard_report.dart';
import '../services/report_service.dart';
import '../services/offline_report_queue_service.dart';
import '../core/supabase_config.dart';
import 'profile_module_screen.dart';
import 'video_record_screen.dart';

class ReportScreen extends StatefulWidget {
  const ReportScreen({super.key});

  @override
  State<ReportScreen> createState() => _ReportScreenState();
}

class _ReportScreenState extends State<ReportScreen> {
  final TextEditingController _descriptionController = TextEditingController();
  final ImagePicker _picker = ImagePicker();
  final AudioRecorder _audioRecorder = AudioRecorder();
  
  String _selectedHazard = '';
  Position? _currentPosition;
  DateTime _now = DateTime.now();
  Timer? _clockTimer;
  final List<XFile> _selectedMedia = [];
  bool _isRecordingAudio = false;
  bool _isHighRisk = false;
  int _peopleAtRisk = 0;
  String _urgencyLevel = 'Medium';
  bool _isSubmitting = false;
  final ReportService _reportService = ReportService();

  static const int _maxAttachments = 5;

  final List<Map<String, dynamic>> _hazardTypes = [
    {'name': 'High Waves', 'icon': '🌊'},
    {'name': 'Tsunami', 'icon': '🌀'},
    {'name': 'Storm', 'icon': '⛈️'},
    {'name': 'Flood', 'icon': '🌊'},
    {'name': 'Other', 'icon': '🚨'},
  ];

  String _hazardDisplayName(String hazardName) {
    switch (hazardName) {
      case 'High Waves':
        return context.l10n.hazardHighWaves;
      case 'Tsunami':
        return context.l10n.hazardTsunami;
      case 'Storm':
        return context.l10n.hazardStorm;
      case 'Flood':
        return context.l10n.hazardFlood;
      case 'Other':
        return context.l10n.hazardOther;
      default:
        return hazardName;
    }
  }

  String _urgencyDisplayName(String level) {
    switch (level) {
      case 'Low':
        return context.l10n.urgencyLow;
      case 'Medium':
        return context.l10n.urgencyMedium;
      case 'High':
        return context.l10n.urgencyHigh;
      default:
        return level;
    }
  }

  Future<Position?> _getBestPosition({
    Duration timeout = const Duration(seconds: 12),
    double goodEnoughAccuracyMeters = 25,
  }) async {
    Position? best = await Geolocator.getLastKnownPosition();

    final completer = Completer<Position?>();
    StreamSubscription<Position>? sub;
    try {
      final settings = const LocationSettings(
        accuracy: LocationAccuracy.bestForNavigation,
        distanceFilter: 0,
      );

      sub = Geolocator.getPositionStream(locationSettings: settings).listen(
        (pos) {
          if (best == null || pos.accuracy < best!.accuracy) {
            best = pos;
          }
          if (!completer.isCompleted && pos.accuracy <= goodEnoughAccuracyMeters) {
            completer.complete(pos);
          }
        },
        onError: (_) {
          if (!completer.isCompleted) completer.complete(best);
        },
      );

      final result = await Future.any<Position?>([
        completer.future,
        Future<Position?>.delayed(timeout, () => best),
      ]);

      return result ?? best;
    } catch (_) {
      return best;
    } finally {
      await sub?.cancel();
    }
  }

  @override
  void initState() {
    super.initState();
    _getCurrentLocation();
    _clockTimer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (!mounted) return;
      setState(() => _now = DateTime.now());
    });
  }

  @override
  void dispose() {
    _stopAudioRecordingIfNeeded();
    _clockTimer?.cancel();
    _descriptionController.dispose();
    super.dispose();
  }

  Future<void> _stopAudioRecordingIfNeeded() async {
    if (!_isRecordingAudio) return;
    try {
      await _audioRecorder.stop();
    } catch (_) {
      // Ignore
    } finally {
      if (mounted) {
        setState(() => _isRecordingAudio = false);
      }
    }
  }

  Future<void> _getCurrentLocation() async {
    try {
      // Step 1: Check if location services are enabled
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        if (mounted) {
          // Show dialog to enable location services
          final shouldOpenSettings = await showDialog<bool>(
            context: context,
            builder: (context) => AlertDialog(
              title: Text(context.l10n.locationServicesOffTitle),
              content: Text(context.l10n.enableLocationServicesForReporting),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context, false),
                  child: Text(context.l10n.cancel),
                ),
                TextButton(
                  onPressed: () => Navigator.pop(context, true),
                  child: Text(context.l10n.openSettings),
                ),
              ],
            ),
          );

          if (shouldOpenSettings == true) {
            await Geolocator.openLocationSettings();
          }
        }
        return;
      }

      // Step 2: Check/request location permission
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text(context.l10n.locationPermissionDeniedAllowInSettings)),
            );
          }
          return;
        }
      }

      if (permission == LocationPermission.deniedForever) {
        if (mounted) {
          // Permanently denied - must go to app settings
          final shouldOpenSettings = await showDialog<bool>(
            context: context,
            builder: (context) => AlertDialog(
              title: Text(context.l10n.permissionRequiredTitle),
              content: Text(context.l10n.locationPermissionPermanentlyDeniedForReporting),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context, false),
                  child: Text(context.l10n.cancel),
                ),
                TextButton(
                  onPressed: () => Navigator.pop(context, true),
                  child: Text(context.l10n.openSettings),
                ),
              ],
            ),
          );

          if (shouldOpenSettings == true) {
            await Geolocator.openAppSettings();
          }
        }
        return;
      }

      // Step 3: Get current position with accuracy
      final position = await _getBestPosition(timeout: const Duration(seconds: 12)) ??
          await Geolocator.getCurrentPosition(
            desiredAccuracy: LocationAccuracy.bestForNavigation,
            timeLimit: const Duration(seconds: 12),
          );
      
      setState(() => _currentPosition = position);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(context.l10n.errorGettingLocationWithError(e.toString()))),
        );
      }
    }
  }

  Future<bool> _requestMediaPermission(ImageSource source) async {
    // Kept for backwards compatibility with existing call sites.
    // Prefer the specific helpers below for images/videos.
    if (source == ImageSource.camera) {
      final camera = await Permission.camera.request();
      return camera.isGranted;
    }

    if (Platform.isIOS) {
      final photos = await Permission.photos.request();
      return photos.isGranted || photos.isLimited;
    }

    // Android: request photos permission (Android 13+ maps to READ_MEDIA_IMAGES).
    final photos = await Permission.photos.request();
    if (photos.isGranted || photos.isLimited) return true;

    // Fallback for older Android devices.
    final storage = await Permission.storage.request();
    return storage.isGranted;
  }

  Future<bool> _requestVideoCameraPermissions() async {
    final camera = await Permission.camera.request();
    if (!camera.isGranted) return false;

    // Many devices require microphone permission to record video with audio.
    final mic = await Permission.microphone.request();
    return mic.isGranted;
  }


  Future<void> _pickFromCamera() async {
    final granted = await _requestMediaPermission(ImageSource.camera);
    if (!mounted) return;
    if (!granted) return;

    try {
      if (_selectedMedia.length >= _maxAttachments) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(context.l10n.maximumAttachmentsAllowed(_maxAttachments))),
        );
        return;
      }

      final XFile? image = await _picker.pickImage(source: ImageSource.camera);
      if (image != null) {
        setState(() => _selectedMedia.add(image));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(context.l10n.errorPickingImageWithError(e.toString()))),
        );
      }
    }
  }


  void _removeMediaAt(int index) {
    setState(() => _selectedMedia.removeAt(index));
  }

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

  bool _isAudio(XFile file) {
    final mt = file.mimeType;
    if (mt != null && mt.startsWith('audio/')) return true;
    final lower = file.name.toLowerCase();
    return lower.endsWith('.mp3') || lower.endsWith('.wav') || lower.endsWith('.m4a') || lower.endsWith('.aac');
  }

  Future<void> _pickVideoFromCamera() async {
    final granted = await _requestVideoCameraPermissions();
    if (!mounted) return;
    if (!granted) return;

    try {
      if (_selectedMedia.length >= _maxAttachments) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(context.l10n.maximumAttachmentsAllowed(_maxAttachments))),
        );
        return;
      }

      final XFile? video = await Navigator.push<XFile?>(
        context,
        MaterialPageRoute(builder: (_) => const VideoRecordScreen()),
      );
      if (!mounted) return;
      if (video != null) {
        setState(() => _selectedMedia.add(video));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(context.l10n.errorPickingVideoWithError(e.toString()))),
        );
      }
    }
  }

  Future<void> _toggleAudioRecording() async {
    if (_selectedMedia.length >= _maxAttachments) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(context.l10n.maximumAttachmentsAllowed(_maxAttachments))),
      );
      return;
    }

    if (_isRecordingAudio) {
      try {
        final filePath = await _audioRecorder.stop();
        if (!mounted) return;
        setState(() => _isRecordingAudio = false);
        if (filePath == null || filePath.isEmpty) return;
        final name = path.basename(filePath);
        setState(() {
          _selectedMedia.add(XFile(filePath, name: name, mimeType: 'audio/m4a'));
        });
      } catch (e) {
        if (!mounted) return;
        setState(() => _isRecordingAudio = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(context.l10n.errorStoppingAudioWithError(e.toString()))),
        );
      }
      return;
    }

    final mic = await Permission.microphone.request();
    if (!mounted) return;
    if (!mic.isGranted) return;

    try {
      final canRecord = await _audioRecorder.hasPermission();
      if (!canRecord) return;

      final dir = await getTemporaryDirectory();
      final filePath = path.join(
        dir.path,
        'audio_${DateTime.now().millisecondsSinceEpoch}.m4a',
      );

      await _audioRecorder.start(
        const RecordConfig(
          encoder: AudioEncoder.aacLc,
          bitRate: 64000,
          sampleRate: 22050,
        ),
        path: filePath,
      );

      if (!mounted) return;
      setState(() => _isRecordingAudio = true);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(context.l10n.recordingAudioTapToStop)),
      );
    } catch (e) {
      if (!mounted) return;
      setState(() => _isRecordingAudio = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(context.l10n.errorStartingAudioWithError(e.toString()))),
      );
    }
  }

  Future<void> _submitReport() async {
    // Validation
    if (_selectedHazard.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(context.l10n.pleaseSelectHazardType)),
      );
      return;
    }

    if (_descriptionController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(context.l10n.pleaseDescribeSituation)),
      );
      return;
    }

    if (_currentPosition == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(context.l10n.waitingForLocation)),
      );
      return;
    }

    if (_isHighRisk && _peopleAtRisk <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(context.l10n.pleaseEnterPeopleAtRisk)),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      final eventTime = DateTime.now();

      // Check connectivity
      final isOnline = await _checkRealConnectivity();
      
      if (!isOnline) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(context.l10n.noInternetReportQueued)),
          );
        }
        // Queue offline report for background sync
        final userId = SupabaseConfig.client.auth.currentUser?.id;
        if (userId == null) {
          throw Exception('User not authenticated');
        }

        final prefs = await SharedPreferences.getInstance();
        final userPhone = prefs.getString('user_phone') ?? '';
        final userName = prefs.getString('user_name');

        if (userPhone.trim().isEmpty) {
          throw Exception('Missing phone number. Please complete your profile.');
        }

        final report = HazardReport(
          userId: userId,
          userPhone: userPhone,
          userName: userName,
          hazardType: _selectedHazard,
          description: _descriptionController.text.trim(),
          latitude: _currentPosition!.latitude,
          longitude: _currentPosition!.longitude,
          isHighRisk: _isHighRisk,
          peopleAtRisk: _isHighRisk ? _peopleAtRisk : null,
          urgencyLevel: _isHighRisk ? _urgencyLevel : null,
          mediaUrls: null,
          uploadComplete: false,
          eventTime: eventTime,
        );

        await OfflineReportQueueService.enqueue(report: report, media: _selectedMedia);
        if (mounted) Navigator.pop(context);
        return;
      }

      // Get user data
      final userId = SupabaseConfig.client.auth.currentUser?.id;
      if (userId == null) {
        throw Exception('User not authenticated');
      }

      final prefs = await SharedPreferences.getInstance();
      final userPhone = prefs.getString('user_phone') ?? '';
      final userName = prefs.getString('user_name');

      if (userPhone.trim().isEmpty) {
        if (mounted) {
          final go = await showDialog<bool>(
            context: context,
            builder: (context) => AlertDialog(
              title: Text(context.l10n.profileNeededTitle),
              content: Text(context.l10n.profileNeededBody),
              actions: [
                TextButton(onPressed: () => Navigator.pop(context, false), child: Text(context.l10n.cancel)),
                TextButton(onPressed: () => Navigator.pop(context, true), child: Text(context.l10n.addNow)),
              ],
            ),
          );

          if (!mounted) throw Exception('Missing phone number');

          if (go == true) {
            await Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const ProfileModuleScreen()),
            );
          }
        }
        throw Exception('Missing phone number');
      }

      // === TWO-PHASE UPLOAD ===
      
      // Phase 1: Insert report WITHOUT media
      final report = HazardReport(
        userId: userId,
        userPhone: userPhone,
        userName: userName,
        hazardType: _selectedHazard,
        description: _descriptionController.text.trim(),
        latitude: _currentPosition!.latitude,
        longitude: _currentPosition!.longitude,
        isHighRisk: _isHighRisk,
        peopleAtRisk: _isHighRisk ? _peopleAtRisk : null,
        urgencyLevel: _isHighRisk ? _urgencyLevel : null,
        mediaUrls: null,
        uploadComplete: _selectedMedia.isEmpty, // true if no media
        eventTime: DateTime.now(),
      );

      final reportId = await _reportService.insertReport(report);

      // Phase 2: Upload media (if any)
      if (_selectedMedia.isNotEmpty) {
        List<String> uploadedUrls = [];
        try {
          for (var index = 0; index < _selectedMedia.length; index++) {
            final file = _selectedMedia[index];
            final url = await _reportService.uploadMedia(
              file,
              reportId,
              userId,
              index: index,
            );
            uploadedUrls.add(url);
          }
          
          // Phase 3: Update report with media URLs
          await _reportService.updateReportMedia(reportId, uploadedUrls);
          
        } catch (uploadError) {
          // Partial success: Report saved, but media failed
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(context.l10n.reportSavedMediaUploadFailedRetry),
                backgroundColor: Colors.orange,
              ),
            );
          }
          // Queue the same report + media for background retry.
          await OfflineReportQueueService.enqueue(
            report: report.copyWith(uploadComplete: false),
            media: _selectedMedia,
            lastError: uploadError.toString(),
          );
        }
      }

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(context.l10n.reportSubmittedSuccessfully),
            backgroundColor: AppColors.success,
          ),
        );
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(context.l10n.errorWithError(e.toString())), backgroundColor: AppColors.error),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }

  // Better connectivity check (not just connectivity_plus)
  Future<bool> _checkRealConnectivity() async {
    final connectivityResults = await Connectivity().checkConnectivity();
    if (connectivityResults.contains(ConnectivityResult.none)) return false;
    
    // Ping Supabase to verify real internet access
    try {
      final response = await http.head(
        Uri.parse('${SupabaseConfig.supabaseUrl}/rest/v1/'),
        headers: {'apikey': SupabaseConfig.supabaseAnonKey},
      ).timeout(const Duration(seconds: 3));
      return response.statusCode >= 200 && response.statusCode < 400;
    } catch (_) {
      return false;
    }
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
          context.l10n.reportHazard,
          style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Text(
              context.l10n.whatAreYouSeeing,
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              context.l10n.reportHelpsKeepSafe,
              style: const TextStyle(fontSize: 14, color: AppColors.textSecondary),
            ),
            
            const SizedBox(height: 24),

            // Hazard Type Selection
            Text(
              context.l10n.hazardTypeRequired,
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: _hazardTypes.map((hazard) {
                  final isSelected = _selectedHazard == hazard['name'];
                  return Padding(
                    padding: const EdgeInsets.only(right: 12),
                    child: _buildHazardChip(
                      hazard['name'],
                      hazard['icon'],
                      isSelected,
                    ),
                  );
                }).toList(),
              ),
            ),

            const SizedBox(height: 24),

            // Description
            Text(
              context.l10n.descriptionRequired,
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _descriptionController,
              maxLines: 4,
              decoration: InputDecoration(
                hintText: context.l10n.describeWhatYouSeeHint,
                filled: true,
                fillColor: Colors.white,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide.none,
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide.none,
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: AppColors.primaryBlue, width: 2),
                ),
              ),
            ),

            const SizedBox(height: 24),

            // Location & Time Cards
            Row(
              children: [
                Expanded(
                  child: _buildInfoCard(
                    Icons.location_on,
                    context.l10n.location,
                    _currentPosition != null
                        ? '${_currentPosition!.latitude.toStringAsFixed(4)}, ${_currentPosition!.longitude.toStringAsFixed(4)}'
                        : context.l10n.gettingLocation,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildInfoCard(
                    Icons.access_time,
                    context.l10n.time,
                    '${_now.hour}:${_now.minute.toString().padLeft(2, '0')}',
                  ),
                ),
              ],
            ),

            const SizedBox(height: 8),
            Row(
              children: [
                TextButton.icon(
                  onPressed: _getCurrentLocation,
                  icon: const Icon(Icons.my_location, size: 18),
                  label: Text(context.l10n.retryGps),
                ),
              ],
            ),

            const SizedBox(height: 24),

            // Media Upload
            Text(
              context.l10n.addMediaOptional,
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: _buildMediaButton(
                    Icons.camera_alt,
                    context.l10n.camera,
                    _pickFromCamera,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildMediaButton(
                    Icons.videocam,
                    context.l10n.record,
                    _pickVideoFromCamera,
                  ),
                ),
              ],
            ),

            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: _buildMediaButton(
                    _isRecordingAudio ? Icons.stop : Icons.mic,
                    _isRecordingAudio ? context.l10n.stopAudio : context.l10n.recordAudio,
                    _toggleAudioRecording,
                  ),
                ),
              ],
            ),

            if (_selectedMedia.isNotEmpty) ...[
              const SizedBox(height: 12),
              SizedBox(
                height: 80,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  itemCount: _selectedMedia.length,
                  itemBuilder: (context, index) {
                    final item = _selectedMedia[index];
                    final isImg = _isImage(item);
                    final isVid = _isVideo(item);
                    final isAud = _isAudio(item);

                    final icon = isVid
                        ? Icons.videocam
                        : (isAud ? Icons.audiotrack : Icons.insert_drive_file);

                    return Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: Stack(
                        children: [
                          ClipRRect(
                            borderRadius: BorderRadius.circular(8),
                            child: isImg
                                ? Image.file(
                                    File(item.path),
                                    width: 80,
                                    height: 80,
                                    fit: BoxFit.cover,
                                  )
                                : Container(
                                    width: 80,
                                    height: 80,
                                    color: const Color(0xFFEFF3F6),
                                    child: Column(
                                      mainAxisAlignment: MainAxisAlignment.center,
                                      children: [
                                        Icon(icon, color: AppColors.primaryBlue),
                                        const SizedBox(height: 4),
                                        Padding(
                                          padding: const EdgeInsets.symmetric(horizontal: 6),
                                          child: Text(
                                            item.name,
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                            textAlign: TextAlign.center,
                                            style: const TextStyle(fontSize: 10, color: AppColors.textSecondary),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                          ),
                          Positioned(
                            top: 4,
                            right: 4,
                            child: GestureDetector(
                              onTap: () => _removeMediaAt(index),
                              child: Container(
                                decoration: BoxDecoration(
                                  color: Colors.black.withOpacity(0.6),
                                  shape: BoxShape.circle,
                                ),
                                padding: const EdgeInsets.all(4),
                                child: const Icon(Icons.close, size: 14, color: Colors.white),
                              ),
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ),
            ],

            const SizedBox(height: 24),

            // High-Risk Toggle
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.warning_amber_rounded, color: AppColors.error),
                          const SizedBox(width: 8),
                          Text(
                            context.l10n.highRiskSituation,
                            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                      Switch(
                        value: _isHighRisk,
                        onChanged: (value) => setState(() => _isHighRisk = value),
                        activeColor: AppColors.error,
                      ),
                    ],
                  ),
                  
                  if (_isHighRisk) ...[
                    const SizedBox(height: 16),
                    TextField(
                      keyboardType: TextInputType.number,
                      decoration: InputDecoration(
                        labelText: context.l10n.peopleAtRiskEstimate,
                        filled: true,
                        fillColor: const Color(0xFFF7F9FB),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                          borderSide: BorderSide.none,
                        ),
                      ),
                      onChanged: (value) => _peopleAtRisk = int.tryParse(value) ?? 0,
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: ['Low', 'Medium', 'High'].map((level) {
                        final isSelected = _urgencyLevel == level;
                        return Expanded(
                          child: Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 4),
                            child: GestureDetector(
                              onTap: () => setState(() => _urgencyLevel = level),
                              child: Container(
                                padding: const EdgeInsets.symmetric(vertical: 8),
                                decoration: BoxDecoration(
                                  color: isSelected ? AppColors.error : const Color(0xFFF7F9FB),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Text(
                                  _urgencyDisplayName(level),
                                  textAlign: TextAlign.center,
                                  style: TextStyle(
                                    color: isSelected ? Colors.white : AppColors.textSecondary,
                                    fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                                  ),
                                ),
                              ),
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                  ],
                ],
              ),
            ),

            const SizedBox(height: 32),

            // Submit Button
            SizedBox(
              width: double.infinity,
              child: _isSubmitting
                  ? const Center(child: CircularProgressIndicator())
                  : PrimaryButton(
                      text: context.l10n.submitReport,
                      backgroundColor: AppColors.primaryBlue,
                      onPressed: _submitReport,
                    ),
            ),

            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildHazardChip(String name, String emoji, bool isSelected) {
    return GestureDetector(
      onTap: () => setState(() => _selectedHazard = name),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primaryBlue : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? AppColors.primaryBlue : AppColors.greyOutline,
          ),
        ),
        child: Row(
          children: [
            Text(emoji, style: const TextStyle(fontSize: 18)),
            const SizedBox(width: 8),
            Text(
              _hazardDisplayName(name),
              style: TextStyle(
                color: isSelected ? Colors.white : AppColors.textPrimary,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoCard(IconData icon, String label, String value) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: AppColors.secondaryCyan, size: 20),
          const SizedBox(height: 8),
          Text(
            label,
            style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
          ),
        ],
      ),
    );
  }

  Widget _buildMediaButton(IconData icon, String label, VoidCallback onPressed) {
    return OutlinedButton(
      onPressed: onPressed,
      style: OutlinedButton.styleFrom(
        padding: const EdgeInsets.symmetric(vertical: 16),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        side: const BorderSide(color: AppColors.greyOutline),
      ),
      child: Column(
        children: [
          Icon(icon, color: AppColors.primaryBlue),
          const SizedBox(height: 4),
          Text(label, style: const TextStyle(color: AppColors.textPrimary)),
        ],
      ),
    );
  }
}
