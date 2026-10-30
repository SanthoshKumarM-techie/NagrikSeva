import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import configureSession from './config/session.js';
import setupSwagger from './config/swagger.js';
import apiRouter from './routes/index.js';
import errorHandler from './middlewares/errorHandler.js';
import notFound from './middlewares/notFound.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Trust proxy for secure cookies behind reverse proxy (e.g. Nginx / Railway)
app.set('trust proxy', 1);

// CORS configuration
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
  : ['http://localhost:5173', 'http://127.0.0.1:5173'];

app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (like mobile apps, curl, postman)
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    return callback(new Error('Blocked by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Express Session
app.use(configureSession());

// Static uploads directory
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Swagger Documentation
setupSwagger(app);

// Root greeting
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'NagrikSeva API',
    description: 'Digital Citizen Services Platform REST API',
    version: '1.0.0',
    documentation: '/api-docs',
    endpoints: '/api/v1'
  });
});

// API Routes
app.use('/api/v1', apiRouter);

// 404 & Global Error Handler
app.use(notFound);
app.use(errorHandler);

export default app;

