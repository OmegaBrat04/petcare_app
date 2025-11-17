import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:table_calendar/table_calendar.dart';
import 'package:intl/intl.dart';
import 'package:petcare_app/App/Controlador/citas_controller.dart';
import 'package:petcare_app/App/Controlador/mascota_controller.dart';
import 'package:petcare_app/App/Controlador/veterinaria_controller.dart';
import 'package:petcare_app/App/Modelo/EstatusCita.dart';
import 'package:petcare_app/App/Modelo/Mascotas.dart';
import 'package:petcare_app/App/Modelo/Clinica.dart';

const _kPrimary = Color(0xFF2F76A6);
const _kPrimaryDark = Color(0xFF0E3A5C);
const _kBg = Color(0xFFF7F9FC);

const _h1 = TextStyle(
  fontSize: 22,
  fontWeight: FontWeight.w900,
  color: Colors.black87,
);
const _h2 = TextStyle(
  fontSize: 16,
  fontWeight: FontWeight.w800,
  color: Colors.black87,
);
const _body = TextStyle(
  fontSize: 14,
  fontWeight: FontWeight.w600,
  color: Colors.black87,
);

RoundedRectangleBorder _surface16 = RoundedRectangleBorder(
  borderRadius: BorderRadius.circular(16),
);

class CitasPage extends StatefulWidget {
  const CitasPage({super.key});

  @override
  State<CitasPage> createState() => _CitasPageState();
}

class _CitasPageState extends State<CitasPage> {
  String _query = '';

  List<Cita> _filterCitas(
    List<Cita> source,
    String q,
    List<Mascota> mascotas,
    List<Clinica> vets,
  ) {
    final query = q.trim().toLowerCase();
    if (query.isEmpty) return source;

    String petName(int id) {
      try {
        return mascotas.firstWhere((m) => m.idMascota == id).nombre;
      } catch (_) {
        return '';
      }
    }

    String vetName(int id) {
      try {
        return vets.firstWhere((v) => v.id == id).name;
      } catch (_) {
        return '';
      }
    }

    return source.where((c) {
      final pet = petName(c.mascotaId).toLowerCase();
      final vet = vetName(c.veterinariaId).toLowerCase();
      final fecha =
          DateFormat('dd/MM/yyyy').format(c.fechaPreferida).toLowerCase();
      return pet.contains(query) ||
          vet.contains(query) ||
          fecha.contains(query);
    }).toList();
  }

