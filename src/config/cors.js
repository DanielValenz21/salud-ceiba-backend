import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

const whitelist = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000', 'http://localhost:5173'];

export const corsOptions = cors({
  origin: (origin, cb) => {
    // Permitir requests sin origin (como Swagger UI, Postman, etc.)
    if (!origin) return cb(null, true);
    
    // Permitir origins de la whitelist
    if (whitelist.includes(origin)) return cb(null, true);
    
    // En desarrollo, permitir localhost
    if (process.env.NODE_ENV !== 'production' && origin.includes('localhost')) {
      return cb(null, true);
    }
    
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}); 