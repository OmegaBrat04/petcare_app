import 'package:flutter/material.dart';
import 'package:petcare_app/App/Controlador/mascota_controller.dart';
import 'package:provider/provider.dart';
import 'package:petcare_app/App/Controlador/auth_controller.dart';
import 'package:petcare_app/App/Vista/Splash.dart';

void main() {
  runApp(
    MultiProvider(

      providers: [
        ChangeNotifierProvider(create: (_) => AuthController()),
        ChangeNotifierProvider(create: (_) => PetController())
      ],
      child: const PetCareApp(),
    ),
  );
}
