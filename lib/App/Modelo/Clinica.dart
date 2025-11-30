import 'Servicios.dart';

class Clinica {
  final int id;
  final String name;
  final String? address;
  final String? phone;
  final double? lat;
  final double? lon;
  final String? descripcion;
  final String? horarioApertura;
  final String? horarioCierre;
  final List<Servicios>? servicios;

  Clinica({
    required this.id,
    required this.name,
    this.address,
    this.phone,
    this.lat,
    this.lon,
    this.descripcion,
    this.horarioApertura,
    this.horarioCierre,
    this.servicios,
  });

  factory Clinica.fromJson(Map<String, dynamic> m) => Clinica(
    id: m['id'] is int ? m['id'] as int : (m['id'] as num?)?.toInt() ?? 0,
    name: (m['nombre'] ?? m['name'] ?? '').toString(),
    address: m['direccion']?.toString() ?? m['address']?.toString(),
    phone: m['telefono']?.toString() ?? m['phone']?.toString(),
    lat:
        m['lat'] != null
            ? (m['lat'] is double
                ? m['lat'] as double
                : double.tryParse(m['lat'].toString()))
            : null,
    lon:
        m['lon'] != null
            ? (m['lon'] is double
                ? m['lon'] as double
                : double.tryParse(m['lon'].toString()))
            : null,
    descripcion: m['descripcion']?.toString(),
    horarioApertura: m['horario_apertura']?.toString(),
    horarioCierre: m['horario_cierre']?.toString(),
    servicios:
        m['servicios'] != null
            ? (m['servicios'] as List<dynamic>)
                .map((s) => Servicios.fromMap(s as Map<String, dynamic>))
                .toList()
            : null,
  );

  Map<String, dynamic> toMap() => {
    'id': id,
    'nombre': name,
    'direccion': address,
    'telefono': phone,
    'lat': lat,
    'lon': lon,
    'descripcion': descripcion,
    'horario_apertura': horarioApertura,
    'horario_cierre': horarioCierre,
    'servicios': servicios?.map((s) => s.toMap()).toList(),
  };

  @override
  String toString() =>
      'Clinica(id: $id, name: $name, lat: $lat, lon: $lon, servicios: ${servicios?.length ?? 0})';
}
