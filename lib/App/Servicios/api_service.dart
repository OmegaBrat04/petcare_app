
import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiService {
  static const String _baseUrl = 'http://10.0.2.2:3000/api';

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
}
