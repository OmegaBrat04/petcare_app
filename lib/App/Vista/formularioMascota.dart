import 'dart:io';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:petcare_app/App/Controlador/mascota_controller.dart';

class FormularioMascota extends StatefulWidget {
  const FormularioMascota({super.key});

  @override
  State<FormularioMascota> createState() => _FormularioMascotaState();
}

class _FormularioMascotaState extends State<FormularioMascota> {
  final formKey = GlobalKey<FormState>();
  final nombreCtrl = TextEditingController();
  final razaCtrl = TextEditingController();
  final pesoCtrl = TextEditingController();
  final edadCtrl = TextEditingController();
  final fechaNacimientoCtrl = TextEditingController();
  DateTime? fechaNacimientoSelected;
  String especie = 'Perro';
  String sexo = 'M';
  File? _image;
  final ImagePicker _picker = ImagePicker();
  bool loading = false;
  Future<void> _pickImage() async {
    final XFile? pickedFile = await _picker.pickImage(
      source: ImageSource.gallery,
      imageQuality: 85,
      maxWidth: 1024,
    );
    if (pickedFile != null) {
      setState(() {
        _image = File(pickedFile.path);
      });
    }
  }

  int _calculateAgeYears(DateTime birthDate) {
    final now = DateTime.now();
    int years = now.year - birthDate.year;
    if (now.month < birthDate.month ||
        (now.month == birthDate.month && now.day < birthDate.day)) {
      years--;
    }
    return years;
  }

