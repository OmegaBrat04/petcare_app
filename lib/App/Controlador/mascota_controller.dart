// /app_flutter/lib/controllers/pet_controller.dart

import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:petcare_app/App/Modelo/Mascotas.dart';
import 'package:petcare_app/App/Servicios/api_service.dart';
import 'package:petcare_app/App/Controlador/auth_controller.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class PetController extends ChangeNotifier {
  final ApiService _apiService = ApiService();
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  List<Mascota> _pets = [];
  List<Mascota> get pets => _pets;

  Future<String?> addPet({
    required File photo,
    required Map<String, dynamic> petData,
    String? token,
  }) async {
    try {
      debugPrint(
        'PetController.addPet -> petData: $petData, photo: ${photo.path}',
      );


      final effectiveToken = token ?? await _storage.read(key: 'jwt_token');
      debugPrint('PetController.addPet -> Token leído: $effectiveToken');
      if (effectiveToken == null || effectiveToken.isEmpty) {
        return 'Acceso denegado. Inicia sesión para poder registrar mascotas.';
      }


      final response = await _api_service_register_safe(
        photo: photo,
        petData: petData,
        token: effectiveToken,
      );

      debugPrint('PetController.addPet -> raw response: $response');

      if (response == null) {
        return 'Respuesta vacía del servidor.';
      }

      Map<String, dynamic> result;

      if (response is Map<String, dynamic>) {
        result = response;
      } else if (response is String) {
        try {
          final parsed = json.decode(response);
          if (parsed is Map<String, dynamic>) {
            result = parsed;
          } else {
            return 'Respuesta inesperada del servidor.';
          }
        } catch (e) {
          debugPrint('PetController.addPet -> error decodificando JSON: $e');
          return 'Respuesta inválida del servidor.';
        }
      } else {
        return 'Respuesta inesperada del servidor.';
      }

      if (result['success'] == true) return null;
      return result['message']?.toString() ??
          'Error desconocido al guardar mascota';
    } catch (e, st) {
      debugPrint('PetController.addPet -> excepción: $e\n$st');
      return 'Error al guardar la mascota: ${e.toString()}';
    }
  }

  Future<dynamic> _api_service_register_safe({
    required File photo,
    required Map<String, dynamic> petData,
    String? token,
  }) async {
    try {
      return await _apiService.registerPet(
        photo: photo,
        petData: petData,
        token: token,
      );
    } catch (e, st) {
      debugPrint('ApiService.registerPet lanzó excepción: $e\n$st');
      rethrow;
    }
  }
  Future<String?> fetchPets() async {
    try {
      final token = await _storage.read(key: 'jwt_token');
      
      if (token == null || token.isEmpty) {
        return "Token no encontrado. Vuelve a iniciar sesión.";
      }

      //Llamar al API Service para obtener la lista
      final result = await _apiService.getPets(token: token); 

      if (result['success'] == true) {
        final List<dynamic> petListJson = result['data'] as List<dynamic>;
        
        // Mapear el JSON a la lista de objetos Mascota
        _pets = petListJson
            .map((json) => Mascota.fromJson(json as Map<String, dynamic>))
            .toList();
        
        notifyListeners();
        return null; // Éxito
      } else {
        return result['message']?.toString() ?? 'Error al cargar mascotas desde el servidor.';
      }
    } catch (e, st) {
      debugPrint('PetController.fetchPets -> excepción: $e\n$st');
      return 'Error de conexión o inesperado al obtener mascotas: ${e.toString()}';
    }
  }
}
