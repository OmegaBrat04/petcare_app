enum Estatus { pending, confirmed, cancelled }

class Cita {
  final int id;
  final int mascotaId;
  final int usuarioId;
  final int veterinariaId;
  final int? servicioId;
  final String? telefonoContacto;
  final DateTime fechaPreferida; 
  final DateTime? horarioConfirmado;
  final Estatus estatus;
  final String? notas;
  final DateTime creadoEn;
  Cita
({
    required this.id,
    required this.mascotaId,
    required this.usuarioId,
    required this.veterinariaId,
    this.servicioId,
    this.telefonoContacto,
    required this.fechaPreferida,
    this.horarioConfirmado,
    this.estatus = Estatus.pending,
    this.notas,
    required this.creadoEn,
  });

  factory Cita
.fromMap(Map<String, dynamic> m) {
   Estatus parseStatus(String s) {
      return s == 'confirmed'
          ? Estatus.confirmed
          : s == 'cancelled'
              ? Estatus.cancelled
              : Estatus.pending;
    }

    return Cita
  (
      id: (m['id'] as num).toInt(),
      mascotaId: (m['mascota_id'] as num).toInt(),
      usuarioId: (m['usuario_id'] as num).toInt(),
      veterinariaId: (m['veterinaria_id'] as num).toInt(),
      servicioId: m['servicio_id'] != null ? (m['servicio_id'] as num).toInt() : null,
      telefonoContacto: m['telefono_contacto'] as String?,
      fechaPreferida: DateTime.parse(m['fecha_preferida'] as String),
      horarioConfirmado: m['horario_confirmado'] != null ? DateTime.parse(m['horario_confirmado'] as String) : null,
      estatus: parseStatus(m['status'] as String),
      notas: m['notas'] as String?,
      creadoEn: DateTime.parse(m['created_at'] as String),
    );
  }

  Map<String, dynamic> toMap() => {
        'id': id,
        'mascota_id': mascotaId,
        'usuario_id': usuarioId,
        'veterinaria_id': veterinariaId,
        'servicio_id': servicioId,
        'telefono_contacto': telefonoContacto,
        'fecha_preferida': fechaPreferida.toIso8601String(),
        'horario_confirmado': horarioConfirmado?.toIso8601String(),
        'status': estatus.name,
        'notas': notas,
        'created_at': creadoEn.toIso8601String(),
      };
}