  Future<void> _selectDate(BuildContext context) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: fechaNacimientoSelected ?? DateTime.now(),
      firstDate: DateTime(1990),
      lastDate: DateTime.now(),
    );
    if (picked != null && picked != fechaNacimientoSelected) {
      setState(() {
        fechaNacimientoSelected = picked;
        fechaNacimientoCtrl.text =
            '${picked.year}-${picked.month.toString().padLeft(2, '0')}-${picked.day.toString().padLeft(2, '0')}';
        final age = _calculateAgeYears(picked);
        edadCtrl.text = age.toString();
      });
    }
  }

  @override
  void initState() {
    super.initState();
    fechaNacimientoCtrl.text = '';
    edadCtrl.text = '';
  }

  @override
  void dispose() {
    nombreCtrl.dispose();
    razaCtrl.dispose();
    pesoCtrl.dispose();
    edadCtrl.dispose();
    fechaNacimientoCtrl.dispose();
    super.dispose();
  }

  Future<void> _onSavePet() async {
    HapticFeedback.lightImpact();
    if (!formKey.currentState!.validate()) return;
    if (_image == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Por favor, selecciona una foto para la mascota.'),
        ),
      );
      return;
    }

    // Asegurar edad: si no hay edad en el controlador pero hay fecha, calcularla
    int? edadInt;
    final edadText = edadCtrl.text.trim();
    if (edadText.isNotEmpty) {
      edadInt = int.tryParse(edadText);
    } else if (fechaNacimientoSelected != null) {
      edadInt = _calculateAgeYears(fechaNacimientoSelected!);
      edadCtrl.text = edadInt.toString();
    }

    debugPrint(
      'DEBUG antes de enviar -> edadCtrl: "${edadCtrl.text}", edadInt: $edadInt, fechaNacimientoSelected: $fechaNacimientoSelected',
    );

    if (edadInt == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'La edad debe ser un número entero. Selecciona fecha de nacimiento o escribe la edad.',
          ),
        ),
      );
      return;
    }

    final petData = {
      'nombre': nombreCtrl.text.trim(),
      'especie': especie,
      'raza': razaCtrl.text.trim().isEmpty ? '' : razaCtrl.text.trim(),
      'sexo': sexo,
      'peso': pesoCtrl.text.trim().isEmpty ? '' : pesoCtrl.text.trim(),
      // Fecha en formato YYYY-MM-DD (lo que tu backend espera)
      'fechaNacimiento':
          fechaNacimientoSelected != null
              ? fechaNacimientoSelected!.toIso8601String().split('T').first
              : fechaNacimientoCtrl.text.trim(),
      'edad': edadInt.toString(),
    };

    debugPrint('DEBUG petData a enviar: $petData');

    final mascotaController = Provider.of<PetController>(
      context,
      listen: false,
    );
    setState(() => loading = true);

    final errorMessage = await mascotaController.addPet(
      photo: _image!,
      petData: petData,
    );

    setState(() => loading = false);

    if (errorMessage == null) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Mascota guardada correctamente')),
        );
        Navigator.of(context).pop(true);
      }
    } else {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(errorMessage)));
      }
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
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
            child: Column(
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
                      'Registrar Mascota',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 22,
                        fontWeight: FontWeight.w800,
                        fontFamily: 'Roboto',
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 24),
                GestureDetector(
                  onTap: _pickImage,
                  child: Container(
                    width: 120,
                    height: 120,
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.9),
                      shape: BoxShape.circle,
                      border: Border.all(color: Colors.white, width: 3),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.2),
                          blurRadius: 8,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: ClipOval(
                      child:
                          _image != null
                              ? Image.file(
                                _image!,
                                fit: BoxFit.cover,
                                width: 120,
                                height: 120,
                              )
                              : Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: const [
                                  Icon(
                                    Icons.add_a_photo,
                                    size: 40,
                                    color: Color(0xFF2F76A6),
                                  ),
                                  SizedBox(height: 8),
                                  Text(
                                    'Añadir foto',
                                    style: TextStyle(
                                      color: Color(0xFF2F76A6),
                                      fontSize: 12,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                ],
                              ),
                    ),
                  ),
                ),
                const SizedBox(height: 24),
                Container(
                  height: MediaQuery.of(context).size.height,
                  width: MediaQuery.of(context).size.width,
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
                    key: formKey,
                    child: Column(
                      children: [
                        Row(
                          children: [
                            const Text(
                              'ID asignado automáticamente:',
                              style: TextStyle(
                                fontSize: 16,
                                fontFamily: 'Roboto',
                              ),
                            ),
                            const SizedBox(width: 8),
                            Text(
                              '---',
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 16,
                                fontFamily: 'Roboto',
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        TextFormField(
                          controller: nombreCtrl,
                          decoration: const InputDecoration(
                            labelText: 'Nombre de la mascota',
                          ),
                          validator:
                              (v) =>
                                  v!.trim().isEmpty
                                      ? 'Ingresa el nombre'
                                      : null,
                        ),
                        const SizedBox(height: 16),
                        DropdownButtonFormField<String>(
                          initialValue: especie,
                          decoration: const InputDecoration(
                            labelText: 'Especie',
                          ),
                          items:
                              ['Perro', 'Gato']
                                  .map(
                                    (e) => DropdownMenuItem(
                                      value: e,
                                      child: Text(e),
                                    ),
                                  )
                                  .toList(),
                          onChanged: (v) => setState(() => especie = v!),
                          validator:
                              (v) => v == null ? 'Selecciona la especie' : null,
                        ),
                        const SizedBox(height: 16),
                        TextFormField(
                          controller: razaCtrl,
                          decoration: const InputDecoration(
                            labelText: 'Raza (opcional)',
                          ),
                        ),
                        const SizedBox(height: 16),
                        DropdownButtonFormField<String>(
                          initialValue: sexo,
                          decoration: const InputDecoration(labelText: 'Sexo'),
                          items:
                              ['M', 'H']
                                  .map(
                                    (e) => DropdownMenuItem(
                                      value: e,
                                      child: Text(e),
                                    ),
                                  )
                                  .toList(),
                          onChanged: (v) => setState(() => sexo = v!),
                          validator:
                              (v) => v == null ? 'Selecciona el sexo' : null,
                        ),
                        const SizedBox(height: 16),
                        TextFormField(
                          controller: edadCtrl,
                          readOnly: true,
                          decoration: const InputDecoration(
                            labelText: 'Edad',
                            hintText: 'Calculada automáticamente',
                          ),
                          //keyboardType: TextInputType.number,
                          validator:
                              (v) =>
                                  v!.trim().isEmpty
                                      ? 'Selecciona la fecha de nacimiento'
                                      : null,
                        ),
                        const SizedBox(height: 16),
                        TextFormField(
                          controller: pesoCtrl,
                          decoration: const InputDecoration(labelText: 'Peso'),
                          keyboardType: TextInputType.number,
                        ),
                        const SizedBox(height: 16),
                        TextFormField(
                          controller: fechaNacimientoCtrl,
                          readOnly: true,
                          onTap: () => _selectDate(context),
                          decoration: const InputDecoration(
                            labelText: 'Fecha de nacimiento',
                            suffixIcon: Icon(Icons.calendar_today_rounded),
                          ),
                          // keyboardType: TextInputType.datetime,
                          validator:
                              (v) =>
                                  fechaNacimientoSelected == null
                                      ? 'Selecciona la fecha'
                                      : null,
                        ),
                        const SizedBox(height: 32),
                        ElevatedButton(
                          onPressed: () {
                            loading ? null : _onSavePet();
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF2F76A6),
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(14),
                            ),
                            textStyle: const TextStyle(
                              fontFamily: 'Roboto',
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
              ],
            ),
          ),
        ),
      ),
    );
  }
}
