import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../core/supabase_config.dart';
import '../services/home_feed_bootstrap_service.dart';
import '../l10n/l10n.dart';
import 'onboarding_screen.dart';
import 'home_screen.dart';
import 'login_screen.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with TickerProviderStateMixin {
  late AnimationController _waveController;
  late AnimationController _fadeController;
  late Animation<double> _fadeIn;

  @override
  void initState() {
    super.initState();
    _waveController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 8),
    )..repeat();

    _fadeController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1800),
    );
    _fadeIn = CurvedAnimation(parent: _fadeController, curve: Curves.easeOut);
    _fadeController.forward();

    Future.delayed(const Duration(seconds: 4), () async {
      final prefs = await SharedPreferences.getInstance();
      final isOnboardingComplete =
          prefs.getBool('onboarding_complete') ?? false;
      final isSignedIn = SupabaseConfig.client.auth.currentUser != null;
      HomeFeedBootstrapData? homeFeedBootstrap;

      if (isOnboardingComplete && isSignedIn) {
        homeFeedBootstrap = await HomeFeedBootstrapService().resolveInitialHomeFeed();
      }

      if (mounted) {
        Navigator.of(context).pushReplacement(
          PageRouteBuilder(
            pageBuilder: (_, __, ___) {
              if (!isOnboardingComplete) return const OnboardingScreen();
              if (!isSignedIn) return const LoginScreen();
              return HomeScreen(
                initialReportWindow: homeFeedBootstrap?.window,
                initialLiveReports: homeFeedBootstrap?.reports,
                initialUserLocation: homeFeedBootstrap?.userLocation,
              );
            },
            transitionsBuilder: (_, animation, __, child) {
              return FadeTransition(opacity: animation, child: child);
            },
            transitionDuration: const Duration(milliseconds: 1200),
          ),
        );
      }
    });
  }

  @override
  void dispose() {
    _waveController.dispose();
    _fadeController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          // Full-screen ocean scene
          AnimatedBuilder(
            animation: _waveController,
            builder: (context, child) {
              return CustomPaint(
                painter: PremiumOceanPainter(_waveController.value),
                size: Size.infinite,
              );
            },
          ),
          // Branded content with fade-in
          FadeTransition(
            opacity: _fadeIn,
            child: Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const SizedBox(height: 60),
                  // Elegant thin line above title
                  Container(
                    width: 40,
                    height: 1,
                    color: const Color(0x40778DA9),
                  ),
                  const SizedBox(height: 28),
                  Text(
                    context.l10n.arcAbbr,
                    style: const TextStyle(
                      fontSize: 56,
                      fontWeight: FontWeight.w200,
                      color: Color(0xFFEAECEE),
                      letterSpacing: 22.0,
                      fontFamily: 'Roboto',
                    ),
                  ),
                  const SizedBox(height: 14),
                  Text(
                    context.l10n.arcFull,
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w400,
                      color: Color(0x77AABBCC),
                      letterSpacing: 5.0,
                    ),
                  ),
                  const SizedBox(height: 28),
                  Container(
                    width: 40,
                    height: 1,
                    color: const Color(0x40778DA9),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// =============================================================================
// PREMIUM OCEAN PAINTER — Sophisticated, dark, cinematic
// =============================================================================
class PremiumOceanPainter extends CustomPainter {
  final double t;
  static final math.Random _rng = math.Random(42);

  static final List<_Star> _stars = List.generate(45, (_) {
    return _Star(
      x: _rng.nextDouble(),
      y: _rng.nextDouble() * 0.35,
      size: _rng.nextDouble() * 1.2 + 0.3,
      phase: _rng.nextDouble() * math.pi * 2,
    );
  });

  PremiumOceanPainter(this.t);

  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;
    final horizon = h * 0.48;

    _paintSky(canvas, w, h, horizon);
    _paintStars(canvas, w, h);
    _paintMoonGlow(canvas, w, h);
    _paintOcean(canvas, w, h, horizon);
    _paintShipSilhouette(canvas, w, h, horizon);
    _paintWaveLayers(canvas, w, h, horizon);
    _paintMoonReflection(canvas, w, h, horizon);
    _paintVignette(canvas, w, h);
  }

  // ---------------------------------------------------------------------------
  void _paintSky(Canvas canvas, double w, double h, double horizon) {
    final paint = Paint()
      ..shader = LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: const [
          Color(0xFF020810), // near-black
          Color(0xFF06101E), // dark navy
          Color(0xFF0C1D34), // medium navy
          Color(0xFF15304D), // warm horizon
        ],
        stops: const [0.0, 0.35, 0.7, 1.0],
      ).createShader(Rect.fromLTWH(0, 0, w, horizon));
    canvas.drawRect(Rect.fromLTWH(0, 0, w, horizon), paint);
  }

  // ---------------------------------------------------------------------------
  void _paintStars(Canvas canvas, double w, double h) {
    for (final star in _stars) {
      final twinkle = (math.sin(t * math.pi * 4 + star.phase) + 1) * 0.5;
      final alpha = (40 + twinkle * 130).toInt().clamp(0, 255);
      canvas.drawCircle(
        Offset(star.x * w, star.y * h),
        star.size,
        Paint()..color = Color.fromARGB(alpha, 200, 215, 235),
      );
    }
  }

  // ---------------------------------------------------------------------------
  void _paintMoonGlow(Canvas canvas, double w, double h) {
    final cx = w * 0.75;
    final cy = h * 0.10;

    // Very subtle atmospheric glow
    canvas.drawCircle(
      Offset(cx, cy),
      60,
      Paint()
        ..color = const Color(0x08C0D0E0)
        ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 50),
    );
    canvas.drawCircle(
      Offset(cx, cy),
      25,
      Paint()
        ..color = const Color(0x18D0DCE8)
        ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 20),
    );
    // Moon disc — small, clean
    canvas.drawCircle(Offset(cx, cy), 12, Paint()..color = const Color(0xFFCCD5E0));
    // Crescent mask
    canvas.drawCircle(
      Offset(cx + 5, cy - 2),
      10,
      Paint()..color = const Color(0xFF06101E),
    );
  }

  // ---------------------------------------------------------------------------
  void _paintOcean(Canvas canvas, double w, double h, double horizon) {
    final paint = Paint()
      ..shader = LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: const [
          Color(0xFF0B2240),
          Color(0xFF081A32),
          Color(0xFF051222),
          Color(0xFF030C18),
        ],
        stops: const [0.0, 0.3, 0.65, 1.0],
      ).createShader(Rect.fromLTWH(0, horizon, w, h - horizon));
    canvas.drawRect(Rect.fromLTWH(0, horizon, w, h - horizon), paint);
  }

  // ---------------------------------------------------------------------------
  // SHIP — clean silhouette, NOT cartoon. Professional, almost logo-like.
  // ---------------------------------------------------------------------------
  void _paintShipSilhouette(Canvas canvas, double w, double h, double horizon) {
    final cx = w * 0.45;
    final cy = horizon + 2;
    final s = w / 420;

    final bob = math.sin(t * 2 * math.pi) * 2.5 * s;
    final tilt = math.sin(t * 2 * math.pi - 0.6) * 0.012;

    canvas.save();
    canvas.translate(cx, cy + bob);
    canvas.rotate(tilt);

    // --- Ship hull silhouette (elegant, sleek) ---
    final hull = Path();
    hull.moveTo(-70 * s, 0);
    hull.lineTo(80 * s, 0);
    hull.cubicTo(
      100 * s, 2 * s,
      95 * s, 18 * s,
      75 * s, 28 * s,
    );
    hull.quadraticBezierTo(20 * s, 38 * s, -30 * s, 35 * s);
    hull.quadraticBezierTo(-65 * s, 30 * s, -75 * s, 12 * s);
    hull.cubicTo(-76 * s, 5 * s, -74 * s, 0, -70 * s, 0);
    hull.close();

    // Hull — dark, matte silhouette with subtle gradient
    canvas.drawPath(hull, Paint()
      ..shader = LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: const [
          Color(0xFF1A2A3E),
          Color(0xFF0F1C2C),
          Color(0xFF0A1420),
        ],
      ).createShader(Rect.fromLTWH(-78 * s, 0, 180 * s, 38 * s)));

    // Hull edge highlight (moonlight glint)
    canvas.drawPath(hull, Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 0.8
      ..color = const Color(0x20FFFFFF));

    // --- Superstructure (clean, geometric blocks) ---
    // Main cabin block
    final cabin = RRect.fromRectAndRadius(
      Rect.fromLTWH(-45 * s, -22 * s, 78 * s, 22 * s),
      Radius.circular(1.5 * s),
    );
    canvas.drawRRect(cabin, Paint()
      ..shader = LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: const [
          Color(0xFF1E3248),
          Color(0xFF152838),
        ],
      ).createShader(Rect.fromLTWH(-45 * s, -22 * s, 78 * s, 22 * s)));
    canvas.drawRRect(cabin, Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 0.5
      ..color = const Color(0x18FFFFFF));

    // Window strip — single horizontal band of warm light
    canvas.save();
    canvas.clipRRect(cabin);
    final windowStrip = Rect.fromLTWH(-40 * s, -13 * s, 68 * s, 4 * s);
    canvas.drawRect(windowStrip, Paint()
      ..shader = LinearGradient(
        colors: const [
          Color(0x00FFD480),
          Color(0x40FFD480),
          Color(0x55FFDD90),
          Color(0x40FFD480),
          Color(0x00FFD480),
        ],
        stops: const [0.0, 0.15, 0.5, 0.85, 1.0],
      ).createShader(windowStrip));
    // Individual window divisions
    for (double x = -35; x <= 25; x += 10) {
      canvas.drawLine(
        Offset(x * s, -14 * s),
        Offset(x * s, -8 * s),
        Paint()
          ..style = PaintingStyle.stroke
          ..strokeWidth = 0.8
          ..color = const Color(0x30152838),
      );
    }
    canvas.restore();

    // Bridge (smaller, upper block)
    final bridge = RRect.fromRectAndRadius(
      Rect.fromLTWH(-22 * s, -34 * s, 36 * s, 12 * s),
      Radius.circular(1.5 * s),
    );
    canvas.drawRRect(bridge, Paint()
      ..shader = LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: const [
          Color(0xFF1C2E42),
          Color(0xFF162636),
        ],
      ).createShader(Rect.fromLTWH(-22 * s, -34 * s, 36 * s, 12 * s)));
    canvas.drawRRect(bridge, Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 0.5
      ..color = const Color(0x15FFFFFF));

    // Bridge window strip
    canvas.save();
    canvas.clipRRect(bridge);
    final bWindowStrip = Rect.fromLTWH(-18 * s, -29 * s, 28 * s, 3.5 * s);
    canvas.drawRect(bWindowStrip, Paint()
      ..shader = LinearGradient(
        colors: const [
          Color(0x00FFD480),
          Color(0x35FFD480),
          Color(0x48FFDD90),
          Color(0x35FFD480),
          Color(0x00FFD480),
        ],
      ).createShader(bWindowStrip));
    canvas.restore();

    // --- Mast — single tall thin line ---
    canvas.drawLine(
      Offset(-4 * s, -34 * s),
      Offset(-4 * s, -70 * s),
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = 1.5 * s
        ..color = const Color(0xFF1A2A3E)
        ..strokeCap = StrokeCap.round,
    );
    // Mast tip light
    canvas.drawCircle(
      Offset(-4 * s, -70 * s),
      1.5 * s,
      Paint()
        ..color = const Color(0xAAFF4444)
        ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 2),
    );

    // Antenna / secondary mast
    canvas.drawLine(
      Offset(20 * s, -22 * s),
      Offset(20 * s, -48 * s),
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = 0.8 * s
        ..color = const Color(0xFF1A2A3E),
    );

    // --- Bow (prow) line — sleek extension ---
    final prowLine = Path();
    prowLine.moveTo(80 * s, 0);
    prowLine.cubicTo(88 * s, -3 * s, 90 * s, -10 * s, 85 * s, -18 * s);
    canvas.drawPath(prowLine, Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5 * s
      ..color = const Color(0xFF1A2A3E)
      ..strokeCap = StrokeCap.round);

    // Subtle warm glow from cabin windows reflecting on water
    canvas.drawRect(
      Rect.fromLTWH(-40 * s, 5 * s, 70 * s, 30 * s),
      Paint()
        ..color = const Color(0x08FFD480)
        ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 12),
    );

    canvas.restore();
  }

  // ---------------------------------------------------------------------------
  // WAVE LAYERS — sophisticated, multi-layered, subtle
  // ---------------------------------------------------------------------------
  void _paintWaveLayers(Canvas canvas, double w, double h, double horizon) {
    // 7 wave layers, far → near, increasingly opaque
    final layers = <_WaveConfig>[
      _WaveConfig(yOffset: -2, amplitude: 3, freq: 1.0, speed: 0.4, color: const Color(0xFF132C48)),
      _WaveConfig(yOffset: 6, amplitude: 5, freq: 1.4, speed: 0.6, color: const Color(0xFF112643)),
      _WaveConfig(yOffset: 14, amplitude: 6, freq: 1.9, speed: 0.8, color: const Color(0xFF0E213B)),
      _WaveConfig(yOffset: 24, amplitude: 7, freq: 1.3, speed: 1.0, color: const Color(0xFF0B1C34)),
      _WaveConfig(yOffset: 36, amplitude: 5, freq: 2.2, speed: 1.3, color: const Color(0xFF09182D)),
      _WaveConfig(yOffset: 50, amplitude: 4, freq: 2.8, speed: 1.6, color: const Color(0xFF071426)),
      _WaveConfig(yOffset: 66, amplitude: 3, freq: 3.2, speed: 2.0, color: const Color(0xFF06101F)),
    ];

    for (final layer in layers) {
      _drawWaveLayer(canvas, w, h, horizon, layer);
    }

    // Subtle foam highlights on first 3 layers
    for (int i = 0; i < 3; i++) {
      _drawWaveFoam(canvas, w, h, horizon, layers[i]);
    }
  }

  void _drawWaveLayer(Canvas canvas, double w, double h, double horizon, _WaveConfig cfg) {
    final baseY = horizon + cfg.yOffset;
    final path = Path();
    path.moveTo(0, h);

    for (double x = 0; x <= w; x += 2) {
      final nx = x / w;
      final y = baseY
        + math.sin(nx * cfg.freq * 2 * math.pi + t * cfg.speed * 2 * math.pi) * cfg.amplitude
        + math.sin(nx * cfg.freq * 3.7 * math.pi + t * cfg.speed * 2.8 * math.pi) * cfg.amplitude * 0.25
        + math.sin(nx * cfg.freq * 7.1 * math.pi + t * cfg.speed * 1.3 * math.pi) * cfg.amplitude * 0.08;
      if (x == 0) path.lineTo(0, y);
      path.lineTo(x, y);
    }
    path.lineTo(w, h);
    path.close();

    canvas.drawPath(path, Paint()..color = cfg.color);
  }

  void _drawWaveFoam(Canvas canvas, double w, double h, double horizon, _WaveConfig cfg) {
    final baseY = horizon + cfg.yOffset;
    final path = Path();
    bool started = false;

    for (double x = 0; x <= w; x += 2) {
      final nx = x / w;
      final y = baseY
        + math.sin(nx * cfg.freq * 2 * math.pi + t * cfg.speed * 2 * math.pi) * cfg.amplitude
        + math.sin(nx * cfg.freq * 3.7 * math.pi + t * cfg.speed * 2.8 * math.pi) * cfg.amplitude * 0.25
        + math.sin(nx * cfg.freq * 7.1 * math.pi + t * cfg.speed * 1.3 * math.pi) * cfg.amplitude * 0.08;
      if (!started) { path.moveTo(x, y); started = true; } else { path.lineTo(x, y); }
    }

    canvas.drawPath(path, Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.0
      ..color = const Color(0x10FFFFFF)
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 1.5));
  }

  // ---------------------------------------------------------------------------
  // MOON REFLECTION on water — vertical shimmering column
  // ---------------------------------------------------------------------------
  void _paintMoonReflection(Canvas canvas, double w, double h, double horizon) {
    final moonX = w * 0.75;
    const reflectWidth = 8.0;

    for (double y = horizon; y < h * 0.75; y += 3) {
      final shimmer = math.sin(y * 0.08 + t * math.pi * 6) * 4;
      final fade = 1.0 - ((y - horizon) / (h * 0.3)).clamp(0.0, 1.0);
      final alpha = (fade * 12).toInt().clamp(0, 255);
      canvas.drawRect(
        Rect.fromCenter(
          center: Offset(moonX + shimmer, y),
          width: reflectWidth * fade,
          height: 2,
        ),
        Paint()
          ..color = Color.fromARGB(alpha, 200, 215, 230)
          ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 3),
      );
    }
  }

  // ---------------------------------------------------------------------------
  // VIGNETTE — darkens edges for cinematic feel
  // ---------------------------------------------------------------------------
  void _paintVignette(Canvas canvas, double w, double h) {
    // Top gradient
    canvas.drawRect(
      Rect.fromLTWH(0, 0, w, h * 0.15),
      Paint()
        ..shader = LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: const [Color(0x60000000), Color(0x00000000)],
        ).createShader(Rect.fromLTWH(0, 0, w, h * 0.15)),
    );
    // Bottom gradient
    canvas.drawRect(
      Rect.fromLTWH(0, h * 0.75, w, h * 0.25),
      Paint()
        ..shader = LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: const [Color(0x00000000), Color(0x80000000)],
        ).createShader(Rect.fromLTWH(0, h * 0.75, w, h * 0.25)),
    );
    // Left edge
    canvas.drawRect(
      Rect.fromLTWH(0, 0, w * 0.12, h),
      Paint()
        ..shader = LinearGradient(
          begin: Alignment.centerLeft,
          end: Alignment.centerRight,
          colors: const [Color(0x40000000), Color(0x00000000)],
        ).createShader(Rect.fromLTWH(0, 0, w * 0.12, h)),
    );
    // Right edge
    canvas.drawRect(
      Rect.fromLTWH(w * 0.88, 0, w * 0.12, h),
      Paint()
        ..shader = LinearGradient(
          begin: Alignment.centerLeft,
          end: Alignment.centerRight,
          colors: const [Color(0x00000000), Color(0x40000000)],
        ).createShader(Rect.fromLTWH(w * 0.88, 0, w * 0.12, h)),
    );
  }

  @override
  bool shouldRepaint(covariant PremiumOceanPainter oldDelegate) {
    return oldDelegate.t != t;
  }
}

// Helper data classes
class _Star {
  final double x, y, size, phase;
  const _Star({required this.x, required this.y, required this.size, required this.phase});
}

class _WaveConfig {
  final double yOffset, amplitude, freq, speed;
  final Color color;
  const _WaveConfig({
    required this.yOffset,
    required this.amplitude,
    required this.freq,
    required this.speed,
    required this.color,
  });
}
