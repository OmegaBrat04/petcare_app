import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'package:flutter/services.dart';
import 'package:petcare_app/App/Controlador/citas_controller.dart';
import 'package:petcare_app/App/Modelo/EstatusCita.dart';
import 'package:petcare_app/App/Modelo/Mascotas.dart';
import 'package:petcare_app/App/Modelo/Clinica.dart';

const _kPrimary = Color(0xFF2F76A6);
const _kPrimaryDark = Color(0xFF0E3A5C);

class ProximaCitaCard extends StatelessWidget {
  final Cita cita;
  final List<Mascota> mascotas;
  final List<Clinica> veterinarias;
  const ProximaCitaCard({
    super.key,
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
    final target = cita.horarioConfirmado ?? cita.fechaPreferida;
    final diasLabel =
        cita.horarioConfirmado == null
            ? 'Sin horario'
            : _diasRestantesLabel(target);

    final fechaStr = DateFormat('dd/MM/yyyy').format(target);
    final horaStr =
        cita.horarioConfirmado != null
            ? DateFormat('HH:mm').format(cita.horarioConfirmado!)
            : (cita.horaPreferida ?? '--:--');

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
                    '$fechaStr • $horaStr',
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
                _Pill(icon: Icons.hourglass_bottom, text: diasLabel),
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
                      onTap: () => _reschedule(context, cita),
                    ),
                    if (cita.estatus == Estatus.pending)
                      Padding(
                        padding: const EdgeInsets.only(left: 6),
                        child: _RoundBtn(
                          icon: Icons.check_circle,
                          label: 'Confirmar',
                          onTap: () => _confirmar(context, cita),
                        ),
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

  String _diasRestantesLabel(DateTime target) {
    final now = DateTime.now();
    final diff = target.difference(now);

    if (diff.inMinutes < 0) return 'Vencida';
    if (diff.inDays == 0) {
      if (diff.inHours <= 0) return 'Menos de 1h';
      if (diff.inHours < 6) return '${diff.inMinutes ~/ 30 * 30} min';
      if (diff.inHours < 12) return '${diff.inHours} h';
      return 'Hoy';
    }
    if (diff.inDays == 1) return 'Mañana';

    // Redondeo hacia arriba para días (si quedan horas extra se cuenta otro día)
    final totalDias = (diff.inHours / 24).ceil();
    return 'En $totalDias d';
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

void _reschedule(BuildContext context, Cita cita) async {
  final citasCtrl = context.read<CitasController>();
  final messenger = ScaffoldMessenger.of(context);

  final pickedDate = await showDatePicker(
    context: context,
    initialDate: cita.horarioConfirmado ?? cita.fechaPreferida,
    firstDate: DateTime.now(),
    lastDate: DateTime.now().add(const Duration(days: 365 * 2)),
  );
  if (pickedDate == null) return;

  final pickedTime = await showTimePicker(
    context: context,
    initialTime: TimeOfDay.fromDateTime(
      cita.horarioConfirmado ?? cita.fechaPreferida,
    ),
  );
  if (pickedTime == null) return;

  final newDateTime = DateTime(
    pickedDate.year,
    pickedDate.month,
    pickedDate.day,
    pickedTime.hour,
    pickedTime.minute,
  );

  final ok = await citasCtrl.reagendarPreferencia(cita.id, newDateTime);
  _toast(messenger, ok ? 'Cita reagendada' : 'Error al reagendar');
  if (ok) _sendPrefTimeNotice(messenger);
}

void _sendPrefTimeNotice(ScaffoldMessengerState? messenger) {
  messenger?.showSnackBar(
    SnackBar(
      backgroundColor: Colors.green.shade700,
      duration: const Duration(seconds: 4),
      content: Row(
        children: const [
          Icon(Icons.send, color: Colors.white),
          SizedBox(width: 12),
          Expanded(
            child: Text(
              'Tu horario preferido se envió al médico veterinario.',
              style: TextStyle(fontWeight: FontWeight.w700),
            ),
          ),
        ],
      ),
    ),
  );
}

void _confirmar(BuildContext context, Cita cita) async {
  final citasCtrl = context.read<CitasController>();
  final messenger = ScaffoldMessenger.maybeOf(context);
  if (cita.horarioConfirmado == null) {
    _toast(messenger, 'Primero asigna un horario (Reagendar).');
    return;
  }
  final fecha = DateFormat('dd/MM/yyyy').format(cita.horarioConfirmado!);
  final hora = DateFormat('HH:mm').format(cita.horarioConfirmado!);
  final okDialog = await showDialog<bool>(
    context: context,
    builder:
        (ctx) => AlertDialog(
          title: const Text('Confirmar cita'),
          content: Text('¿Confirmar la cita para el $fecha a las $hora?'),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('Reagendar'),
            ),
            ElevatedButton(
              onPressed: () => Navigator.pop(ctx, true),
              child: const Text('Confirmar'),
            ),
          ],
        ),
  );
  if (okDialog == true) {
    final ok = await citasCtrl.updateStatus(cita.id, 'confirmed');
    _toast(messenger, ok ? 'Cita confirmada' : 'Error al confirmar');
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

void _showNotas(BuildContext context, Cita cita) {
  final texto =
      (cita.notas != null && cita.notas!.trim().isNotEmpty)
          ? cita.notas!.trim()
          : 'No hay Notas para esta cita.';
  showDialog(
    context: context,
    barrierColor: Colors.black54,
    builder:
        (ctx) => Dialog(
          insetPadding: const EdgeInsets.symmetric(
            horizontal: 24,
            vertical: 40,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(24),
          ),
          child: Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(24),
              gradient: const LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [_kPrimaryDark, _kPrimary],
              ),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const SizedBox(height: 18),
                CircleAvatar(
                  radius: 30,
                  backgroundColor: Colors.white,
                  child: Icon(
                    Icons.article_outlined,
                    color: _kPrimaryDark,
                    size: 30,
                  ),
                ),
                const SizedBox(height: 12),
                const Text(
                  'Notas',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 20,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 8),
                Flexible(
                  child: Container(
                    width: double.infinity,
                    margin: const EdgeInsets.fromLTRB(16, 8, 16, 12),
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(.90),
                      borderRadius: BorderRadius.circular(18),
                    ),
                    child: SingleChildScrollView(
                      child: Text(
                        texto,
                        style: TextStyle(
                          color: Colors.grey.shade800,
                          fontSize: 15,
                          height: 1.35,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ),
                ),
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    TextButton.icon(
                      onPressed: () {
                        Clipboard.setData(ClipboardData(text: texto));
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('Copiado al portapapeles'),
                          ),
                        );
                      },
                      icon: const Icon(Icons.copy, size: 18),
                      label: const Text('Copiar'),
                      style: TextButton.styleFrom(
                        foregroundColor: Colors.white,
                      ),
                    ),
                    const SizedBox(width: 4),
                    TextButton.icon(
                      onPressed: () => Navigator.pop(ctx),
                      icon: const Icon(Icons.close, size: 18),
                      label: const Text('Cerrar'),
                      style: TextButton.styleFrom(
                        foregroundColor: Colors.white,
                      ),
                    ),
                    const SizedBox(width: 12),
                  ],
                ),
                const SizedBox(height: 6),
              ],
            ),
          ),
        ),
  );
}

void _toast(ScaffoldMessengerState? messenger, String msg) {
  messenger?.showSnackBar(
    SnackBar(content: Text(msg), backgroundColor: Colors.black87),
  );
}
