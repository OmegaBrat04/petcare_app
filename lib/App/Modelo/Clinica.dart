import 'Servicios.dart';

class Clinica{
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
        id: m['id'] as int,
        name: m['nombre'] as String,
        address: m['direccion'] as String?,
        phone: m['telefono'] as String?,
        lat: (m['lat'] as num?)?.toDouble(),
        lon: (m['lon'] as num?)?.toDouble(),
        descripcion: m['descripcion'] as String?,
        horarioApertura: m['horario_apertura']?.toString(),
        horarioCierre: m['horario_cierre']?.toString(),
        servicios: (m['servicios'] as List<dynamic>?)
            ?.map((s) => Servicios.fromMap(s as Map<String, dynamic>))
            .toList(),
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
}