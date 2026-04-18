import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import { env } from './config/env';
import './config/passport'; // Initialize passport strategies
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';

const app = express();

// Security
const allowedOrigins = env.FRONTEND_URL.split(',').map((o) => o.trim());

app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Logging
app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));

// Passport
app.use(passport.initialize());

// Body parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health check (for UptimeRobot pings)
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api', routes);

// Global error handler (must be last)
app.use(errorHandler);

export default app;
