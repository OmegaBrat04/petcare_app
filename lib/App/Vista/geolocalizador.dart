import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

const _kPrimary = Color(0xFF2F76A6);
const _kPrimaryDark = Color(0xFF0E3A5C);

class GeolocalizadorPage extends StatefulWidget {
  const GeolocalizadorPage({super.key});

  @override
  State<GeolocalizadorPage> createState() => _GeolocalizadorPageState();
}

class _GeolocalizadorPageState extends State<GeolocalizadorPage> {
  GoogleMapController? _mapController;

  final LatLng _center = const LatLng(-12.046374, -77.042793);
  LatLng? _currentPosition;
  bool _isLoadingLocation = false;
  MapType _mapType = MapType.normal;

  final TextEditingController _searchCtrl = TextEditingController();
  final Set<String> _activeFilters = {'Consulta'};

  /// 0 = Mapa, 1 = Lista
  int _viewIndex = 0;

  // ---- Datos “fake” de clínicas y posiciones
  final List<Marker> _baseMarkers = const [
    Marker(
      markerId: MarkerId('vet1'),
      position: LatLng(-12.046374, -77.042793),
      infoWindow: InfoWindow(title: 'Vet Centro Norte', snippet: 'Av. Los Olivos 123'),
    ),
    Marker(
      markerId: MarkerId('vet2'),
      position: LatLng(-12.050000, -77.045000),
      infoWindow: InfoWindow(title: 'Clínica Mascotitas', snippet: 'Calle Sol 45'),
    ),
    Marker(
      markerId: MarkerId('vet3'),
      position: LatLng(-12.040000, -77.040000),
      infoWindow: InfoWindow(title: 'Vet Express', snippet: 'Jr. Lima 780'),
    ),
  ];

  final Map<String, LatLng> _clinicPositions = const {
    'Vet Centro Norte': LatLng(-12.046374, -77.042793),
    'Clínica Mascotitas': LatLng(-12.050000, -77.045000),
    'Vet Express': LatLng(-12.040000, -77.040000),
  };

  List<({String name, String address, String meta, List<String> tags})> get _clinics =>
      const [
        (
          name: 'Vet Centro Norte',
          address: 'Av. Los Olivos 123',
          meta: 'L–S 8:00–20:00 • Consulta, Vacunas, Rayos X',
          tags: ['Consulta', 'Vacunas', 'Rayos X']
        ),
        (
          name: 'Clínica Mascotitas',
          address: 'Calle Sol 45',
          meta: 'L–V 9:00–18:00 • Consulta, Cirugía',
          tags: ['Consulta', 'Cirugía']
        ),
        (
          name: 'Vet Express',
          address: 'Jr. Lima 780',
          meta: '24h • Urgencias, Hospitalización, Eco',
          tags: ['24h', 'Urgencias', 'Eco']
        ),
      ];

  // ---- Pulso de resaltado
  Set<Circle> _pulseCircles = {};

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  void _onMapCreated(GoogleMapController controller) {
    _mapController = controller;
    _simulateGetLocation();
  }

  Future<void> _simulateGetLocation() async {
    setState(() => _isLoadingLocation = true);
    await Future.delayed(const Duration(milliseconds: 900));
    const simulated = LatLng(-12.0464, -77.0428);
    setState(() {
      _currentPosition = simulated;
      _isLoadingLocation = false;
    });
    await _mapController?.animateCamera(
      CameraUpdate.newCameraPosition(
        const CameraPosition(target: simulated, zoom: 15.0),
      ),
    );
  }

  Future<void> _recenter() async {
    final target = _currentPosition ?? _center;
    await _mapController?.animateCamera(
      CameraUpdate.newCameraPosition(
        CameraPosition(target: target, zoom: 15),
      ),
    );
  }

