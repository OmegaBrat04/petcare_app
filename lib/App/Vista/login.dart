import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:petcare_app/App/Vista/signup.dart';

void main() => runApp(const PetCareLoginApp());

class PetCareLoginApp extends StatelessWidget {
  const PetCareLoginApp({super.key});

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
          contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide: BorderSide.none,
          ),
        ),
      ),
      home: const LoginPawView(),
    );
  }
}

class LoginPawView extends StatefulWidget {
  const LoginPawView({super.key});

  @override
  State<LoginPawView> createState() => _LoginPawViewState();
}

class _LoginPawViewState extends State<LoginPawView> with SingleTickerProviderStateMixin {
  final _formKey = GlobalKey<FormState>();
  final _emailCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  bool _obscure = true;
  bool _remember = true;
  bool _loading = false;

  late final AnimationController _anim = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 900),
  )..forward();

  late final Animation<double> _fadeIn = CurvedAnimation(parent: _anim, curve: Curves.easeOutCubic);
  late final Animation<Offset> _slideUp = Tween(begin: const Offset(0, .06), end: Offset.zero)
      .animate(CurvedAnimation(parent: _anim, curve: Curves.easeOutCubic));

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passCtrl.dispose();
    _anim.dispose();
    super.dispose();
  }

  Future<void> _onLogin() async {
    HapticFeedback.lightImpact();
    if (!_formKey.currentState!.validate()) return;
    setState(() => _loading = true);
    await Future.delayed(const Duration(milliseconds: 900)); // simula petición
    setState(() => _loading = false);

    // TODO: reemplazar por navegación real a tu Home
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('¡Bienvenido/a a PetCare!')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
    SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      systemNavigationBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.light,
      systemNavigationBarIconBrightness: Brightness.light,
    ));

    return Scaffold(
       resizeToAvoidBottomInset: true,
      body: Stack(
        fit: StackFit.expand,
        children: [
          const _GradientBackground(),
          const _BlobDecorations(),
          IgnorePointer(child: const _PawPattern(opacity: .10, density: 1.25, baseSize: 46)),

          SafeArea(
            child: LayoutBuilder(
              builder: (context, c) {
                return SingleChildScrollView(
                  physics: const BouncingScrollPhysics(),
                  padding: EdgeInsets.only(
                    left: 20,
                    right: 20,
                    top: 36,
                    bottom: MediaQuery.of(context).viewInsets.bottom + 24,
                  ),
                  child: ConstrainedBox(
                    constraints: BoxConstraints(minHeight: c.maxHeight - 72),
                    child: FadeTransition(
                      opacity: _fadeIn,
                      child: SlideTransition(
                        position: _slideUp,
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          mainAxisAlignment: MainAxisAlignment.center, // centrado vertical
                          children: [
                            const SizedBox(height: 6),
                            const _BrandHeader(),
                            const SizedBox(height: 16),
                            _GlassCard(child: _buildForm(context)),
                            const SizedBox(height: 16),
                            const _FooterNotes(),
                          ],
                        ),
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildForm(BuildContext context) {
    return Form(
      key: _formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            '¡Hola de nuevo!',
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.w800,
                  color: const Color(0xFF0F2E4F),
                ),
          ),
          const SizedBox(height: 4),
          Text(
            'Inicia sesión para cuidar a tu peludito',
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: Colors.blueGrey.shade600),
          ),
          const SizedBox(height: 18),

          // Email
          Text('Correo electrónico', style: TextStyle(color: Colors.blueGrey.shade700, fontWeight: FontWeight.w600)),
          const SizedBox(height: 6),
          TextFormField(
            controller: _emailCtrl,
            keyboardType: TextInputType.emailAddress,
            textInputAction: TextInputAction.next,
            decoration: const InputDecoration(
              prefixIcon: Icon(Icons.alternate_email),
              hintText: 'correo.com', // ← hint más claro
            ),
            validator: (v) {
              if (v == null || v.trim().isEmpty) return 'Ingresa tu correo';
              final emailRx = RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$');
              if (!emailRx.hasMatch(v.trim())) return 'Formato de correo inválido';
              return null;
            },
          ),

          const SizedBox(height: 14),

          // Password
          Text('Contraseña', style: TextStyle(color: Colors.blueGrey.shade700, fontWeight: FontWeight.w600)),
          const SizedBox(height: 6),
          TextFormField(
            controller: _passCtrl,
            obscureText: _obscure,
            decoration: InputDecoration(
              hintText: '••••••••',
              prefixIcon: const Icon(Icons.lock_outline),
              suffixIcon: IconButton(
                onPressed: () => setState(() => _obscure = !_obscure),
                icon: Icon(_obscure ? Icons.visibility : Icons.visibility_off),
              ),
            ),
            validator: (v) => (v == null || v.length < 6) ? 'Mínimo 6 caracteres' : null,
          ),

          const SizedBox(height: 6),

          // Helper row
          Row(
            children: [
              Checkbox(
                value: _remember,
                onChanged: (v) => setState(() => _remember = v ?? true),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
              ),
              const Text('Recordarme'),
              const Spacer(),
              TextButton(
                onPressed: () {},
                child: const Text('¿Olvidaste tu contraseña?', style: TextStyle(
                  decoration: TextDecoration.underline,
                  fontWeight: FontWeight.w600,
                  fontSize: 13,
                ),),
              )
            ],
          ),

          const SizedBox(height: 8),

          // Primary CTA
          SizedBox(
            height: 52,
            child: FilledButton.icon(
              onPressed: _loading ? null : _onLogin,
              icon: AnimatedSwitcher(
                duration: const Duration(milliseconds: 300),
                child: _loading
                    ? const SizedBox(
                        key: ValueKey('loader'),
                        width: 22,
                        height: 22,
                        child: CircularProgressIndicator(strokeWidth: 2.6),
                      )
                    : const Icon(Icons.pets, key: ValueKey('icon')),
              ),
              label: const Text(
                'Iniciar sesión',
                style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700),
              ),
              style: FilledButton.styleFrom(
                backgroundColor: const Color(0xFF2F76A6),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
            ),
          ),

          const SizedBox(height: 12),

          // Sign up
          Center(
            child: TextButton(
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const SignUpPawView()),
                );
              },
              child: const Text.rich(TextSpan(children: [
                TextSpan(text: '¿Nuevo en PetCare? '),
                TextSpan(
                  text: 'Crea una cuenta',
                  style: TextStyle(fontWeight: FontWeight.w800),
                )
              ])),
            ),
          ),
        ],
      ),
    );
  }
}

