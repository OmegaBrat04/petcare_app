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
    id: m['id'] is int ? m['id'] as int : (m['id'] as num?)?.toInt() ?? 0,
    clinicId:
        m['veterinaria_id'] is int
            ? m['veterinaria_id'] as int
            : (m['veterinaria_id'] as num?)?.toInt() ?? 0,
    name: (m['nombre'] ?? m['name'] ?? '').toString(),
    description: m['descripcion']?.toString() ?? m['description']?.toString(),
    price:
        m['precio'] != null
            ? (m['precio'] is double
                ? m['precio'] as double
                : double.tryParse(m['precio'].toString()))
            : null,
    active: m['activo'] == 1 || m['activo'] == true || m['active'] == true,
  );

  Map<String, dynamic> toMap() => {
    'id': id,
    'veterinaria_id': clinicId,
    'nombre': name,
    'descripcion': description,
    'precio': price,
    'activo': active ? 1 : 0,
  };

  @override
  String toString() => 'Servicios(id: $id, name: $name, precio: $price)';
}