  // ---- Enfoque + “bounce” (zoom breve) + pulso circular
  Future<void> _focusClinic(String name) async {
    final pos = _clinicPositions[name];
    if (pos == null || _mapController == null) return;

    // Cambia a vista mapa si no estás en ella
    if (_viewIndex != 0) {
      setState(() => _viewIndex = 0);
      // da un pequeño tiempo para montar el mapa antes de animar
      await Future.delayed(const Duration(milliseconds: 120));
    }

    // Animación de cámara (zoom-in -> zoom-out) simulando “bounce”
    await _mapController!.animateCamera(
      CameraUpdate.newCameraPosition(CameraPosition(target: pos, zoom: 16.8)),
    );
    await Future.delayed(const Duration(milliseconds: 120));
    await _mapController!.animateCamera(
      CameraUpdate.newCameraPosition(CameraPosition(target: pos, zoom: 15.6)),
    );

    // Pulso (círculo que se expande y desvanece)
    final id = CircleId('pulse_${DateTime.now().millisecondsSinceEpoch}');
    setState(() {
      _pulseCircles = {
        ..._pulseCircles,
        Circle(
          circleId: id,
          center: pos,
          radius: 30,
          strokeWidth: 2,
          strokeColor: _kPrimary.withOpacity(.9),
          fillColor: _kPrimary.withOpacity(.15),
        ),
      };
    });

    // Expandir el círculo un par de veces
    Future<void> _grow(double r, double op) async {
      setState(() {
        _pulseCircles = _pulseCircles.map((c) {
          if (c.circleId == id) {
            return c.copyWith(
              radiusParam: r,
              strokeColorParam: _kPrimary.withOpacity(op),
              fillColorParam: _kPrimary.withOpacity(op * .2),
            );
          }
          return c;
        }).toSet();
      });
      await Future.delayed(const Duration(milliseconds: 140));
    }

    await _grow(80, .7);
    await _grow(120, .45);
    await _grow(150, .25);

    // Remover pulso
    setState(() {
      _pulseCircles = _pulseCircles.where((c) => c.circleId != id).toSet();
    });
  }

  Set<Marker> get _markers {
    final set = Set<Marker>.from(_baseMarkers);
    if (_currentPosition != null) {
      set.add(
        Marker(
          markerId: const MarkerId('current_location'),
          position: _currentPosition!,
          icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueAzure),
          infoWindow: const InfoWindow(title: 'Mi ubicación', snippet: 'Estás aquí'),
        ),
      );
    }
    return set;
  }

  void _toggleFilter(String tag) {
    setState(() {
      if (_activeFilters.contains(tag)) {
        _activeFilters.remove(tag);
      } else {
        _activeFilters.add(tag);
      }
    });
    _toast(_activeFilters.isEmpty ? 'Filtro: Ninguno' : 'Filtro: ${_activeFilters.join(', ')}');
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
          // ======== CAPA MAPA / LISTA FULL ========
          AnimatedSwitcher(
            duration: const Duration(milliseconds: 250),
            child: _viewIndex == 0
                ? _FullScreenMap(
                    key: const ValueKey('map'),
                    onMapCreated: _onMapCreated,
                    initial: _center,
                    markers: _markers,
                    circles: _pulseCircles,
                    mapType: _mapType,
                  )
                : _FullScreenList(
                    key: const ValueKey('list'),
                    clinics: _clinics,
                    onOpen: (c) {
                      // En “Lista”: al abrir ficha, también enfocamos el mapa
                      _focusClinic(c.name);
                      _openClinicSheet(c);
                    },
                    onCall: (n) => _toast('Llamando a $n…'),
                    onRoute: (n) {
                      _focusClinic(n);
                      _toast('Trazando ruta hacia $n…');
                    },
                    onTapCard: (n) => _focusClinic(n),
                  ),
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
                    subtitle: _currentPosition == null ? 'Localizando…' : 'Ubicado',
                    loading: _isLoadingLocation,
                    onBack: () => Navigator.of(context).maybePop(),
                  ),
                  const SizedBox(height: 10),
                  _FloatingSearch(
                    controller: _searchCtrl,
                    hint: 'Buscar por nombre, calle o servicio…',
                    onClear: () => setState(_searchCtrl.clear),
                    onSubmitted: (_) => _toast('Buscar: ${_searchCtrl.text}'),
                  ),
                  const SizedBox(height: 10),
                  _FiltersRow(
                    active: _activeFilters,
                    onTap: _toggleFilter,
                  ),
                ],
              ),
            ),
          ),

          // ======== HOJA DESLIZABLE (LISTA) SOBRE MAPA ========
          if (_viewIndex == 0)
            _SnapSheet(
              child: _ClinicsList(
                clinics: _clinics,
                onOpen: (c) {
                  _focusClinic(c.name);
                  _openClinicSheet(c);
                },
                onCall: (n) => _toast('Llamando a $n…'),
                onRoute: (n) {
                  _focusClinic(n);
                  _toast('Trazando ruta hacia $n…');
                },
                onTapCard: (n) => _focusClinic(n),
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
                  onTap: () => setState(() {
                    _mapType = _mapType == MapType.normal ? MapType.hybrid : MapType.normal;
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

  void _openClinicSheet(({String name, String address, String meta, List<String> tags}) c) {
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
                  color: Colors.black12, borderRadius: BorderRadius.circular(999),
                ),
              ),
              ListTile(
                leading: CircleAvatar(
                  backgroundColor: _kPrimary.withOpacity(.15),
                  child: const Icon(Icons.local_hospital, color: _kPrimaryDark),
                ),
                title: Text(c.name, style: const TextStyle(fontWeight: FontWeight.w900)),
                subtitle: Text(c.address),
                trailing: const _RatingBadge(rating: 4.7),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 10),
                child: Align(
                  alignment: Alignment.centerLeft,
                  child: Wrap(
                    spacing: 6, runSpacing: -6, children: c.tags.map((t) => _Tag(t)).toList(),
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                child: Align(
                  alignment: Alignment.centerLeft,
                  child: Text(c.meta, style: const TextStyle(fontWeight: FontWeight.w600)),
                ),
              ),
              const Divider(height: 1),
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
                child: Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () => _toast('Llamando…'),
                        icon: const Icon(Icons.call),
                        label: const Text('Llamar'),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: _kPrimary, foregroundColor: Colors.white,
                        ),
                        onPressed: () => _toast('Abrir en Maps…'),
                        icon: const Icon(Icons.directions),
                        label: const Text('Cómo llegar'),
                      ),
                    ),
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
}

