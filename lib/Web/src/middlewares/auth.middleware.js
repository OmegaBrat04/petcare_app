const jwt = require("jsonwebtoken");

const JWT_SECRET =
  process.env.JWT_SECRET ||
  "980h_F3l$K9tB0zPzW!aQnRvYmCgX1dE2pA4sU7jL6iT8oH5eD0fG2uI4vJ6";

module.exports = (req, res, next) => {
  let token =
    req.headers.authorization ||
    req.headers.Authorization ||
    req.headers["x-access-token"];

  console.log("🔐 [auth] Headers:", {
    authorization: req.headers.authorization,
  });

  if (typeof token === "string" && token.startsWith("Bearer ")) {
    token = token.slice(7);
  }

  if (!token) {
    console.log("❌ [auth] Token no proporcionado");
    return res
      .status(401)
      .json({ success: false, message: "Token no proporcionado" });
  }

  console.log("🔑 [auth] Token:", token.substring(0, 20) + "...");

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    console.log("✅ [auth] Payload:", payload);

    const userId = payload.id || payload.IdUsuario || payload.idUsuario;
    if (!userId) {
      console.log("❌ [auth] userId no encontrado en payload");
      return res
        .status(401)
        .json({ success: false, message: "Token inválido" });
    }

    req.user = { ...payload, id: userId, idUsuario: userId };
    console.log("✅ [auth] req.user asignado:", req.user);
    return next();
  } catch (e) {
    console.error("❌ [auth] Error verificando token:", e.message);
    return res
      .status(401)
      .json({ success: false, message: "Token inválido o expirado" });
  }
};
