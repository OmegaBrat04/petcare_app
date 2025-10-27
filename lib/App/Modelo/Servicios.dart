class Servicios {
  final int id;
  final int clinicId;
  final String name;
  final String? description;
  final double? price;
  final bool active;

  Servicios({
    required this.id,
    required this.clinicId,
    required this.name,
    this.description,
    this.price,
    this.active = true,
  });

  factory Servicios.fromMap(Map<String, dynamic> m) => Servicios(
        id: m['id'] as int,
        clinicId: m['veterinaria_id'] as int,
        name: m['nombre'] as String,
        description: m['descripcion'] as String?,
        price: (m['precio'] as num?)?.toDouble(),
        active: (m['activo'] as int? ?? 1) == 1,
      );

  Map<String, dynamic> toMap() => {
        'id': id,
        'veterinaria_id': clinicId,
        'nombre': name,
        'descripcion': description,
        'precio': price,
        'activo': active ? 1 : 0,
      };
}