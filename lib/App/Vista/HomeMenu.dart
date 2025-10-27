import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:petcare_app/App/Controlador/auth_controller.dart';
import 'package:petcare_app/App/Vista/citas.dart';
import 'package:petcare_app/App/Vista/geolocalizador.dart';
import 'package:petcare_app/App/Vista/InfoMascota.dart';
import 'package:petcare_app/App/Vista/login.dart';
import 'package:provider/provider.dart';

/*WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarIconBrightness: Brightness.light,
    statusBarBrightness: Brightness.dark,
    systemNavigationBarColor: Colors.white,
    systemNavigationBarIconBrightness: Brightness.dark,*/

const _kPrimary = Color(0xFF2F76A6);
const _kPrimaryDark = Color(0xFF0E3A5C);

const double _kBottomNavHeight = 68;
const double _kBottomNavOuterPadding = 16;
const double _kBottomNavGap = 14;

void _comingSoon(BuildContext context) {
  ScaffoldMessenger.of(context).showSnackBar(
    const SnackBar(content: Text('Vista estática. Sin lógica conectada.')),
  );
}

Future<void> _showAccountMenu(BuildContext context) async {
  showModalBottomSheet(
    context: context,
    backgroundColor: Colors.transparent,
    isScrollControlled: true,
    builder: (ctx) {
      return Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
        ),
        padding: EdgeInsets.only(
          top: 12,
          bottom: 16 + MediaQuery.of(ctx).viewPadding.bottom,
          left: 8,
          right: 8,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 48,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.black26,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 12),
            ListTile(
              leading: const Icon(Icons.logout, color: _kPrimaryDark),
              title: const Text('Cerrar sesión'),
              onTap: () async {
                Navigator.of(ctx).pop();

                try {
                  await Provider.of<AuthController>(
                    context,
                    listen: false,
                  ).logout();
                } catch (_) {}
                Navigator.of(context).pushReplacementNamed('/login');
              },
            ),
            
          ],
        ),
      );
    },
  );
}

class _ModuleDef {
  final String label;
  final IconData icon;
  final Widget page;
  const _ModuleDef(this.label, this.icon, this.page);
}

class HomeShell extends StatefulWidget {
  const HomeShell({super.key});
  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  late final List<_ModuleDef> _modules = [
    _ModuleDef('Mascotas', Icons.pets, const SizedBox.shrink()),
    _ModuleDef('Veterinarias', Icons.map, const SizedBox.shrink()),
    _ModuleDef('Citas', Icons.event_available, const SizedBox.shrink()),
  ];

  //int _index = 1; // Arranca en Veterinarias
  int _index = 0;

  @override
  void initState() {
    super.initState();
  }

  @override
  void dispose() {
    super.dispose();
  }