// ============================ SUBWIDGETS / UI ============================

class _FullScreenMap extends StatelessWidget {
  final void Function(GoogleMapController) onMapCreated;
  final LatLng initial;
  final Set<Marker> markers;
  final Set<Circle> circles;
  final MapType mapType;
  const _FullScreenMap({
    super.key,
    required this.onMapCreated,
    required this.initial,
    required this.markers,
    required this.circles,
    required this.mapType,
  });

  @override
  Widget build(BuildContext context) {
    return GoogleMap(
      onMapCreated: onMapCreated,
      initialCameraPosition: CameraPosition(target: initial, zoom: 14),
      mapType: mapType,
      markers: markers,
      circles: circles,
      zoomControlsEnabled: false,
      myLocationEnabled: false,
      myLocationButtonEnabled: false,
      buildingsEnabled: true,
      compassEnabled: false,
    );
  }
}

class _FullScreenList extends StatelessWidget {
  final List<({String name, String address, String meta, List<String> tags})> clinics;
  final void Function(({String name, String address, String meta, List<String> tags})) onOpen;
  final void Function(String) onCall;
  final void Function(String) onRoute;
  final void Function(String) onTapCard;

  const _FullScreenList({
    super.key,
    required this.clinics,
    required this.onOpen,
    required this.onCall,
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
        return _ClinicCard(
          name: c.name,
          address: c.address,
          meta: c.meta,
          tags: c.tags,
          onOpen: () => onOpen(c),
          onCall: () => onCall(c.name),
          onRoute: () => onRoute(c.name),
          onTapCard: () => onTapCard(c.name),
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
                    Text('Veterinarias cercanas',
                        style: const TextStyle(
                            color: Colors.white, fontWeight: FontWeight.w900, fontSize: 16)),
                    const SizedBox(height: 2),
                    Row(
                      children: [
                        Icon(Icons.circle,
                            size: 8, color: loading ? Colors.orangeAccent : Colors.lightGreenAccent),
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
              _IconButtonGlass(
                icon: Icons.tune,
                onTap: () => ScaffoldMessenger.of(context)
                    .showSnackBar(const SnackBar(content: Text('Opciones…'))),
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
  const _FloatingSearch({
    required this.controller,
    required this.hint,
    required this.onClear,
    this.onSubmitted,
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
            BoxShadow(color: Colors.black.withOpacity(.07), blurRadius: 14, offset: const Offset(0, 6))
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
                decoration: InputDecoration(hintText: hint, border: InputBorder.none),
                textInputAction: TextInputAction.search,
                onSubmitted: onSubmitted,
              ),
            ),
            ValueListenableBuilder<TextEditingValue>(
              valueListenable: controller,
              builder: (_, v, __) => v.text.isEmpty
                  ? const SizedBox(width: 8)
                  : IconButton(
                      onPressed: onClear,
                      icon: const Icon(Icons.close_rounded, color: Colors.blueGrey),
                      splashRadius: 18,
                    ),
            ),
          ],
        ),
      ),
    );
  }
}

class _FiltersRow extends StatelessWidget {
  final Set<String> active;
  final void Function(String) onTap;
  const _FiltersRow({required this.active, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final tags = const ['Consulta', 'Vacunas', 'Cirugía', '24h', 'Urgencias'];
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: [
          for (final t in tags) ...[
            _ChipSelectable(
              label: t,
              selected: active.contains(t),
              onTap: () => onTap(t),
            ),
            const SizedBox(width: 8),
          ],
        ],
      ),
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
            boxShadow: [BoxShadow(color: Color(0x1A000000), blurRadius: 16, offset: Offset(0, -4))],
          ),
          child: Column(
            children: [
              const SizedBox(height: 10),
              Container(
                width: 48,
                height: 5,
                decoration: BoxDecoration(
                  color: Colors.black12, borderRadius: BorderRadius.circular(999),
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
  final List<({String name, String address, String meta, List<String> tags})> clinics;
  final void Function(({String name, String address, String meta, List<String> tags})) onOpen;
  final void Function(String) onCall;
  final void Function(String) onRoute;
  final void Function(String) onTapCard;

  const _ClinicsList({
    required this.clinics,
    required this.onOpen,
    required this.onCall,
    required this.onRoute,
    required this.onTapCard,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        for (final c in clinics) ...[
          _ClinicCard(
            name: c.name,
            address: c.address,
            meta: c.meta,
            tags: c.tags,
            onOpen: () => onOpen(c),
            onCall: () => onCall(c.name),
            onRoute: () => onRoute(c.name),
            onTapCard: () => onTapCard(c.name),
          ),
          const SizedBox(height: 10),
        ],
      ],
    );
  }
}

class _ClinicCard extends StatelessWidget {
  final String name;
  final String address;
  final String meta;
  final List<String> tags;
  final VoidCallback onOpen;
  final VoidCallback onCall;
  final VoidCallback onRoute;
  final VoidCallback onTapCard;

  const _ClinicCard({
    required this.name,
    required this.address,
    required this.meta,
    required this.tags,
    required this.onOpen,
    required this.onCall,
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
        onTap: onTapCard, // tap rápido centra y hace bounce
        child: Padding(
          padding: const EdgeInsets.fromLTRB(12, 10, 12, 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(children: [
                CircleAvatar(
                  backgroundColor: _kPrimary.withOpacity(.15),
                  child: const Icon(Icons.local_hospital, color: _kPrimaryDark),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(name, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16)),
                ),
                const _RatingBadge(rating: 4.6),
              ]),
              const SizedBox(height: 6),
              Text(address, style: const TextStyle(color: Colors.black87)),
              const SizedBox(height: 4),
              Text(meta, style: const TextStyle(fontWeight: FontWeight.w600)),
              const SizedBox(height: 8),
              Wrap(spacing: 6, runSpacing: -6, children: tags.map((t) => _Tag(t)).toList()),
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: onCall,
                      icon: const Icon(Icons.call),
                      label: const Text('Llamar'),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: _kPrimary, foregroundColor: Colors.white,
                      ),
                      onPressed: onRoute,
                      icon: const Icon(Icons.directions),
                      label: const Text('Ruta'),
                    ),
                  ),
                ],
              )
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
        ButtonSegment(value: 1, icon: Icon(Icons.list_alt), label: Text('Lista')),
      ],
      selected: {index},
      onSelectionChanged: (s) => onChanged(s.first),
      style: ButtonStyle(
        backgroundColor: WidgetStatePropertyAll(Colors.white.withOpacity(.95)),
        side: WidgetStatePropertyAll(BorderSide(color: Colors.black12.withOpacity(.5))),
        padding: const WidgetStatePropertyAll(EdgeInsets.symmetric(horizontal: 8)),
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
  const _CTAButton({required this.label, required this.icon, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return ElevatedButton.icon(
      style: ElevatedButton.styleFrom(
        backgroundColor: _kPrimary, foregroundColor: Colors.white, elevation: 2,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      ),
      onPressed: onTap,
      icon: Icon(icon),
      label: Text(label),
    );
  }
}

class _ChipSelectable extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;
  const _ChipSelectable({required this.label, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(999),
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: selected ? _kPrimary.withOpacity(.15) : Colors.white,
          borderRadius: BorderRadius.circular(999),
          border: Border.all(color: selected ? _kPrimary : Colors.black12),
        ),
        child: Row(mainAxisSize: MainAxisSize.min, children: [
          Icon(selected ? Icons.check_circle : Icons.circle_outlined,
              size: 16, color: selected ? _kPrimaryDark : Colors.black38),
          const SizedBox(width: 6),
          Text(label,
              style: TextStyle(
                fontWeight: FontWeight.w700,
                color: selected ? _kPrimaryDark : Colors.black87,
              )),
        ]),
      ),
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
          color: _kPrimaryDark, fontWeight: FontWeight.w800, fontSize: 12,
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
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        const Icon(Icons.star, size: 16, color: Colors.amber),
        const SizedBox(width: 4),
        Text(rating.toStringAsFixed(1),
            style: const TextStyle(fontWeight: FontWeight.w900, color: Colors.black87)),
      ]),
    );
  }
}

// ===== Utilidad: padding inferior seguro
class MediaStorePadding {
  static double of(BuildContext context) => MediaQuery.of(context).padding.bottom;
}
