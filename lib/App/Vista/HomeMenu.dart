import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:petcare_app/App/Vista/citas.dart';
import 'package:petcare_app/App/Vista/geolocalizador.dart';
import 'package:petcare_app/App/Vista/InfoMascota.dart';

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
    _ModuleDef('Mascotas', Icons.pets, const _RedirectTab('/mascotas')),
    _ModuleDef('Veterinarias', Icons.map, const SizedBox.shrink()),
    _ModuleDef('Citas', Icons.event_available, const SizedBox.shrink()),
  ];

  //int _index = 1; // Arranca en Veterinarias
  int _index = 0;
  final TextEditingController _searchCtrl = TextEditingController();
  String _query = '';

  @override
  void initState() {
    super.initState();
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  void _onNavSelected(int i) {
    if (i == 0) {
      Navigator.of(context).pushNamed('/mascotas');
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
                    SliverToBoxAdapter(
                      child: Padding(
                        padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
                        child: _SearchBarWhite(
                          controller: _searchCtrl,
                          hintText: 'Buscar mascotas, citas, veterinarias…',
                          onChanged: (t) => setState(() => _query = t),
                          onClear: () {
                            _searchCtrl.clear();
                            setState(() => _query = '');
                          },
                          onSubmitted: (_) {},
                        ),
                      ),
                    ),
                    const SliverToBoxAdapter(child: SizedBox(height: 8)),
                  ],
              body: AnimatedSwitcher(
                duration: const Duration(milliseconds: 250),
                child: Container(
                  key: ValueKey('$_index|$_query'),
                  padding: const EdgeInsets.fromLTRB(12, 6, 12, 24),
                  child: IndexedStack(
                    index: _index,
                    // ahora solo hay contenido para Mascotas (redirect);
                    // Veterinarias y Citas están vacíos porque se abren con push
                    children: _modules.map((m) => m.page).toList(),
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
              onTap: () => _comingSoon(context),
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

class _RedirectTab extends StatelessWidget {
  final String routeName;
  const _RedirectTab(this.routeName, {super.key});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: ElevatedButton.icon(
        onPressed: () {
          Navigator.of(
            context,
          ).push(MaterialPageRoute(builder: (_) => const MascotasListScreen()));
        },
        icon: const Icon(Icons.pets),
        label: const Text('Abrir Mascotas'),
      ),
    );
  }
}
