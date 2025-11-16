import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'dart:io';
import 'package:path/path.dart' as p;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:petcare_app/App/Modelo/Clinica.dart';

class ApiService {
  static const String _baseUrl = 'http://10.0.2.2:3000/api/mobile';
  static final FlutterSecureStorage _storage = const FlutterSecureStorage();
  // --------------------------------- REGISTRO ---------------------------------
  Future<Map<String, dynamic>> signUp({
    required String email,
    required String password,
    required String name,
  }) async {
    final url = Uri.parse('$_baseUrl/signup');
    final response = await http.post(
      url,
      headers: {'Content-Type': 'application/json'},
      body: json.encode({
        'email': email,
        'password': password,
        'nombreCompleto': name,
      }),
    );

    final responseBody = json.decode(response.body);

    if (response.statusCode == 201) {
      // 201 Created (Éxito en la creación)
      return {
        'success': true,
        'message': responseBody['message'] ?? 'Registro exitoso.',
        'token': responseBody['token'],
        'user': responseBody['user'],
      };
    } else {
      // Manejar 400 Bad Request, 409 Conflict (Email ya existe), etc.
      return {
        'success': false,
        'message':
            responseBody['message'] ?? 'Error al registrar. Intenta de nuevo.',
      };
    }
  }

  // ------------------------------ INICIO DE SESIÓN ------------------------------
  Future<Map<String, dynamic>> login({
    required String email,
    required String password,
  }) async {
    final url = Uri.parse('$_baseUrl/login');
    final response = await http.post(
      url,
      headers: {'Content-Type': 'application/json'},
      body: json.encode({'email': email, 'password': password}),
    );

    final responseBody = json.decode(response.body);

    if (response.statusCode == 200) {
      // 200 OK
      return {
        'success': true,
        'token': responseBody['token'],
        'user': responseBody['user'], // Datos del usuario
      };
    } else {
      // Manejar 401 Unauthorized (Credenciales inválidas)
      return {
        'success': false,
        'message': responseBody['message'] ?? 'Credenciales inválidas.',
      };
    }
  }

