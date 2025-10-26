import 'package:flutter/material.dart';
import 'package:petcare_app/App/Modelo/Mascotas.dart';
import 'package:table_calendar/table_calendar.dart';
import 'package:provider/provider.dart';
import 'package:petcare_app/App/Controlador/mascota_controller.dart';
import 'package:petcare_app/App/Controlador/auth_controller.dart';
import 'package:petcare_app/App/Modelo/Vacuna.dart';
import 'package:petcare_app/App/Modelo/Desparasitacion.dart';
import 'package:petcare_app/App/Modelo/Historial Clinico.dart';

// Datos de ejemplo (SIMULADOS)
final List<Vacuna> _ejemploVacunas = [
  Vacuna(DateTime.now(), "LOT-AZ12", "Veterinaria Central", 1),
  Vacuna(
    DateTime.now().subtract(const Duration(days: 30)),
    "LOT-XY45",
    "Clínica Este",
    0,
  ),
];
final List<Desparasitacion> _ejemploDesparasitaciones = [
  Desparasitacion(
    "Interna",
    "Albendazol",
    DateTime.now().subtract(const Duration(days: 60)),
  ),
  Desparasitacion(
    "Externa",
    "Bravecto",
    DateTime.now().subtract(const Duration(days: 120)),
  ),
];
final List<HistorialClinico> _ejemploHistorial = [
  HistorialClinico(
    DateTime.now().subtract(const Duration(days: 5)),
    "Consulta de control anual.",
  ),
  HistorialClinico(
    DateTime.now().subtract(const Duration(days: 150)),
    "Revisión dental y limpieza.",
  ),
];

class MascotasListScreen extends StatefulWidget {
  const MascotasListScreen({super.key});
  @override
  State<MascotasListScreen> createState() => _MascotasListScreenState();
}

