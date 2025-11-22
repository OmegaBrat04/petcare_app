import 'package:flutter/foundation.dart';
import 'package:latlong2/latlong.dart';
import 'package:petcare_app/App/Modelo/Clinica.dart';
import 'package:petcare_app/App/Servicios/api_service.dart';

class VeterinariaController extends ChangeNotifier {
  static final Distance _dist = const Distance();

  List<Clinica> _veterinarias = [];
  bool _loading = false;
  String? _error;

  List<Clinica> get veterinarias => List.unmodifiable(_veterinarias);
  bool get loading => _loading;
  String? get error => _error;

  /// Cargar veterinarias desde API
  Future<void> fetchVeterinarias() async {
    _loading = true;
    _error = null;
    notifyListeners();

    try {
      final result = await ApiService.getVeterinarias();

      if (result['success'] == true) {
        final list = (result['data'] as List<dynamic>? ?? []);
        _veterinarias =
            list
                .map((json) => Clinica.fromJson(json as Map<String, dynamic>))
                .toList();
        debugPrint(
          '✅ [VeterinariaController] ${_veterinarias.length} veterinarias cargadas',
        );
      } else {
        _error =
            result['message']?.toString() ?? 'Error al cargar veterinarias';
        debugPrint('❌ [VeterinariaController] $_error');
      }
    } catch (e, st) {
      _error = e.toString();
      debugPrint('❌ [VeterinariaController] Exception: $e\n$st');
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  /// Distancia entre dos puntos en kilómetros
  static double distanceKm(LatLng a, LatLng b) {
    return _dist.as(LengthUnit.Kilometer, a, b);
  }

  /// Filtra y ordena clínicas por radio (km)
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

  /// Filtrar veterinarias actuales por radio
  List<Clinica> getByRadius({
    required LatLng center,
    required double radiusKm,
  }) {
    return byRadius(clinics: _veterinarias, center: center, radiusKm: radiusKm);
  }
}

class _ClinicaWithD {
  final Clinica c;
  final double d;
  _ClinicaWithD(this.c, this.d);
}