  // ------------------------------ REGISTRO DE MASCOTA ------------------------------
  Future<Map<String, dynamic>> registerPet({
    String? token,
    required File photo,
    required Map<String, dynamic> petData,
  }) async {
    final url = Uri.parse('$_baseUrl/register');
    final request = http.MultipartRequest('POST', url);

    if (token != null && token.isNotEmpty) {
      request.headers['Authorization'] = 'Bearer $token';
    }

    petData.forEach((key, value) {
      request.fields[key] = value?.toString() ?? '';
    });

    // Adjuntar archivo usando fromPath para preservar filename y mimeType por extensión
    final filename = p.basename(photo.path);
    final multipartFile = await http.MultipartFile.fromPath(
      'photo',
      photo.path,
      filename: filename,
    );
    request.files.add(multipartFile);

    final streamed = await request.send();
    final response = await http.Response.fromStream(streamed);

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return json.decode(response.body) as Map<String, dynamic>;
    } else {
      try {
        return json.decode(response.body) as Map<String, dynamic>;
      } catch (_) {
        return {
          'success': false,
          'message': 'Error de servidor: ${response.statusCode}',
          'raw': response.body,
        };
      }
    }
  }

  // ------------------------------ OBTENER MASCOTAS ------------------------------
 Future<Map<String, dynamic>> getPets({required String token}) async {
    final url = Uri.parse('$_baseUrl/mascotas');
    
    debugPrint('🐾 [getPets] URL: $url');
    debugPrint('🐾 [getPets] Token: ${token.substring(0, 20)}...');

    try {
      final response = await http.get(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      debugPrint('🐾 [getPets] Status: ${response.statusCode}');
      debugPrint('🐾 [getPets] Body (primeros 200 chars): ${response.body.length > 200 ? response.body.substring(0, 200) : response.body}');

      // Si la respuesta no es 200, NO intentes decodificar como JSON exitoso
      if (response.statusCode != 200) {
        try {
          final errorBody = json.decode(response.body) as Map<String, dynamic>;
          return {
            'success': false,
            'message': errorBody['message'] ?? 'Error ${response.statusCode}',
          };
        } catch (_) {
          return {
            'success': false,
            'message': 'Error ${response.statusCode}: ${response.body}',
            'raw': response.body,
          };
        }
      }

      // Solo decodifica si es 200
      try {
        final responseBody = json.decode(response.body) as Map<String, dynamic>;
        return {
          'success': responseBody['success'] ?? true,
          'data': responseBody['data'] ?? [],
        };
      } on FormatException catch (e) {
        debugPrint('❌ [getPets] FormatException: $e');
        debugPrint('❌ [getPets] Body completo: ${response.body}');
        return {
          'success': false,
          'message': 'Respuesta no JSON. Body: ${response.body}',
        };
      }
    } catch (e, st) {
      debugPrint('❌ [getPets] Exception: $e');
      debugPrint('Stack: $st');
      return {
        'success': false,
        'message': 'Error de conexión: $e',
      };
    }
  }

  // ------------------------------ OBTENER CLINICAS ------------------------------
  static Future<List<Clinica>> getClinicas() async {
    final url = Uri.parse('$_baseUrl/veterinarias');
    final res = await http.get(url);
    if (res.statusCode != 200) {
      throw Exception('Error al obtener veterinarias (${res.statusCode})');
    }
    final body = json.decode(res.body) as Map<String, dynamic>;
    final list = (body['data'] as List<dynamic>? ?? []);
    return list
        .map((e) => Clinica.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  static Future<Map<String, dynamic>> getVeterinarias() async {
    try {
      final clinicas = await getClinicas();
      return {
        'success': true,
        'data': clinicas.map((c) => c.toMap()).toList(),
      };
    } catch (e) {
      debugPrint('❌ [getVeterinarias] Error: $e');
      return {
        'success': false,
        'message': 'Error al cargar veterinarias: $e',
      };
    }
  }

  //------------------------------ CREAR CITA ------------------------------

  static Future<void> saveToken(String token) async {
    await _storage.write(key: 'jwt_token', value: token);
  }

  static Future<String?> readToken() async {
    final t = await _storage.read(key: 'jwt_token');
    if (t != null && t.isNotEmpty) return t;
    return _storage.read(key: 'token');
  }

  static Future<void> clearToken() async {
    await _storage.delete(key: 'jwt_token');
    await _storage.delete(key: 'token');
  }


  static Future<Map<String, String>> _authHeaders() async {
    final token = await readToken();
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  static Future<Map<String, dynamic>> crearCita({
    required int veterinariaId,
    required String mascotaNombre,
    String? servicioNombre,
    required DateTime fechaPreferida,
    String? telefono,
    String? notas,
  }) async {
    final url = Uri.parse('$_baseUrl/citas');
    final headers = await _authHeaders();
    if (!headers.containsKey('Authorization')) {
      return {'success': false, 'message': 'Sesión expirada. Inicie sesión.'};
    }
    final body = {
      'veterinaria_id': veterinariaId,
      'mascota_nombre': mascotaNombre,
      if (servicioNombre != null && servicioNombre.isNotEmpty)
        'servicio_nombre': servicioNombre,
      'telefono_contacto': telefono ?? '',
      'fecha_preferida':
          '${fechaPreferida.year.toString().padLeft(4, '0')}-${fechaPreferida.month.toString().padLeft(2, '0')}-${fechaPreferida.day.toString().padLeft(2, '0')}',
      'notas': notas ?? '',
    };
    final res = await http.post(url, headers: headers, body: json.encode(body));
    try {
      return json.decode(res.body) as Map<String, dynamic>;
    } catch (_) {
      return {
        'success': false,
        'message': 'HTTP ${res.statusCode}: ${res.body}',
      };
    }
  }

  //------------------------------ OBTENER CITAS ------------------------------
  static Future<Map<String, dynamic>> getCitas({
    String? status,
    int? mascotaId,
    DateTime? desde,
    DateTime? hasta,
  }) async {
    final queryParams = <String, String>{};
    if (status != null) queryParams['status'] = status;
    if (mascotaId != null) queryParams['mascota_id'] = mascotaId.toString();
    if (desde != null) {
      queryParams['desde'] = '${desde.year}-${desde.month.toString().padLeft(2, '0')}-${desde.day.toString().padLeft(2, '0')}';
    }
    if (hasta != null) {
      queryParams['hasta'] = '${hasta.year}-${hasta.month.toString().padLeft(2, '0')}-${hasta.day.toString().padLeft(2, '0')}';
    }

    final url = Uri.parse('$_baseUrl/citas').replace(queryParameters: queryParams.isNotEmpty ? queryParams : null);
    final headers = await _authHeaders();

    debugPrint('📋 [getCitas] URL: $url');

    try {
      final res = await http.get(url, headers: headers);
      debugPrint('📋 [getCitas] Status: ${res.statusCode}');

      if (res.statusCode != 200) {
        try {
          final errorBody = json.decode(res.body) as Map<String, dynamic>;
          return {'success': false, 'message': errorBody['message'] ?? 'Error ${res.statusCode}'};
        } catch (_) {
          return {'success': false, 'message': 'Error ${res.statusCode}: ${res.body}'};
        }
      }

      final responseBody = json.decode(res.body) as Map<String, dynamic>;
      debugPrint('📋 [getCitas] Data: ${responseBody['data']}');
      return {'success': responseBody['success'] ?? true, 'data': responseBody['data'] ?? []};
    } catch (e, st) {
      debugPrint('❌ [getCitas] Exception: $e\n$st');
      return {'success': false, 'message': 'Error de conexión: $e'};
    }
  }

  static Future<Map<String, dynamic>> updateCitaStatus(int citaId, String status) async {
    final url = Uri.parse('$_baseUrl/citas/$citaId/status');
    final headers = await _authHeaders();
    final body = {'status': status};

    debugPrint('📋 [updateCitaStatus] URL: $url, status: $status');

    try {
      final res = await http.patch(url, headers: headers, body: json.encode(body));
      debugPrint('📋 [updateCitaStatus] Status: ${res.statusCode}');
      
      return json.decode(res.body) as Map<String, dynamic>;
    } catch (e, st) {
      debugPrint('❌ [updateCitaStatus] Exception: $e\n$st');
      return {'success': false, 'message': 'Error al actualizar: $e'};
    }
  }

  static Future<Map<String, dynamic>> deleteCita(int citaId) async {
    final url = Uri.parse('$_baseUrl/citas/$citaId');
    final headers = await _authHeaders();

    debugPrint('📋 [deleteCita] URL: $url');

    try {
      final res = await http.delete(url, headers: headers);
      debugPrint('📋 [deleteCita] Status: ${res.statusCode}');
      
      return json.decode(res.body) as Map<String, dynamic>;
    } catch (e, st) {
      debugPrint('❌ [deleteCita] Exception: $e\n$st');
      return {'success': false, 'message': 'Error al eliminar: $e'};
    }
  }



}
