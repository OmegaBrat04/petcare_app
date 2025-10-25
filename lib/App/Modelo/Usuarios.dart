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
    final rawId =
        json['IdUsuario'] ?? json['id'] ?? json['idUsuario'] ?? json['Id'];
    if (rawId == null) {
      throw FormatException('IdUsuario missing in user JSON: $json');
    }
    final int idValue =
        rawId is int
            ? rawId
            : int.tryParse(rawId.toString()) ??
                (throw FormatException('IdUsuario is not an int: $rawId'));

    final rawEmail = json['email'] ?? json['Email'] ?? '';
    final rawRole = json['rol'] ?? json['Rol'] ?? '';
    return Usuarios(
      id: idValue,
      email: rawEmail.toString(),
      role: rawRole.toString(),
      token: token,
    );
  }
}
