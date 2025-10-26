import 'package:flutter/material.dart';
import 'package:table_calendar/table_calendar.dart';

const _kPrimary = Color(0xFF2F76A6);
const _kPrimaryDark = Color(0xFF0E3A5C);
const _kBg = Color(0xFFF7F9FC);

const _h1 = TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: Colors.black87);
const _h2 = TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: Colors.black87);
const _body = TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Colors.black87);

RoundedRectangleBorder _surface16 = RoundedRectangleBorder(
  borderRadius: BorderRadius.circular(16),
);


class CitasPage extends StatelessWidget {
  const CitasPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _kBg,
      appBar: AppBar(
        title: const Text('Citas', style: TextStyle(fontWeight: FontWeight.w800)),
        centerTitle: true,
        elevation: 0,
        backgroundColor: _kBg,
        foregroundColor: Colors.black87,
      ),
      
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 120),
        children: const [
          _NextCard(),
          SizedBox(height: 12),
          _FiltersBar(),
          SizedBox(height: 12),
          _DateStrip(),
          SizedBox(height: 12),
          _DayGroup(
            title: '02/01/2025',
            items: [
              _ApptViewData(
                petInitial: 'L',
                petAndType: 'Luna • Consulta',
                dateTimeStr: '02/01/2025 • 09:00–09:30',
                clinic: 'Vet Centro Norte',
                status: 'Pendiente',
                statusColor: Colors.orange,
              ),
            ],
          ),
          SizedBox(height: 10),
          _DayGroup(
            title: '05/01/2025',
            items: [
              _ApptViewData(
                petInitial: 'R',
                petAndType: 'Rocky • Control',
                dateTimeStr: '05/01/2025 • 11:30–12:00',
                clinic: 'Vet Express',
                status: 'Confirmada',
                statusColor: Colors.green,
              ),
              _ApptViewData(
                petInitial: 'L',
                petAndType: 'Luna • Vacuna',
                dateTimeStr: '05/01/2025 • 16:00–16:30',
                clinic: 'Clínica Mascotitas',
                status: 'Pendiente',
                statusColor: Colors.orange,
              ),
            ],
          ),
          SizedBox(height: 10),
          _DayGroup(
            title: '12/12/2024',
            items: [
              _ApptViewData(
                petInitial: 'T',
                petAndType: 'Toby • Consulta',
                dateTimeStr: '12/12/2024 • 16:00–16:30',
                clinic: 'Vet Express',
                status: 'Cancelada',
                statusColor: Colors.red,
              ),
            ],
          ),
        ],
      ),
    );
  }
}

/// ====== Hero “Próxima cita” (estático) ======
class _NextCard extends StatelessWidget {
  const _NextCard();

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment(-1, -1), end: Alignment(1, .6),
          colors: [_kPrimaryDark, _kPrimary],
        ),
        borderRadius: BorderRadius.circular(18),
      ),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          children: [
            const CircleAvatar(
              radius: 26, backgroundColor: Colors.white,
              child: Text('L', style: TextStyle(color: _kPrimaryDark, fontWeight: FontWeight.w900, fontSize: 22)),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: const [
                Text('Próxima cita', style: TextStyle(color: Colors.white70, fontWeight: FontWeight.w700)),
                SizedBox(height: 2),
                Text('Luna • Consulta', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 16)),
                SizedBox(height: 2),
                Text('02/01/2025 • 09:00', style: TextStyle(color: Colors.white)),
                Text('Vet Centro Norte', style: TextStyle(color: Colors.white70, fontWeight: FontWeight.w600)),
              ]),
            ),
            const SizedBox(width: 8),
            Column(
              children: [
                _Pill(icon: Icons.hourglass_bottom, text: '3 d'),
                const SizedBox(height: 8),
                Row(children: [
                  _RoundBtn(icon: Icons.article_outlined, label: 'Indicaciones'),
                  SizedBox(width: 6),
                  _RoundBtn(icon: Icons.edit, label: 'Reagendar'),
                ]),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _Pill extends StatelessWidget {
  final IconData icon; final String text;
  const _Pill({required this.icon, required this.text});
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(999)),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        Icon(icon, size: 14, color: _kPrimaryDark),
        const SizedBox(width: 6),
        Text(text, style: const TextStyle(fontWeight: FontWeight.w900)),
      ]),
    );
  }
}

class _RoundBtn extends StatelessWidget {
  final IconData icon; final String label;
  const _RoundBtn({required this.icon, required this.label});
  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white, shape: const CircleBorder(), elevation: 1,
      child: InkWell(
        customBorder: const CircleBorder(),
        onTap: () => _toast(context, '$label (UI demo)'),
        child: Padding(padding: const EdgeInsets.all(8), child: Icon(icon, color: _kPrimaryDark)),
      ),
    );
  }
}

/// ====== Barra de filtros (solo visual) ======
class _FiltersBar extends StatelessWidget {
  const _FiltersBar();

  @override
  Widget build(BuildContext context) {
    return Column(
      children: const [
        _SearchBar(hint: 'Buscar clínica, mascota o fecha…'),
        SizedBox(height: 10),
        _Segment(title: 'Estado', chips: [
          _ChipStatic(text: 'Pendiente', color: Colors.orange),
          _ChipStatic(text: 'Confirmada', color: Colors.green),
          _ChipStatic(text: 'Cancelada', color: Colors.red),
        ]),
        SizedBox(height: 6),
        _Segment(title: 'Mascota', chips: [
          _ChipStatic(text: 'Luna', color: _kPrimary),
          _ChipStatic(text: 'Rocky', color: _kPrimary),
          _ChipStatic(text: 'Toby', color: _kPrimary),
        ]),
      ],
    );
  }
}

