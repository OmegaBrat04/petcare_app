import 'package:flutter/material.dart';

class Mascota {
  final int idMascota;
  final int? idUsuario;
  final String nombre;
  final String? especie;       
  final String? raza;
  final String? sexo;         
  final int? edad;
  final int? peso;
  final String? fotoURL;
  final DateTime? fechaNacimiento;
  final DateTime? fechaRegistro; 

  Mascota({
    required this.idMascota,
    this.idUsuario,
    required this.nombre,
    this.fotoURL,
    this.especie,
    this.sexo,
    this.raza,
    this.edad,
    this.peso,
    this.fechaNacimiento,
    this.fechaRegistro,
  });

  factory Mascota.fromJson(Map<String, dynamic> json) {
    try {
      debugPrint('🔍 Parseando mascota: ${json['nombre']}');
      debugPrint('  - id: ${json['id']} (${json['id'].runtimeType})');
      debugPrint('  - idUsuario: ${json['idUsuario']} (${json['idUsuario']?.runtimeType})');
      debugPrint('  - edad: ${json['edad']} (${json['edad']?.runtimeType})');
      debugPrint('  - peso: ${json['peso']} (${json['peso']?.runtimeType})');
      
      return Mascota(
        idMascota: json['id'] as int,
        idUsuario: json['idUsuario'] as int?,
        nombre: json['nombre'] as String? ?? '',
        especie: json['especie'] as String?,
        sexo: json['sexo'] as String?,
        edad: json['edad'] as int?,
        raza: json['raza'] as String?,
        peso: json['peso'] != null 
            ? (json['peso'] is int 
                ? json['peso'] as int 
                : int.tryParse(json['peso'].toString()))
            : null,
        fotoURL: json['foto'] as String?,
        fechaNacimiento: json['fechaNacimiento'] != null
            ? DateTime.tryParse(json['fechaNacimiento'] as String)
            : null,
        fechaRegistro: json['fechaRegistro'] != null
            ? DateTime.tryParse(json['fechaRegistro'] as String)
            : null,
      );
    } catch (e, st) {
      debugPrint('❌ Error parseando mascota: $e');
      debugPrint('JSON: $json');
      debugPrint('Stack: $st');
      rethrow;
    }
  }

  Map<String, dynamic> toJson() {
    return {
      'id': idMascota,
      'idUsuario': idUsuario,
      'nombre': nombre,
      'foto': fotoURL,
      'especie': especie,
      'raza': raza,
      'sexo': sexo,
      'edad': edad,
      'peso': peso,
      'fechaNacimiento': fechaNacimiento?.toIso8601String(),
      'fechaRegistro': fechaRegistro?.toIso8601String(),
    };
  }
}