/// --------------------------- Widgets de decoración ---------------------------
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

class _BlobDecorations extends StatelessWidget {
  const _BlobDecorations();
  @override
  Widget build(BuildContext context) {
    return Stack(children: const [
      Positioned(
        top: -80,
        right: -60,
        child: _Blob(size: 220, asset: 'assets/images/blob.png', opacity: .25),
      ),
      Positioned(
        bottom: -60,
        left: -40,
        child: _Blob(size: 180, asset: 'assets/images/blob.png', opacity: .18),
      ),
      Positioned(
        bottom: -30,
        right: -24,
        child: _Blob(size: 140, asset: 'assets/images/blob.png', opacity: .22),
      ),
    ]);
  }
}

class _Blob extends StatelessWidget {
  final double size; final String asset; final double opacity;
  const _Blob({required this.size, required this.asset, this.opacity = .3});
  @override
  Widget build(BuildContext context) {
    return Opacity(
      opacity: opacity,
      child: Image.asset(asset, width: size, height: size, fit: BoxFit.contain),
    );
  }
}

class _PawPattern extends StatelessWidget {
  final double opacity; final double density; final double baseSize;
  const _PawPattern({this.opacity = .06, this.density = 1.0, this.baseSize = 42});
  @override
  Widget build(BuildContext context) {
    return IgnorePointer(
      child: CustomPaint(
        painter: _PawPainter(opacity: opacity, density: density, baseSize: baseSize),
        child: const SizedBox.expand(),
      ),
    );
  }
}

