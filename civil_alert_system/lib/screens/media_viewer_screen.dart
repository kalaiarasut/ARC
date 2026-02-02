import 'package:flutter/material.dart';
import 'package:just_audio/just_audio.dart';
import 'package:video_player/video_player.dart';

import '../theme/app_colors.dart';

enum MediaKind { image, video, audio, unknown }

class MediaViewerScreen extends StatefulWidget {
  final String url;

  const MediaViewerScreen({super.key, required this.url});

  static MediaKind kindFromUrl(String url) {
    try {
      final path = Uri.parse(url).path.toLowerCase();
      if (path.endsWith('.jpg') ||
          path.endsWith('.jpeg') ||
          path.endsWith('.png') ||
          path.endsWith('.webp') ||
          path.endsWith('.gif')) {
        return MediaKind.image;
      }
      if (path.endsWith('.mp4') || path.endsWith('.mov') || path.endsWith('.mkv') || path.endsWith('.webm')) {
        return MediaKind.video;
      }
      if (path.endsWith('.m4a') || path.endsWith('.aac') || path.endsWith('.mp3') || path.endsWith('.wav')) {
        return MediaKind.audio;
      }
    } catch (_) {}

    return MediaKind.unknown;
  }

  @override
  State<MediaViewerScreen> createState() => _MediaViewerScreenState();
}

class _MediaViewerScreenState extends State<MediaViewerScreen> {
  late final MediaKind _kind;
  VideoPlayerController? _video;
  AudioPlayer? _audio;
  String? _error;

  @override
  void initState() {
    super.initState();
    _kind = MediaViewerScreen.kindFromUrl(widget.url);
    _init();
  }

  Future<void> _init() async {
    try {
      if (_kind == MediaKind.video) {
        final controller = VideoPlayerController.networkUrl(Uri.parse(widget.url));
        await controller.initialize();
        controller.setLooping(true);
        if (!mounted) return;
        setState(() => _video = controller);
      } else if (_kind == MediaKind.audio) {
        final player = AudioPlayer();
        await player.setUrl(widget.url);
        if (!mounted) return;
        setState(() => _audio = player);
      }
    } catch (e) {
      if (!mounted) return;
      setState(() => _error = e.toString());
    }
  }

  @override
  void dispose() {
    _video?.dispose();
    _audio?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        foregroundColor: Colors.white,
        elevation: 0,
        title: const Text('Media'),
      ),
      body: SafeArea(
        child: _error != null
            ? Center(
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Text(
                    _error!,
                    textAlign: TextAlign.center,
                    style: const TextStyle(color: Colors.white70),
                  ),
                ),
              )
            : _buildContent(),
      ),
    );
  }

  Widget _buildContent() {
    switch (_kind) {
      case MediaKind.image:
        return Center(
          child: InteractiveViewer(
            minScale: 0.7,
            maxScale: 4,
            child: Image.network(
              widget.url,
              fit: BoxFit.contain,
              errorBuilder: (context, error, stackTrace) =>
                  const Text('Failed to load image', style: TextStyle(color: Colors.white70)),
              loadingBuilder: (context, child, progress) {
                if (progress == null) return child;
                return const Center(child: CircularProgressIndicator(color: Colors.white));
              },
            ),
          ),
        );

      case MediaKind.video:
        final controller = _video;
        if (controller == null) {
          return const Center(child: CircularProgressIndicator(color: Colors.white));
        }

        return Column(
          children: [
            Expanded(
              child: Center(
                child: AspectRatio(
                  aspectRatio: controller.value.aspectRatio,
                  child: VideoPlayer(controller),
                ),
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              color: Colors.black,
              child: Row(
                children: [
                  IconButton(
                    onPressed: () {
                      if (controller.value.isPlaying) {
                        controller.pause();
                      } else {
                        controller.play();
                      }
                      setState(() {});
                    },
                    icon: Icon(
                      controller.value.isPlaying ? Icons.pause_circle_filled : Icons.play_circle_filled,
                      color: Colors.white,
                      size: 40,
                    ),
                  ),
                  Expanded(
                    child: VideoProgressIndicator(
                      controller,
                      allowScrubbing: true,
                      colors: VideoProgressColors(
                        playedColor: AppColors.primaryBlue,
                        bufferedColor: Colors.white24,
                        backgroundColor: Colors.white10,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        );

      case MediaKind.audio:
        final player = _audio;
        if (player == null) {
          return const Center(child: CircularProgressIndicator(color: Colors.white));
        }

        return Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.audiotrack, color: Colors.white, size: 64),
              const SizedBox(height: 12),
              StreamBuilder<Duration?>(
                stream: player.durationStream,
                builder: (context, snapshotDuration) {
                  final duration = snapshotDuration.data ?? Duration.zero;
                  return StreamBuilder<Duration>(
                    stream: player.positionStream,
                    builder: (context, snapshotPosition) {
                      final position = snapshotPosition.data ?? Duration.zero;
                      final maxMs = duration.inMilliseconds <= 0 ? 1.0 : duration.inMilliseconds.toDouble();
                      final valueMs = position.inMilliseconds.clamp(0, duration.inMilliseconds).toDouble();

                      return Column(
                        children: [
                          Slider(
                            value: valueMs,
                            min: 0,
                            max: maxMs,
                            activeColor: AppColors.primaryBlue,
                            inactiveColor: Colors.white24,
                            onChanged: (v) async {
                              await player.seek(Duration(milliseconds: v.toInt()));
                            },
                          ),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(_fmt(position), style: const TextStyle(color: Colors.white70)),
                              Text(_fmt(duration), style: const TextStyle(color: Colors.white70)),
                            ],
                          ),
                        ],
                      );
                    },
                  );
                },
              ),
              const SizedBox(height: 10),
              StreamBuilder<PlayerState>(
                stream: player.playerStateStream,
                builder: (context, snapshot) {
                  final state = snapshot.data;
                  final playing = state?.playing ?? false;

                  return ElevatedButton.icon(
                    onPressed: () async {
                      if (playing) {
                        await player.pause();
                      } else {
                        await player.play();
                      }
                    },
                    icon: Icon(playing ? Icons.pause : Icons.play_arrow),
                    label: Text(playing ? 'Pause' : 'Play'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primaryBlue,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                    ),
                  );
                },
              ),
            ],
          ),
        );

      case MediaKind.unknown:
        return const Center(
          child: Padding(
            padding: EdgeInsets.all(20),
            child: Text('Unsupported media type', style: TextStyle(color: Colors.white70)),
          ),
        );
    }
  }

  String _fmt(Duration d) {
    final m = d.inMinutes.remainder(60).toString().padLeft(2, '0');
    final s = d.inSeconds.remainder(60).toString().padLeft(2, '0');
    return '$m:$s';
  }
}
