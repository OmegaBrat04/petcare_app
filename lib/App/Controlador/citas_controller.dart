import 'package:flutter/foundation.dart';
import 'package:petcare_app/App/Servicios/api_service.dart';
import 'package:petcare_app/App/Modelo/EstatusCita.dart';
import 'package:petcare_app/App/Modelo/Mascotas.dart';
import 'package:petcare_app/App/Modelo/Clinica.dart';

class CitasController extends ChangeNotifier {
  List<Cita> _citas = [];
  bool _loading = false;
  String? _error;

  String? _statusFilter;
  int? _mascotaFilter;

  List<Cita> get citas => List.unmodifiable(_citas);
  bool get loading => _loading;
  String? get error => _error;
  String? get statusFilter => _statusFilter;
  int? get mascotaFilter => _mascotaFilter;

  Cita? get proximaCita {
    final ahora = DateTime.now();
    final futuras = _citas.where((c) =>
      (c.estatus == Estatus.pending || c.estatus == Estatus.confirmed) &&
      c.fechaPreferida.isAfter(ahora)
    ).toList()..sort((a, b) => a.fechaPreferida.compareTo(b.fechaPreferida));
    
    return futuras.isNotEmpty ? futuras.first : null;
  }

  Map<String, List<Cita>> get citasPorFecha {
    final Map<String, List<Cita>> agrupadas = {};
    for (final cita in _citas) {
      final key = _formatDate(cita.fechaPreferida);
      agrupadas.putIfAbsent(key, () => []).add(cita);
    }
    return agrupadas;
  }

  String _formatDate(DateTime date) {
    return '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year}';
  }

  // ✅ Resolver nombre de mascota desde ID
  String getMascotaNombre(int mascotaId, List<Mascota> mascotas) {
    try {
      return mascotas.firstWhere((m) => m.idMascota == mascotaId).nombre;
    } catch (_) {
      return 'Mascota';
    }
  }

  // ✅ Resolver nombre de veterinaria desde ID
  String getVeterinariaNombre(int veterinariaId, List<Clinica> veterinarias) {
    try {
      return veterinarias.firstWhere((v) => v.id == veterinariaId).name;
    } catch (_) {
      return 'Veterinaria';
    }
  }

  // ✅ Inicial de mascota
  String getPetInitial(int mascotaId, List<Mascota> mascotas) {
    final nombre = getMascotaNombre(mascotaId, mascotas);
    return nombre.isNotEmpty ? nombre[0].toUpperCase() : '?';
  }

  Future<void> fetchCitas() async {
    _loading = true;
    _error = null;
    notifyListeners();

    try {
      final result = await ApiService.getCitas(
        status: _statusFilter,
        mascotaId: _mascotaFilter,
      );

      if (result['success'] == true) {
        final list = (result['data'] as List<dynamic>? ?? []);
        _citas = list.map((json) => Cita.fromJson(json as Map<String, dynamic>)).toList();
        debugPrint('✅ [CitasController] ${_citas.length} citas cargadas');
      } else {
        _error = result['message']?.toString() ?? 'Error al cargar citas';
        debugPrint('❌ [CitasController] $_error');
      }
    } catch (e, st) {
      _error = e.toString();
      debugPrint('❌ [CitasController] Exception: $e\n$st');
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  void setStatusFilter(String? status) {
    if (_statusFilter != status) {
      _statusFilter = status;
      fetchCitas();
    }
  }

  void setMascotaFilter(int? mascotaId) {
    if (_mascotaFilter != mascotaId) {
      _mascotaFilter = mascotaId;
      fetchCitas();
    }
  }

  void clearFilters() {
    _statusFilter = null;
    _mascotaFilter = null;
    fetchCitas();
  }

  Future<bool> updateStatus(int citaId, String newStatus) async {
    try {
      final result = await ApiService.updateCitaStatus(citaId, newStatus);
      if (result['success'] == true) {
        await fetchCitas();
        return true;
      }
      _error = result['message']?.toString() ?? 'Error al actualizar';
      notifyListeners();
      return false;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<bool> deleteCita(int citaId) async {
    try {
      final result = await ApiService.deleteCita(citaId);
      if (result['success'] == true) {
        await fetchCitas();
        return true;
      }
      _error = result['message']?.toString() ?? 'Error al eliminar';
      notifyListeners();
      return false;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }
}