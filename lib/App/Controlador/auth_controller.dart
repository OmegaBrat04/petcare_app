import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:petcare_app/App/Modelo/Usuarios.dart';
import 'package:petcare_app/App/Servicios/api_service.dart';

class AuthController extends ChangeNotifier {
  Usuarios? _currentUser;
  final ApiService _apiService = ApiService();
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  bool get isAuthenticated => _currentUser != null;
  Usuarios? get currentUser => _currentUser;

  // -------------------------- Métodos de Autenticación --------------------------

  Future<String?> login(String email, String password) async {
    try {
      final result = await _api_service_login_safe(email, password);

      if (result == null) {
        return 'Respuesta vacía del servidor.';
      }

      debugPrint('AuthController.login -> result: $result');

      if (result['success'] == true) {
        final token = result['token'] as String?;
        if (token != null) {
          await ApiService.saveToken(token);
        }
        final userMap = result['user'] as Map<String, dynamic>?;

        if (token == null) return 'Token no recibido desde el servidor.';
        if (userMap == null) {
          return 'Datos de usuario no recibidos desde el servidor.';
        }

        // Verificar que userMap contiene alguna forma de IdUsuario
        final idKeys = ['IdUsuario', 'idUsuario', 'id', 'Id'];
        final hasId = idKeys.any(
          (k) => userMap.containsKey(k) && userMap[k] != null,
        );
        if (!hasId) {
          debugPrint('AuthController.login -> userMap sin Id: $userMap');
          return 'El servidor no devolvió IdUsuario en la respuesta de usuario.';
        }

        try {
          final user = Usuarios.fromJson(userMap, token);
          await ApiService.saveToken(token);
          debugPrint('Guardando token: $token');
          await _storage.write(key: 'jwt_token', value: token);
          _currentUser = user;
          notifyListeners();
          return null; // Éxito
        } catch (e, st) {
          debugPrint('AuthController.login -> error al parsear user: $e\n$st');
          return 'Error al parsear datos de usuario: ${e.toString()}';
        }
      } else {
        return result['message']?.toString() ?? 'Error en inicio de sesión.';
      }
    } catch (e, st) {
      debugPrint('AuthController.login -> excepción: $e\n$st');
      return 'Error de conexión o inesperado: ${e.toString()}';
    }
  }

  // Helper que llama al ApiService.login con manejo de excepciones
  Future<Map<String, dynamic>?> _api_service_login_safe(
    String email,
    String password,
  ) async {
    try {
      final r = await _api_service_login(email: email, password: password);
      debugPrint('api_service.login returned: $r');
      return r;
    } catch (e, st) {
      debugPrint('api_service.login threw: $e\n$st');
      rethrow;
    }
  }

  // Helper que llama directamente al ApiService
  Future<Map<String, dynamic>?> _api_service_login({
    required String email,
    required String password,
  }) {
    return _apiService.login(email: email, password: password);
  }

  Future<String?> signUp(String email, String password, String name) async {
    final result = await _apiService.signUp(
      email: email,
      password: password,
      name: name,
    );

    if (result['success'] == true) {
      return null; // Éxito
    } else {
      return result['message'];
    }
  }

  // Cerrar sesión
  Future<void> logout() async {
    _currentUser = null;
    await _storage.delete(key: 'jwt_token');
    notifyListeners();
  }
}
