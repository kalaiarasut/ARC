import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:image_picker/image_picker.dart';
import 'package:file_picker/file_picker.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:http/http.dart' as http;
import 'package:flutter_image_compress/flutter_image_compress.dart';
import 'package:path_provider/path_provider.dart';
import 'dart:io';
import 'package:path/path.dart' as path;
import '../theme/app_colors.dart';
import '../widgets/primary_button.dart';
import '../models/hazard_report.dart';
import '../services/report_service.dart';
import '../services/offline_report_queue_service.dart';
import '../core/supabase_config.dart';
import 'user_details_screen.dart';

class ReportScreen extends StatefulWidget {
  const ReportScreen({super.key});

  @override
  State<ReportScreen> createState() => _ReportScreenState();
}

class _ReportScreenState extends State<ReportScreen> {
  final TextEditingController _descriptionController = TextEditingController();
  final ImagePicker _picker = ImagePicker();
  
  String _selectedHazard = '';
  Position? _currentPosition;
  DateTime _timestamp = DateTime.now();
  final List<XFile> _selectedMedia = [];
  bool _isHighRisk = false;
  int _peopleAtRisk = 0;
  String _urgencyLevel = 'Medium';
  bool _isSubmitting = false;
  final ReportService _reportService = ReportService();
  bool _eventTimeEdited = false;

  static const int _maxAttachments = 5;

  final List<Map<String, dynamic>> _hazardTypes = [
    {'name': 'High Waves', 'icon': '🌊'},
    {'name': 'Tsunami', 'icon': '🌀'},
    {'name': 'Storm', 'icon': '⛈️'},
    {'name': 'Flood', 'icon': '🌊'},
    {'name': 'Other', 'icon': '🚨'},
  ];

  @override
  void initState() {
    super.initState();
    _getCurrentLocation();
  }

