import 'dart:ui';
import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:geolocator/geolocator.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'package:petcare_app/App/Controlador/mascota_controller.dart';
import 'package:petcare_app/App/Modelo/Clinica.dart';
import 'package:petcare_app/App/Servicios/api_service.dart';
import 'package:petcare_app/App/Controlador/veterinaria_controller.dart';

const _kPrimary = Color(0xFF2F76A6);
const _kPrimaryDark = Color(0xFF0E3A5C);

class GeolocalizadorPage extends StatefulWidget {
  const GeolocalizadorPage({super.key});

  @override
  State<GeolocalizadorPage> createState() => _GeolocalizadorPageState();
}

class _GeolocalizadorPageState extends State<GeolocalizadorPage> {
  MapController? _mapController;
  StreamSubscription<MapEvent>? _mapSub;
  final LatLng _center = const LatLng(-12.046374, -77.042793);
  LatLng _lastMapCenter = const LatLng(-12.046374, -77.042793);
  double _lastZoom = 14;
  LatLng? _currentPosition;
  bool _isLoadingLocation = false;
  bool _isLoadingClinics = false;
  String _mapType = 'streets';

  final TextEditingController _searchCtrl = TextEditingController();
  String _searchQuery = '';

  List<String> _petNames = [];

  /// 0 = Mapa, 1 = Lista
  int _viewIndex = 0;
  final List<double> _radiusOptions = const [2, 5, 10, 20];
  double _radiusKm = 5;

  final List<Clinica> _clinicasAll = [];
  final List<Clinica> _clinicas = [];
  final List<Marker> _allMarkers = [];

  @override
  void initState() {
    super.initState();
    _mapController = MapController();
    _mapSub = _mapController!.mapEventStream.listen((evt) {
      _lastMapCenter = evt.camera.center;
      _lastZoom = evt.camera.zoom;
    });
    _searchCtrl.addListener(() {
      final q = _searchCtrl.text.trim();
      if (q != _searchQuery) {
        _searchQuery = q;
        _applyFilters();
      }
    });
    _checkLocationPermission();
    _loadPetNames();
    _loadClinics();
  }

