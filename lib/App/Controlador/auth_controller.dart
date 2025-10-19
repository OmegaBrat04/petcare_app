
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
    final result = await _apiService.login(email: email, password: password);

    if (result['success'] == true) {
      final token = result['token'] as String;
      final userJson = result['user'] as Map<String, dynamic>;
      
      // Crear modelo de usuario y guardarlo en el estado
      _currentUser = Usuarios.fromJson(userJson, token);
      
      // Persistir el token
      await _storage.write(key: 'jwt_token', value: token);
      
      notifyListeners(); // Notifica a las vistas que el estado cambió
      return null; // Éxito
    } else {
      return result['message']; 
    }
  }

  Future<String?> signUp(String email, String password, String name) async {
    final result = await _apiService.signUp(email: email, password: password, name: name);

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