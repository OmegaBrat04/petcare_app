class Mascota {
  final int idMascota;
  final int idUsuario; 
  final String nombre;
  final String especie;
  final String? raza; 
  final String sexo;
  final int? peso; 
  final String? fotoURL; // La URL o ruta después de subirla
  final DateTime? fechaNacimiento;
  final DateTime fechaRegistro;

  Mascota({
    required this.idMascota,
    required this.idUsuario ,
    required this.nombre,
    required this.especie,
    required this.sexo,
    this.raza,
    this.peso,
    this.fotoURL,
    this.fechaNacimiento,
    required this.fechaRegistro,
  });

  // Método para crear un objeto Pet a partir del JSON de la API
  factory Mascota.fromJson(Map<String, dynamic> json) {
    return Mascota(
      idMascota: json['IdMascota'],
      idUsuario: json['IdUsuario'],
      nombre: json['Nombre'],
      especie: json['Especie'],
      sexo: json['Sexo'],
      raza: json['Raza'],
      peso: json['Peso'] != null ? int.tryParse(json['Peso'].toString()) : null,
      fotoURL: json['Foto'],
      // Conversión de string a DateTime (ajustar formato si es necesario)
      fechaNacimiento:
          json['FechaNacimiento'] != null
              ? DateTime.tryParse(json['FechaNacimiento'])
              : null,
      fechaRegistro: DateTime.parse(json['FechaRegistro']),
    );
  }
}
