import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import authRoutes from './routes/authRoutes.js';
import communityMembershipRoutes from './routes/communityMembership.js';
import communityFeedRoutes from './routes/communityFeed.js';
import universityRoutes from './routes/universityRoutes.js';
import profileRoutes from './routes/profile.js';

const allowedOrigins = (env.corsOrigin ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Origin not allowed by CORS policy.'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, message: 'Too many requests. Please retry shortly.' },
  skipSuccessfulRequests: false,
});

const sanitizeLogMessage = (message) =>
  String(message ?? '').replace(/Bearer\s+[A-Za-z0-9\-._~+/=]+/gi, 'Bearer [REDACTED]');

export const app = express();

app.disable('x-powered-by');
app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: false,
    frameguard: { action: 'deny' },
    hidePoweredBy: true,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  }),
);
app.use(cookieParser());
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
    message: { ok: false, message: 'Too many requests. Please retry shortly.' },
  }),
);
app.use('/api/auth', authRateLimiter);
app.use(express.json({ limit: '1mb', strict: true }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));

app.get('/api/health', (req, res) => {
  const mode = env.supabaseUrl ? 'supabase-auth-enabled' : 'auth-disabled';
  res.json({
    ok: true,
    service: 'campus-crypt-api',
    authProvider: 'supabase',
    mode,
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/universities', universityRoutes);
app.use('/api/universities', communityMembershipRoutes);
app.use('/api/universities', communityFeedRoutes);
app.use('/api/users', profileRoutes);

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({
      ok: false,
      message: 'Malformed JSON request body.',
    });
  }

  if (err?.message === 'Origin not allowed by CORS policy.') {
    return res.status(403).json({
      ok: false,
      message: 'Origin not allowed by CORS policy.',
    });
  }

  console.error({
    route: req.originalUrl,
    message: sanitizeLogMessage(err?.message ?? 'Unexpected server error.'),
  });

  res.status(500).json({
    ok: false,
    message: 'Unexpected server error.',
  });
});

export default app;
