import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:petcare_app/App/Controlador/auth_controller.dart';
import 'package:petcare_app/App/Vista/Splash.dart';

void main() {
  runApp(
    ChangeNotifierProvider(
      create: (_) => AuthController(),
      child: const PetCareApp(),
    ),
  );
}
