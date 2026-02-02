import 'dart:async';

import 'package:camera/camera.dart';
import 'package:flutter/material.dart';

import '../theme/app_colors.dart';

class VideoRecordScreen extends StatefulWidget {
  const VideoRecordScreen({super.key});

  @override
  State<VideoRecordScreen> createState() => _VideoRecordScreenState();
}

class _VideoRecordScreenState extends State<VideoRecordScreen> with WidgetsBindingObserver {
  CameraController? _controller;
  bool _isInitializing = true;
  bool _isRecording = false;
  Duration _elapsed = Duration.zero;
  Timer? _timer;
  Stopwatch? _stopwatch;
  String? _initError;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _init();
  }

  @override
  void dispose() {
    _timer?.cancel();
    _stopwatch?.stop();
    WidgetsBinding.instance.removeObserver(this);
    _controller?.dispose();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    // If we go to background while recording, stop and discard.
    if (state == AppLifecycleState.inactive || state == AppLifecycleState.paused) {
      if (_isRecording) {
        // ignore: discarded_futures
        _stopRecording(discard: true);
      }
    }
    if (state == AppLifecycleState.resumed) {
      // Re-init if controller became invalid.
      final controller = _controller;
      if (!_isInitializing && (controller == null || !controller.value.isInitialized)) {
        // ignore: discarded_futures
        _init();
      }
    }
  }

  Future<void> _init() async {
    setState(() {
      _isInitializing = true;
      _initError = null;
    });

    final old = _controller;
    _controller = null;
    await old?.dispose();

    try {
      final cameras = await availableCameras();
      final back = cameras.where((c) => c.lensDirection == CameraLensDirection.back).toList();
      final selected = back.isNotEmpty ? back.first : cameras.first;

      final controller = CameraController(
        selected,
        // High can be unstable on some devices/encoders.
        ResolutionPreset.medium,
        enableAudio: true,
      );

      controller.addListener(() {
        if (!mounted) return;
        if (controller.value.hasError) {
          final msg = controller.value.errorDescription ?? 'Camera error';
          if (_isRecording) {
            // ignore: discarded_futures
            _stopRecording(discard: true);
          }
          setState(() => _initError = msg);
        }
      });

      await controller.initialize();

      if (!mounted) {
        await controller.dispose();
        return;
      }

      setState(() {
        _controller = controller;
        _isInitializing = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isInitializing = false;
        _initError = e.toString();
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Failed to open camera')),
      );
    }
  }

  String _format(Duration d) {
    final m = d.inMinutes.remainder(60).toString().padLeft(2, '0');
    final s = d.inSeconds.remainder(60).toString().padLeft(2, '0');
    return '$m:$s';
  }

  Future<void> _toggleRecording() async {
    final controller = _controller;
    if (controller == null || !controller.value.isInitialized) return;

    if (_isRecording) {
      await _stopRecording(discard: false);
      return;
    }

    try {
      setState(() {
        _elapsed = Duration.zero;
        _isRecording = true;
      });

      // Some devices/plugins may throw here; recording can still work.
      try {
        await controller.prepareForVideoRecording();
      } catch (_) {}
      await controller.startVideoRecording();

      _timer?.cancel();
      _stopwatch?.stop();
      _stopwatch = Stopwatch()..start();
      _timer = Timer.periodic(const Duration(milliseconds: 200), (_) {
        if (!mounted) return;
        final sw = _stopwatch;
        final ctrl = _controller;
        if (sw == null || ctrl == null) return;

        // Detect unexpected stop (common on some camera encoders).
        if (_isRecording && !ctrl.value.isRecordingVideo) {
          // ignore: discarded_futures
          _stopRecording(discard: true, showStoppedUnexpectedly: true);
          return;
        }

        setState(() => _elapsed = sw.elapsed);
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _isRecording = false);
      _timer?.cancel();
      _stopwatch?.stop();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to start recording: $e')),
      );
    }
  }

  Future<void> _stopRecording({
    required bool discard,
    bool showStoppedUnexpectedly = false,
  }) async {
    final controller = _controller;
    if (controller == null) return;

    _timer?.cancel();
    _stopwatch?.stop();

    // Enforce a small minimum duration to avoid accidental taps.
    final wasTooShort = _elapsed < const Duration(seconds: 2);

    try {
      if (controller.value.isRecordingVideo) {
        final file = await controller.stopVideoRecording();
        if (!mounted) return;

        setState(() => _isRecording = false);

        if (discard || showStoppedUnexpectedly || wasTooShort) {
          if (showStoppedUnexpectedly) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Recording stopped unexpectedly. Please try again.')),
            );
          } else if (wasTooShort) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Video too short. Please record at least 2 seconds.')),
            );
          }
          return;
        }

        Navigator.pop(context, file);
      } else {
        if (!mounted) return;
        setState(() => _isRecording = false);
        if (showStoppedUnexpectedly) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Recording stopped unexpectedly. Please try again.')),
          );
        }
      }
    } catch (e) {
      if (!mounted) return;
      setState(() => _isRecording = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to stop recording: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final controller = _controller;

    return Scaffold(
      backgroundColor: Colors.black,
      body: SafeArea(
        child: Stack(
          children: [
            if (_isInitializing)
              const Center(child: CircularProgressIndicator(color: Colors.white))
            else if (controller == null || !controller.value.isInitialized)
              Center(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Text(
                        'Camera unavailable',
                        style: TextStyle(color: Colors.white70, fontSize: 16, fontWeight: FontWeight.w700),
                      ),
                      const SizedBox(height: 10),
                      Text(
                        (_initError == null || _initError!.trim().isEmpty)
                            ? 'Close other apps using the camera and try again.'
                            : _initError!,
                        textAlign: TextAlign.center,
                        style: const TextStyle(color: Colors.white54),
                      ),
                      const SizedBox(height: 16),
                      OutlinedButton.icon(
                        onPressed: _init,
                        icon: const Icon(Icons.refresh, color: Colors.white),
                        label: const Text('Retry', style: TextStyle(color: Colors.white)),
                        style: OutlinedButton.styleFrom(
                          side: const BorderSide(color: Colors.white24),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                      ),
                    ],
                  ),
                ),
              )
            else
              Positioned.fill(
                child: CameraPreview(controller),
              ),

            // Recording overlay (make it obvious)
            if (_isRecording)
              Positioned.fill(
                child: IgnorePointer(
                  child: Container(
                    decoration: BoxDecoration(
                      border: Border.all(color: AppColors.error.withOpacity(0.85), width: 3),
                    ),
                  ),
                ),
              ),

            // Top overlay
            Positioned(
              top: 0,
              left: 0,
              right: 0,
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                child: Row(
                  children: [
                    IconButton(
                      onPressed: _isRecording
                          ? null
                          : () {
                              Navigator.pop(context);
                            },
                      icon: Icon(
                        Icons.close,
                        color: _isRecording ? Colors.white38 : Colors.white,
                      ),
                    ),
                    const Spacer(),
                    if (_isRecording)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        decoration: BoxDecoration(
                          color: Colors.black.withOpacity(0.55),
                          borderRadius: BorderRadius.circular(999),
                          border: Border.all(color: Colors.white24),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Container(
                              width: 10,
                              height: 10,
                              decoration: const BoxDecoration(
                                color: AppColors.error,
                                shape: BoxShape.circle,
                              ),
                            ),
                            const SizedBox(width: 8),
                            const Text(
                              'REC',
                              style: TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.w800,
                                letterSpacing: 0.5,
                              ),
                            ),
                            const SizedBox(width: 10),
                            Text(
                              _format(_elapsed),
                              style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ],
                        ),
                      )
                    else
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        decoration: BoxDecoration(
                          color: Colors.black.withOpacity(0.45),
                          borderRadius: BorderRadius.circular(999),
                          border: Border.all(color: Colors.white24),
                        ),
                        child: const Text(
                          'Tap record to start',
                          style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600),
                        ),
                      ),
                  ],
                ),
              ),
            ),

            // Bottom controls
            Positioned(
              left: 0,
              right: 0,
              bottom: 0,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(24, 18, 24, 28),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    GestureDetector(
                      onTap: (_isInitializing || controller == null) ? null : _toggleRecording,
                      child: Container(
                        width: 80,
                        height: 80,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: _isRecording ? Colors.white : AppColors.error,
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.35),
                              blurRadius: 16,
                              offset: const Offset(0, 6),
                            ),
                          ],
                        ),
                        child: Center(
                          child: Container(
                            width: _isRecording ? 30 : 54,
                            height: _isRecording ? 30 : 54,
                            decoration: BoxDecoration(
                              color: _isRecording ? AppColors.error : Colors.white,
                              borderRadius: BorderRadius.circular(_isRecording ? 8 : 999),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
