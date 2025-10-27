enum AppointmentStatus { pending, confirmed, cancelled }

class Appointment {
  final int id;
  final int petId;
  final int userId;
  final int clinicId;
  final int? serviceId;
  final String? phone;
  final DateTime preferredDate; // sólo fecha
  final DateTime? confirmedAt; // fecha+hora confirmada por la clínica
  final AppointmentStatus status;
  final String? notes;
  final DateTime createdAt;

  Appointment({
    required this.id,
    required this.petId,
    required this.userId,
    required this.clinicId,
    this.serviceId,
    this.phone,
    required this.preferredDate,
    this.confirmedAt,
    this.status = AppointmentStatus.pending,
    this.notes,
    required this.createdAt,
  });

  factory Appointment.fromMap(Map<String, dynamic> m) {
    AppointmentStatus parseStatus(String s) {
      return s == 'confirmed'
          ? AppointmentStatus.confirmed
          : s == 'cancelled'
              ? AppointmentStatus.cancelled
              : AppointmentStatus.pending;
    }

    return Appointment(
      id: (m['id'] as num).toInt(),
      petId: (m['mascota_id'] as num).toInt(),
      userId: (m['usuario_id'] as num).toInt(),
      clinicId: (m['veterinaria_id'] as num).toInt(),
      serviceId: m['servicio_id'] != null ? (m['servicio_id'] as num).toInt() : null,
      phone: m['telefono_contacto'] as String?,
      preferredDate: DateTime.parse(m['fecha_preferida'] as String),
      confirmedAt: m['horario_confirmado'] != null ? DateTime.parse(m['horario_confirmado'] as String) : null,
      status: parseStatus(m['status'] as String),
      notes: m['notas'] as String?,
      createdAt: DateTime.parse(m['created_at'] as String),
    );
  }

  Map<String, dynamic> toMap() => {
        'id': id,
        'mascota_id': petId,
        'usuario_id': userId,
        'veterinaria_id': clinicId,
        'servicio_id': serviceId,
        'telefono_contacto': phone,
        'fecha_preferida': preferredDate.toIso8601String(),
        'horario_confirmado': confirmedAt?.toIso8601String(),
        'status': status.name,
        'notas': notes,
        'created_at': createdAt.toIso8601String(),
      };
}