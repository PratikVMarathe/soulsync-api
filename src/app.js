import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import healthRouter from './routes/health.js';
import cloudinaryRouter from './routes/cloudinary.js';

dotenv.config();

const app = express();

// Determine allowed origins
const defaultOrigins = [
  'http://localhost:5000',
  'http://localhost:5001',
  'http://localhost:5002',
  'http://localhost:5003',
  'http://localhost:5173',
  'https://soulsync-b29c8.web.app',
  'https://soulsync-b29c8.firebaseapp.com',
  'https://soulsync-prod-app.web.app',
  'https://soulsync-prod-app.firebaseapp.com',
];

const envOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean)
  : [];

const allowedOrigins = Array.from(new Set([...defaultOrigins, ...envOrigins]));

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (e.g. server-to-server, curl, Postman, health monitors)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Also match subdomain patterns for Firebase preview channels if needed
    if (
      origin.endsWith('.web.app')
      || origin.endsWith('.firebaseapp.com')
      || origin.includes('localhost')
      || origin.includes('127.0.0.1')
    ) {
      return callback(null, true);
    }

    return callback(new Error(`CORS origin not allowed: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// Mount routes
app.use('/health', healthRouter);
app.use('/api/cloudinary', cloudinaryRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'The requested API endpoint was not found.',
    },
  });
});

// Global error handler
app.use((err, req, res, _next) => {
  console.error('Unhandled server error:', err.message);

  if (err.message && err.message.startsWith('CORS origin not allowed')) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'CORS_FORBIDDEN',
        message: 'Origin not allowed by CORS policy.',
      },
    });
  }

  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected internal server error occurred.',
    },
  });
});

export default app;
