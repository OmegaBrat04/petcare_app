const db = require("../../config/db");

/*const uuid = require('uuid');
const uuidv4 = uuid.v4;*/
const { randomUUID } = require("crypto");
const path = require("path");
const fs = require("fs");

//Nota: Necesitarás un middleware para verificar el token JWT y obtener el IdUsuario.
// Por ahora, asumiremos que el IdUsuario viene del body o lo simularemos.

const registerPet = async (req, res) => {
  console.log("Datos recibidos:", {
    body: req.body,
    file: req.file
      ? {
          filename: req.file.filename,
          mimetype: req.file.mimetype,
          size: req.file.size,
        }
      : null,
  });
  // 1. Obtener datos del cuerpo (req.body)
  const idUsuario = req.user.idUsuario;
  const { nombre, especie, raza, sexo, peso, fechaNacimiento, edad } = req.body;

  console.log("Edad recibida:", edad, "Tipo:", typeof edad);

  const edadString = String(edad).trim();
  const edadInt = parseInt(edad, 10);

  if (isNaN(edadInt)) {
    console.log("Error de parseo edad:", {
      edadOriginal: edad,
      edadString: edadString,
      edadInt: edadInt,
    });

    // Si la edad no es un número válido, detiene la ejecución aquí
    if (req.file) fs.unlinkSync(req.file.path);
    return res.status(400).json({
      success: false,
      message: "La edad debe ser un número entero.",
      debug: {
        edadRecibida: edad,
        tipo: typeof edad,
      },
    });
  }

  // 2. Obtener la información del archivo subido (req.file)
  const file = req.file;

  if (!file || !nombre || !especie || !sexo || !fechaNacimiento) {
    // Asegúrate de limpiar el archivo si falla la validación
    if (file) fs.unlinkSync(file.path);
    return res
      .status(400)
      .json({
        success: false,
        message: "Faltan campos obligatorios o la foto.",
      });
  }

  try {
    // La URL final de la foto (simulamos que está en una carpeta pública)
    const rutaFoto = `/uploads/${file.filename}`;

    // 3. Insertar el nuevo registro en SQL Server
    const [idMascota] = await db("Mascotas").insert({
      IdUsuario: idUsuario,
      Foto: rutaFoto,
      Nombre: nombre,
      Especie: especie,
      Raza: raza || null,
      Sexo: sexo.substring(0, 1).toUpperCase(),
      Edad: edadInt,
      Peso: peso || null,
      FechaNacimiento: fechaNacimiento,
    });

    // 4. Devolver la respuesta de éxito
    return res.status(201).json({
      success: true,
      message: "Mascota registrada exitosamente.",
      idMascota: idMascota,
      fotoURL: rutaFoto,
    });
  } catch (error) {
    console.error("Error al registrar mascota en SQL Server:", error);
    if (file) fs.unlinkSync(file.path);
    return res
      .status(500)
      .json({ success: false, message: "Error interno del servidor." });
  }
};

module.exports = {
  registerPet,
};
