import cors from "cors";

export const corsOptionsRaw = {
  origin: true, // <- acepta CUALQUIER Origin (solo para DEV)
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 204,
};

export const corsMiddleware = cors(corsOptionsRaw);