class _PawPainter extends CustomPainter {
  final double opacity; final double density; final double baseSize;
  _PawPainter({required this.opacity, required this.density, required this.baseSize});
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
        final angle = ((r * 37 + c * 19) % 360) * 3.14159 / 180;
        final color = colors[(r + c) % colors.length];
        _drawPaw(canvas, offset, baseSize * scale, angle, color);
      }
    }
  }
  void _drawPaw(Canvas canvas, Offset center, double size, double angle, Color color) {
    final pawPath = Path();
    final paint = Paint()
      ..style = PaintingStyle.fill
      ..shader = RadialGradient(
        colors: [color.withOpacity(color.opacity * 1.0), color.withOpacity(color.opacity * .6)],
        stops: const [0.2, 1.0],
      ).createShader(Rect.fromCircle(center: center, radius: size));
    canvas.save();
    canvas.translate(center.dx, center.dy);
    canvas.rotate(angle);
    final padW = size * .9, padH = size * .65; final toeR = size * .18;
    final rect = Rect.fromCenter(center: Offset(0, 0), width: padW, height: padH);
    pawPath.addRRect(RRect.fromRectAndRadius(rect, Radius.circular(size * .28)));
    final toes = <Offset>[
      Offset(-padW * .28, -padH * .55),
      Offset(-padW * .06, -padH * .68),
      Offset(padW * .16, -padH * .56),
      Offset(padW * .36, -padH * .46),
    ];
    canvas.drawShadow(pawPath, Colors.black.withOpacity(.12), 4.0, false);
    canvas.drawPath(pawPath, paint);
    final toePaint = Paint()
      ..style = PaintingStyle.fill
      ..shader = RadialGradient(
        colors: [color.withOpacity(color.opacity * 1.0), color.withOpacity(color.opacity * .65)],
      ).createShader(Rect.fromCircle(center: Offset.zero, radius: toeR));
    for (final o in toes) {
      canvas.drawCircle(o, toeR, toePaint);
    }
    canvas.restore();
  }
  @override
  bool shouldRepaint(covariant _PawPainter old) =>
      old.opacity != opacity || old.density != density || old.baseSize != baseSize;
}

class _BrandHeader extends StatelessWidget {
  const _BrandHeader();
  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        CircleAvatar(
          radius: 46,
          backgroundColor: Colors.white.withOpacity(.25),
          child: Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(.85),
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(color: Colors.black.withOpacity(.08), blurRadius: 14, spreadRadius: 1),
              ],
            ),
            child: ClipOval(
              child: Image.asset('assets/images/logo.png', width: 62, height: 62, fit: BoxFit.contain),
            ),
          ),
        ),
        const SizedBox(height: 10),
        const Text('PetCare', style: TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w800)),
      ],
    );
  }
}

class _GlassCard extends StatelessWidget {
  final Widget child;
  const _GlassCard({required this.child});
  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(24),
      child: BackdropFilter(
        filter: ui.ImageFilter.blur(sigmaX: 14, sigmaY: 14),
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.fromLTRB(20, 18, 20, 18),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(24),
            color: Colors.white.withOpacity(.72),
            border: Border.all(color: Colors.white.withOpacity(.8), width: 1),
            boxShadow: [
              BoxShadow(color: Colors.black.withOpacity(.18), blurRadius: 24, offset: const Offset(0, 12)),
            ],
          ),
          child: child,
        ),
      ),
    );
  }
}

class _FooterNotes extends StatelessWidget {
  const _FooterNotes();
  @override
  Widget build(BuildContext context) {
    return Opacity(
      opacity: .9,
      child: Column(
        children: [
          Text(
            'Al iniciar sesión aceptas nuestros Términos y Política de Privacidad.',
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.white.withOpacity(.9)),
          ),
          const SizedBox(height: 6),
        ],
      ),
    );
  }
}
