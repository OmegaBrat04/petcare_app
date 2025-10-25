import 'package:flutter/material.dart';

class Menu extends StatefulWidget{
  @override
  State<Menu> createState() => _MenuState();


}
class _MenuState extends State<Menu>{
  @override
  Widget build (BuildContext context){
    return Scaffold(
      appBar: AppBar(
        title: Text('Menú Principal'),
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: <Widget>[
            ElevatedButton(
              onPressed: () {
                Navigator.pushNamed(context, '/formularioMascota');
              },
              child: Text('Agregar Mascota'),
            ),
            SizedBox(height: 20),
            ElevatedButton(
              onPressed: () {
                Navigator.pushNamed(context, '/PacientesListScreen');
              },
              child: Text('Ver Mascotas'),
            ),
          ],
        ),
      ),
    );
  }
}