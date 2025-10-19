import 'package:flutter/material.dart';
import 'package:table_calendar/table_calendar.dart';

void main() {
  runApp(MaterialApp(
    title: 'PetCare App',
    debugShowCheckedModeBanner: false,
    theme: ThemeData(
      useMaterial3: true,
      colorSchemeSeed: Color(0xFF2F76A6),
      fontFamily: 'Roboto',
      inputDecorationTheme: InputDecorationTheme(
        hintStyle: TextStyle(color: Colors.blueGrey),
        filled: true,
        fillColor: Colors.white,
        contentPadding: EdgeInsets.symmetric(horizontal: 14, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.all(Radius.circular(14)),
          borderSide: BorderSide.none,
        ),
      ),
    ),
    home: PacientesListScreen(),
  ));
}

class Paciente {
  final int id;
  final String nombre;
  final String especie;
  final String raza;
  final Propietario propietario;
  final String edad;
  final String ultimaVisita;
  final String sucursal;
  final String microchip;
  final String sexo;
  final String peso;
  final String fechaNac;
  final List<Vacuna> vacunas;
  final List<Desparasitacion> desparasitaciones;
  final List<Historial> historial;
  final List<Documento> documentos;
  final List<String> etiquetas;

  Paciente({
    required this.id,
    required this.nombre,
    required this.especie,
    required this.raza,
    required this.propietario,
    required this.edad,
    required this.ultimaVisita,
    required this.sucursal,
    required this.microchip,
    required this.sexo,
    required this.peso,
    required this.fechaNac,
    required this.vacunas,
    required this.desparasitaciones,
    required this.historial,
    required this.documentos,
    required this.etiquetas,
  });
}

class Propietario {
  final String nombre;
  final String direccion;

  Propietario({required this.nombre, required this.direccion});
}

class Vacuna {
  final String fecha, lote, veterinaria;
  final int adjuntos;

  Vacuna(this.fecha, this.lote, this.veterinaria, this.adjuntos);
}

class Desparasitacion {
  final String tipo, producto, fecha;

  Desparasitacion(this.tipo, this.producto, this.fecha);
}

class Historial {
  final String fecha, nota;

  Historial(this.fecha, this.nota);
}

class Documento {
  final String tipo, nombre, fecha;

  Documento(this.tipo, this.nombre, this.fecha);
}

// --- Lista de ejemplo ---
final List<Paciente> pacientes = [
  Paciente(
    id: 1,
    nombre: "Luna",
    especie: "Felino",
    raza: "Siames",
    propietario: Propietario(nombre: "Ana López", direccion: "456 Calle B, Ciudad"),
    edad: "5 años",
    ultimaVisita: "15 abr 2024",
    sucursal: "Central",
    microchip: "981020000123456",
    sexo: "Hembra",
    peso: "4.5 kg",
    fechaNac: "2019-03-10",
    vacunas: [Vacuna("05 feb 2024", "LOT-AZ12", "Central", 1)],
    desparasitaciones: [Desparasitacion("Interna", "Albendazol", "10 ene 2024")],
    historial: [Historial("15 abr 2024", "Consulta por control anual. Examen físico normal.")],
    documentos: [Documento("PDF", "Constancia vacunación.pdf", "05 feb 2024")],
    etiquetas: ["Esterilizada", "Al día"],
  ),
  Paciente(
    id: 2,
    nombre: "Thor",
    especie: "Canino",
    raza: "Golden Retriever",
    propietario: Propietario(nombre: "Carlos Gómez", direccion: "Av. Alameda 120"),
    edad: "3 años",
    ultimaVisita: "20 mar 2024",
    sucursal: "Oeste",
    microchip: "980000000001234",
    sexo: "Macho",
    peso: "28 kg",
    fechaNac: "2021-01-02",
    vacunas: [],
    desparasitaciones: [],
    historial: [],
    documentos: [],
    etiquetas: ["Cachorro grande"],
  ),
];

class PacientesListScreen extends StatelessWidget {
  const PacientesListScreen({super.key});

