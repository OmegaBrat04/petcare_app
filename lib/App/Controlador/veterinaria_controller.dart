import 'package:latlong2/latlong.dart';
import 'package:petcare_app/App/Modelo/Clinica.dart';
class VeterinariaController {
  static final Distance _dist = const Distance();

  /// Distancia entre dos puntos en kilómetros.
  static double distanceKm(LatLng a, LatLng b) {
    return _dist.as(LengthUnit.Kilometer, a, b);
  }

  /// Filtra y ordena clínicas por radio (km) desde center.
  static List<Clinica> byRadius({
    required List<Clinica> clinics,
    required LatLng center,
    required double radiusKm,
  }) {
    final withCoords = clinics.where((c) => c.lat != null && c.lon != null);
    final filtered = <_ClinicaWithD>[];

    for (final c in withCoords) {
      final d = distanceKm(center, LatLng(c.lat!, c.lon!));
      if (d <= radiusKm) {
        filtered.add(_ClinicaWithD(c, d));
      }
    }

    filtered.sort((a, b) => a.d.compareTo(b.d));
    return filtered.map((e) => e.c).toList();
  }
}

class _ClinicaWithD {
  final Clinica c;
  final double d;
  _ClinicaWithD(this.c, this.d);
}