  void _onNavSelected(int i) {
    if (i == 0) {
      Navigator.of(
        context,
      ).push(MaterialPageRoute(builder: (_) => const MascotasListScreen()));
      return;
    }
    if (i == 1) {
      Navigator.of(
        context,
      ).push(MaterialPageRoute(builder: (_) => const GeolocalizadorPage()));
      return;
    }
    if (i == 2) {
      Navigator.of(
        context,
      ).push(MaterialPageRoute(builder: (_) => const CitasPage()));
      return;
    }
    setState(() => _index = i);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBody: true,
      backgroundColor: Colors.transparent,
      body: Stack(
        children: [
          Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment(0.0, -1.0),
                end: Alignment(0.8, 1.0),
                colors: [_kPrimaryDark, _kPrimary],
              ),
            ),
          ),
          SafeArea(
            bottom: false,
            child: NestedScrollView(
              headerSliverBuilder:
                  (context, _) => [
                    const SliverToBoxAdapter(
                      child: Padding(
                        padding: EdgeInsets.fromLTRB(16, 16, 16, 8),
                        child: _GlassHeader(),
                      ),
                    ),

                    const SliverToBoxAdapter(child: SizedBox(height: 8)),
                  ],
              body: AnimatedSwitcher(
                duration: const Duration(milliseconds: 250),
                child: Container(
                  key: ValueKey(_index),
                  padding: const EdgeInsets.fromLTRB(12, 6, 12, 24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,

                    children: [
                      const Text(
                        'Resumen',
                        style: TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 20),
                      Expanded(
                        child: ListView(
                          children: [
                            _InfoCard(
                              title: 'Próxima Cita',
                              icon: Icons.event,
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'No tienes citas programadas',
                                    style: TextStyle(
                                      fontSize: 16,
                                      color: Colors.white.withOpacity(0.9),
                                    ),
                                  ),
                                  TextButton(
                                    onPressed:
                                        () => Navigator.of(context).push(
                                          MaterialPageRoute(
                                            builder:
                                                (_) =>
                                                    const CitasPage(),
                                          ),
                                        ),
                                    child: const Text('Historial de Citas', style: TextStyle(
                                      color: Colors.white
                                    )),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 16),
                            _InfoCard(
                              title: 'Mis Mascotas',
                              icon: Icons.pets,
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Registra a tus mascotas para:',
                                    style: TextStyle(
                                      fontSize: 16,
                                      color: Colors.white.withOpacity(0.9),
                                    ),
                                  ),
                                  const SizedBox(height: 8),
                                  _BulletPoint('Agendar citas fácilmente'),
                                  _BulletPoint('Mantener su historial médico'),
                                  _BulletPoint('Recordatorios de vacunas'),
                                  TextButton(
                                    onPressed:
                                        () => Navigator.of(context).push(
                                          MaterialPageRoute(
                                            builder:
                                                (_) =>
                                                    const MascotasListScreen(),
                                          ),
                                        ),
                                    child: const Text('Ver mis mascotas', style: TextStyle(
                                      color: Colors.white
                                    )),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 16),
                            _InfoCard(
                              title: 'Veterinarias Cercanas',
                              icon: Icons.local_hospital,
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Encuentra veterinarias cercanas y sus servicios',
                                    style: TextStyle(
                                      fontSize: 16,
                                      color: Colors.white.withOpacity(0.9),
                                    ),
                                  ),
                                  TextButton(
                                    onPressed:
                                        () => Navigator.of(context).push(
                                          MaterialPageRoute(
                                            builder:
                                                (_) =>
                                                    const GeolocalizadorPage(),
                                          ),
                                        ),
                                    child: const Text('Buscar veterinarias', style: TextStyle(
                                      color: Colors.white
                                    )),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
      bottomNavigationBar: Padding(
        padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(18),
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
            child: Container(
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(.9),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(.08),
                    blurRadius: 16,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              child: NavigationBarTheme(
                data: NavigationBarThemeData(
                  height: _kBottomNavHeight,
                  indicatorColor: _kPrimary.withOpacity(.12),
                  labelTextStyle: MaterialStateProperty.resolveWith((states) {
                    final selected = states.contains(MaterialState.selected);
                    return TextStyle(
                      color: selected ? _kPrimaryDark : Colors.blueGrey,
                      fontWeight: FontWeight.w600,
                    );
                  }),
                ),
                child: NavigationBar(
                  selectedIndex: _index,
                  onDestinationSelected: _onNavSelected,
                  destinations:
                      _modules
                          .map(
                            (m) => NavigationDestination(
                              icon: Icon(m.icon, color: _kPrimaryDark),
                              selectedIcon: Icon(m.icon, color: _kPrimaryDark),
                              label: m.label,
                            ),
                          )
                          .toList(),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _InfoCard extends StatelessWidget {
  final String title;
  final IconData icon;
  final Widget child;

  const _InfoCard({
    required this.title,
    required this.icon,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.15),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withOpacity(0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, color: Colors.white),
              const SizedBox(width: 12),
              Text(
                title,
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          child,
        ],
      ),
    );
  }
}

class _BulletPoint extends StatelessWidget {
  final String text;

  const _BulletPoint(this.text);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Row(
        children: [
          Container(
            width: 6,
            height: 6,
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.9),
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 8),
          Text(
            text,
            style: TextStyle(
              fontSize: 14,
              color: Colors.white.withOpacity(0.9),
            ),
          ),
        ],
      ),
    );
  }
}

class _GlassHeader extends StatelessWidget {
  const _GlassHeader();
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(12, 12, 12, 10),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(.12),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withOpacity(.25)),
      ),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(.9),
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(.08),
                  blurRadius: 10,
                  offset: const Offset(0, 6),
                ),
              ],
            ),
            child: ClipOval(
              child: Image.asset(
                'assets/images/logo.png',
                width: 48,
                height: 48,
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) {
                  return const Center(
                    child: Icon(Icons.pets, color: _kPrimaryDark),
                  );
                },
              ),
            ),
          ),
          const SizedBox(width: 12),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Bienvenido a',
                  style: TextStyle(
                    color: Colors.white70,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                SizedBox(height: 2),
                Text(
                  'PetCare',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 20,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 6),
          Material(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            child: InkWell(
              onTap: () => _showAccountMenu(context),
              borderRadius: BorderRadius.circular(12),
              child: const Padding(
                padding: EdgeInsets.all(8.0),
                child: Icon(Icons.person, color: _kPrimaryDark),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _SearchBarWhite extends StatelessWidget {
  final TextEditingController controller;
  final String hintText;
  final ValueChanged<String>? onChanged;
  final ValueChanged<String>? onSubmitted;
  final VoidCallback? onClear;

  const _SearchBarWhite({
    required this.controller,
    required this.hintText,
    this.onChanged,
    this.onSubmitted,
    this.onClear,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(top: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.black12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          const SizedBox(width: 10),
          const Icon(Icons.search, color: _kPrimaryDark, size: 22),
          const SizedBox(width: 6),
          Expanded(
            child: TextField(
              controller: controller,
              onChanged: onChanged,
              onSubmitted: onSubmitted,
              style: const TextStyle(
                color: Colors.black87,
                fontWeight: FontWeight.w600,
              ),
              cursorColor: Colors.black87,
              decoration: const InputDecoration(
                hintText: 'Buscar mascotas, citas, veterinarias…',
                hintStyle: TextStyle(color: Colors.black38),
                border: InputBorder.none,
                contentPadding: EdgeInsets.symmetric(vertical: 14),
              ),
              textInputAction: TextInputAction.search,
            ),
          ),
          ValueListenableBuilder<TextEditingValue>(
            valueListenable: controller,
            builder:
                (_, value, __) =>
                    value.text.isEmpty
                        ? const SizedBox(width: 8)
                        : IconButton(
                          onPressed: onClear,
                          icon: const Icon(
                            Icons.close_rounded,
                            color: Colors.blueGrey,
                          ),
                          splashRadius: 18,
                        ),
          ),
        ],
      ),
    );
  }
}