  @override
  void dispose() {
    _descriptionController.dispose();
    super.dispose();
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
              title: const Text('Location Services Off'),
              content: const Text(
                'Please enable location services (GPS) to report hazards. '
                'Your location helps authorities respond quickly.',
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context, false),
                  child: const Text('Cancel'),
                ),
                TextButton(
                  onPressed: () => Navigator.pop(context, true),
                  child: const Text('Open Settings'),
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
              const SnackBar(
                content: Text('Location permission denied. Please allow access in settings.'),
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
              title: const Text('Permission Required'),
              content: const Text(
                'Location permission is permanently denied. '
                'Please enable it in app settings to report hazards.',
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context, false),
                  child: const Text('Cancel'),
                ),
                TextButton(
                  onPressed: () => Navigator.pop(context, true),
                  child: const Text('Open Settings'),
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
      final position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
        timeLimit: const Duration(seconds: 10),
      );
      
      setState(() => _currentPosition = position);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error getting location: $e')),
        );
      }
    }
  }

  Future<bool> _requestMediaPermission(ImageSource source) async {
    if (source == ImageSource.camera) {
      final camera = await Permission.camera.request();
      return camera.isGranted;
    }

    // Gallery permission varies by OS/version; permission_handler normalizes this.
    final photos = await Permission.photos.request();
    if (photos.isGranted) return true;

    // Fallback for older Android devices.
    final storage = await Permission.storage.request();
    return storage.isGranted;
  }

  Future<void> _pickFromCamera() async {
    final granted = await _requestMediaPermission(ImageSource.camera);
    if (!mounted) return;
    if (!granted) return;

    try {
      if (_selectedMedia.length >= _maxAttachments) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Maximum $_maxAttachments attachments allowed')),
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
          SnackBar(content: Text('Error picking image: $e')),
        );
      }
    }
  }

  Future<void> _pickFromGallery() async {
    final granted = await _requestMediaPermission(ImageSource.gallery);
    if (!mounted) return;
    if (!granted) return;

    try {
      final remaining = _maxAttachments - _selectedMedia.length;
      if (remaining <= 0) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Maximum $_maxAttachments attachments allowed')),
        );
        return;
      }

      final picked = await _picker.pickMultiImage();
      if (picked.isEmpty) return;

      setState(() {
        _selectedMedia.addAll(picked.take(remaining));
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error picking images: $e')),
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
    final granted = await _requestMediaPermission(ImageSource.camera);
    if (!mounted) return;
    if (!granted) return;

    try {
      if (_selectedMedia.length >= _maxAttachments) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Maximum $_maxAttachments attachments allowed')),
        );
        return;
      }

      final XFile? video = await _picker.pickVideo(source: ImageSource.camera);
      if (video != null) {
        setState(() => _selectedMedia.add(video));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error picking video: $e')),
        );
      }
    }
  }

  Future<void> _pickVideoFromGallery() async {
    final granted = await _requestMediaPermission(ImageSource.gallery);
    if (!mounted) return;
    if (!granted) return;

    try {
      if (_selectedMedia.length >= _maxAttachments) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Maximum $_maxAttachments attachments allowed')),
        );
        return;
      }

      final XFile? video = await _picker.pickVideo(source: ImageSource.gallery);
      if (video != null) {
        setState(() => _selectedMedia.add(video));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error picking video: $e')),
        );
      }
    }
  }

  Future<void> _pickAudioFile() async {
    try {
      if (_selectedMedia.length >= _maxAttachments) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Maximum $_maxAttachments attachments allowed')),
        );
        return;
      }

      final result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: const ['mp3', 'wav', 'm4a', 'aac'],
      );

      final file = result?.files.single;
      final filePath = file?.path;
      if (filePath == null) return;

      final name = file?.name ?? path.basename(filePath);
      setState(() {
        _selectedMedia.add(XFile(filePath, name: name));
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error picking audio: $e')),
        );
      }
    }
  }

  Future<void> _pickEventTime() async {
    final date = await showDatePicker(
      context: context,
      initialDate: _timestamp,
      firstDate: DateTime.now().subtract(const Duration(days: 365)),
      lastDate: DateTime.now().add(const Duration(days: 1)),
    );

    if (date == null || !mounted) return;

    final time = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.fromDateTime(_timestamp),
    );

    if (time == null || !mounted) return;

    setState(() {
      _timestamp = DateTime(date.year, date.month, date.day, time.hour, time.minute);
      _eventTimeEdited = true;
    });
  }

  Future<void> _submitReport() async {
    // Validation
    if (_selectedHazard.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select a hazard type')),
      );
      return;
    }

    if (_descriptionController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please describe the situation')),
      );
      return;
    }

    if (_currentPosition == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Waiting for location...')),
      );
      return;
    }

    if (_isHighRisk && _peopleAtRisk <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter an estimate of people at risk')),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      // Validate file sizes BEFORE upload (10MB limit)
      for (final file in _selectedMedia) {
        final size = await file.length();
        if (size > 10 * 1024 * 1024) {
          throw Exception('File ${file.name} exceeds 10MB limit');
        }
      }

      // Default to submit time unless user explicitly edited event time.
      if (!_eventTimeEdited) {
        _timestamp = DateTime.now();
      }

      // Check connectivity
      final isOnline = await _checkRealConnectivity();
      
      if (!isOnline) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('No internet connection. Report will be queued.')),
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
          eventTime: _timestamp,
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
              title: const Text('Profile Needed'),
              content: const Text('Please add your phone number before submitting a report.'),
              actions: [
                TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
                TextButton(onPressed: () => Navigator.pop(context, true), child: const Text('Add Now')),
              ],
            ),
          );

          if (!mounted) throw Exception('Missing phone number');

          if (go == true) {
            await Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const UserDetailsScreen()),
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
        eventTime: _timestamp,
      );

      final reportId = await _reportService.insertReport(report);

      // Phase 2: Upload media (if any)
      if (_selectedMedia.isNotEmpty) {
        List<String> uploadedUrls = [];
        try {
          for (var index = 0; index < _selectedMedia.length; index++) {
            final file = _selectedMedia[index];
            // Compress image if needed
            final processedFile = await _processMediaFile(file);
            final url = await _reportService.uploadMedia(
              processedFile,
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
              const SnackBar(
                content: Text('Report saved! Media upload failed, will retry later.'),
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
          const SnackBar(
            content: Text('Report submitted successfully! 🎉'),
            backgroundColor: AppColors.success,
          ),
        );
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: AppColors.error),
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

  // Smart media processing: compress images >500KB
  Future<XFile> _processMediaFile(XFile file) async {
    // Only compress images
    if (!(file.mimeType?.startsWith('image/') ?? false)) {
      return file;
    }

    // Check file size
    final size = await file.length();
    
    // Skip compression if already small (<500KB)
    if (size <= 500 * 1024) {
      return file;
    }

    // Compress image
    try {
      final dir = await getTemporaryDirectory();
      final targetPath = path.join(
        dir.path,
        '${DateTime.now().millisecondsSinceEpoch}_compressed${path.extension(file.path)}',
      );

      final compressedFile = await FlutterImageCompress.compressAndGetFile(
        file.path,
        targetPath,
        quality: 70,
        minWidth: 1024,
        minHeight: 1024,
      );

      if (compressedFile != null) {
        return XFile(compressedFile.path);
      }
      
      // If compression fails, return original
      return file;
    } catch (e) {
      // On error, return original file
      return file;
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
        title: const Text(
          'Report Hazard',
          style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            const Text(
              'What are you seeing? 👁️',
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Your report helps keep everyone safe',
              style: TextStyle(fontSize: 14, color: AppColors.textSecondary),
            ),
            
            const SizedBox(height: 24),

            // Hazard Type Selection
            const Text(
              'Hazard Type *',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
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
            const Text(
              'Description *',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _descriptionController,
              maxLines: 4,
              decoration: InputDecoration(
                hintText: 'Describe what you\'re seeing...',
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
                    'Location',
                    _currentPosition != null
                        ? '${_currentPosition!.latitude.toStringAsFixed(4)}, ${_currentPosition!.longitude.toStringAsFixed(4)}'
                        : 'Getting location...',
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildInfoCard(
                    Icons.access_time,
                    'Time',
                    '${_timestamp.hour}:${_timestamp.minute.toString().padLeft(2, '0')}',
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
                  label: const Text('Retry GPS'),
                ),
                const SizedBox(width: 8),
                TextButton.icon(
                  onPressed: _pickEventTime,
                  icon: const Icon(Icons.edit, size: 18),
                  label: const Text('Edit Time'),
                ),
              ],
            ),

            const SizedBox(height: 24),

            // Media Upload
            const Text(
              'Add Media (Optional)',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: _buildMediaButton(
                    Icons.camera_alt,
                    'Camera',
                    _pickFromCamera,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildMediaButton(
                    Icons.photo_library,
                    'Gallery',
                    _pickFromGallery,
                  ),
                ),
              ],
            ),

            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: _buildMediaButton(
                    Icons.videocam,
                    'Video',
                    _pickVideoFromCamera,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildMediaButton(
                    Icons.video_library,
                    'Video',
                    _pickVideoFromGallery,
                  ),
                ),
              ],
            ),

            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: _buildMediaButton(
                    Icons.mic,
                    'Audio',
                    _pickAudioFile,
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
                        children: const [
                          Icon(Icons.warning_amber_rounded, color: AppColors.error),
                          SizedBox(width: 8),
                          Text(
                            'High Risk Situation',
                            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
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
                        labelText: 'People at risk (estimate)',
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
                                  level,
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
                      text: 'Submit Report',
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
              name,
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
