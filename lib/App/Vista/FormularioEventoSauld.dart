import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter/services.dart';
import 'package:petcare_app/App/Controlador/mascota_controller.dart';
import 'package:petcare_app/App/Modelo/Mascotas.dart';

class FormularioEventoSalud extends StatefulWidget {
  final Mascota mascota;
  const FormularioEventoSalud({super.key, required this.mascota});
  @override
  State<FormularioEventoSalud> createState() => _FormularioEventoSaludState();
}

class _FormularioEventoSaludState extends State<FormularioEventoSalud> {
  final _formKey = GlobalKey<FormState>();
  String tipo = 'vacuna';
  DateTime? fecha;
  final productoCtrl = TextEditingController();
  final loteCtrl = TextEditingController();
  final vetCtrl = TextEditingController();
  final notasCtrl = TextEditingController();
  int? regularidadMeses; // 3,6,12,24
  bool loading = false;

  @override
  void dispose() {
    productoCtrl.dispose();
    loteCtrl.dispose();
    vetCtrl.dispose();
    notasCtrl.dispose();
    super.dispose();
  }

  Future<void> _pickDate() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: fecha ?? now,
      firstDate: DateTime(now.year - 5),
      lastDate: DateTime(now.year + 2),
    );
    if (picked != null) setState(() => fecha = picked);
  }

  Future<void> _save() async {
    HapticFeedback.lightImpact();
    if (!_formKey.currentState!.validate()) return;
    if (fecha == null) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Selecciona la fecha')));
      return;
    }
    setState(() => loading = true);
    final ctrl = context.read<PetController>();
    final err = await ctrl.crearEventoSalud(
      mascotaId: widget.mascota.idMascota,
      tipo: tipo,
      fecha: fecha!,
      producto: productoCtrl.text.trim(),
      lote: tipo == 'vacuna' ? loteCtrl.text.trim() : null,
      veterinaria: vetCtrl.text.trim().isEmpty ? null : vetCtrl.text.trim(),
      regularidadMeses: regularidadMeses,
      notas: notasCtrl.text.trim(),
    );
    setState(() => loading = false);
    if (err == null) {
      Navigator.pop(context, true);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(err)));
    }
  }

  // ...existing code...
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent, // evita blanco de fondo
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFF0E3A5C), Color(0xFF2F76A6)],
          ),
        ),
        child: SafeArea(
          child: LayoutBuilder(
            builder: (ctx, constraints) {
              return SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
                physics: const BouncingScrollPhysics(),
                child: ConstrainedBox(
                  constraints: BoxConstraints(
                    minHeight: constraints.maxHeight, // estira hasta el fondo
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          IconButton(
                            icon: const Icon(
                              Icons.arrow_back_ios_new_rounded,
                              color: Colors.white,
                              size: 28,
                            ),
                            onPressed: () => Navigator.pop(context),
                            tooltip: 'Regresar',
                          ),
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
                              child: const Icon(
                                Icons.medical_information,
                                color: Color(0xFF2F76A6),
                                size: 30,
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          const Text(
                            'Registro Salud',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 22,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 24),
                      // Card formulario
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(18),
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
                        child: Form(
                          key: _formKey,
                          child: Column(
                            children: [
                              DropdownButtonFormField<String>(
                                value: tipo,
                                decoration: const InputDecoration(
                                  labelText: 'Tipo',
                                ),
                                items: const [
                                  DropdownMenuItem(
                                    value: 'vacuna',
                                    child: Text('Vacuna'),
                                  ),
                                  DropdownMenuItem(
                                    value: 'desparasitacion',
                                    child: Text('Desparasitación'),
                                  ),
                                ],
                                onChanged: (v) => setState(() => tipo = v!),
                              ),
                              const SizedBox(height: 16),
                              TextFormField(
                                controller: productoCtrl,
                                decoration: const InputDecoration(
                                  labelText: 'Producto',
                                ),
                                validator:
                                    (v) =>
                                        v == null || v.trim().isEmpty
                                            ? 'Ingresa el producto'
                                            : null,
                              ),
                              const SizedBox(height: 16),
                              if (tipo == 'vacuna')
                                TextFormField(
                                  controller: loteCtrl,
                                  decoration: const InputDecoration(
                                    labelText: 'Lote',
                                  ),
                                ),
                              if (tipo == 'vacuna') const SizedBox(height: 16),
                              TextFormField(
                                controller: vetCtrl,
                                decoration: const InputDecoration(
                                  labelText: 'Veterinaria (opcional)',
                                ),
                              ),
                              const SizedBox(height: 16),
                              DropdownButtonFormField<int>(
                                value: regularidadMeses,
                                decoration: const InputDecoration(
                                  labelText: 'Regularidad (opcional)',
                                ),
                                hint: const Text('Selecciona intervalo'),
                                items: const [
                                  DropdownMenuItem(
                                    value: 3,
                                    child: Text('Cada 3 meses'),
                                  ),
                                  DropdownMenuItem(
                                    value: 6,
                                    child: Text('Cada 6 meses'),
                                  ),
                                  DropdownMenuItem(
                                    value: 12,
                                    child: Text('Cada 1 año'),
                                  ),
                                  DropdownMenuItem(
                                    value: 24,
                                    child: Text('Cada 2 años'),
                                  ),
                                ],
                                onChanged:
                                    (v) => setState(() => regularidadMeses = v),
                              ),
                              const SizedBox(height: 16),
                              TextFormField(
                                controller: notasCtrl,
                                maxLines: 3,
                                decoration: const InputDecoration(
                                  labelText: 'Notas (opcional)',
                                ),
                              ),
                              const SizedBox(height: 16),
                              // Fecha
                              TextFormField(
                                readOnly: true,
                                onTap: _pickDate,
                                decoration: InputDecoration(
                                  labelText: 'Fecha de aplicación',
                                  suffixIcon: const Icon(
                                    Icons.calendar_today_rounded,
                                  ),
                                  hintText:
                                      fecha != null
                                          ? fecha!
                                              .toIso8601String()
                                              .split('T')
                                              .first
                                          : 'Selecciona la fecha',
                                ),
                                validator:
                                    (v) =>
                                        fecha == null
                                            ? 'Selecciona la fecha'
                                            : null,
                              ),
                              const SizedBox(height: 32),
                              ElevatedButton(
                                onPressed: loading ? null : _save,
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: const Color(0xFF2F76A6),
                                  foregroundColor: Colors.white,
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(14),
                                  ),
                                  textStyle: const TextStyle(
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                                child:
                                    loading
                                        ? const CircularProgressIndicator(
                                          color: Colors.white,
                                        )
                                        : const Text('Guardar'),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
      ),
    );
  }
}
