import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:petcare_app/App/Controlador/auth_controller.dart';
import 'package:petcare_app/App/Controlador/citas_controller.dart';
import 'package:petcare_app/App/Controlador/mascota_controller.dart';
import 'package:petcare_app/App/Controlador/veterinaria_controller.dart';
import 'package:petcare_app/App/Modelo/EstatusCita.dart';
import 'package:petcare_app/App/Servicios/ProximaCitaCard.dart';
import 'package:petcare_app/App/Vista/citas.dart';
import 'package:petcare_app/App/Vista/geolocalizador.dart';
import 'package:petcare_app/App/Vista/InfoMascota.dart';
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
            // ...existing code inside _showAccountMenu (antes del ListTile de cerrar sesión)...
            ListTile(
              leading: const Icon(Icons.phone, color: _kPrimaryDark),
              title: const Text('Actualizar teléfono'),
              subtitle: Consumer<AuthController>(
                builder:
                    (_, auth, __) => Text(
                      auth.currentUser?.telefono == null ||
                              auth.currentUser!.telefono!.isEmpty
                          ? 'No registrado'
                          : auth.currentUser!.telefono!,
                      style: const TextStyle(fontSize: 12),
                    ),
              ),
              onTap: () async {
                final auth = context.read<AuthController>();
                final controller = TextEditingController(
                  text: auth.currentUser?.telefono ?? '',
                );
                final ok = await showDialog<bool>(
                  context: context,
                  builder:
                      (dCtx) => AlertDialog(
                        title: const Text('Teléfono de contacto'),
                        content: TextField(
                          controller: controller,
                          keyboardType: TextInputType.phone,
                          decoration: const InputDecoration(
                            hintText: 'Ej: 999123456',
                          ),
                          inputFormatters: [
                            FilteringTextInputFormatter.digitsOnly,
                          ],
                        ),
                        actions: [
                          TextButton(
                            onPressed: () => Navigator.pop(dCtx, false),
                            child: const Text('Cancelar'),
                          ),
                          ElevatedButton(
                            onPressed: () => Navigator.pop(dCtx, true),
                            child: const Text('Guardar'),
                          ),
                        ],
                      ),
                );
                if (ok == true) {
                  final tel = controller.text.trim();
                  if (tel.length < 6) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Teléfono inválido')),
                    );
                    return;
                  }
                  final updated = await auth.actualizarTelefono(tel);
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(
                        updated
                            ? 'Teléfono actualizado'
                            : 'No se pudo actualizar',
                      ),
                    ),
                  );
                }
              },
            ),
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
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      final petCtrl = context.read<PetController>();
      await petCtrl.fetchPets();
      final citasCtrl = context.read<CitasController>();
      await citasCtrl.fetchCitas();
      final vetCtrl = context.read<VeterinariaController>();
      await vetCtrl.fetchVeterinarias();
    });
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
                              child: Consumer3<
                                CitasController,
                                PetController,
                                VeterinariaController
                              >(
                                builder: (
                                  context,
                                  citasCtrl,
                                  petCtrl,
                                  vetCtrl,
                                  _,
                                ) {
                                  final mascotaList = petCtrl.pets;
                                  final vets = vetCtrl.veterinarias;
                                  final ahora = DateTime.now();
                                  final futuras =
                                      citasCtrl.citas
                                          .where(
                                            (c) =>
                                                (c.estatus == Estatus.pending ||
                                                    c.estatus ==
                                                        Estatus.confirmed) &&
                                                c.fechaPreferida.isAfter(ahora),
                                          )
                                          .toList()
                                        ..sort(
                                          (a, b) => a.fechaPreferida.compareTo(
                                            b.fechaPreferida,
                                          ),
                                        );
                                  if (futuras.isEmpty) {
                                    return Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          'No tienes citas programadas',
                                          style: TextStyle(
                                            fontSize: 16,
                                            color: Colors.white.withOpacity(
                                              0.9,
                                            ),
                                          ),
                                        ),
                                        const SizedBox(height: 8),
                                        _RectActionButton(
                                          label: 'Historial de Citas',
                                          icon: Icons.history,
                                          onTap:
                                              () => Navigator.of(context).push(
                                                MaterialPageRoute(
                                                  builder:
                                                      (_) => const CitasPage(),
                                                ),
                                              ),
                                        ),
                                      ],
                                    );
                                  }
                                  final proxima = futuras.first;
                                  return ProximaCitaCard(
                                    cita: proxima,
                                    mascotas: mascotaList.cast(),
                                    veterinarias: vets,
                                  );
                                },
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
                                  const SizedBox(height: 8),
                                  _RectActionButton(
                                    label: 'Ver mis mascotas',
                                    icon: Icons.pets,
                                    onTap:
                                        () => Navigator.of(context).push(
                                          MaterialPageRoute(
                                            builder:
                                                (_) =>
                                                    const MascotasListScreen(),
                                          ),
                                        ),
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
                                  const SizedBox(height: 8),
                                  _RectActionButton(
                                    label: 'Buscar veterinarias',
                                    icon: Icons.map,
                                    onTap:
                                        () => Navigator.of(context).push(
                                          MaterialPageRoute(
                                            builder:
                                                (_) =>
                                                    const GeolocalizadorPage(),
                                          ),
                                        ),
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

class _RectActionButton extends StatelessWidget {
  final String label;
  final IconData icon;
  final VoidCallback onTap;
  const _RectActionButton({
    required this.label,
    required this.icon,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      child: DecoratedBox(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          color: Colors.white.withOpacity(.15),
          border: Border.all(color: Colors.white.withOpacity(.85), width: 1.6),
        ),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(12),
          splashColor: Colors.white24,
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 16),
            child: Row(
              children: [
                Icon(icon, color: Colors.white, size: 20),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    label,
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w700,
                      letterSpacing: .3,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
