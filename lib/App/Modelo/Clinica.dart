class Clinica{
  final int id;
  final String name;
  final String? address;
  final String? phone;
  final double? lat;
  final double? lon;
  final String? horario;
  final String? caracteristicas;

  Clinica({
    required this.id,
    required this.name,
    this.address,
    this.phone,
    this.lat,
    this.lon,
    this.horario,
    this.caracteristicas,
  });

  factory Clinica.fromJson(Map<String, dynamic> m) => Clinica(
        id: m['id'] as int,
        name: m['nombre'] as String,
        address: m['direccion'] as String?,
        phone: m['telefono'] as String?,
        lat: (m['lat'] as num?)?.toDouble(),
        lon: (m['lon'] as num?)?.toDouble(),
        horario: m['Horario'] as String?,
        caracteristicas: m['Caracteristicas'] as String?,
      );

  Map<String, dynamic> toMap() => {
        'id': id,
        'nombre': name,
        'direccion': address,
        'telefono': phone,
        'lat': lat,
        'lon': lon,
        'Horario': horario,
        'Caracteristicas': caracteristicas,
      };
}