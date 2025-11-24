import 'dart:async';
import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:petcare_app/App/Controlador/auth_controller.dart';
import 'package:petcare_app/App/Controlador/mascota_controller.dart';
import 'package:petcare_app/App/Vista/formularioMascota.dart';
import 'package:petcare_app/App/Vista/InfoMascota.dart';
import 'package:petcare_app/App/Vista/login.dart';
import 'package:provider/provider.dart';
import 'package:petcare_app/App/Vista/HomeMenu.dart';

/*void main() => runApp(
 MultiProvider(
    providers: [
      ChangeNotifierProvider(create: (_) => AuthController()),
      ChangeNotifierProvider(create: (_) => PetController()),
    ],
    child: const PetCareApp(),
  ),
);*/

class PetCareApp extends StatelessWidget {
  const PetCareApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,

      theme: ThemeData(
        useMaterial3: true,
        colorSchemeSeed: const Color(0xFF2F76A6),
        fontFamily: 'Roboto',
        inputDecorationTheme: InputDecorationTheme(
          hintStyle: TextStyle(color: Colors.blueGrey.shade300),
          filled: true,
          fillColor: Colors.white,
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 14,
            vertical: 14,
          ),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide: BorderSide.none,
          ),
        ),
      ),
      routes: {
        '/': (_) => const SplashScreen(),
        '/login': (_) => const LoginPawView(),
        '/menu': (_) => HomeShell(),
        '/mascotas': (_) => const MascotasListScreen(),
        '/formularioMascota': (_) => const FormularioMascota(),
      },
    );
  }
}

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});
  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with TickerProviderStateMixin {
  late final AnimationController _introCtrl = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1100),
  )..forward();
  late final Animation<double> _fadeIn = CurvedAnimation(
    parent: _introCtrl,
    curve: Curves.easeOutCubic,
  );
  late final Animation<double> _scaleIn = Tween(
    begin: .93,
    end: 1.0,
  ).animate(CurvedAnimation(parent: _introCtrl, curve: Curves.easeOutBack));

  late final AnimationController _rotateCtrl = AnimationController(
    vsync: this,
    duration: const Duration(seconds: 18),
  )..repeat();
  late final AnimationController _shimmerCtrl = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 2400),
  )..repeat();

  @override
  void initState() {
    super.initState();
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
    SystemChrome.setSystemUIOverlayStyle(
      const SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        systemNavigationBarColor: Colors.transparent,
        statusBarIconBrightness: Brightness.light,
        systemNavigationBarIconBrightness: Brightness.light,
      ),
    );
    _boot();
  }

  Future<void> _boot() async {
    await Future.delayed(const Duration(milliseconds: 1500));
    final auth = context.read<AuthController>();
    await auth.restoreSession();
    if (!mounted) return;
    Navigator.pushReplacementNamed(
      context,
      auth.isAuthenticated ? '/menu' : '/login',
    );
  }

  @override
  void dispose() {
    _introCtrl.dispose();
    _rotateCtrl.dispose();
    _shimmerCtrl.dispose();
    //_timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: LayoutBuilder(
        builder: (context, c) {
          return Stack(
            fit: StackFit.expand,
            children: [
              const _GradientBackground(),

              // Blobs girando
              AnimatedBuilder(
                animation: _rotateCtrl,
                builder: (_, __) {
                  final t = _rotateCtrl.value;
                  return Stack(
                    children: [
                      Positioned(
                        top: -100,
                        right: -80,
                        child: Transform.rotate(
                          angle: t * 2 * math.pi * .25,
                          child: const _Blob(
                            size: 260,
                            asset: 'assets/images/blob.png',
                            opacity: .22,
                          ),
                        ),
                      ),
                      Positioned(
                        bottom: -80,
                        left: -60,
                        child: Transform.rotate(
                          angle: -t * 2 * math.pi * .2,
                          child: const _Blob(
                            size: 220,
                            asset: 'assets/images/blob.png',
                            opacity: .18,
                          ),
                        ),
                      ),
                    ],
                  );
                },
              ),

              // Huellas con shimmer
              AnimatedBuilder(
                animation: _shimmerCtrl,
                builder:
                    (_, __) => _ShimmerPawOverlay(phase: _shimmerCtrl.value),
              ),

              // Contenido
              SafeArea(
                child: Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 28,
                    vertical: 24,
                  ),
                  child: Column(
                    children: [
                      const Spacer(),

                      ScaleTransition(
                        scale: _scaleIn,
                        child: FadeTransition(
                          opacity: _fadeIn,
                          child: Stack(
                            alignment: Alignment.center,
                            children: [
                              // brillo suave detrás
                              Container(
                                width: c.maxWidth * 0.68,
                                height: c.maxWidth * 0.68,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  gradient: RadialGradient(
                                    colors: [
                                      Colors.white.withOpacity(.35),
                                      Colors.white.withOpacity(.06),
                                    ],
                                    stops: const [.0, 1.0],
                                  ),
                                ),
                              ),
                              // Blob de fondo
                              Transform.scale(
                                scale: 1.15,
                                child: Image.asset(
                                  'assets/images/blob.png',
                                  width: c.maxWidth * 0.9,
                                  height: c.maxWidth * 0.9,
                                  color: Colors.white.withOpacity(0.18),
                                  fit: BoxFit.contain,
                                ),
                              ),
                              Container(
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  boxShadow: [
                                    BoxShadow(
                                      color: Colors.black.withOpacity(.28),
                                      blurRadius: 20,
                                      offset: const Offset(0, 10),
                                    ),
                                  ],
                                ),
                                child: ClipPath(
                                  clipper: _TopBiasedCircleClipper(bias: -0.10),
                                  child: SizedBox(
                                    width: c.maxWidth * 0.58,
                                    height: c.maxWidth * 0.58,
                                    child: FittedBox(
                                      fit: BoxFit.cover,
                                      child: Image.asset(
                                        'assets/images/dog.png',
                                        filterQuality: FilterQuality.high,
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),

                      const SizedBox(height: 70),

                      // Logo + texto
                      FadeTransition(
                        opacity: _fadeIn,
                        child: Column(
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Hero(
                                  tag: 'petcare_logo',
                                  child: Image.asset(
                                    'assets/images/logo.png',
                                    height: 80,
                                    fit: BoxFit.contain,
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'PetCare',
                                      style: Theme.of(
                                        context,
                                      ).textTheme.headlineSmall?.copyWith(
                                        fontWeight: FontWeight.w800,
                                        color: Colors.white,
                                      ),
                                    ),
                                    Text(
                                      'Manager',
                                      style: Theme.of(
                                        context,
                                      ).textTheme.titleMedium?.copyWith(
                                        color: Colors.lightBlue.shade100,
                                        fontWeight: FontWeight.w700,
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                            const SizedBox(height: 26),
                            ClipRRect(
                              borderRadius: BorderRadius.circular(10),
                              child: SizedBox(
                                height: 8,
                                width: 200,
                                child: LinearProgressIndicator(
                                  minHeight: 8,
                                  backgroundColor: Colors.white.withOpacity(
                                    .25,
                                  ),
                                  valueColor: AlwaysStoppedAnimation<Color>(
                                    Colors.white.withOpacity(.95),
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),

                      const Spacer(),
                    ],
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

class _TopBiasedCircleClipper extends CustomClipper<Path> {
  final double bias;
  const _TopBiasedCircleClipper({this.bias = -0.10});

  @override
  Path getClip(Size size) {
    final radius = size.width / 2;
    final center = Offset(size.width / 2, size.height / 2 + size.height * bias);
    return Path()..addOval(Rect.fromCircle(center: center, radius: radius));
  }

  @override
  bool shouldReclip(covariant _TopBiasedCircleClipper oldClipper) =>
      oldClipper.bias != bias;
}

class _GradientBackground extends StatelessWidget {
  const _GradientBackground();
  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [Color(0xFF0E3A5C), Color(0xFF2F76A6)],
        ),
      ),
    );
  }
}

class _Blob extends StatelessWidget {
  final double size;
  final String asset;
  final double opacity;
  const _Blob({required this.size, required this.asset, this.opacity = .3});
  @override
  Widget build(BuildContext context) {
    return Opacity(
      opacity: opacity,
      child: Image.asset(asset, width: size, height: size, fit: BoxFit.contain),
    );
  }
}

class _ShimmerPawOverlay extends StatelessWidget {
  final double phase; // 0..1
  const _ShimmerPawOverlay({required this.phase});
  @override
  Widget build(BuildContext context) {
    final gradient = LinearGradient(
      begin: Alignment(-1.0 + 2 * phase, 0),
      end: Alignment(1.0 + 2 * phase, 0),
      colors: [
        Colors.white.withOpacity(.06),
        Colors.white.withOpacity(.18),
        Colors.white.withOpacity(.06),
      ],
      stops: const [0.25, 0.5, 0.75],
    );
    return ShaderMask(
      shaderCallback: (rect) => gradient.createShader(rect),
      blendMode: BlendMode.srcATop,
      child: const _PawPattern(opacity: .1, density: 1.2, baseSize: 46),
    );
  }
}

class _PawPattern extends StatelessWidget {
  final double opacity;
  final double density;
  final double baseSize;
  const _PawPattern({
    this.opacity = .08,
    this.density = 1.0,
    this.baseSize = 42,
  });
  @override
  Widget build(BuildContext context) {
    return IgnorePointer(
      child: CustomPaint(
        painter: _PawPainter(
          opacity: opacity,
          density: density,
          baseSize: baseSize,
        ),
        child: const SizedBox.expand(),
      ),
    );
  }
}

class _PawPainter extends CustomPainter {
  final double opacity;
  final double density;
  final double baseSize;
  _PawPainter({
    required this.opacity,
    required this.density,
    required this.baseSize,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final colors = [
      const Color(0xFFFFFFFF).withOpacity(opacity),
      const Color(0xFFD6E8F5).withOpacity(opacity * 1.2),
      const Color(0xFFB9D7EE).withOpacity(opacity * 1.1),
    ];

    final cols = (size.width / (120 / density)).clamp(6, 16).toInt();
    final rows = (size.height / (140 / density)).clamp(8, 22).toInt();

    for (int r = 0; r < rows; r++) {
      for (int c = 0; c < cols; c++) {
        final dx = (c + (r.isOdd ? .6 : .2)) / cols;
        final dy = (r + (c.isOdd ? .25 : .0)) / rows;
        final offset = Offset(dx * size.width, dy * size.height);

        final scale = 0.8 + ((r + c) % 5) * 0.08;
        final angle = ((r * 37 + c * 19) % 360) * math.pi / 180;
        final color = colors[(r + c) % colors.length];

        _drawPaw(canvas, offset, baseSize * scale, angle, color);
      }
    }
  }

  void _drawPaw(
    Canvas canvas,
    Offset center,
    double size,
    double angle,
    Color color,
  ) {
    final pawPath = Path();
    final paint =
        Paint()
          ..style = PaintingStyle.fill
          ..shader = RadialGradient(
            colors: [
              color.withOpacity(color.opacity * 1.0),
              color.withOpacity(color.opacity * .6),
            ],
            stops: const [0.2, 1.0],
          ).createShader(Rect.fromCircle(center: center, radius: size));

    canvas.save();
    canvas.translate(center.dx, center.dy);
    canvas.rotate(angle);

    final padW = size * .9, padH = size * .65;
    final toeR = size * .18;

    final rect = Rect.fromCenter(
      center: Offset(0, 0),
      width: padW,
      height: padH,
    );
    pawPath.addRRect(
      RRect.fromRectAndRadius(rect, Radius.circular(size * .28)),
    );

    final toes = <Offset>[
      Offset(-padW * .28, -padH * .55),
      Offset(-padW * .06, -padH * .68),
      Offset(padW * .16, -padH * .56),
      Offset(padW * .36, -padH * .46),
    ];

    canvas.drawShadow(pawPath, Colors.black.withOpacity(.10), 4.0, false);
    canvas.drawPath(pawPath, paint);

    final toePaint =
        Paint()
          ..style = PaintingStyle.fill
          ..shader = RadialGradient(
            colors: [
              color.withOpacity(color.opacity * 1.0),
              color.withOpacity(color.opacity * .65),
            ],
          ).createShader(Rect.fromCircle(center: Offset.zero, radius: toeR));

    for (final o in toes) {
      canvas.drawCircle(o, toeR, toePaint);
    }

    canvas.restore();
  }

  @override
  bool shouldRepaint(covariant _PawPainter old) =>
      old.opacity != opacity ||
      old.density != density ||
      old.baseSize != baseSize;
}
