import 'package:flutter/material.dart';
import 'package:table_calendar/table_calendar.dart';
import 'formularioMascota.dart';

void main() {
  runApp(
    MaterialApp(
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
    ),
  );
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
    propietario: Propietario(
      nombre: "Ana López",
      direccion: "456 Calle B, Ciudad",
    ),
    edad: "5 años",
    ultimaVisita: "15 abr 2024",
    sucursal: "Central",
    microchip: "981020000123456",
    sexo: "H",
    peso: "4.5 kg",
    fechaNac: "2019-03-10",
    vacunas: [Vacuna("05 feb 2024", "LOT-AZ12", "Central", 1)],
    desparasitaciones: [
      Desparasitacion("Interna", "Albendazol", "10 ene 2024"),
    ],
    historial: [
      Historial(
        "15 abr 2024",
        "Consulta por control anual. Examen físico normal.",
      ),
    ],
    documentos: [Documento("PDF", "Constancia vacunación.pdf", "05 feb 2024")],
    etiquetas: ["Esterilizada", "Al día"],
  ),
  Paciente(
    id: 2,
    nombre: "Thor",
    especie: "Canino",
    raza: "Golden Retriever",
    propietario: Propietario(
      nombre: "Carlos Gómez",
      direccion: "Av. Alameda 120",
    ),
    edad: "3 años",
    ultimaVisita: "20 mar 2024",
    sucursal: "Oeste",
    microchip: "980000000001234",
    sexo: "M",
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
                    Row(
                      children: [
                        IconButton(
                          onPressed: () {
                            Navigator.pop(context);
                          },
                          icon: Icon(
                            Icons.arrow_back,
                            color: Colors.white,
                            size: 28,
                          ),
                        ),
                        const SizedBox(width: 4),
                        const Text(
                          'Volver',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 18,
                            fontWeight: FontWeight.w500,
                            fontFamily: 'Roboto',
                          ),
                        ),
                      ],
                    ),
                    SizedBox(width: 8),
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
                  child: ValueListenableBuilder<String>(
                    valueListenable: filtroNotifier,
                    builder: (context, filtro, _) {
                      return ValueListenableBuilder<String>(
                        valueListenable: queryNotifier,
                        builder: (context, query, _) {
                          final filtrados =
                              pacientes.where((p) {
                                final coincideEspecie =
                                    filtro == "Todas" || p.especie == filtro;
                                final coincideQuery =
                                    query.isEmpty ||
                                    p.nombre.toLowerCase().contains(
                                      query.toLowerCase(),
                                    ) ||
                                    p.propietario.nombre.toLowerCase().contains(
                                      query.toLowerCase(),
                                    );
                                return coincideEspecie && coincideQuery;
                              }).toList();

                          return Column(
                            children: [
                              Row(
                                children: [
                                  Expanded(
                                    child: TextField(
                                      decoration: const InputDecoration(
                                        labelText:
                                            "Buscar por nombre o propietario",
                                      ),
                                      onChanged: (v) => queryNotifier.value = v,
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  DropdownButton<String>(
                                    value: filtro,
                                    items:
                                        ["Todas", "Canino", "Felino"]
                                            .map(
                                              (e) => DropdownMenuItem(
                                                value: e,
                                                child: Text(e),
                                              ),
                                            )
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
                                        subtitle: Text(
                                          "${p.especie} / ${p.raza}\n${p.propietario.nombre}",
                                        ),
                                        onTap: () {
                                          Navigator.push(
                                            context,
                                            MaterialPageRoute(
                                              builder:
                                                  (_) => PacienteDetailScreen(
                                                    paciente: p,
                                                  ),
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
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
          Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => const FormularioMascota()),
          );
        },
        backgroundColor: const Color(0xFF2F76A6),
        foregroundColor: Colors.white,
        icon: const Icon(Icons.pets, size: 28),
        label: const Text(
          "Añadir Mascota",
          style: TextStyle(fontWeight: FontWeight.bold, fontFamily: 'Roboto'),
        ),
        elevation: 6,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
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
  late TabController tabController;

  @override
  void initState() {
    super.initState();
    tabController = TabController(length: 4, vsync: this);
  }

  @override
  Widget build(BuildContext context) {
    final seleccionado = widget.paciente;
    return Scaffold(
      appBar: AppBar(
        title: Text(seleccionado.nombre),
        backgroundColor: Colors.blue.shade100,
        elevation: 1,
        actions: [
          OutlinedButton(onPressed: () {}, child: const Text("Editar")),
        ],
        bottom: TabBar(
          controller: tabController,
          labelColor: Colors.blue,
          tabs: const [
            Tab(text: "Perfil"),
            Tab(text: "Vacunas"),
            Tab(text: "Desparasitación"),
            Tab(text: "Historial"),
          ],
        ),
      ),
      body: TabBarView(
        controller: tabController,
        children: [
          _buildPerfil(seleccionado),
          _buildVacunas(seleccionado),
          _buildDesparasitaciones(seleccionado),
          _buildHistorial(seleccionado),
        ],
      ),
    );
  }

  Widget _buildPerfil(Paciente p) {
    return Padding(
      padding: const EdgeInsets.all(8.0),
      child: ListView(
        children: [
          ListTile(title: const Text("Microchip"), subtitle: Text(p.microchip)),
          ListTile(title: const Text("Sexo"), subtitle: Text(p.sexo)),
          ListTile(title: const Text("Peso"), subtitle: Text(p.peso)),
          ListTile(title: const Text("Fecha Nac."), subtitle: Text(p.fechaNac)),
          ListTile(
            title: const Text("Propietario"),
            subtitle: Text(p.propietario.nombre),
          ),
          ListTile(
            title: const Text("Dirección"),
            subtitle: Text(p.propietario.direccion),
          ),
        ],
      ),
    );
  }

  Widget _buildVacunas(Paciente p) {
    final eventos = <DateTime, List<Vacuna>>{};
    for (final v in p.vacunas) {
      final partes = v.fecha.split(' ');
      if (partes.length == 3) {
        final dia = int.tryParse(partes[0]) ?? 1;
        final mes = _mesStrToInt(partes[1]);
        final anio = int.tryParse(partes[2]) ?? 2024;
        final fecha = DateTime(anio, mes, dia);
        eventos.putIfAbsent(fecha, () => []).add(v);
      }
    }

    DateTime focusedDay = DateTime.now();
    DateTime? selectedDay;

    return StatefulBuilder(
      builder: (context, setState) {
        return Column(
          children: [
            TableCalendar(
              firstDay: DateTime(DateTime.now().year - 2),
              lastDay: DateTime(DateTime.now().year + 2),
              focusedDay: focusedDay,
              selectedDayPredicate: (day) => isSameDay(selectedDay, day),
              calendarFormat: CalendarFormat.month,
              eventLoader: (day) => eventos[day] ?? [],
              onDaySelected: (selectedDay, focusedDay) {
                setState(() {
                  selectedDay = selectedDay;
                  focusedDay = focusedDay;
                });
              },
              calendarStyle: CalendarStyle(
                markerDecoration: BoxDecoration(
                  color: Colors.green.shade400,
                  shape: BoxShape.circle,
                ),
                todayDecoration: BoxDecoration(
                  color: Colors.blue.shade200,
                  shape: BoxShape.circle,
                ),
                selectedDecoration: BoxDecoration(
                  color: Colors.orange.shade400,
                  shape: BoxShape.circle,
                ),
              ),
              headerStyle: const HeaderStyle(
                formatButtonVisible: false,
                titleCentered: true,
              ),
            ),
            const SizedBox(height: 16),
            if (selectedDay != null && eventos[selectedDay] != null)
              ...eventos[selectedDay]!.map(
                (v) => Card(
                  color: Colors.green.shade50,
                  child: ListTile(
                    title: Text("${v.fecha} - ${v.lote}"),
                    subtitle: Text(
                      "${v.veterinaria} • Adjuntos: ${v.adjuntos}",
                    ),
                  ),
                ),
              ),
            if (selectedDay != null &&
                (eventos[selectedDay] == null || eventos[selectedDay]!.isEmpty))
              const Padding(
                padding: EdgeInsets.all(12.0),
                child: Text(
                  "No hay vacunas registradas en este día.",
                  style: TextStyle(color: Colors.grey),
                ),
              ),
            if (selectedDay == null)
              const Padding(
                padding: EdgeInsets.all(12.0),
                child: Text(
                  "Selecciona un día para ver detalles.",
                  style: TextStyle(color: Colors.grey),
                ),
              ),
          ],
        );
      },
    );
  }

  int _mesStrToInt(String mes) {
    switch (mes.toLowerCase()) {
      case 'ene':
        return 1;
      case 'feb':
        return 2;
      case 'mar':
        return 3;
      case 'abr':
        return 4;
      case 'may':
        return 5;
      case 'jun':
        return 6;
      case 'jul':
        return 7;
      case 'ago':
        return 8;
      case 'sep':
        return 9;
      case 'oct':
        return 10;
      case 'nov':
        return 11;
      case 'dic':
        return 12;
      default:
        return 1;
    }
  }

  Widget _buildDesparasitaciones(Paciente p) {
    if (p.desparasitaciones.isEmpty)
      return _empty("Sin registros de desparasitación");
    return ListView(
      children:
          p.desparasitaciones
              .map(
                (d) => ListTile(
                  title: Text("${d.tipo}: ${d.producto}"),
                  subtitle: Text(d.fecha),
                ),
              )
              .toList(),
    );
  }

  Widget _buildHistorial(Paciente p) {
    if (p.historial.isEmpty) return _empty("Sin notas clínicas");
    return ListView(
      children:
          p.historial
              .map(
                (h) => ListTile(title: Text(h.nota), subtitle: Text(h.fecha)),
              )
              .toList(),
    );
  }

  Widget _empty(String msg) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Text(msg, style: const TextStyle(color: Colors.grey)),
      ),
    );
  }
}
