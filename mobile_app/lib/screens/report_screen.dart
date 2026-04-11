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
import '../services/upload_progress_controller.dart';
import 'profile_module_screen.dart';

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
  String _immediateDangerStatus = HazardReport.immediateDangerNotSure;
  String _affectedPeopleBand = HazardReport.affectedPeopleUnknown;
  bool _showImmediateDangerTip = false;
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

  String _affectedPeopleLabel(String band) {
    switch (band) {
      case HazardReport.affectedPeople1To5:
        return '1-5';
      case HazardReport.affectedPeople6To20:
        return '6-20';
      case HazardReport.affectedPeople21To50:
        return '21-50';
      case HazardReport.affectedPeople50Plus:
        return '50+';
      case HazardReport.affectedPeopleUnknown:
      default:
        return 'Unknown';
    }
  }

  bool get _isImmediateDangerYes =>
      _immediateDangerStatus == HazardReport.immediateDangerYes;

  bool get _isHighRisk => _isImmediateDangerYes;

  int? get _peopleAtRisk {
    if (!_isImmediateDangerYes) return null;

    switch (_affectedPeopleBand) {
      case HazardReport.affectedPeople1To5:
        return 3;
      case HazardReport.affectedPeople6To20:
        return 13;
      case HazardReport.affectedPeople21To50:
        return 35;
      case HazardReport.affectedPeople50Plus:
        return 50;
      case HazardReport.affectedPeopleUnknown:
      default:
        return null;
    }
  }

  String get _urgencyLevel {
    switch (_immediateDangerStatus) {
      case HazardReport.immediateDangerYes:
        return 'High';
      case HazardReport.immediateDangerNotSure:
        return 'Medium';
      case HazardReport.immediateDangerNo:
      default:
        return 'Low';
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
          if (!completer.isCompleted &&
              pos.accuracy <= goodEnoughAccuracyMeters) {
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
              SnackBar(
                content: Text(
                  context.l10n.locationPermissionDeniedAllowInSettings,
                ),
              ),
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
              content: Text(
                context.l10n.locationPermissionPermanentlyDeniedForReporting,
              ),
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
      final position =
          await _getBestPosition(timeout: const Duration(seconds: 12)) ??
          await Geolocator.getCurrentPosition(
            desiredAccuracy: LocationAccuracy.bestForNavigation,
            timeLimit: const Duration(seconds: 12),
          );

      setState(() => _currentPosition = position);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              context.l10n.errorGettingLocationWithError(e.toString()),
            ),
          ),
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
          SnackBar(
            content: Text(
              context.l10n.maximumAttachmentsAllowed(_maxAttachments),
            ),
          ),
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
          SnackBar(
            content: Text(
              context.l10n.errorPickingImageWithError(e.toString()),
            ),
          ),
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
    return lower.endsWith('.mp4') ||
        lower.endsWith('.mov') ||
        lower.endsWith('.mkv');
  }

  bool _isAudio(XFile file) {
    final mt = file.mimeType;
    if (mt != null && mt.startsWith('audio/')) return true;
    final lower = file.name.toLowerCase();
    return lower.endsWith('.mp3') ||
        lower.endsWith('.wav') ||
        lower.endsWith('.m4a') ||
        lower.endsWith('.aac');
  }

  Future<void> _pickVideoFromCamera() async {
    final granted = await _requestVideoCameraPermissions();
    if (!mounted) return;
    if (!granted) return;

    try {
      if (_selectedMedia.length >= _maxAttachments) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              context.l10n.maximumAttachmentsAllowed(_maxAttachments),
            ),
          ),
        );
        return;
      }

      final XFile? video = await _picker.pickVideo(
        source: ImageSource.camera,
        preferredCameraDevice: CameraDevice.rear,
      );
      if (!mounted) return;
      if (video != null) {
        setState(() => _selectedMedia.add(video));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              context.l10n.errorPickingVideoWithError(e.toString()),
            ),
          ),
        );
      }
    }
  }

  Future<void> _toggleAudioRecording() async {
    if (_selectedMedia.length >= _maxAttachments) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            context.l10n.maximumAttachmentsAllowed(_maxAttachments),
          ),
        ),
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
          _selectedMedia.add(
            XFile(filePath, name: name, mimeType: 'audio/m4a'),
          );
        });
      } catch (e) {
        if (!mounted) return;
        setState(() => _isRecordingAudio = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              context.l10n.errorStoppingAudioWithError(e.toString()),
            ),
          ),
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
        SnackBar(
          content: Text(context.l10n.errorStartingAudioWithError(e.toString())),
        ),
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
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(context.l10n.waitingForLocation)));
      return;
    }

    setState(() => _isSubmitting = true);

    final l10n = context.l10n;
    try {
      final eventTime = DateTime.now();

      // Check connectivity
      final isOnline = await _checkRealConnectivity();

      if (!isOnline) {
        if (mounted) {
          ScaffoldMessenger.of(
            context,
          ).showSnackBar(SnackBar(content: Text(l10n.noInternetReportQueued)));
        }
        // Queue offline report for background sync
        final userId = SupabaseConfig.client.auth.currentSession?.user.id ?? SupabaseConfig.client.auth.currentUser?.id;
        if (userId == null) {
          throw Exception('User not authenticated');
        }

        final prefs = await SharedPreferences.getInstance();
        final userPhone = prefs.getString('user_phone') ?? '';
        final userName = prefs.getString('user_name');

        if (userPhone.trim().isEmpty) {
          throw Exception(
            'Missing phone number. Please complete your profile.',
          );
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
          peopleAtRisk: _peopleAtRisk,
          urgencyLevel: _urgencyLevel,
          immediateDangerStatus: _immediateDangerStatus,
          affectedPeopleBand: _isImmediateDangerYes
              ? _affectedPeopleBand
              : null,
          mediaUrls: null,
          uploadComplete: false,
          eventTime: eventTime,
        );

        await OfflineReportQueueService.enqueue(
          report: report,
          media: _selectedMedia,
        );
        if (mounted) Navigator.pop(context);
        return;
      }

      final totalSteps = 2 + _selectedMedia.length;
      UploadProgressController.instance.start(
        flowType: UploadFlowType.submit,
        title: l10n.uploadingReportTitle,
        subtitle: l10n.preparingReportDesc,
        totalSteps: totalSteps,
      );

      // Get user data
      final userId = SupabaseConfig.client.auth.currentSession?.user.id ?? SupabaseConfig.client.auth.currentUser?.id;
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
              title: Text(l10n.profileNeededTitle),
              content: Text(l10n.profileNeededBody),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context, false),
                  child: Text(l10n.cancel),
                ),
                TextButton(
                  onPressed: () => Navigator.pop(context, true),
                  child: Text(l10n.addNow),
                ),
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
        peopleAtRisk: _peopleAtRisk,
        urgencyLevel: _urgencyLevel,
        immediateDangerStatus: _immediateDangerStatus,
        affectedPeopleBand: _isImmediateDangerYes ? _affectedPeopleBand : null,
        mediaUrls: null,
        uploadComplete: _selectedMedia.isEmpty, // true if no media
        eventTime: DateTime.now(),
      );

      final reportId = await _reportService.insertReport(report);
      UploadProgressController.instance.step(l10n.reportDetailsUploaded);

      // If backend dedupe returned an existing report, stop and inform user.
      final meta = await _reportService.getReportMetaById(reportId);
      final existingClientId = meta?['client_id']?.toString();
      final isLikelyDuplicate =
          existingClientId != null && existingClientId != report.clientId;
      if (isLikelyDuplicate) {
        UploadProgressController.instance.complete(l10n.duplicateReportLinked);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(l10n.duplicateReportDetected),
              backgroundColor: Colors.orange,
            ),
          );
          await _showSubmittedConfirmationDialog();
          UploadProgressController.instance.clear();
          if (mounted) Navigator.pop(context);
        }
        return;
      }

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
            UploadProgressController.instance.step(
              l10n.uploadedAttachmentCounter(index + 1, _selectedMedia.length),
              subtitle: l10n.uploadingMedia,
            );
          }

          // Phase 3: Update report with media URLs
          await _reportService.updateReportMedia(reportId, uploadedUrls);
        } catch (uploadError) {
          // Partial success: Report saved, but media failed
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(l10n.reportSavedMediaUploadFailedRetry),
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
          UploadProgressController.instance.note(l10n.mediaUploadFailedQueued);
        }
      }

      UploadProgressController.instance.step(l10n.finalizingReport);
      UploadProgressController.instance.complete(
        l10n.reportSubmittedSuccessfully,
      );

      if (mounted) {
        await _showSubmittedConfirmationDialog();
        UploadProgressController.instance.clear();
        if (mounted) Navigator.pop(context);
      }
    } catch (e) {
      final msg = e.toString().toLowerCase();
      if (msg.contains('rate_limited_min_interval')) {
        UploadProgressController.instance.fail(l10n.pleaseWaitBeforeSending);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(l10n.rateLimitMinInterval),
              backgroundColor: Colors.orange,
            ),
          );
        }
      } else if (msg.contains('rate_limited_device')) {
        UploadProgressController.instance.fail(l10n.pleaseWaitBeforeSending);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(l10n.rateLimitMinInterval),
              backgroundColor: Colors.orange,
            ),
          );
        }
      } else if (msg.contains('rate_limited_hourly')) {
        UploadProgressController.instance.fail(l10n.hourlyReportLimitTitle);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(l10n.rateLimitHourly),
              backgroundColor: Colors.orange,
            ),
          );
        }
      } else if (msg.contains('device_id_required')) {
        UploadProgressController.instance.fail(l10n.uploadFailedError('device_id_required'));
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: const Text('Device registration is missing. Please reopen the app and try again.'),
              backgroundColor: AppColors.error,
            ),
          );
        }
      } else if (msg.contains('backend_submission_rpc_missing')) {
        UploadProgressController.instance.fail(l10n.uploadFailedError('backend_submission_rpc_missing'));
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: const Text('Report submission is temporarily unavailable. Please try again later.'),
              backgroundColor: AppColors.error,
            ),
          );
        }
      } else {
        UploadProgressController.instance.fail(
          l10n.uploadFailedError(e.toString()),
        );
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(l10n.errorWithError(e.toString())),
              backgroundColor: AppColors.error,
            ),
          );
        }
      }
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }

  Future<void> _showSubmittedConfirmationDialog() async {
    if (!mounted) return;
    await showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (context) {
        return Dialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
          ),
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 72,
                  height: 72,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: AppColors.success.withOpacity(0.12),
                  ),
                  child: const Icon(
                    Icons.check_circle,
                    color: AppColors.success,
                    size: 42,
                  ),
                ),
                const SizedBox(height: 14),
                Text(
                  context.l10n.reportSubmittedSuccessfully,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  context.l10n.uploadTimelineCompleted,
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: Theme.of(context).brightness == Brightness.dark
                        ? AppColors.darkTextSecondary
                        : AppColors.textSecondary,
                  ),
                ),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: PrimaryButton(
                    text: context.l10n.doneLabel,
                    backgroundColor: AppColors.primaryBlue,
                    onPressed: () => Navigator.pop(context),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  // Better connectivity check (not just connectivity_plus)
  Future<bool> _checkRealConnectivity() async {
    final connectivityResults = await Connectivity().checkConnectivity();
    if (connectivityResults.contains(ConnectivityResult.none)) return false;

    // Ping Supabase to verify real internet access
    try {
      final response = await http
          .head(
            Uri.parse('${SupabaseConfig.supabaseUrl}/rest/v1/'),
            headers: {'apikey': SupabaseConfig.supabaseAnonKey},
          )
          .timeout(const Duration(seconds: 3));
      return response.statusCode >= 200 && response.statusCode < 400;
    } catch (_) {
      return false;
    }
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
          context.l10n.reportHazard,
          style: TextStyle(
            color: Theme.of(context).brightness == Brightness.dark
                ? AppColors.darkTextPrimary
                : AppColors.textPrimary,
            fontWeight: FontWeight.bold,
          ),
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
                color: Theme.of(context).brightness == Brightness.dark
                    ? AppColors.darkTextPrimary
                    : AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              context.l10n.reportHelpsKeepSafe,
              style: TextStyle(
                fontSize: 14,
                color: Theme.of(context).brightness == Brightness.dark
                    ? AppColors.darkTextSecondary
                    : AppColors.textSecondary,
              ),
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
                fillColor: Theme.of(context).cardColor,
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
                  borderSide: const BorderSide(
                    color: AppColors.primaryBlue,
                    width: 2,
                  ),
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
                    _isRecordingAudio
                        ? context.l10n.stopAudio
                        : context.l10n.recordAudio,
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
                                      mainAxisAlignment:
                                          MainAxisAlignment.center,
                                      children: [
                                        Icon(
                                          icon,
                                          color: AppColors.primaryBlue,
                                        ),
                                        const SizedBox(height: 4),
                                        Padding(
                                          padding: const EdgeInsets.symmetric(
                                            horizontal: 6,
                                          ),
                                          child: Text(
                                            item.name,
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                            textAlign: TextAlign.center,
                                            style: TextStyle(
                                              fontSize: 10,
                                              color:
                                                  Theme.of(
                                                        context,
                                                      ).brightness ==
                                                      Brightness.dark
                                                  ? AppColors.darkTextSecondary
                                                  : AppColors.textSecondary,
                                            ),
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
                                child: const Icon(
                                  Icons.close,
                                  size: 14,
                                  color: Colors.white,
                                ),
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

            _buildDangerQuestionCard(),

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
          color: isSelected
              ? AppColors.primaryBlue
              : Theme.of(context).cardColor,
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
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: AppColors.secondaryCyan, size: 20),
          const SizedBox(height: 8),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              color: Theme.of(context).brightness == Brightness.dark
                  ? AppColors.darkTextSecondary
                  : AppColors.textSecondary,
            ),
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

  Widget _buildMediaButton(
    IconData icon,
    String label,
    VoidCallback onPressed,
  ) {
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
          Text(
            label,
            style: TextStyle(
              color: Theme.of(context).brightness == Brightness.dark
                  ? AppColors.darkTextPrimary
                  : AppColors.textPrimary,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDangerQuestionCard() {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final surfaceColor = isDark
        ? AppColors.darkElevated
        : const Color(0xFFF3F8FB);
    final borderColor = isDark
        ? AppColors.darkOutline
        : AppColors.primaryBlue.withOpacity(0.10);

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: surfaceColor,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: borderColor),
        boxShadow: [
          BoxShadow(
            color: AppColors.primaryBlue.withOpacity(isDark ? 0.08 : 0.05),
            blurRadius: 24,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 42,
                height: 42,
                decoration: BoxDecoration(
                  color: AppColors.error.withOpacity(isDark ? 0.18 : 0.10),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: const Icon(
                  Icons.emergency_outlined,
                  color: AppColors.error,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Is anyone in immediate danger?',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                        color: isDark
                            ? AppColors.darkTextPrimary
                            : AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Flag this when the situation needs fast human attention.',
                      style: TextStyle(
                        fontSize: 12,
                        height: 1.4,
                        color: isDark
                            ? AppColors.darkTextSecondary
                            : AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
              InkWell(
                borderRadius: BorderRadius.circular(12),
                onTap: () => setState(
                  () => _showImmediateDangerTip = !_showImmediateDangerTip,
                ),
                child: Container(
                  width: 34,
                  height: 34,
                  decoration: BoxDecoration(
                    color: AppColors.secondaryCyan.withOpacity(
                      isDark ? 0.18 : 0.12,
                    ),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(
                    Icons.tips_and_updates_outlined,
                    color: AppColors.secondaryCyan,
                    size: 20,
                  ),
                ),
              ),
            ],
          ),
          AnimatedSize(
            duration: const Duration(milliseconds: 180),
            curve: Curves.easeOutCubic,
            child: _showImmediateDangerTip
                ? Padding(
                    padding: const EdgeInsets.only(top: 16),
                    child: Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: isDark
                            ? AppColors.darkCard.withOpacity(0.9)
                            : Colors.white.withOpacity(0.86),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(
                          color: AppColors.secondaryCyan.withOpacity(0.18),
                        ),
                      ),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Icon(
                            Icons.tips_and_updates_outlined,
                            color: AppColors.secondaryCyan,
                            size: 18,
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              'Use this if someone may be trapped, injured, swept away, or unable to leave safely.',
                              style: TextStyle(
                                fontSize: 12,
                                height: 1.45,
                                color: isDark
                                    ? AppColors.darkTextPrimary
                                    : AppColors.textPrimary,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  )
                : const SizedBox.shrink(),
          ),
          const SizedBox(height: 16),
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: [
              _buildDangerChoice(
                label: 'Yes',
                icon: Icons.priority_high_rounded,
                status: HazardReport.immediateDangerYes,
                accentColor: AppColors.error,
              ),
              _buildDangerChoice(
                label: 'No',
                icon: Icons.check_circle_outline_rounded,
                status: HazardReport.immediateDangerNo,
                accentColor: AppColors.success,
              ),
              _buildDangerChoice(
                label: 'Not sure',
                icon: Icons.help_outline_rounded,
                status: HazardReport.immediateDangerNotSure,
                accentColor: AppColors.warning,
              ),
            ],
          ),
          AnimatedSize(
            duration: const Duration(milliseconds: 220),
            curve: Curves.easeOutCubic,
            child: _isImmediateDangerYes
                ? Padding(
                    padding: const EdgeInsets.only(top: 18),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'How many people seem affected nearby?',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                            color: isDark
                                ? AppColors.darkTextPrimary
                                : AppColors.textPrimary,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          'A quick estimate helps responders prioritize what to check first.',
                          style: TextStyle(
                            fontSize: 12,
                            height: 1.4,
                            color: isDark
                                ? AppColors.darkTextSecondary
                                : AppColors.textSecondary,
                          ),
                        ),
                        const SizedBox(height: 12),
                        Wrap(
                          spacing: 10,
                          runSpacing: 10,
                          children: [
                            _buildAffectedChoice(
                              HazardReport.affectedPeopleUnknown,
                            ),
                            _buildAffectedChoice(
                              HazardReport.affectedPeople1To5,
                            ),
                            _buildAffectedChoice(
                              HazardReport.affectedPeople6To20,
                            ),
                            _buildAffectedChoice(
                              HazardReport.affectedPeople21To50,
                            ),
                            _buildAffectedChoice(
                              HazardReport.affectedPeople50Plus,
                            ),
                          ],
                        ),
                      ],
                    ),
                  )
                : const SizedBox.shrink(),
          ),
        ],
      ),
    );
  }

  Widget _buildDangerChoice({
    required String label,
    required IconData icon,
    required String status,
    required Color accentColor,
  }) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final isSelected = _immediateDangerStatus == status;

    return InkWell(
      borderRadius: BorderRadius.circular(16),
      onTap: () => setState(() => _immediateDangerStatus = status),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: isSelected
              ? accentColor.withOpacity(isDark ? 0.18 : 0.10)
              : (isDark ? AppColors.darkCard : Colors.white.withOpacity(0.82)),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isSelected
                ? accentColor.withOpacity(0.60)
                : (isDark ? AppColors.darkOutline : AppColors.greyOutline),
            width: isSelected ? 1.4 : 1,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              size: 18,
              color: isSelected
                  ? accentColor
                  : (isDark
                        ? AppColors.darkTextSecondary
                        : AppColors.textSecondary),
            ),
            const SizedBox(width: 8),
            Text(
              label,
              style: TextStyle(
                fontSize: 13,
                fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                color: isSelected
                    ? accentColor
                    : (isDark
                          ? AppColors.darkTextPrimary
                          : AppColors.textPrimary),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAffectedChoice(String band) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final isSelected = _affectedPeopleBand == band;

    return InkWell(
      borderRadius: BorderRadius.circular(14),
      onTap: () => setState(() => _affectedPeopleBand = band),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          color: isSelected
              ? AppColors.primaryBlue
              : (isDark ? AppColors.darkCard : Colors.white.withOpacity(0.86)),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: isSelected
                ? AppColors.primaryBlue
                : (isDark ? AppColors.darkOutline : AppColors.greyOutline),
          ),
        ),
        child: Text(
          _affectedPeopleLabel(band),
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w700,
            color: isSelected
                ? Colors.white
                : (isDark ? AppColors.darkTextPrimary : AppColors.textPrimary),
          ),
        ),
      ),
    );
  }
}