  Map<String, List<Cita>> _groupByDate(List<Cita> list) {
    final Map<String, List<Cita>> out = {};
    for (final c in list) {
      final key = DateFormat('dd/MM/yyyy').format(c.fechaPreferida);
      out.putIfAbsent(key, () => []).add(c);
    }
    return out;
  }

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<CitasController>().fetchCitas();
      final petCtrl = context.read<PetController>();
      if (petCtrl.pets.isEmpty) petCtrl.fetchPets();
      final vetCtrl = context.read<VeterinariaController>();
      if (vetCtrl.veterinarias.isEmpty) vetCtrl.fetchVeterinarias();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _kBg,
      appBar: AppBar(
        title: const Text(
          'Citas',
          style: TextStyle(fontWeight: FontWeight.w800),
        ),
        centerTitle: true,
        elevation: 0,
        backgroundColor: _kBg,
        foregroundColor: Colors.black87,
      ),
      body: Consumer3<CitasController, PetController, VeterinariaController>(
        builder: (context, citasCtrl, petCtrl, vetCtrl, _) {
          if (citasCtrl.loading) {
            return const Center(child: CircularProgressIndicator());
          }

          if (citasCtrl.error != null) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.error_outline, size: 64, color: Colors.red),
                  const SizedBox(height: 16),
                  Text(citasCtrl.error!, style: _body),
                  const SizedBox(height: 16),
                  ElevatedButton.icon(
                    onPressed: () => citasCtrl.fetchCitas(),
                    icon: const Icon(Icons.refresh),
                    label: const Text('Reintentar'),
                  ),
                ],
              ),
            );
          }

          final List<Mascota> mascotas =
              (petCtrl.pets.isNotEmpty ? petCtrl.pets : petCtrl.items)
                  .cast<Mascota>();
          final List<Clinica> veterinarias = vetCtrl.veterinarias;

          final filtradas = _filterCitas(
            citasCtrl.citas,
            _query,
            mascotas,
            veterinarias,
          );
          final citasPorFecha = _groupByDate(filtradas);

          Cita? proxima;
          if (filtradas.isNotEmpty) {
            final ahora = DateTime.now();
            final futuras =
                filtradas
                    .where(
                      (c) =>
                          (c.estatus == Estatus.pending ||
                              c.estatus == Estatus.confirmed) &&
                          c.fechaPreferida.isAfter(ahora),
                    )
                    .toList()
                  ..sort(
                    (a, b) => a.fechaPreferida.compareTo(b.fechaPreferida),
                  );
            if (futuras.isNotEmpty) proxima = futuras.first;
          }

          return RefreshIndicator(
            onRefresh: () => citasCtrl.fetchCitas(),
            child: ListView(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 120),
              children: [
                if (proxima != null)
                  _NextCard(
                    cita: proxima,
                    mascotas: mascotas,
                    veterinarias: veterinarias,
                  ),
                if (proxima != null) const SizedBox(height: 12),
                _FiltersBar(
                  query: _query,
                  onSearchChanged: (q) => setState(() => _query = q),
                ),
                const SizedBox(height: 12),
                const _DateStrip(),
                const SizedBox(height: 12),
                if (citasPorFecha.isEmpty)
                  const Center(
                    child: Padding(
                      padding: EdgeInsets.all(32),
                      child: Text('No hay citas registradas', style: _body),
                    ),
                  )
                else
                  ...citasPorFecha.entries.map((entry) {
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: _DayGroup(
                        title: entry.key,
                        citas: entry.value,
                        mascotas: mascotas,
                        veterinarias: veterinarias,
                      ),
                    );
                  }).toList(),
              ],
            ),
          );
        },
      ),
    );
  }
}

/// ====== Hero "Próxima cita" ======
class _NextCard extends StatelessWidget {
  final Cita cita;
  final List<Mascota> mascotas;
  final List<Clinica> veterinarias;
  const _NextCard({
    required this.cita,
    required this.mascotas,
    required this.veterinarias,
  });

  @override
  Widget build(BuildContext context) {
    final citasCtrl = context.read<CitasController>();
    final mascotaNombre = citasCtrl.getMascotaNombre(cita.mascotaId, mascotas);
    final vetNombre = citasCtrl.getVeterinariaNombre(
      cita.veterinariaId,
      veterinarias,
    );
    final inicial = citasCtrl.getPetInitial(cita.mascotaId, mascotas);
    final diasFaltantes = cita.fechaPreferida.difference(DateTime.now()).inDays;

    return Container(
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment(-1, -1),
          end: Alignment(1, .6),
          colors: [_kPrimaryDark, _kPrimary],
        ),
        borderRadius: BorderRadius.circular(18),
      ),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          children: [
            CircleAvatar(
              radius: 26,
              backgroundColor: Colors.white,
              child: Text(
                inicial,
                style: const TextStyle(
                  color: _kPrimaryDark,
                  fontWeight: FontWeight.w900,
                  fontSize: 22,
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Próxima cita',
                    style: TextStyle(
                      color: Colors.white70,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    '$mascotaNombre • Consulta',
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w900,
                      fontSize: 16,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    DateFormat(
                      'dd/MM/yyyy • HH:mm',
                    ).format(cita.horarioConfirmado ?? cita.fechaPreferida),
                    style: const TextStyle(color: Colors.white),
                  ),
                  Text(
                    vetNombre,
                    style: const TextStyle(
                      color: Colors.white70,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            Column(
              children: [
                _Pill(icon: Icons.hourglass_bottom, text: '$diasFaltantes d'),
                const SizedBox(height: 8),
                Row(
                  children: [
                    _RoundBtn(
                      icon: Icons.article_outlined,
                      label: 'Indicaciones',
                      onTap: () => _showNotas(context, cita),
                    ),
                    const SizedBox(width: 6),
                    _RoundBtn(
                      icon: Icons.edit,
                      label: 'Reagendar',
                      onTap: () => _toast(context, 'Reagendar (próximamente)'),
                    ),
                  ],
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _Pill extends StatelessWidget {
  final IconData icon;
  final String text;
  const _Pill({required this.icon, required this.text});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: _kPrimaryDark),
          const SizedBox(width: 6),
          Text(text, style: const TextStyle(fontWeight: FontWeight.w900)),
        ],
      ),
    );
  }
}

class _RoundBtn extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  const _RoundBtn({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      shape: const CircleBorder(),
      elevation: 1,
      child: InkWell(
        customBorder: const CircleBorder(),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(8),
          child: Icon(icon, color: _kPrimaryDark),
        ),
      ),
    );
  }
}

/// ====== Grupo por día ======
class _DayGroup extends StatelessWidget {
  final String title;
  final List<Cita> citas;
  final List<Mascota> mascotas;
  final List<Clinica> veterinarias;
  const _DayGroup({
    required this.title,
    required this.citas,
    required this.mascotas,
    required this.veterinarias,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 12, bottom: 6),
          child: Text(title, style: _h2),
        ),
        ...citas.map(
          (c) => Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: _ApptCard(
              cita: c,
              mascotas: mascotas,
              veterinarias: veterinarias,
            ),
          ),
        ),
      ],
    );
  }
}