class _SearchBar extends StatelessWidget {
  final String hint;
  const _SearchBar({required this.hint});

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
          boxShadow: [BoxShadow(color: Colors.black.withOpacity(.05), blurRadius: 12, offset: const Offset(0, 6))],
        ),
        child: Row(
          children: [
            const SizedBox(width: 12),
            const Icon(Icons.search, color: _kPrimaryDark, size: 20),
            const SizedBox(width: 8),
            Expanded(
              child: Text(hint, style: const TextStyle(color: Colors.black38, fontWeight: FontWeight.w600)),
            ),
            IconButton(
              onPressed: () => _toast(context, 'Borrar búsqueda (UI demo)'),
              icon: const Icon(Icons.close_rounded, color: Colors.blueGrey),
              splashRadius: 18,
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
            child: Row(children: [
              const SizedBox(width: 4),
              ...chips.expand((w) => [w, const SizedBox(width: 8)]),
            ]),
          ),
        ),
      ],
    );
  }
}

class _ChipStatic extends StatelessWidget {
  final String text;
  final Color color;
  const _ChipStatic({required this.text, required this.color});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(999),
      onTap: () => _toast(context, '$text (UI demo)'),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: color.withOpacity(.12),
          borderRadius: BorderRadius.circular(999),
          border: Border.all(color: color.withOpacity(.6)),
        ),
        child: Row(mainAxisSize: MainAxisSize.min, children: [
          Icon(Icons.circle, size: 10, color: color),
          const SizedBox(width: 6),
          Text(text, style: TextStyle(fontWeight: FontWeight.w700, color: color.withOpacity(.95))),
        ]),
      ),
    );
  }
}

/// ====== DateStrip con table_calendar ======
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
            _toast(context, 'Día seleccionado: ${selectedDay.day}');
          },
          calendarStyle: CalendarStyle(
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

/// ====== Grupo por día (título + lista) ======
class _DayGroup extends StatelessWidget {
  final String title;
  final List<_ApptViewData> items;
  const _DayGroup({required this.title, required this.items});

  @override
  Widget build(BuildContext context) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Padding(
        padding: const EdgeInsets.only(left: 12, bottom: 6),
        child: Text(title, style: _h2),
      ),
      ...items.map((a) => Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: _ApptCardStatic(data: a),
          )),
    ]);
  }
}

/// ====== “Datos” planos para la tarjeta (sin modelo/clase) ======
class _ApptViewData {
  final String petInitial;
  final String petAndType;   // "Luna • Consulta"
  final String dateTimeStr;  // "02/01/2025 • 09:00–09:30"
  final String clinic;       // "Vet Centro Norte"
  final String status;       // "Pendiente"/"Confirmada"/"Cancelada"
  final Color statusColor;

  const _ApptViewData({
    required this.petInitial,
    required this.petAndType,
    required this.dateTimeStr,
    required this.clinic,
    required this.status,
    required this.statusColor,
  });
}

/// ====== Tarjeta estática con riel (sin lógica) ======
class _ApptCardStatic extends StatelessWidget {
  final _ApptViewData data;
  const _ApptCardStatic({required this.data});

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // riel
        Column(
          children: [
            Container(width: 10, height: 10, decoration: BoxDecoration(color: data.statusColor, shape: BoxShape.circle)),
            Container(width: 2, height: 68, margin: const EdgeInsets.only(top: 4), color: data.statusColor.withOpacity(.25)),
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
                    child: Text(data.petInitial, style: const TextStyle(color: _kPrimaryDark, fontWeight: FontWeight.w900)),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text(data.petAndType, style: _h2),
                      const SizedBox(height: 4),
                      Text(data.dateTimeStr, style: _body),
                      const SizedBox(height: 2),
                      Text(data.clinic, style: _body.copyWith(color: Colors.black54)),
                      const SizedBox(height: 8),
                      Row(children: [
                        _StatusChip(label: data.status, color: data.statusColor),
                        const SizedBox(width: 3),
                        TextButton.icon(
                          onPressed: () => _toast(context, 'Indicaciones (UI demo)'),
                          icon: const Icon(Icons.article_outlined, size: 18),
                          label: const Text('Indicaciones'),
                        ),
                      ]),
                    ]),
                  ),
                  PopupMenuButton<String>(
                    onSelected: (v) => _toast(context, v == 'edit' ? 'Editar (UI demo)' : 'Eliminar (UI demo)'),
                    itemBuilder: (ctx) => const [
                      PopupMenuItem(value: 'edit', child: Text('Editar')),
                      PopupMenuItem(value: 'delete', child: Text('Eliminar')),
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
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        Icon(
          label == 'Pendiente' ? Icons.hourglass_bottom :
          label == 'Confirmada' ? Icons.check_circle :
          Icons.cancel, size: 16, color: color,
        ),
        const SizedBox(width: 6),
        Text(label, style: TextStyle(color: color, fontWeight: FontWeight.w900)),
      ]),
    );
  }
}

/// ====== Utilidad para toasts simples ======
void _toast(BuildContext context, String msg) {
  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
}
