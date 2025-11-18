import 'package:flutter/material.dart';
import 'package:petcare_app/App/Controlador/citas_controller.dart';
import 'package:petcare_app/App/Controlador/mascota_controller.dart';
import 'package:petcare_app/App/Controlador/veterinaria_controller.dart';
import 'package:petcare_app/App/Vista/Splash.dart';
import 'package:provider/provider.dart';
import 'package:petcare_app/App/Controlador/auth_controller.dart';

void main() {
  runApp(
    MultiProvider(

      providers: [
        ChangeNotifierProvider(create: (_) => AuthController()),
        ChangeNotifierProvider(create: (_) => PetController()),
        ChangeNotifierProvider(create: (_) => VeterinariaController()),
        ChangeNotifierProvider(create: (_) => CitasController()),
      ],
      child: const PetCareApp(),
    ),
  );
}
