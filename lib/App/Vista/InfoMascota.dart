import 'package:flutter/material.dart';
import 'package:petcare_app/App/Controlador/citas_controller.dart';
import 'package:petcare_app/App/Modelo/Mascotas.dart';
import 'package:petcare_app/App/Vista/formularioMascota.dart';
import 'package:table_calendar/table_calendar.dart';
import 'package:provider/provider.dart';
import 'package:petcare_app/App/Controlador/mascota_controller.dart';
import 'package:petcare_app/App/Controlador/veterinaria_controller.dart';
import 'package:petcare_app/App/Modelo/EventoSalud.dart';
import 'package:petcare_app/App/Vista/FormularioEventoSauld.dart';

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
                    IconButton(
                      onPressed: () {
                        Navigator.pop(context);
                      },
                      icon: Icon(Icons.arrow_back, color: Colors.white),
                    ),
                    const SizedBox(width: 4),
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
                                  style: TextStyle(
                                    color: Colors.blueGrey.shade700,
                                    fontSize: 16,
                                  ),
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
    length: 3,
    vsync: this,
  );

  DateTime _focusedDay = DateTime.now();
  DateTime? _selectedDay;

  static const Color _kPrimary = Color(0xFF2F76A6);
  static const Color _kPrimaryDark = Color(0xFF0E3A5C);

  @override
  void initState() {
    super.initState();
    _tabController.addListener(() {
      if (mounted) setState(() {});
    });
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<PetController>().fetchEventosSalud(widget.mascota.idMascota);
    });
  }

  @override
  Widget build(BuildContext context) {
    final p = widget.mascota;

    return Scaffold(
      floatingActionButton: _buildFab(p),
      body: NestedScrollView(
        headerSliverBuilder:
            (context, innerScrolled) => [
              SliverAppBar(
                pinned: true,
                expandedHeight: 340,
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
                          24,
                        ),
                        child: _headerCard(context, p),
                      ),
                    ),
                  ),
                ),
              ),
              SliverPersistentHeader(
                pinned: true,
                delegate: _TabsHeaderDelegate(
                  minExtent: kTextTabBarHeight + 32,
                  maxExtent: kTextTabBarHeight + 32,
                  builder: (context, shrinkOffset, overlapsContent) {
                    return Container(
                      color: _kPrimary,
                      padding: const EdgeInsets.fromLTRB(12, 8, 12, 8),
                      child: Container(
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
                            Tab(
                              icon: Icon(Icons.vaccines),
                              text: 'Eventos Salud',
                            ),
                            Tab(icon: Icon(Icons.history), text: 'Historial'),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),
            ],
        body: TabBarView(
          controller: _tabController,
          children: [
            _buildPerfil(p),
            _buildEventosSalud(p),
            _buildHistorial(p),
          ],
        ),
      ),
    );
  }

  /* ===================== Header con foto ===================== */
  Widget _headerCard(BuildContext context, Mascota p) {
    final especie = p.especie ?? '—';
    final sexo = p.sexo ?? '—';
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
                            _chip(context, Icons.pets, 'Especie', especie),
                            _chip(context, Icons.female, 'Sexo', sexo),
                            _chip(
                              context,
                              Icons.monitor_weight,
                              'Peso',
                              peso,
                              ' kg',
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
    );
  }

  Widget _buildFab(Mascota p) {
    switch (_tabController.index) {
      case 0: // Perfil
        return FloatingActionButton.extended(
          onPressed: () async {
            final updated = await Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => FormularioMascota(mascota: p)),
            );
            if (updated == true) {
              context.read<PetController>().fetchPets();
            }
          },
          icon: const Icon(Icons.edit, color: Colors.white),
          label: const Text('Editar', style: TextStyle(color: Colors.white)),
          backgroundColor: _kPrimary,
        );
      case 1: // Eventos Salud
        return FloatingActionButton.extended(
          onPressed: () async {
            final creado = await Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => FormularioEventoSalud(mascota: p),
              ),
            );
            if (creado == true) {
              await context.read<PetController>().fetchEventosSalud(
                p.idMascota,
              );
            }
          },
          icon: const Icon(Icons.add, color: Colors.white),
          label: const Text('Agregar', style: TextStyle(color: Colors.white)),
          backgroundColor: _kPrimary,
        );
      default:
        return const SizedBox.shrink(); // Historial sin FAB
    }
  }

  Widget _chip(
    BuildContext context,
    IconData icon,
    String label,
    String value, [
    String suffix = '',
  ]) {
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
                '$label: $value$suffix',
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
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),

      children: [
        _infoCard(context, 'Datos de la Mascota', [
          _kv('Nombre', p.nombre),
          _kv('Especie', p.especie ?? '—'),
          _kv('Raza', p.raza ?? '—'),
          _kv('Sexo', p.sexo ?? '—'),
          _kv('Edad', '${p.edad} años'),
          _kv('Peso', p.peso != null ? '${p.peso} kg' : '—'),
          _kv(
            'Fecha de nacimiento',
            p.fechaNacimiento?.toIso8601String().split('T')[0] ?? '—',
          ),
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
                fontSize: 18,
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
      title: Text(
        label,
        style: const TextStyle(
          color: Colors.blueGrey,
          fontWeight: FontWeight.w500,
          fontSize: 16,
        ),
      ),
      subtitle: Text(
        v,
        maxLines: 2,
        overflow: TextOverflow.ellipsis,
        style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
      ),
    );
  }

  Widget _buildEventosSalud(Mascota p) {
    final petCtrl = context.watch<PetController>();
    final eventosBase = petCtrl.eventosPorMascota[p.idMascota] ?? [];
    // Agrupar por día
    final mapaOriginal = <DateTime, List<EventoSalud>>{};
    for (final e in eventosBase) {
      final key = DateTime(e.fecha.year, e.fecha.month, e.fecha.day);
      mapaOriginal.putIfAbsent(key, () => []).add(e);
    }
    final ahora = DateTime.now();
    final horizonte = DateTime(ahora.year + 1, ahora.month, ahora.day);
    final mapaRecurrencias = <DateTime, List<EventoSalud>>{};

    for (final e in eventosBase) {
      final intervalo = e.regularidadMeses;
      if (intervalo == null || intervalo <= 0) continue;

      DateTime base = e.fecha;
      DateTime next = _addMonthsSafe(base, intervalo);
      while (next.isBefore(horizonte)) {
        final key = DateTime(next.year, next.month, next.day);
        final yaOriginal =
            mapaOriginal[key]?.any(
              (orig) => orig.tipo == e.tipo && orig.producto == e.producto,
            ) ??
            false;
        if (!yaOriginal) {
          final clone = EventoSalud(
            id: -e.id,
            mascotaId: e.mascotaId,
            tipo: e.tipo,
            fecha: next,
            producto: e.producto,
            lote: e.lote,
            veterinaria: e.veterinaria,
            adjuntos: 0,
            notas: e.notas,
            regularidadMeses: intervalo,
          );
          mapaRecurrencias.putIfAbsent(key, () => []).add(clone);
        }
        next = _addMonthsSafe(next, intervalo);
      }
    }
    List<EventoSalud> eventsOf(DateTime d) {
      final key = DateTime(d.year, d.month, d.day);
      return [...?mapaOriginal[key], ...?mapaRecurrencias[key]];
    }

    return Column(
      children: [
        Expanded(
          child: ListView(
            padding: const EdgeInsets.fromLTRB(12, 12, 12, 24),
            children: [
              Card(
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(8.0),
                  child: TableCalendar<EventoSalud>(
                    firstDay: DateTime(DateTime.now().year - 2),
                    lastDay: DateTime(DateTime.now().year + 2),
                    focusedDay: _focusedDay,
                    selectedDayPredicate:
                        (day) =>
                            _selectedDay != null &&
                            isSameDay(_selectedDay, day),
                    eventLoader: eventsOf,
                    calendarFormat: CalendarFormat.month,
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
                  'Selecciona un día para ver registros.',
                  Icons.calendar_today,
                ),
              if (_selectedDay != null) ...[
                for (final e in eventsOf(_selectedDay!))
                  Card(
                    color:
                        e.id < 0
                            ? (e.tipo == 'vacuna'
                                ? Colors.green.shade100
                                : Colors.indigo.shade100)
                            : (e.tipo == 'vacuna'
                                ? Colors.green.shade50
                                : Colors.indigo.shade50),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: ListTile(
                      leading: Icon(
                        e.tipo == 'vacuna' ? Icons.vaccines : Icons.shield,
                        color: e.tipo == 'vacuna' ? Colors.green : _kPrimary,
                      ),
                      title: Text(
                        '${e.tipo == 'vacuna' ? 'Vacuna' : 'Desparasitación'}: ${e.producto}${e.id < 0 ? ' (próximo)' : ''}',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      subtitle: Text(
                        [
                          if (e.lote != null && e.lote!.isNotEmpty)
                            'Lote: ${e.lote}',
                          if (e.veterinaria != null &&
                              e.veterinaria!.isNotEmpty)
                            e.veterinaria!,
                          if (e.regularidadMeses != null && e.id < 0)
                            'Cada ${e.regularidadMeses} mes(es)',
                        ].join(' • '),
                      ),
                      trailing:
                          e.id > 0
                              ? IconButton(
                                icon: const Icon(Icons.delete_outline),
                                onPressed: () async {
                                  final ok = await showDialog<bool>(
                                    context: context,
                                    builder:
                                        (ctx) => AlertDialog(
                                          title: const Text('Eliminar'),
                                          content: const Text(
                                            style: TextStyle(
                                              fontSize: 16,
                                              height: 1.4,
                                            ),
                                            '¿Deseas eliminar este registro?',
                                          ),
                                          actions: [
                                            TextButton(
                                              onPressed:
                                                  () =>
                                                      Navigator.pop(ctx, false),
                                              child: const Text('Cancelar'),
                                            ),
                                            ElevatedButton(
                                              onPressed:
                                                  () =>
                                                      Navigator.pop(ctx, true),
                                              child: const Text('Eliminar'),
                                            ),
                                          ],
                                        ),
                                  );
                                  if (ok == true) {
                                    final petCtrl =
                                        context.read<PetController>();
                                    final err = await petCtrl
                                        .eliminarEventoSalud(
                                          mascotaId: p.idMascota,
                                          eventoId: e.id,
                                        );
                                    if (err != null) {
                                      ScaffoldMessenger.of(
                                        context,
                                      ).showSnackBar(
                                        SnackBar(content: Text(err)),
                                      );
                                    }
                                  }
                                },
                              )
                              : null,
                    ),
                  ),
                if (eventsOf(_selectedDay!).isEmpty)
                  _emptyState(
                    'No hay registros en este día.',
                    Icons.inbox_outlined,
                  ),
              ],
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildHistorial(Mascota p) {
    return Consumer2<CitasController, VeterinariaController>(
      builder: (context, citasCtrl, vetCtrl, _) {
        final citasMascota =
            citasCtrl.citas.where((c) => c.mascotaId == p.idMascota).toList()
              ..sort(
                (a, b) => (b.horarioConfirmado ?? b.fechaPreferida).compareTo(
                  a.horarioConfirmado ?? a.fechaPreferida,
                ),
              );

        if (citasCtrl.loading) {
          return const Center(child: CircularProgressIndicator());
        }
        if (citasMascota.isEmpty) {
          return _emptyState(
            'No hay citas registradas para ${p.nombre}.',
            Icons.event_busy,
          );
        }
        String _vetName(int id) {
          try {
            return vetCtrl.veterinarias.firstWhere((v) => v.id == id).name;
          } catch (_) {
            return 'Veterinaria #$id';
          }
        }

        return ListView.separated(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
          itemCount: citasMascota.length,
          separatorBuilder: (_, __) => const SizedBox(height: 10),
          itemBuilder: (_, i) {
            final c = citasMascota[i];
            final fecha = c.horarioConfirmado ?? c.fechaPreferida;
            final fechaStr =
                '${fecha.year}-${fecha.month.toString().padLeft(2, '0')}-${fecha.day.toString().padLeft(2, '0')}';
            final horaStr =
                '${fecha.hour.toString().padLeft(2, '0')}:${fecha.minute.toString().padLeft(2, '0')}';

            return Card(
              elevation: 0,
              color: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
              ),
              child: Padding(
                padding: const EdgeInsets.fromLTRB(14, 14, 14, 10),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(
                          Icons.calendar_month,
                          color: _kPrimaryDark,
                          size: 22,
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'Cita: $fechaStr • $horaStr',
                            style: const TextStyle(
                              fontWeight: FontWeight.w800,
                              fontSize: 16,
                              color: _kPrimaryDark,
                            ),
                          ),
                        ),
                        _statusChip(c),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      _vetName(c.veterinariaId),
                      style: const TextStyle(
                        fontWeight: FontWeight.w600,
                        color: Colors.blueGrey,
                      ),
                    ),
                    if (c.notas != null && c.notas!.trim().isNotEmpty) ...[
                      const SizedBox(height: 6),
                      Text(
                        c.notas!,
                        maxLines: 3,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w500,
                          height: 1.3,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            );
          },
        );
      },
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

  Widget _statusChip(dynamic cita) {
    final label = cita.statusLabel;
    final color = cita.statusColor;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(.12),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: color.withOpacity(.5)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            label == 'Pendiente'
                ? Icons.hourglass_bottom
                : label == 'Confirmada'
                ? Icons.check_circle
                : Icons.cancel,
            size: 16,
            color: color,
          ),
          const SizedBox(width: 6),
          Text(
            label,
            style: TextStyle(
              color: color,
              fontWeight: FontWeight.w900,
              fontSize: 12,
            ),
          ),
        ],
      ),
    );
  }

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

  DateTime _addMonthsSafe(DateTime src, int months) {
    final year = src.year + ((src.month + months - 1) ~/ 12);
    final month = ((src.month + months - 1) % 12) + 1;
    final dayInTargetMonth = DateTime(year, month + 1, 0).day;
    final day = src.day <= dayInTargetMonth ? src.day : dayInTargetMonth;
    return DateTime(year, month, day);
  }
}

class _TabsHeaderDelegate extends SliverPersistentHeaderDelegate {
  final double minExtent;
  final double maxExtent;
  final Widget Function(
    BuildContext context,
    double shrinkOffset,
    bool overlapsContent,
  )
  builder;

  _TabsHeaderDelegate({
    required this.minExtent,
    required this.maxExtent,
    required this.builder,
  });

  @override
  Widget build(
    BuildContext context,
    double shrinkOffset,
    bool overlapsContent,
  ) {
    return builder(context, shrinkOffset, overlapsContent);
  }

  @override
  bool shouldRebuild(_TabsHeaderDelegate oldDelegate) {
    return oldDelegate.minExtent != minExtent ||
        oldDelegate.maxExtent != maxExtent;
  }
}
