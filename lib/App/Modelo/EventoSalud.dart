class EventoSalud {
  final int id;
  final int mascotaId;
  final String tipo; // vacuna | desparasitacion
  final DateTime fecha;
  final String producto;
  final String? lote;
  final String? veterinaria;
  final int adjuntos;
  final String? notas;
  final int? regularidadMeses;

  EventoSalud({
    required this.id,
    required this.mascotaId,
    required this.tipo,
    required this.fecha,
    required this.producto,
    this.lote,
    this.veterinaria,
    required this.adjuntos,
    this.notas,
    this.regularidadMeses,
  });

  factory EventoSalud.fromJson(Map<String, dynamic> j) => EventoSalud(
    id: j['id'],
    mascotaId: j['mascotaId'],
    tipo: j['tipo'],
    fecha: DateTime.parse(j['fechaAplicacion']),
    producto: j['producto'],
    lote: j['lote'],
    veterinaria: j['veterinaria'],
    adjuntos: j['adjuntos'] ?? 0,
    notas: j['notas'],
    regularidadMeses: j['regularidadMeses'],
  );
}