/// ====== Tarjeta de cita ======
class _ApptCard extends StatelessWidget {
  final Cita cita;
  final List<Mascota> mascotas;
  final List<Clinica> veterinarias;
  const _ApptCard({
    required this.cita,
    required this.mascotas,
    required this.veterinarias,
  });

  @override
  Widget build(BuildContext context) {
    final citasCtrl = context.read<CitasController>();
    final mascotaNombre = citasCtrl.getMascotaNombre(cita.mascotaId, mascotas);
    final vetNombre = citasCtrl.getVeterinariaNombre(
      cita.veterinariaId,
      veterinarias,
    );
    final inicial = citasCtrl.getPetInitial(cita.mascotaId, mascotas);
    final horaStr = DateFormat(
      'HH:mm',
    ).format(cita.horarioConfirmado ?? cita.fechaPreferida);

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Column(
          children: [
            Container(
              width: 10,
              height: 10,
              decoration: BoxDecoration(
                color: cita.statusColor,
                shape: BoxShape.circle,
              ),
            ),
            Container(
              width: 2,
              height: 68,
              margin: const EdgeInsets.only(top: 4),
              color: cita.statusColor.withOpacity(.25),
            ),
          ],
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Card(
            elevation: 0,
            color: Colors.white,
            shape: _surface16,
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Row(
                children: [
                  CircleAvatar(
                    backgroundColor: _kPrimary.withOpacity(.12),
                    child: Text(
                      inicial,
                      style: const TextStyle(
                        color: _kPrimaryDark,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('$mascotaNombre • Consulta', style: _h2),
                        const SizedBox(height: 4),
                        Text(
                          '${DateFormat('dd/MM/yyyy').format(cita.fechaPreferida)} • $horaStr',
                          style: _body,
                        ),
                        const SizedBox(height: 2),
                        Text(
                          vetNombre,
                          style: _body.copyWith(color: Colors.black54),
                        ),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            _StatusChip(
                              label: cita.statusLabel,
                              color: cita.statusColor,
                            ),
                            const SizedBox(width: 3),
                            TextButton.icon(
                              onPressed: () => _showNotas(context, cita),
                              icon: const Icon(
                                Icons.article_outlined,
                                size: 18,
                              ),
                              label: const Text('Indicaciones'),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  PopupMenuButton<String>(
                    onSelected: (v) => _handleMenu(context, v, cita),
                    itemBuilder:
                        (ctx) => const [
                          PopupMenuItem(
                            value: 'reschedule',
                            child: Text('Reagendar'),
                          ),
                          PopupMenuItem(
                            value: 'cancel',
                            child: Text('Cancelar'),
                          ),
                        ],
                    child: const Icon(Icons.more_horiz),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _StatusChip extends StatelessWidget {
  final String label;
  final Color color;
  const _StatusChip({required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
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
            style: TextStyle(color: color, fontWeight: FontWeight.w900),
          ),
        ],
      ),
    );
  }
}

/// ====== Barra de filtros ======
class _FiltersBar extends StatelessWidget {
  final String query;
  final ValueChanged<String> onSearchChanged;
  const _FiltersBar({required this.query, required this.onSearchChanged});
  @override
  Widget build(BuildContext context) {
    return Consumer2<CitasController, PetController>(
      builder: (context, citasCtrl, petCtrl, _) {
        return Column(
          children: [
            _SearchBar(
              hint: 'Buscar clínica, mascota o fecha…',
              text: query,
              onChanged: onSearchChanged,
              onClear: () => onSearchChanged(''),
            ),
            const SizedBox(height: 10),
            _Segment(
              title: 'Estado',
              chips: [
                _ChipFilter(
                  text: 'Pendiente',
                  color: Colors.orange,
                  active: citasCtrl.statusFilter == 'pending',
                  onTap:
                      () => citasCtrl.setStatusFilter(
                        citasCtrl.statusFilter == 'pending' ? null : 'pending',
                      ),
                ),
                _ChipFilter(
                  text: 'Confirmada',
                  color: Colors.green,
                  active: citasCtrl.statusFilter == 'confirmed',
                  onTap:
                      () => citasCtrl.setStatusFilter(
                        citasCtrl.statusFilter == 'confirmed'
                            ? null
                            : 'confirmed',
                      ),
                ),
                _ChipFilter(
                  text: 'Cancelada',
                  color: Colors.red,
                  active: citasCtrl.statusFilter == 'cancelled',
                  onTap:
                      () => citasCtrl.setStatusFilter(
                        citasCtrl.statusFilter == 'cancelled'
                            ? null
                            : 'cancelled',
                      ),
                ),
              ],
            ),
            const SizedBox(height: 6),
            _Segment(
              title: 'Mascota',
              chips:
                  petCtrl.pets.map((pet) {
                    return _ChipFilter(
                      text: pet.nombre,
                      color: _kPrimary,
                      active: citasCtrl.mascotaFilter == pet.idMascota,
                      onTap:
                          () => citasCtrl.setMascotaFilter(
                            citasCtrl.mascotaFilter == pet.idMascota
                                ? null
                                : pet.idMascota,
                          ),
                    );
                  }).toList(),
            ),
          ],
        );
      },
    );
  }
}

class _SearchBar extends StatefulWidget {
  final String hint;
  final String text;
  final ValueChanged<String> onChanged;
  final VoidCallback onClear;
  const _SearchBar({
    required this.hint,
    required this.text,
    required this.onChanged,
    required this.onClear,
  });

  @override
  State<_SearchBar> createState() => _SearchBarState();
}

class _SearchBarState extends State<_SearchBar> {
  late final TextEditingController _ctl;

  @override
  void initState() {
    super.initState();
    _ctl = TextEditingController(text: widget.text);
    _ctl.addListener(() => widget.onChanged(_ctl.text));
  }

  @override
  void didUpdateWidget(covariant _SearchBar oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.text != widget.text && _ctl.text != widget.text) {
      _ctl.text = widget.text;
      _ctl.selection = TextSelection.fromPosition(
        TextPosition(offset: _ctl.text.length),
      );
    }
  }

  @override
  void dispose() {
    _ctl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(14),
      child: Container(
        height: 46,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: Colors.black12),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(.05),
              blurRadius: 12,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: Row(
          children: [
            const SizedBox(width: 12),
            const Icon(Icons.search, color: _kPrimaryDark, size: 20),
            const SizedBox(width: 8),
            Expanded(
              child: TextField(
                controller: _ctl,
                decoration: InputDecoration(
                  hintText: widget.hint,
                  border: InputBorder.none,
                  isCollapsed: true,
                ),
                style: const TextStyle(
                  color: Colors.black87,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
            IconButton(
              onPressed: () {
                _ctl.clear();
                widget.onClear();
              },
              icon: const Icon(Icons.close_rounded, color: Colors.blueGrey),
              splashRadius: 18,
              tooltip: 'Limpiar',
            ),
          ],
        ),
      ),
    );
  }
}

class _Segment extends StatelessWidget {
  final String title;
  final List<Widget> chips;
  const _Segment({required this.title, required this.chips});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Text('$title: ', style: _body.copyWith(color: Colors.black54)),
        Expanded(
          child: SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                const SizedBox(width: 4),
                ...chips.expand((w) => [w, const SizedBox(width: 8)]),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _ChipFilter extends StatelessWidget {
  final String text;
  final Color color;
  final bool active;
  final VoidCallback onTap;
  const _ChipFilter({
    required this.text,
    required this.color,
    required this.active,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(999),
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: active ? color : color.withOpacity(.12),
          borderRadius: BorderRadius.circular(999),
          border: Border.all(color: color.withOpacity(.6)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.circle, size: 10, color: active ? Colors.white : color),
            const SizedBox(width: 6),
            Text(
              text,
              style: TextStyle(
                fontWeight: FontWeight.w700,
                color: active ? Colors.white : color.withOpacity(.95),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _DateStrip extends StatefulWidget {
  const _DateStrip();

  @override
  State<_DateStrip> createState() => _DateStripState();
}

class _DateStripState extends State<_DateStrip> {
  DateTime _selectedDay = DateTime.now();
  DateTime _focusedDay = DateTime.now();

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 0,
      color: Colors.white,
      shape: _surface16,
      child: Padding(
        padding: const EdgeInsets.all(8),
        child: TableCalendar<dynamic>(
          firstDay: DateTime.utc(2020, 1, 1),
          lastDay: DateTime.utc(2030, 12, 31),
          focusedDay: _focusedDay,
          selectedDayPredicate: (day) => isSameDay(_selectedDay, day),
          calendarFormat: CalendarFormat.week,
          onDaySelected: (selectedDay, focusedDay) {
            setState(() {
              _selectedDay = selectedDay;
              _focusedDay = focusedDay;
            });
          },
          calendarStyle: const CalendarStyle(
            selectedDecoration: BoxDecoration(
              color: _kPrimary,
              shape: BoxShape.circle,
            ),
            todayDecoration: BoxDecoration(
              color: _kPrimaryDark,
              shape: BoxShape.circle,
            ),
          ),
        ),
      ),
    );
  }
}

void _toast(BuildContext context, String msg) {
  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
}

void _showNotas(BuildContext context, Cita cita) {
  showDialog(
    context: context,
    builder:
        (ctx) => AlertDialog(
          title: const Text('Indicaciones'),
          content: Text(
            cita.notas?.isNotEmpty == true ? cita.notas! : 'Sin indicaciones',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Cerrar'),
            ),
          ],
        ),
  );
}

void _handleMenu(BuildContext context, String action, Cita cita) async {
  final citasCtrl = context.read<CitasController>();

  switch (action) {
    case 'reschedule':
      // Elegir fecha
      final pickedDate = await showDatePicker(
        context: context,
        initialDate: cita.horarioConfirmado ?? cita.fechaPreferida,
        firstDate: DateTime.now().subtract(const Duration(days: 0)),
        lastDate: DateTime.now().add(const Duration(days: 365 * 2)),
      );
      if (pickedDate == null) return;

      final pickedTime = await showTimePicker(
        context: context,
        initialTime: TimeOfDay.fromDateTime(
          cita.horarioConfirmado ?? cita.fechaPreferida,
        ),
      );

      DateTime newDateTime = DateTime(
        pickedDate.year,
        pickedDate.month,
        pickedDate.day,
        (pickedTime?.hour ?? 9),
        (pickedTime?.minute ?? 0),
      );

      final ok = await citasCtrl.reagendar(cita.id, newDateTime);
      _toast(context, ok ? 'Cita reagendada' : 'No se pudo reagendar');
      break;

    case 'cancel':
      final ok = await citasCtrl.updateStatus(cita.id, 'cancelled');
      _toast(context, ok ? 'Cita cancelada' : 'Error al cancelar');
      break;
  }
}
