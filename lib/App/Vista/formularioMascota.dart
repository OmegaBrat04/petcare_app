import 'package:flutter/material.dart';

void main() {
  runApp(MaterialApp(
    title: 'Formulario Mascota',
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
    home: const FormularioMascota(),
  ));
}

class FormularioMascota extends StatefulWidget {
  const FormularioMascota({super.key});

  @override
  State<FormularioMascota> createState() => _FormularioMascotaState();
}

class _FormularioMascotaState extends State<FormularioMascota> {
  String especie = 'Perro';
  String sexo = 'Macho';
  late final String idMascota;

  @override
  void initState() {
    super.initState();
    idMascota = DateTime.now().millisecondsSinceEpoch.toString();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      // Fondo degradado similar a signup
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
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                Row(
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
                Container(
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(24),
                    color: Colors.white.withOpacity(.72),
                    border: Border.all(color: Colors.white.withOpacity(.8), width: 1),
                    boxShadow: [
                      BoxShadow(color: Colors.black.withOpacity(.18), blurRadius: 24, offset: const Offset(0, 12)),
                    ],
                  ),
                  child: Column(
                    children: [
                      Row(
                        children: [
                          const Text(
                            'ID asignado automáticamente:',
                            style: TextStyle(fontSize: 16, fontFamily: 'Roboto'),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            idMascota,
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, fontFamily: 'Roboto'),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      TextField(
                        decoration: const InputDecoration(
                          labelText: 'Nombre de la mascota',
                        ),
                      ),
                      const SizedBox(height: 16),
                      DropdownButtonFormField<String>(
                        value: especie,
                        decoration: const InputDecoration(
                          labelText: 'Especie',
                        ),
                        items: ['Perro', 'Gato']
                            .map((e) => DropdownMenuItem(value: e, child: Text(e)))
                            .toList(),
                        onChanged: (v) => setState(() => especie = v!),
                      ),
                      const SizedBox(height: 16),
                      TextField(
                        decoration: const InputDecoration(
                          labelText: 'Raza (opcional)',
                        ),
                      ),
                      const SizedBox(height: 16),
                      DropdownButtonFormField<String>(
                        value: sexo,
                        decoration: const InputDecoration(
                          labelText: 'Sexo',
                        ),
                        items: ['Macho', 'Hembra']
                            .map((e) => DropdownMenuItem(value: e, child: Text(e)))
                            .toList(),
                        onChanged: (v) => setState(() => sexo = v!),
                      ),
                      const SizedBox(height: 16),
                      TextField(
                        decoration: const InputDecoration(
                          labelText: 'Edad',
                        ),
                        keyboardType: TextInputType.number,
                      ),
                      const SizedBox(height: 16),
                      TextField(
                        decoration: const InputDecoration(
                          labelText: 'Peso',
                        ),
                        keyboardType: TextInputType.number,
                      ),
                      const SizedBox(height: 16),
                      TextField(
                        decoration: const InputDecoration(
                          labelText: 'Fecha de nacimiento',
                          hintText: 'YYYY-MM-DD',
                        ),
                      ),
                      const SizedBox(height: 32),
                      ElevatedButton(
                        onPressed: () {},
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF2F76A6),
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                          textStyle: const TextStyle(fontFamily: 'Roboto', fontWeight: FontWeight.w700),
                        ),
                        child: const Text('Guardar'),
                      ),
                    ],
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