  @override
  void dispose() {
    _mapSub?.cancel();
    _searchCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadPetNames() async {
    try {
      final mc = Provider.of<PetController>(context, listen: false);
      final names = await mc.getPetNames(); // debe devolver List<String>
      if (!mounted) return;
      setState(() => _petNames = names);
    } catch (e) {
      debugPrint('Error cargando nombres de mascotas: $e');
    }
  }

  Future<void> _loadClinics() async {
    setState(() => _isLoadingClinics = true);
    try {
      final result = await ApiService.getClinicas();
      if (!mounted) return;
      _clinicasAll
        ..clear()
        ..addAll(result.where((c) => c.lat != null && c.lon != null));

      _buildAllMarkers();
      _applyFilters();
    } catch (e) {
      debugPrint('Error cargando clínicas: $e');
      _toast('No se pudieron cargar las clínicas.');
    } finally {
      if (mounted) setState(() => _isLoadingClinics = false);
    }
  }

  void _buildAllMarkers() {
    _allMarkers
      ..clear()
      ..addAll(
        _clinicasAll.map((c) {
          final pos = LatLng(c.lat!, c.lon!);
          return Marker(
            point: pos,
            width: 40,
            height: 40,
            child: GestureDetector(
              onTap: () => _showClinicInfo(c),
              child: const Icon(Icons.local_hospital, color: _kPrimaryDark),
            ),
          );
        }),
      );
    setState(() {});
  }

  void _recenter() {
    if (_currentPosition != null) {
      _mapController?.move(_currentPosition!, 15);
    }
  }

  void _applyFilters() {
    // 1. Aplica radio
    List<Clinica> base;
    if (_currentPosition == null) {
      base = List.from(_clinicasAll);
    } else {
      base = VeterinariaController.byRadius(
        clinics: _clinicasAll,
        center: _currentPosition!,
        radiusKm: _radiusKm,
      );
    }

    // 2. Aplica búsqueda
    final q = _searchQuery.toLowerCase();
    if (q.isNotEmpty) {
      base =
          base.where((c) {
            final nombre = (c.name).toLowerCase();
            final direccion = (c.address ?? '').toLowerCase();
            final servicios = (c.servicios ?? [])
                .map((s) => s.name.toLowerCase())
                .join(' ');
            return nombre.contains(q) ||
                direccion.contains(q) ||
                servicios.contains(q);
          }).toList();
    }

    setState(() {
      _clinicas
        ..clear()
        ..addAll(base);
    });
  }

  void _simulateGetLocation() {
    _getCurrentLocation();
  }

  Future<void> _checkLocationPermission() async {
    bool serviceEnabled;
    LocationPermission permission;

    serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      _toast('Los servicios de ubicación están desactivados');
      return;
    }

    permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        _toast('Permisos de ubicación denegados');
        return;
      }
    }

    if (permission == LocationPermission.deniedForever) {
      _toast('Los permisos de ubicación están permanentemente denegados');
      return;
    }

    _getCurrentLocation();
  }

  Future<void> _getCurrentLocation() async {
    setState(() => _isLoadingLocation = true);
    try {
      Position position = await Geolocator.getCurrentPosition();
      setState(() {
        _currentPosition = LatLng(position.latitude, position.longitude);
        _isLoadingLocation = false;
      });
      _mapController?.move(_currentPosition!, 15);
      _lastMapCenter = _currentPosition!;
      _lastZoom = 15;
      _applyFilters();
    } catch (e) {
      _toast('Error al obtener ubicación');
      setState(() => _isLoadingLocation = false);
    }
  }

  void _showClinicInfo(Clinica c) {
    _openClinicSheet(c);
  }

  List<Marker> get _markers {
    final markers = List<Marker>.from(_allMarkers);
    if (_currentPosition != null) {
      markers.add(
        Marker(
          point: _currentPosition!,
          width: 40,
          height: 40,
          child: const Icon(Icons.my_location, color: Colors.blue),
        ),
      );
    }
    return markers;
  }

  void _focusClinic(String idOrName) {
    Clinica? c;
    try {
      c = _clinicas.firstWhere(
        (x) => x.name == idOrName || x.id.toString() == idOrName,
      );
    } catch (e) {
      c = null;
    }

    if (c == null || c.lat == null || c.lon == null) return;
    final pos = LatLng(c.lat!, c.lon!);
    if (_viewIndex != 0) setState(() => _viewIndex = 0);
    _mapController?.move(pos, 16);
  }

  void _toast(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
  }

  @override
  Widget build(BuildContext context) {
    final padding = MediaQuery.of(context).padding;

    return Scaffold(
      backgroundColor: Colors.white,
      body: Stack(
        children: [
          // Mapa o Lista
          IndexedStack(
            index: _viewIndex,
            children: [
              FlutterMap(
                mapController: _mapController,
                options: MapOptions(
                  initialCenter: _lastMapCenter,
                  initialZoom: _lastZoom,
                      ),
                      children: [
                        TileLayer(
                          urlTemplate:
                              _mapType == 'streets'
                                  ? 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
                                  : 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
                          userAgentPackageName: 'com.example.petcare_app',
                        ),
                        MarkerLayer(markers: _markers),
                      ],
                    ),
                     _FullScreenList(
                      clinics: _clinicas,
                      onOpen: _openClinicSheet,
                      onRoute: (n) => _focusClinic(n),
                      onTapCard: (n) => _focusClinic(n),
                    ),
            ],
          ),

          // ======== TOP BAR FLOTANTE (tono azul) ========
          SafeArea(
            bottom: false,
            child: Padding(
              padding: EdgeInsets.fromLTRB(16, padding.top > 0 ? 0 : 8, 16, 0),
              child: Column(
                children: [
                  _FrostedAppBar(
                    title: 'Veterinarias cercanas',
                    subtitle:
                        _currentPosition == null ? 'Localizando…' : 'Ubicado',
                    loading: _isLoadingLocation,
                    onBack: () => Navigator.of(context).maybePop(),
                  ),
                  const SizedBox(height: 10),
                  _FloatingSearch(
                    controller: _searchCtrl,
                    hint: 'Buscar por nombre, calle o servicio…',
                    onClear: () {
                      _searchCtrl.clear();
                      _searchQuery = '';
                      _applyFilters();
                    },
                    onChanged: (_) => _applyFilters(),
                    onSubmitted: (_) => _applyFilters(),
                  ),
                  const SizedBox(height: 10),
                  _RadiusFilterRow(
                    optionsKm: _radiusOptions,
                    selectedKm: _radiusKm,
                    onChanged: (km) {
                      setState(() => _radiusKm = km);
                      _applyFilters();
                    },
                    enabled: _currentPosition != null,
                  ),
                  const SizedBox(height: 10),
                ],
              ),
            ),
          ),

          // ======== HOJA DESLIZABLE (LISTA) SOBRE MAPA ========
          if (_viewIndex == 0)
            _SnapSheet(
              child: _ClinicsList(
                clinics: _clinicas,
                onOpen: (c) {
                  _focusClinic(c.id.toString());
                  _openClinicSheet(c);
                },
                onRoute: (id) {
                  _focusClinic(id);
                  _toast('Trazando ruta…');
                },
                onTapCard: (id) => _focusClinic(id),
                loading: _isLoadingClinics,
              ),
            ),

          // ======== CONTROLES FLOTANTES DERECHA ========
          Positioned(
            right: 16,
            bottom: 16 + MediaStorePadding.of(context),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                _SegmentedViewSwitch(
                  index: _viewIndex,
                  onChanged: (i) => setState(() => _viewIndex = i),
                ),
                const SizedBox(height: 10),
                _RoundButton(
                  icon: Icons.layers_outlined,
                  tooltip: 'Cambiar tipo de mapa',
                  onTap:
                      () => setState(() {
                        _mapType =
                            _mapType == 'streets' ? 'satellite' : 'streets';
                      }),
                ),
                const SizedBox(height: 10),
                _RoundButton(
                  icon: Icons.my_location,
                  tooltip: 'Centrar en mi ubicación',
                  onTap: _recenter,
                ),
                const SizedBox(height: 10),
                _CTAButton(
                  label: 'Mi ubicación',
                  icon: Icons.location_searching,
                  onTap: _simulateGetLocation,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _openClinicSheet(Clinica c) {
    final meta = _buildMeta(c);
    final tags =
        (c.servicios ?? [])
            .map((s) => s.name)
            .where((e) => e.trim().isNotEmpty)
            .take(6)
            .toList();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
      ),
      builder: (ctx) {
        return Padding(
          padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).padding.bottom),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const SizedBox(height: 8),
              Container(
                width: 52,
                height: 5,
                decoration: BoxDecoration(
                  color: Colors.black12,
                  borderRadius: BorderRadius.circular(999),
                ),
              ),
              ListTile(
                leading: CircleAvatar(
                  backgroundColor: _kPrimary.withOpacity(.15),
                  child: const Icon(Icons.local_hospital, color: _kPrimaryDark),
                ),
                title: Text(
                  c.name,
                  style: const TextStyle(fontWeight: FontWeight.w900),
                ),
                subtitle: Text(c.address ?? 'Dirección no disponible'),
                trailing: const _RatingBadge(rating: 4.7),
              ),
              if (tags.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
                  child: Wrap(
                    spacing: 6,
                    runSpacing: 6,
                    children: tags.map((t) => _Tag(t)).toList(),
                  ),
                ),
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                child: Align(
                  alignment: Alignment.centerLeft,
                  child: Text(
                    meta,
                    style: const TextStyle(fontWeight: FontWeight.w600),
                  ),
                ),
              ),
              const Divider(height: 1),
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
                child: Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () {
                          Navigator.pop(context);
                          _showAgendarCitaForm(c);
                        },
                        icon: const Icon(Icons.event_available),
                        label: const Text('Agendar cita'),
                      ),
                    ),
                    const SizedBox(width: 12),
                    
                  ],
                ),
              ),
              const SizedBox(height: 12),
            ],
          ),
        );
      },
    );
  }

  void _showAgendarCitaForm(Clinica clinic) {
    final mascotaController = TextEditingController();
    final telefonoController = TextEditingController();
    final motivoController = TextEditingController();
    DateTime? fechaSeleccionada;
    String? servicioSeleccionado;

    // Servicios ejemplo (vendrían de la veterinaria)
    final servicios = (clinic.servicios ?? []).map((s) => s.name).toList();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setState) {
            return Container(
              height: MediaQuery.of(context).size.height * 0.85,
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
              ),
              child: Column(
                children: [
                  // Header
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: _kPrimary.withOpacity(0.1),
                      borderRadius: const BorderRadius.vertical(
                        top: Radius.circular(22),
                      ),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.pets, color: _kPrimaryDark),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Agendar Cita',
                                style: TextStyle(
                                  fontSize: 20,
                                  fontWeight: FontWeight.bold,
                                  color: _kPrimaryDark,
                                ),
                              ),
                              Text(
                                clinic.name,
                                style: TextStyle(
                                  color: _kPrimaryDark.withOpacity(0.7),
                                ),
                              ),
                            ],
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.close),
                          onPressed: () => Navigator.pop(context),
                          color: _kPrimaryDark,
                        ),
                      ],
                    ),
                  ),

                  // Formulario
                  Expanded(
                    child: SingleChildScrollView(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Nombre de la mascota
                          _FormField(
                            title: 'Mascota',
                            child: Autocomplete<String>(
                              optionsBuilder: (
                                TextEditingValue textEditingValue,
                              ) {
                                final input =
                                    textEditingValue.text.toLowerCase();
                                if (input.isEmpty) {
                                  return const Iterable<String>.empty();
                                }
                                return _petNames.where(
                                  (p) => p.toLowerCase().contains(input),
                                );
                              },
                              displayStringForOption: (option) => option,
                              fieldViewBuilder: (
                                context,
                                controller,
                                focusNode,
                                onFieldSubmitted,
                              ) {
                                mascotaController.text = controller.text;
                                controller.addListener(() {
                                  // mantener sincronía entre controllers
                                  if (mascotaController.text !=
                                      controller.text) {
                                    mascotaController.text = controller.text;
                                    mascotaController.selection =
                                        controller.selection;
                                  }
                                });
                                return TextField(
                                  controller: controller,
                                  focusNode: focusNode,
                                  decoration: const InputDecoration(
                                    hintText: 'Nombre de su mascota',
                                    prefixIcon: Icon(Icons.pets),
                                    border: OutlineInputBorder(),
                                  ),
                                );
                              },
                              onSelected: (selection) {
                                mascotaController.text = selection;
                              },
                              optionsViewBuilder: (
                                context,
                                onSelected,
                                options,
                              ) {
                                return Material(
                                  elevation: 4,
                                  borderRadius: BorderRadius.circular(8),
                                  child: ListView.separated(
                                    padding: const EdgeInsets.symmetric(
                                      vertical: 8,
                                    ),
                                    shrinkWrap: true,
                                    itemCount: options.length,
                                    separatorBuilder:
                                        (_, __) => const Divider(height: 1),
                                    itemBuilder: (ctx, i) {
                                      final opt = options.elementAt(i);
                                      return ListTile(
                                        title: Text(opt),
                                        onTap: () => onSelected(opt),
                                      );
                                    },
                                  ),
                                );
                              },
                            ),
                          ),
                          const SizedBox(height: 20),

                          // Servicio requerido
                          _FormField(
                            title: 'Servicio requerido',
                            child: DropdownButtonFormField<String>(
                              value: servicioSeleccionado,
                              decoration: const InputDecoration(
                                prefixIcon: Icon(Icons.medical_services),
                                border: OutlineInputBorder(),
                              ),
                              hint: const Text('Seleccione el servicio'),
                              items:
                                  servicios.map((String value) {
                                    return DropdownMenuItem<String>(
                                      value: value,
                                      child: Text(value),
                                    );
                                  }).toList(),
                              onChanged: (val) {
                                setState(() => servicioSeleccionado = val);
                              },
                            ),
                          ),
                          const SizedBox(height: 20),

                          // Fecha
                          _FormField(
                            title: 'Fecha preferida',
                            child: InkWell(
                              onTap: () async {
                                final fecha = await showDatePicker(
                                  context: context,
                                  initialDate: DateTime.now().add(
                                    const Duration(days: 1),
                                  ),
                                  firstDate: DateTime.now(),
                                  lastDate: DateTime.now().add(
                                    const Duration(days: 30),
                                  ),
                                  builder: (context, child) {
                                    return Theme(
                                      data: Theme.of(context).copyWith(
                                        colorScheme: ColorScheme.light(
                                          primary: _kPrimary,
                                          onPrimary: Colors.white,
                                          surface: Colors.white,
                                          onSurface: _kPrimaryDark,
                                        ),
                                      ),
                                      child: child!,
                                    );
                                  },
                                );
                                if (fecha != null) {
                                  setState(() => fechaSeleccionada = fecha);
                                }
                              },
                              child: InputDecorator(
                                decoration: const InputDecoration(
                                  prefixIcon: Icon(Icons.calendar_today),
                                  border: OutlineInputBorder(),
                                ),
                                child: Text(
                                  fechaSeleccionada == null
                                      ? 'Seleccione una fecha'
                                      : DateFormat(
                                        'EEEE d MMMM, y',
                                        'es',
                                      ).format(fechaSeleccionada!),
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(height: 20),

                          // Teléfono
                          _FormField(
                            title: 'Teléfono de contacto',
                            child: TextField(
                              controller: telefonoController,
                              decoration: const InputDecoration(
                                hintText: '(999) 999-9999',
                                prefixIcon: Icon(Icons.phone),
                                border: OutlineInputBorder(),
                              ),
                              keyboardType: TextInputType.phone,
                              inputFormatters: [
                                FilteringTextInputFormatter.digitsOnly,
                              ],
                            ),
                          ),
                          const SizedBox(height: 20),

                          // Motivo
                          _FormField(
                            title: 'Motivo de la consulta',
                            child: TextField(
                              controller: motivoController,
                              maxLines: 3,
                              decoration: const InputDecoration(
                                hintText: 'Describa el motivo de su visita...',
                                border: OutlineInputBorder(),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                  // Botón de enviar
                  Container(
                    padding: EdgeInsets.fromLTRB(
                      16,
                      16,
                      16,
                      16 + MediaQuery.of(context).padding.bottom,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.05),
                          blurRadius: 10,
                          offset: const Offset(0, -5),
                        ),
                      ],
                    ),
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: _kPrimary,
                        foregroundColor: Colors.white,
                        minimumSize: const Size.fromHeight(50),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      onPressed: () {
                        // Aquí iría la lógica de envío
                        Navigator.pop(context);
                        _toast(
                          'Solicitud enviada. La clínica confirmará el horario.',
                        );
                      },
                      child: const Text(
                        'Solicitar Cita',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }
}

String _formatHora(String? h) {
  if (h == null || h.isEmpty) return '';
  try {
    if (h.contains('T')) {
      final dt = DateTime.parse(h);
      return '${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
    }
    final parts = h.split(':');
    if (parts.length >= 2) {
      return '${parts[0].padLeft(2, '0')}:${parts[1].padLeft(2, '0')}';
    }
  } catch (e) {
    debugPrint('Error formateando hora: $e');
  }
  return h;
}

String _buildMeta(Clinica c) {
  final ha = _formatHora(c.horarioApertura);
  final hc = _formatHora(c.horarioCierre);
  // SOLO mostrar horario, SIN servicios
  return (ha.isNotEmpty && hc.isNotEmpty)
      ? 'L–D $ha–$hc'
      : 'Horario no disponible';
}

// ============================ SUBWIDGETS / UI ============================

class _FullScreenList extends StatelessWidget {
  final List<Clinica> clinics;
  final void Function(Clinica) onOpen;
  final void Function(String id) onRoute;
  final void Function(String id) onTapCard;
  const _FullScreenList({
    required this.clinics,
    required this.onOpen,
    required this.onRoute,
    required this.onTapCard,
  });

  @override
  Widget build(BuildContext context) {
    return ListView.separated(
      padding: EdgeInsets.fromLTRB(16, kToolbarHeight + 140, 16, 16),
      itemCount: clinics.length,
      separatorBuilder: (_, __) => const SizedBox(height: 10),
      itemBuilder: (_, i) {
        final c = clinics[i];
        final tags = (c.servicios ?? []).map((s) => s.name).take(6).toList();
        return _ClinicCard(
          id: c.id.toString(),
          name: c.name,
          address: c.address ?? '',
          meta: _buildMeta(c), // Ya está correcto
          tags: tags,
          onOpen: () => onOpen(c),
          onRoute: () => onRoute(c.id.toString()),
          onTapCard: () => onTapCard(c.id.toString()),
        );
      },
    );
  }
}

// ====== Barra frosted con tono azul (pedido) ======
class _FrostedAppBar extends StatelessWidget {
  final String title;
  final String subtitle;
  final bool loading;
  final VoidCallback onBack;
  const _FrostedAppBar({
    required this.title,
    required this.subtitle,
    required this.loading,
    required this.onBack,
  });

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(14),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 14, sigmaY: 14),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
          decoration: BoxDecoration(
            color: _kPrimary.withOpacity(.28), // azul translúcido
            border: Border.all(color: Colors.white.withOpacity(.20)),
            borderRadius: BorderRadius.circular(14),
            boxShadow: [
              BoxShadow(
                color: _kPrimaryDark.withOpacity(.15),
                blurRadius: 18,
                offset: const Offset(0, 6),
              ),
            ],
          ),
          child: Row(
            children: [
              _IconButtonGlass(icon: Icons.arrow_back, onTap: onBack),
              const SizedBox(width: 8),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Veterinarias cercanas',
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w900,
                        fontSize: 16,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Row(
                      children: [
                        Icon(
                          Icons.circle,
                          size: 8,
                          color:
                              loading
                                  ? Colors.orangeAccent
                                  : Colors.lightGreenAccent,
                        ),
                        const SizedBox(width: 6),
                        Text(
                          subtitle,
                          style: TextStyle(
                            color: Colors.white.withOpacity(.9),
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _FloatingSearch extends StatelessWidget {
  final TextEditingController controller;
  final String hint;
  final VoidCallback onClear;
  final ValueChanged<String>? onSubmitted;
  final ValueChanged<String>? onChanged;
  const _FloatingSearch({
    required this.controller,
    required this.hint,
    required this.onClear,
    this.onSubmitted,
    this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      elevation: 0,
      color: Colors.transparent,
      child: Container(
        height: 48,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: Colors.black12),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(.07),
              blurRadius: 14,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: Row(
          children: [
            const SizedBox(width: 12),
            const Icon(Icons.search, color: _kPrimaryDark),
            const SizedBox(width: 8),
            Expanded(
              child: TextField(
                controller: controller,
                decoration: InputDecoration(
                  hintText: hint,
                  border: InputBorder.none,
                ),
                textInputAction: TextInputAction.search,
                onSubmitted: onSubmitted,
                onChanged: onChanged,
              ),
            ),
            ValueListenableBuilder<TextEditingValue>(
              valueListenable: controller,
              builder:
                  (_, v, __) =>
                      v.text.isEmpty
                          ? const SizedBox(width: 8)
                          : IconButton(
                            onPressed: onClear,
                            icon: const Icon(
                              Icons.close_rounded,
                              color: Colors.blueGrey,
                            ),
                            splashRadius: 18,
                          ),
            ),
          ],
        ),
      ),
    );
  }
}

// ...existing code...
class _RadiusFilterRow extends StatelessWidget {
  final List<double> optionsKm;
  final double selectedKm;
  final ValueChanged<double> onChanged;
  final bool enabled;
  const _RadiusFilterRow({
    required this.optionsKm,
    required this.selectedKm,
    required this.onChanged,
    this.enabled = true,
  });

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 8,
      children:
          optionsKm.map((km) {
            final sel = km == selectedKm;
            return ChoiceChip(
              label: Text('${km.toStringAsFixed(km >= 10 ? 0 : 0)} km'),
              selected: sel,
              onSelected: enabled ? (_) => onChanged(km) : null,
              selectedColor: _kPrimary.withOpacity(.15),
              labelStyle: TextStyle(
                color: sel ? _kPrimaryDark : Colors.black87,
                fontWeight: FontWeight.w700,
              ),
              backgroundColor: Colors.white,
              shape: StadiumBorder(
                side: BorderSide(color: sel ? _kPrimary : Colors.black12),
              ),
            );
          }).toList(),
    );
  }
}

class _SnapSheet extends StatelessWidget {
  final Widget child;
  const _SnapSheet({required this.child});

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      initialChildSize: .22,
      minChildSize: .18,
      maxChildSize: .88,
      snap: true,
      snapSizes: const [.22, .5, .88],
      builder: (ctx, controller) {
        return Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
            boxShadow: [
              BoxShadow(
                color: Color(0x1A000000),
                blurRadius: 16,
                offset: Offset(0, -4),
              ),
            ],
          ),
          child: Column(
            children: [
              const SizedBox(height: 10),
              Container(
                width: 48,
                height: 5,
                decoration: BoxDecoration(
                  color: Colors.black12,
                  borderRadius: BorderRadius.circular(999),
                ),
              ),
              const SizedBox(height: 8),
              Expanded(
                child: ListView(
                  controller: controller,
                  padding: const EdgeInsets.fromLTRB(12, 0, 12, 16),
                  children: [child],
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _ClinicsList extends StatelessWidget {
  final List<Clinica> clinics;
  final void Function(Clinica) onOpen;
  final void Function(String id) onRoute;
  final void Function(String id) onTapCard;
  final bool loading;
  const _ClinicsList({
    required this.clinics,
    required this.onOpen,
    required this.onRoute,
    required this.onTapCard,
    this.loading = false,
  });

  @override
  Widget build(BuildContext context) {
    if (loading) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(24.0),
          child: CircularProgressIndicator(),
        ),
      );
    }
    return Column(
      children: [
        for (final c in clinics) ...[
          _ClinicCard(
            id: c.id.toString(),
            name: c.name,
            address: c.address ?? '',
            meta: _buildMeta(c),
            tags: (c.servicios ?? []).map((s) => s.name).take(6).toList(),
            onOpen: () => onOpen(c),
            onRoute: () => onRoute(c.id.toString()),
            onTapCard: () => onTapCard(c.id.toString()),
          ),
          const SizedBox(height: 10),
        ],
      ],
    );
  }
}

class _ClinicCard extends StatelessWidget {
  final String id;
  final String name;
  final String address;
  final String meta;
  final List<String> tags;
  final VoidCallback onOpen;
  final VoidCallback onRoute;
  final VoidCallback onTapCard;

  const _ClinicCard({
    required this.id,
    required this.name,
    required this.address,
    required this.meta,
    required this.tags,
    required this.onOpen,
    required this.onRoute,
    required this.onTapCard,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 0,
      color: Colors.white,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onTapCard,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(12, 10, 12, 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  CircleAvatar(
                    backgroundColor: _kPrimary.withOpacity(.15),
                    child: const Icon(
                      Icons.local_hospital,
                      color: _kPrimaryDark,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      name,
                      style: const TextStyle(
                        fontWeight: FontWeight.w900,
                        fontSize: 16,
                      ),
                    ),
                  ),
                  const _RatingBadge(rating: 4.6),
                ],
              ),
              const SizedBox(height: 6),
              Text(address, style: const TextStyle(color: Colors.black87)),
              const SizedBox(height: 4),
              if (tags.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.only(top: 8),
                  child: Wrap(
                    spacing: 6,
                    runSpacing: 6,
                    children: tags.map((t) => _Tag(t)).toList(),
                  ),
                ),

              const SizedBox(height: 8),
              Text(meta, style: const TextStyle(fontWeight: FontWeight.w600)),
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: onOpen,
                      icon: const Icon(Icons.event_available),
                      label: const Text('Agendar cita'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SegmentedViewSwitch extends StatelessWidget {
  final int index;
  final ValueChanged<int> onChanged;
  const _SegmentedViewSwitch({required this.index, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    return SegmentedButton<int>(
      segments: const [
        ButtonSegment(value: 0, icon: Icon(Icons.map), label: Text('Mapa')),
        ButtonSegment(
          value: 1,
          icon: Icon(Icons.list_alt),
          label: Text('Lista'),
        ),
      ],
      selected: {index},
      onSelectionChanged: (s) => onChanged(s.first),
      style: ButtonStyle(
        backgroundColor: WidgetStateProperty.all(
          Colors.white.withOpacity(.95),
        ),
        side: WidgetStateProperty.all(
          BorderSide(color: Colors.black12.withOpacity(.5)),
        ),
        padding: WidgetStateProperty.all(
          const EdgeInsets.symmetric(horizontal: 8),
        ),
      ),
    );
  }
}

class _IconButtonGlass extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;
  const _IconButtonGlass({required this.icon, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(10),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
        child: Material(
          color: _kPrimary.withOpacity(.30), // azul translúcido del botón
          child: InkWell(
            onTap: onTap,
            child: Padding(
              padding: const EdgeInsets.all(8),
              child: Icon(icon, color: Colors.white.withOpacity(.95)),
            ),
          ),
        ),
      ),
    );
  }
}

class _RoundButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;
  final String? tooltip;
  const _RoundButton({required this.icon, required this.onTap, this.tooltip});

  @override
  Widget build(BuildContext context) {
    return Tooltip(
      message: tooltip ?? '',
      child: Material(
        color: Colors.white,
        shape: const CircleBorder(),
        elevation: 2,
        child: InkWell(
          customBorder: const CircleBorder(),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.all(10.0),
            child: Icon(icon, color: _kPrimaryDark, size: 20),
          ),
        ),
      ),
    );
  }
}

class _CTAButton extends StatelessWidget {
  final String label;
  final IconData icon;
  final VoidCallback onTap;
  const _CTAButton({
    required this.label,
    required this.icon,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ElevatedButton.icon(
      style: ElevatedButton.styleFrom(
        backgroundColor: _kPrimary,
        foregroundColor: Colors.white,
        elevation: 2,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      ),
      onPressed: onTap,
      icon: Icon(icon),
      label: Text(label),
    );
  }
}

class _Tag extends StatelessWidget {
  final String text;
  const _Tag(this.text);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: _kPrimary.withOpacity(.10),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: _kPrimary.withOpacity(.25)),
      ),
      child: Text(
        text,
        style: const TextStyle(
          color: _kPrimaryDark,
          fontWeight: FontWeight.w800,
          fontSize: 12,
        ),
      ),
    );
  }
}

class _RatingBadge extends StatelessWidget {
  final double rating;
  const _RatingBadge({required this.rating});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.amber.withOpacity(.2),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.amber.withOpacity(.6)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.star, size: 16, color: Colors.amber),
          const SizedBox(width: 4),
          Text(
            rating.toStringAsFixed(1),
            style: const TextStyle(
              fontWeight: FontWeight.w900,
              color: Colors.black87,
            ),
          ),
        ],
      ),
    );
  }
}

// ===== Utilidad: padding inferior seguro
class MediaStorePadding {
  static double of(BuildContext context) =>
      MediaQuery.of(context).padding.bottom;
}

class _FormField extends StatelessWidget {
  final String title;
  final Widget child;

  const _FormField({required this.title, required this.child});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: _kPrimaryDark,
          ),
        ),
        const SizedBox(height: 8),
        child,
      ],
    );
  }
}
