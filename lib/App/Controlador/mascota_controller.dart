// /app_flutter/lib/controllers/pet_controller.dart

import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:petcare_app/App/Modelo/Mascotas.dart';
import 'package:petcare_app/App/Servicios/api_service.dart';
import 'package:petcare_app/App/Modelo/EventoSalud.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class PetController extends ChangeNotifier {
  final ApiService _apiService = ApiService();
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  List<Mascota> _pets = [];
  List<Mascota> get pets => _pets;
  List<Mascota> get items => _pets;

  final Map<int, List<EventoSalud>> _eventosSalud = {};
  Map<int, List<EventoSalud>> get eventosPorMascota => _eventosSalud;

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

      if (result['success'] == true) {
        await fetchPets();
        return null;
      }
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
        debugPrint('❌ [fetchPets] Token vacío');
        return "Token no encontrado. Vuelve a iniciar sesión.";
      }

      debugPrint('🐾 [fetchPets] Llamando API...');
      final result = await _apiService.getPets(token: token);
      debugPrint('🐾 [fetchPets] Resultado: $result');

      if (result['success'] == true) {
        final List<dynamic> petListJson =
            result['data'] as List<dynamic>? ?? [];
        debugPrint('✅ [fetchPets] ${petListJson.length} mascotas recibidas');

        _pets =
            petListJson
                .map((json) => Mascota.fromJson(json as Map<String, dynamic>))
                .toList();

        notifyListeners();
        return null; // Éxito
      } else {
        final msg = result['message']?.toString() ?? 'Error al cargar mascotas';
        debugPrint('❌ [fetchPets] Error del servidor: $msg');
        return msg;
      }
    } catch (e, st) {
      debugPrint('❌ [fetchPets] Excepción: $e');
      debugPrint('Stack: $st');
      return 'Error inesperado: ${e.toString()}';
    }
  }

  Future<List<String>> getPetNames({bool forceRefresh = false}) async {
    try {
      if (!forceRefresh && _pets.isNotEmpty) {
        return _pets.map((p) => p.nombre).where((s) => s.isNotEmpty).toList();
      }

      final token = await _storage.read(key: 'jwt_token');
      if (token == null || token.isEmpty) {
        debugPrint('❌ [getPetNames] Token vacío');
        return [];
      }

      final result = await _apiService.getPets(token: token);
      if (result['success'] == true) {
        final List<dynamic> list = result['data'] as List<dynamic>? ?? [];
        _pets =
            list
                .map((json) => Mascota.fromJson(json as Map<String, dynamic>))
                .toList();
        notifyListeners();
        return _pets.map((p) => p.nombre).where((s) => s.isNotEmpty).toList();
      }

      debugPrint('❌ [getPetNames] Error: ${result['message']}');
      return [];
    } catch (e, st) {
      debugPrint('❌ [getPetNames] Excepción: $e\n$st');
      return [];
    }
  }

  Future<String?> updatePet({
    required Mascota original,
    required Map<String, dynamic> petData,
    File? photo,
  }) async {
    try {
      final token = await _storage.read(key: 'jwt_token');
      if (token == null || token.isEmpty) return 'Sesión expirada.';

      final res = await _apiService.updatePet(
        idMascota: original.idMascota,
        petData: petData,
        photo: photo,
        token: token,
      );

      if (res['success'] == true) {
        await fetchPets();
        return null;
      }
      return res['message']?.toString() ?? 'Error al actualizar mascota.';
    } catch (e, st) {
      debugPrint('updatePet error: $e\n$st');
      return 'Excepción al actualizar.';
    }
  }

  Future<void> fetchEventosSalud(int mascotaId) async {
    try {
      final res = await _apiService.listarEventosSalud(mascotaId);
      if (res['success'] == true) {
        final list =
            (res['data'] as List)
                .whereType<Map<String, dynamic>>()
                .map(EventoSalud.fromJson)
                .toList();
        _eventosSalud[mascotaId] = list;
        notifyListeners();
      }
    } catch (_) {}
  }

  Future<String?> crearEventoSalud({
    required int mascotaId,
    required String tipo,
    required DateTime fecha,
    required String producto,
    String? lote,
    String? veterinaria,
    int? regularidadMeses,
    String? notas,
  }) async {
    try {
      final res = await _apiService.crearEventoSalud(
        mascotaId: mascotaId,
        tipo: tipo,
        fecha: fecha,
        producto: producto,
        lote: lote,
        veterinaria: veterinaria,
        regularidadMeses: regularidadMeses,
        notas: notas,
      );
      if (res['success'] == true) {
        await fetchEventosSalud(mascotaId);
        return null;
      }
      return res['message']?.toString() ?? 'Error';
    } catch (e) {
      return 'Error conexión';
    }
  }

  Future<String?> eliminarEventoSalud({
    required int mascotaId,
    required int eventoId,
  }) async {
    try {
      final res = await _apiService.eliminarEventoSalud(eventoId);
      if (res['success'] == true) {
        await fetchEventosSalud(mascotaId);
        return null;
      }
      return res['message']?.toString() ?? 'Error al eliminar';
    } catch (e) {
      return 'Error conexión';
    }
  }
}
