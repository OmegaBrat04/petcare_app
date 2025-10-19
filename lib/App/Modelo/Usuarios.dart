
class Usuarios {
  final int id;
  final String email;
  final String role;
  final String token;

  Usuarios({
    required this.id,
    required this.email,
    required this.role,
    required this.token,
  });

  // Método para crear un objeto User a partir del JSON de la API
  factory Usuarios.fromJson(Map<String, dynamic> json, String token) {
    return Usuarios(
      id: json['idUsuario'],
      email: json['email'],
      role: json['rol'],
      token: token,
    );
  }
}