  @override
  Widget build(BuildContext context) {
    String query = "";
    String filtroEspecie = "Todas";
    final ValueNotifier<String> filtroNotifier = ValueNotifier(filtroEspecie);
    final ValueNotifier<String> queryNotifier = ValueNotifier(query);

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
                            BoxShadow(color: Colors.black.withOpacity(.08), blurRadius: 8, spreadRadius: 1),
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
                      'Pacientes',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 22,
                        fontWeight: FontWeight.w800,
                        fontFamily: 'Roboto',
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
                    borderRadius: BorderRadius.circular(24),
                    color: Colors.white.withOpacity(.72),
                    border: Border.all(color: Colors.white.withOpacity(.8), width: 1),
                    boxShadow: [
                      BoxShadow(color: Colors.black.withOpacity(.18), blurRadius: 24, offset: const Offset(0, 12)),
                    ],
                  ),
                  child: ValueListenableBuilder<String>(
                    valueListenable: filtroNotifier,
                    builder: (context, filtro, _) {
                      return ValueListenableBuilder<String>(
                        valueListenable: queryNotifier,
                        builder: (context, query, _) {
                          final filtrados = pacientes.where((p) {
                            final coincideEspecie = filtro == "Todas" || p.especie == filtro;
                            final coincideQuery = query.isEmpty ||
                                p.nombre.toLowerCase().contains(query.toLowerCase()) ||
                                p.propietario.nombre.toLowerCase().contains(query.toLowerCase());
                            return coincideEspecie && coincideQuery;
                          }).toList();

                          return Column(
                            children: [
                              Row(
                                children: [
                                  Expanded(
                                    child: TextField(
                                      decoration: const InputDecoration(
                                        labelText: "Buscar por nombre o propietario",
                                      ),
                                      onChanged: (v) => queryNotifier.value = v,
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  DropdownButton<String>(
                                    value: filtro,
                                    items: ["Todas", "Canino", "Felino"]
                                        .map((e) => DropdownMenuItem(value: e, child: Text(e)))
                                        .toList(),
                                    onChanged: (v) => filtroNotifier.value = v!,
                                  ),
                                ],
                              ),
                              const SizedBox(height: 12),
                              Expanded(
                                child: ListView.builder(
                                  itemCount: filtrados.length,
                                  itemBuilder: (context, index) {
                                    final p = filtrados[index];
                                    return Card(
                                      child: ListTile(
                                        title: Text(p.nombre),
                                        subtitle: Text("${p.especie} / ${p.raza}\n${p.propietario.nombre}"),
                                        onTap: () {
                                          Navigator.push(
                                            context,
                                            MaterialPageRoute(
                                              builder: (_) => PacienteDetailScreen(paciente: p),
                                            ),
                                          );
                                        },
                                      ),
                                    );
                                  },
                                ),
                              ),
                            ],
                          );
                        },
                      );
                    },
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

class PacienteDetailScreen extends StatefulWidget {
  final Paciente paciente;
  const PacienteDetailScreen({super.key, required this.paciente});

  @override
  State<PacienteDetailScreen> createState() => _PacienteDetailScreenState();
}

class _PacienteDetailScreenState extends State<PacienteDetailScreen>
    with TickerProviderStateMixin {
  late final TabController _tabController = TabController(length: 4, vsync: this);

  DateTime _focusedDay = DateTime.now();
  DateTime? _selectedDay;

  static const Color _kPrimary = Color(0xFF2F76A6);
  static const Color _kPrimaryDark = Color(0xFF0E3A5C);

  @override
  Widget build(BuildContext context) {
    final p = widget.paciente;

    return Scaffold(
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
        },
        icon: const Icon(Icons.pets, color: Colors.white),
        label: const Text('Editar', style: TextStyle(color: Colors.white)),
        backgroundColor: _kPrimary,
      ),
      body: NestedScrollView(
        headerSliverBuilder: (context, innerScrolled) => [
          SliverAppBar(
  pinned: true,
  expandedHeight: 380, 
  elevation: 0,
  backgroundColor: _kPrimary,
   leading: Navigator.of(context).canPop()
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
          padding: const EdgeInsets.fromLTRB(16, kToolbarHeight + 12, 16, 48), 
          child: _headerCard(context, p),
        ),
      ),
    ),
  ),

  // Mismo bottom (TabBar), solo le damos margen superior para que se vea más azul entre ambos
  bottom: PreferredSize(
  preferredSize: const Size.fromHeight(16 + kTextTabBarHeight + 12),
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
          border: Border.all(color: Colors.white.withOpacity(.25)),
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
            Tab(icon: Icon(Icons.shield), text: 'Desparasitación'),
            Tab(icon: Icon(Icons.history), text: 'Historial'),
          ],
        ),
      ),
    ],
  ),
)


)

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
  Widget _headerCard(BuildContext context, Paciente p) {
    final micro = p.microchip.isEmpty ? '—' : p.microchip;
    final sexo = p.sexo.isEmpty ? '—' : p.sexo;
    final peso = p.peso.isEmpty ? '—' : p.peso;

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
            // Avatar + botón agregar foto (placeholder)
            Stack(
              alignment: Alignment.bottomRight,
              children: [
                Container(
                  width: 84,
                  height: 84,
                  decoration: const BoxDecoration(shape: BoxShape.circle),
                  child: CircleAvatar(
                    radius: 42,
                    backgroundColor: Colors.white,
                    // Si luego tienes una URL: backgroundImage: NetworkImage(p.fotoUrl),
                    child: const Icon(Icons.pets, color: _kPrimary, size: 36),
                  ),
                ),
                Material(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  child: InkWell(
                    onTap: () {
                      // TODO: abrir selector de imagen / cámara
                    },
                    borderRadius: BorderRadius.circular(16),
                    child: const Padding(
                      padding: EdgeInsets.all(4.0),
                      child: Icon(Icons.add_a_photo, size: 16, color: _kPrimaryDark),
                    ),
                  ),
                ),
              ],
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
                    style: Theme.of(context)
                        .textTheme
                        .titleLarge
                        ?.copyWith(color: Colors.white, fontWeight: FontWeight.w800),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    p.propietario.nombre,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(context)
                        .textTheme
                        .labelLarge
                        ?.copyWith(color: Colors.white.withOpacity(.9)),
                  ),
                  const SizedBox(height: 10),
                  LayoutBuilder(
                    builder: (_, __) => Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        _chip(context, Icons.qr_code_2, 'Microchip', micro),
                        _chip(context, Icons.female, 'Sexo', sexo),
                        _chip(context, Icons.monitor_weight, 'Peso', peso),
                        _chip(context, Icons.location_city, 'Sucursal', p.sucursal),
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

  Widget _chip(BuildContext context, IconData icon, String label, String value) {
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
                style: Theme.of(context)
                    .textTheme
                    .labelMedium
                    ?.copyWith(color: Colors.white, fontWeight: FontWeight.w600),
              ),
            ),
          ],
        ),
      ),
    );
  }

  /* ===================== Pestañas ===================== */

  Widget _buildPerfil(Paciente p) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
      children: [
        _infoCard(context, 'Datos generales', [
          _kv('Microchip', p.microchip),
          _kv('Sexo', p.sexo),
          _kv('Peso', p.peso),
          _kv('Fecha de nacimiento', p.fechaNac),
        ]),
        const SizedBox(height: 12),
        _infoCard(context, 'Propietario', [
          _kv('Nombre', p.propietario.nombre),
          _kv('Dirección', p.propietario.direccion),
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
              style: Theme.of(context)
                  .textTheme
                  .titleMedium
                  ?.copyWith(fontWeight: FontWeight.w800, color: _kPrimaryDark),
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

  Widget _buildVacunas(Paciente p) {
    final eventos = <DateTime, List<Vacuna>>{};
    for (final v in p.vacunas) {
      final fecha = _parseFechaCorta(v.fecha);
      if (fecha != null) {
        final key = DateTime(fecha.year, fecha.month, fecha.day);
        eventos.putIfAbsent(key, () => []).add(v);
      }
    }

    List<Vacuna> eventsOf(DateTime day) =>
        eventos[DateTime(day.year, day.month, day.day)] ?? [];

    return ListView(
      padding: const EdgeInsets.fromLTRB(12, 12, 12, 100),
      children: [
        Card(
          elevation: 0,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          child: Padding(
            padding: const EdgeInsets.all(8.0),
            child: TableCalendar<Vacuna>(
              firstDay: DateTime(DateTime.now().year - 2),
              lastDay: DateTime(DateTime.now().year + 2),
              focusedDay: _focusedDay,
              selectedDayPredicate: (day) =>
                  _selectedDay != null && isSameDay(_selectedDay, day),
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
          _emptyState('Selecciona un día para ver las vacunas aplicadas.', Icons.calendar_today),
        if (_selectedDay != null) ...[
          ...eventsOf(_selectedDay!).map(
            (v) => Card(
              color: Colors.green.shade50,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
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
            _emptyState('No hay vacunas registradas en este día.', Icons.inbox_outlined),
        ],
      ],
    );
  }

  Widget _buildDesparasitaciones(Paciente p) {
    if (p.desparasitaciones.isEmpty) {
      return _emptyState('Sin registros de desparasitación', Icons.inbox_outlined);
    }
    return ListView.separated(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
      itemBuilder: (_, i) {
        final d = p.desparasitaciones[i];
        return Card(
          elevation: 0,
          color: Colors.indigo.shade50,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          child: ListTile(
            leading: const Icon(Icons.shield, color: _kPrimary),
            title: Text(
              '${d.tipo}: ${d.producto}',
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(fontWeight: FontWeight.w700),
            ),
            subtitle: Text(d.fecha),
          ),
        );
      },
      separatorBuilder: (_, __) => const SizedBox(height: 8),
      itemCount: p.desparasitaciones.length,
    );
  }

  Widget _buildHistorial(Paciente p) {
    if (p.historial.isEmpty) {
      return _emptyState('Sin notas clínicas', Icons.note_alt_outlined);
    }
    return ListView.separated(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
      itemBuilder: (_, i) {
        final h = p.historial[i];
        return Card(
          elevation: 0,
          color: Colors.orange.shade50,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          child: ListTile(
            leading: const Icon(Icons.note_alt_outlined, color: Colors.deepOrange),
            title: Text(h.nota, maxLines: 2, overflow: TextOverflow.ellipsis),
            subtitle: Text(h.fecha),
            isThreeLine: true,
          ),
        );
      },
      separatorBuilder: (_, __) => const SizedBox(height: 8),
      itemCount: p.historial.length,
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
            Flexible(child: Text(msg, style: const TextStyle(color: Colors.blueGrey))),
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