class _MascotasListScreenState extends State<MascotasListScreen> {
  String? errorMessage;
  bool isLoading = true;
  String query = "";
  String filtroEspecie = "Todas";
  final ValueNotifier<String> filtroNotifier = ValueNotifier("Todas");
  final ValueNotifier<String> queryNotifier = ValueNotifier("");

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _fetchData();
    });
  }

  Future<void> _fetchData() async {
    final petController = Provider.of<PetController>(context, listen: false);

    // Asumimos que el token ya fue guardado al iniciar sesión
    final error = await petController.fetchPets();

    if (mounted) {
      setState(() {
        errorMessage = error;
        isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFF0E3A5C), Color(0xFF2F76A6)],
          ),
        ),
        child: SafeArea(
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
                child: Row(
                  children: [
                    CircleAvatar(
                      radius: 28,
                      backgroundColor: Colors.white.withOpacity(.25),
                      child: Container(
                        padding: const EdgeInsets.all(4),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(.85),
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(.08),
                              blurRadius: 8,
                              spreadRadius: 1,
                            ),
                          ],
                        ),
                        child: ClipOval(
                          child: Image.asset(
                            'assets/images/logo.png',
                            width: 32,
                            height: 32,
                            fit: BoxFit.contain,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    const Text(
                      'Mis Mascotas',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 22,
                        fontWeight: FontWeight.w800,
                        fontFamily: 'Roboto',
                      ),
                    ),
                    const Spacer(),
                    IconButton(
                      icon: const Icon(
                        Icons.add_circle,
                        color: Colors.white,
                        size: 30,
                      ),
                      onPressed:
                          () => Navigator.pushNamed(
                            context,
                            '/formularioMascota',
                          ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 18),
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    borderRadius: const BorderRadius.vertical(
                      top: Radius.circular(24),
                    ),
                    color: Colors.white.withOpacity(.9),
                    border: Border.all(
                      color: Colors.white.withOpacity(.8),
                      width: 1,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(.18),
                        blurRadius: 24,
                        offset: const Offset(0, 12),
                      ),
                    ],
                  ),
                  child: Column(
                    children: [
                      // --- BARRA DE BÚSQUEDA Y FILTRO ---
                      Row(
                        children: [
                          Expanded(
                            child: TextField(
                              decoration: const InputDecoration(
                                labelText: "Buscar por nombre",
                              ),
                              onChanged: (v) => queryNotifier.value = v,
                            ),
                          ),
                          const SizedBox(width: 8),
                          ValueListenableBuilder<String>(
                            valueListenable: filtroNotifier,
                            builder: (context, filtro, _) {
                              return DropdownButton<String>(
                                value: filtro,
                                items:
                                    [
                                          "Todas",
                                          "Perro",
                                          "Gato",
                                        ] // Usar los nombres de la base de datos
                                        .map(
                                          (e) => DropdownMenuItem(
                                            value: e,
                                            child: Text(e),
                                          ),
                                        )
                                        .toList(),
                                onChanged: (v) => filtroNotifier.value = v!,
                              );
                            },
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Expanded(
                        //Usamos Consumer para reconstruir solo la lista cuando el controlador cambie
                        child: Consumer<PetController>(
                          builder: (context, petController, child) {
                            if (isLoading) {
                              return const Center(
                                child: CircularProgressIndicator(),
                              );
                            }
                            if (errorMessage != null) {
                              return Center(
                                child: Text('Error: $errorMessage'),
                              );
                            }

                            //Aplicar filtros a la lista del controlador
                            final List<Mascota> mascotas =
                                petController.pets.where((p) {
                                  final coincideEspecie =
                                      filtroNotifier.value == "Todas" ||
                                      p.especie == filtroNotifier.value;
                                  final coincideQuery =
                                      queryNotifier.value.isEmpty ||
                                      p.nombre.toLowerCase().contains(
                                        queryNotifier.value.toLowerCase(),
                                      );
                                  return coincideEspecie && coincideQuery;
                                }).toList();

                            if (mascotas.isEmpty) {
                              return Center(
                                child: Text(
                                  "Aún no tienes mascotas registradas.",
                                ),
                              );
                            }

                            return ListView.builder(
                              itemCount: mascotas.length,
                              itemBuilder: (context, index) {
                                final p = mascotas[index];
                                return Card(
                                  child: ListTile(
                                    title: Text(p.nombre),
                                    subtitle: Text(
                                      "${p.especie} / ${p.raza ?? 'Sin Raza'}",
                                    ),
                                    leading: CircleAvatar(
                                      // Usar NetworkImage para la URL de la foto subida
                                      backgroundImage:
                                          p.fotoURL != null &&
                                                  p.fotoURL!.isNotEmpty
                                              ? NetworkImage(
                                                'http://10.0.2.2:3000${p.fotoURL!}',
                                              )
                                              : null,
                                      child:
                                          p.fotoURL == null ||
                                                  p.fotoURL!.isEmpty
                                              ? const Icon(Icons.pets)
                                              : null,
                                    ),
                                    onTap: () {
                                      Navigator.push(
                                        context,
                                        MaterialPageRoute(
                                          builder:
                                              (_) => MascotaDetailScreen(
                                                mascota: p,
                                              ),
                                        ),
                                      );
                                    },
                                  ),
                                );
                              },
                            );
                          },
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class MascotaDetailScreen extends StatefulWidget {
  final Mascota mascota;
  const MascotaDetailScreen({super.key, required this.mascota});

  @override
  State<MascotaDetailScreen> createState() => _MascotaDetailScreenState();
}

class _MascotaDetailScreenState extends State<MascotaDetailScreen>
    with TickerProviderStateMixin {
  late final TabController _tabController = TabController(
    length: 4,
    vsync: this,
  );

  DateTime _focusedDay = DateTime.now();
  DateTime? _selectedDay;

  static const Color _kPrimary = Color(0xFF2F76A6);
  static const Color _kPrimaryDark = Color(0xFF0E3A5C);

  @override
  Widget build(BuildContext context) {
    final p = widget.mascota;

    return Scaffold(
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {},
        icon: const Icon(Icons.pets, color: Colors.white),
        label: const Text('Editar', style: TextStyle(color: Colors.white)),
        backgroundColor: _kPrimary,
      ),
      body: NestedScrollView(
        headerSliverBuilder:
            (context, innerScrolled) => [
              SliverAppBar(
                pinned: true,
                expandedHeight: 380,
                elevation: 0,
                backgroundColor: _kPrimary,
                leading:
                    Navigator.of(context).canPop()
                        ? const BackButton(color: Colors.white)
                        : null,
                iconTheme: const IconThemeData(color: Colors.white),
                flexibleSpace: FlexibleSpaceBar(
                  collapseMode: CollapseMode.pin,
                  background: Container(
                    decoration: const BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment(0.0, -1.0),
                        end: Alignment(0.6, 1.0),
                        colors: [_kPrimaryDark, _kPrimary],
                      ),
                    ),
                    child: SafeArea(
                      bottom: false,
                      child: Padding(
                        padding: const EdgeInsets.fromLTRB(
                          16,
                          kToolbarHeight + 12,
                          16,
                          48,
                        ),
                        child: _headerCard(context, p),
                      ),
                    ),
                  ),
                ),

                bottom: PreferredSize(
                  preferredSize: const Size.fromHeight(
                    16 + kTextTabBarHeight + 12,
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const SizedBox(height: 16),
                      Container(
                        margin: const EdgeInsets.fromLTRB(12, 0, 12, 12),
                        padding: const EdgeInsets.all(6),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(.12),
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(
                            color: Colors.white.withOpacity(.25),
                          ),
                        ),
                        child: TabBar(
                          controller: _tabController,
                          isScrollable: true,
                          indicator: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          labelColor: _kPrimaryDark,
                          unselectedLabelColor: Colors.white,
                          splashBorderRadius: BorderRadius.circular(10),
                          tabs: const [
                            Tab(icon: Icon(Icons.pets), text: 'Perfil'),
                            Tab(icon: Icon(Icons.vaccines), text: 'Vacunas'),
                            Tab(
                              icon: Icon(Icons.shield),
                              text: 'Desparasitación',
                            ),
                            Tab(icon: Icon(Icons.history), text: 'Historial'),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
        body: TabBarView(
          controller: _tabController,
          children: [
            _buildPerfil(p),
            _buildVacunas(p),
            _buildDesparasitaciones(p),
            _buildHistorial(p),
          ],
        ),
      ),
    );
  }

  /* ===================== Header con foto ===================== */
  Widget _headerCard(BuildContext context, Mascota p) {
    final especie = p.especie.isEmpty ? '—' : p.especie;
    final sexo = p.sexo.isEmpty ? '—' : p.sexo;
    final peso = p.peso?.toString() ?? '—';

    return Material(
      color: Colors.white.withOpacity(.12),
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: Colors.white.withOpacity(.25)),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
                Container(
                  width: 84,
                  height: 84,
                  decoration: const BoxDecoration(shape: BoxShape.circle),
                  child: CircleAvatar(
                    radius: 42,
                    backgroundColor: Colors.white,
                    backgroundImage:
                        p.fotoURL != null && p.fotoURL!.isNotEmpty
                            ? NetworkImage('http://10.0.2.2:3000${p.fotoURL!}')
                            : null,
                    child:
                        p.fotoURL == null || p.fotoURL!.isEmpty
                            ? const Icon(Icons.pets, color: _kPrimary, size: 36)
                            : null,
                  ),
                ),
            const SizedBox(width: 14),
            // Texto flexible para evitar overflow
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    p.nombre,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      color: Colors.white,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                   '${p.especie} • ${p.raza ?? 'Sin Raza'}',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(context).textTheme.labelLarge?.copyWith(
                      color: Colors.white.withOpacity(.9),
                    ),
                  ),
                  const SizedBox(height: 10),
                  LayoutBuilder(
                    builder:
                        (_, __) => Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: [
                            _chip(context, Icons.catching_pokemon, 'Especie', especie),
                            _chip(context, Icons.female, 'Sexo', sexo),
                            _chip(context, Icons.monitor_weight, 'Peso', peso),
                          ],
                        ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _chip(
    BuildContext context,
    IconData icon,
    String label,
    String value,
  ) {
    return ConstrainedBox(
      constraints: const BoxConstraints(maxWidth: 180),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(.14),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.white.withOpacity(.25)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 16, color: Colors.white),
            const SizedBox(width: 6),
            Flexible(
              child: Text(
                '$label: $value',
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: Theme.of(context).textTheme.labelMedium?.copyWith(
                  color: Colors.white,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  /* ===================== Pestañas ===================== */

  Widget _buildPerfil(Mascota p) {
    final currentUser = Provider.of<AuthController>(context).currentUser;
    //final propietarioNombre = currentUser?.nombre ?? "Usuario No Autenticado"; 
    final propietarioEmail = currentUser?.email ?? "Sin Email";
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
      children: [
        _infoCard(context, 'Datos de la Mascota', [
          _kv('Nombre', p.nombre),
          _kv('Especie', p.especie),
          _kv('Raza', p.raza ?? '—'),
          _kv('Sexo', p.sexo),
          //_kv('Edad', '${p.edad} años'),
          _kv('Peso', '${p.peso ?? '—'} kg'),
          _kv('Fecha de nacimiento', p.fechaNacimiento?.toIso8601String().split('T')[0] ?? '—'),
        ]),
        const SizedBox(height: 12),
        _infoCard(context, 'Dueño', [
          //_kv('Nombre', propietarioNombre),
          _kv('Dirección', propietarioEmail),
        ]),
      ],
    );
  }

  Widget _infoCard(BuildContext context, String title, List<Widget> children) {
    return Card(
      elevation: 0,
      color: Colors.blueGrey.shade50,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 14, 16, 8),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              overflow: TextOverflow.ellipsis,
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w800,
                color: _kPrimaryDark,
              ),
            ),
            const SizedBox(height: 8),
            ...children,
          ],
        ),
      ),
    );
  }

  Widget _kv(String label, String value) {
    final v = value.isEmpty ? '—' : value;
    return ListTile(
      dense: true,
      contentPadding: EdgeInsets.zero,
      title: Text(label, style: const TextStyle(color: Colors.blueGrey)),
      subtitle: Text(
        v,
        maxLines: 2,
        overflow: TextOverflow.ellipsis,
        style: const TextStyle(fontWeight: FontWeight.w600),
      ),
    );
  }

  Widget _buildVacunas(Mascota p) {
    final eventos = <DateTime, List<Vacuna>>{};
    for (final v in _ejemploVacunas) {
      final key = DateTime(v.fecha.year, v.fecha.month, v.fecha.day);
      eventos.putIfAbsent(key, () => []).add(v);
    }

    List<Vacuna> eventsOf(DateTime day) =>
        eventos[DateTime(day.year, day.month, day.day)] ?? [];

    return ListView(
      padding: const EdgeInsets.fromLTRB(12, 12, 12, 100),
      children: [
        Card(
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          child: Padding(
            padding: const EdgeInsets.all(8.0),
            child: TableCalendar<Vacuna>(
              firstDay: DateTime(DateTime.now().year - 2),
              lastDay: DateTime(DateTime.now().year + 2),
              focusedDay: _focusedDay,
              selectedDayPredicate:
                  (day) => _selectedDay != null && isSameDay(_selectedDay, day),
              calendarFormat: CalendarFormat.month,
              eventLoader: eventsOf,
              onDaySelected: (sel, foc) {
                setState(() {
                  _selectedDay = sel;
                  _focusedDay = foc;
                });
              },
              headerStyle: const HeaderStyle(
                formatButtonVisible: false,
                titleCentered: true,
              ),
              calendarStyle: CalendarStyle(
                todayDecoration: BoxDecoration(
                  color: _kPrimary.withOpacity(.35),
                  shape: BoxShape.circle,
                ),
                selectedDecoration: const BoxDecoration(
                  color: _kPrimary,
                  shape: BoxShape.circle,
                ),
                markerDecoration: const BoxDecoration(
                  color: Colors.green,
                  shape: BoxShape.circle,
                ),
              ),
            ),
          ),
        ),
        const SizedBox(height: 12),
        if (_selectedDay == null)
          _emptyState(
            'Selecciona un día para ver las vacunas aplicadas.',
            Icons.calendar_today,
          ),
        if (_selectedDay != null) ...[
          ...eventsOf(_selectedDay!).map(
            (v) => Card(
              color: Colors.green.shade50,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              child: ListTile(
                leading: const Icon(Icons.vaccines, color: Colors.green),
                title: Text(
                  '${v.fecha}  •  Lote: ${v.lote}',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                subtitle: Text(
                  '${v.veterinaria}  •  Adjuntos: ${v.adjuntos}',
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                isThreeLine: true,
              ),
            ),
          ),
          if (eventsOf(_selectedDay!).isEmpty)
            _emptyState(
              'No hay vacunas registradas en este día.',
              Icons.inbox_outlined,
            ),
        ],
      ],
    );
  }

  Widget _buildDesparasitaciones(Mascota p) {
    return ListView.separated(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
      itemBuilder: (_, i) {
        final d = _ejemploDesparasitaciones[i];
        return Card(
          elevation: 0,
          color: Colors.indigo.shade50,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          child: ListTile(
            leading: const Icon(Icons.shield, color: _kPrimary),
            title: Text(
              '${d.tipo}: ${d.producto}',
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(fontWeight: FontWeight.w700),
            ),
            subtitle: Text(d.fecha.toIso8601String().split('T')[0]),
          ),
        );
      },
      separatorBuilder: (_, __) => const SizedBox(height: 8),
      itemCount: _ejemploDesparasitaciones.length,
    );
  }

  Widget _buildHistorial(Mascota p) {
    return ListView.separated(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
      itemBuilder: (_, i) {
        final h = _ejemploHistorial[i];
        return Card(
          elevation: 0,
          color: Colors.orange.shade50,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          child: ListTile(
            leading: const Icon(
              Icons.note_alt_outlined,
              color: Colors.deepOrange,
            ),
            title: Text(h.nota, maxLines: 2, overflow: TextOverflow.ellipsis),
            subtitle: Text(h.fecha.toIso8601String().split('T')[0]),
            isThreeLine: true,
          ),
        );
      },
      separatorBuilder: (_, __) => const SizedBox(height: 8),
      itemCount: _ejemploHistorial.length,
    );
  }

  Widget _emptyState(String msg, IconData icon) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 22, color: Colors.blueGrey),
            const SizedBox(width: 8),
            Flexible(
              child: Text(msg, style: const TextStyle(color: Colors.blueGrey)),
            ),
          ],
        ),
      ),
    );
  }

  /* ===================== Helpers ===================== */

  DateTime? _parseFechaCorta(String raw) {
    if (raw.trim().isEmpty) return null;
    final norm = raw.toLowerCase().replaceAll(RegExp(r'[-/]+'), ' ').trim();
    final parts = norm.split(RegExp(r'\s+'));
    if (parts.length < 3) return null;
    final dia = int.tryParse(parts[0]) ?? 1;
    final mes = _mesStrToInt(parts[1]);
    final anio = int.tryParse(parts[2]) ?? DateTime.now().year;
    return DateTime(anio, mes, dia);
  }

  int _mesStrToInt(String mes) {
    switch (mes.toLowerCase()) {
      case 'ene':
      case 'enero':
        return 1;
      case 'feb':
      case 'febrero':
        return 2;
      case 'mar':
      case 'marzo':
        return 3;
      case 'abr':
      case 'abril':
        return 4;
      case 'may':
      case 'mayo':
        return 5;
      case 'jun':
      case 'junio':
        return 6;
      case 'jul':
      case 'julio':
        return 7;
      case 'ago':
      case 'agosto':
        return 8;
      case 'sep':
      case 'sept':
      case 'septiembre':
        return 9;
      case 'oct':
      case 'octubre':
        return 10;
      case 'nov':
      case 'noviembre':
        return 11;
      case 'dic':
      case 'diciembre':
        return 12;
      default:
        return 1;
    }
  }
}
