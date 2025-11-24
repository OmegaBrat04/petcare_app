import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:petcare_app/App/Modelo/Usuarios.dart';
import 'package:petcare_app/App/Servicios/api_service.dart';

class AuthController extends ChangeNotifier {
  Usuarios? _currentUser;
  final ApiService _apiService = ApiService();
  final FlutterSecureStorage _storage = const FlutterSecureStorage();
  bool _restoring = false;
  bool get isAuthenticated => _currentUser != null;
  Usuarios? get currentUser => _currentUser;
  bool get isRestoring => _restoring;

  // -------------------------- Métodos de Autenticación --------------------------

  Future<String?> login(
    String email,
    String password, {
    bool rememberMe = false,
  }) async {
    try {
      final result = await _api_service_login_safe(email, password);
      if (result == null) return 'Respuesta vacía del servidor.';
      if (result['success'] == true) {
        final token = result['token'] as String?;
        final userMap = result['user'] as Map<String, dynamic>?;
        if (token == null) return 'Token no recibido desde el servidor.';
        if (userMap == null)
          return 'Datos de usuario no recibidos desde el servidor.';
        final idKeys = ['IdUsuario', 'idUsuario', 'id', 'Id'];
        final hasId = idKeys.any(
          (k) => userMap.containsKey(k) && userMap[k] != null,
        );
        if (!hasId) return 'El servidor no devolvió IdUsuario.';
        try {
          final user = Usuarios.fromJson(userMap, token);
          await _storage.write(key: 'jwt_token', value: token);
          await _storage.write(
            key: 'remember_me',
            value: rememberMe ? 'true' : 'false',
          );
          if (rememberMe) {
            await _storage.write(key: 'user_json', value: jsonEncode(userMap));
          } else {
            await _storage.delete(key: 'user_json');
          }
          _currentUser = user;
          if (user.telefono != null && user.telefono!.isNotEmpty) {
            await ApiService.writeSecure('user_phone', user.telefono!);
          }
          notifyListeners();
          return null;
        } catch (e, st) {
          debugPrint('AuthController.login parse error: $e\n$st');
          return 'Error al parsear usuario.';
        }
      } else {
        return result['message']?.toString() ?? 'Error en inicio de sesión.';
      }
    } catch (e, st) {
      debugPrint('AuthController.login excepción: $e\n$st');
      return 'Error de conexión: ${e.toString()}';
    }
  }

  Future<void> restoreSession() async {
    _restoring = true;
    notifyListeners();
    try {
      final remember = await _storage.read(key: 'remember_me');
      if (remember != 'true') {
        await _storage.delete(key: 'jwt_token');
        await _storage.delete(key: 'user_json');
        _currentUser = null;
        return;
      }
      final token = await _storage.read(key: 'jwt_token');
      if (token == null || token.isEmpty) {
        _currentUser = null;
        return;
      }
      // Validar token llamando a un endpoint protegido (ej: mascotas)
      final petsRes = await _apiService.getPets(token: token);
      if (petsRes['success'] != true) {
        await _storage.delete(key: 'jwt_token');
        await _storage.delete(key: 'user_json');
        _currentUser = null;
        return;
      }
      final userRaw = await _storage.read(key: 'user_json');
      if (userRaw != null) {
        try {
          final userMap = jsonDecode(userRaw) as Map<String, dynamic>;
          _currentUser = Usuarios.fromJson(userMap, token);
        } catch (_) {
          _currentUser = Usuarios(
            id: -1,
            nombreCompleto: 'Usuario',
            email: 'desconocido',
            token: token,
            role: '',
          );
        }
      } else {
        _currentUser = Usuarios(
          id: -1,
          nombreCompleto: 'Usuario',
          email: 'desconocido',
          token: token,
          role: '',
        );
      }
      final storedPhone = await ApiService.readSecure('user_phone');
      if (_currentUser != null &&
          storedPhone != null &&
          storedPhone.isNotEmpty &&
          (_currentUser!.telefono == null || _currentUser!.telefono!.isEmpty)) {
        _currentUser = Usuarios(
          id: _currentUser!.id,
          email: _currentUser!.email,
          role: _currentUser!.role,
          token: _currentUser!.token,
          nombreCompleto: _currentUser!.nombreCompleto,
          telefono: storedPhone,
        );
      }
    } catch (e) {
      debugPrint('restoreSession error: $e');
      _currentUser = null;
    } finally {
      _restoring = false;
      notifyListeners();
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
    await _storage.delete(key: 'remember_me');
    await _storage.delete(key: 'user_json');
    notifyListeners();
  }

  Future<bool> actualizarTelefono(String telefono) async {
    try {
      final res = await ApiService.actualizarTelefono(telefono);
      if (res['success'] == true) {
        final u = res['usuario'] as Map<String, dynamic>;
        // reconstruir modelo conservando token
        final newUser = Usuarios.fromJson(u, _currentUser!.token);
        _currentUser = newUser;
        // guardar teléfono
        await ApiService.writeSecure('user_phone', newUser.telefono ?? '');
        notifyListeners();
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }
}
