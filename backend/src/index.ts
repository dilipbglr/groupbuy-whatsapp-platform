// backend/src/index.ts
import dotenv from 'dotenv';
import path from 'path';

// ✅ Load environment variables FIRST, before any other imports
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import { requestLogger } from './middleware/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import healthRoutes from './routes/health';
import whatsappRoutes from './routes/whatsapp';
import dealsRoutes from './routes/deals';

console.log('✅ ENV DEBUG (Twilio):');
console.log('TWILIO_ACCOUNT_SID:', process.env.TWILIO_ACCOUNT_SID);
console.log('TWILIO_AUTH_TOKEN:', process.env.TWILIO_AUTH_TOKEN);
console.log('TWILIO_MESSAGING_SERVICE_SID:', process.env.TWILIO_MESSAGING_SERVICE_SID);

console.log('🔍 All ENV Vars Loaded:', process.env);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// ✅ Supabase client initialized globally (and exported for controllers)
export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

const corsOptions = {
  origin: [process.env.FRONTEND_URL || 'http://localhost:5173', 'null', '*'],
  credentials: true,
  optionsSuccessStatus: 200,
  allowedHeaders: ['Content-Type', 'Authorization'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// ✅ Register routes
app.use('/', healthRoutes); // Mount health routes at root level
app.use('/whatsapp', whatsappRoutes);
app.use('/api', dealsRoutes);

// ===== WHATSAPP WEBHOOK ENDPOINTS =====
import { handleWebhook } from './controllers/whatsappController';
app.post('/webhook/whatsapp', express.urlencoded({ extended: false }), handleWebhook);
app.post('/whatsapp/webhook', express.urlencoded({ extended: false }), handleWebhook);

// =====  AUTHENTICATION ENDPOINTS =====
app.post('/api/auth/login', (req, res) => {
  const { phone_number, phone, password } = req.body;
  const userPhone = phone_number || phone;

  if (userPhone === '+1234567890' && password === 'admin123') {
    return res.json({
      token: 'mock-jwt-token-123456',
      user: {
        id: '511e34c5-28ab-4a66-9c3f-660556737ofc',
        name: 'Admin User',
        phone_number: '+1234567890',
        is_admin: true,
      },
    });
  }

  if (userPhone === 'admin' && password === 'admin') {
    return res.json({
      token: 'mock-jwt-token-789012',
      user: {
        id: '210ef7ad-edbf-4e16-999b-6c12eb49fbf',
        name: 'Admin',
        phone_number: 'admin',
        is_admin: true,
      },
    });
  }

  return res.status(401).json({ message: 'Invalid phone number or password' });
});

app.get('/api/auth/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    if (token === 'mock-jwt-token-123456') {
      return res.json({
        success: true,
        user: {
          id: '511e34c5-28ab-4a66-9c3f-660556737ofc',
          name: 'Admin User',
          phone_number: '+1234567890',
          is_admin: true,
        },
      });
    }

    if (token === 'mock-jwt-token-789012') {
      return res.json({
        success: true,
        user: {
          id: '210ef7ad-edbf-4e16-999b-6c12eb49fbf',
          name: 'Admin',
          phone_number: 'admin',
          is_admin: true,
        },
      });
    }
  }
  return res.status(401).json({ success: false, message: 'Authentication required' });
});

// ✅ RAILWAY ROOT HEALTH ENDPOINT
app.get('/', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Group Buying API server running ✅',
    version: '2.0',
    timestamp: new Date().toISOString(),
  });
});

// ✅ ENHANCED HEALTH CHECK ENDPOINT
app.get('/healthcheck', (req, res) => {
  res.status(200).json({
    success: true,
    healthy: true,
    message: 'Group Buy API is healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '2.0',
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// ✅ (Optional but recommended) Add fallback health endpoints:
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'ok',
    service: 'group-buy-backend',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    api: 'healthy',
    endpoints: [
      '/api/deals', '/api/auth/login', '/api/analytics',
      '/api/users', '/whatsapp/webhook'
    ],
    timestamp: new Date().toISOString()
  });
});

app.get('/health/detailed', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      twilio: {
        enabled: !!process.env.TWILIO_MESSAGING_SERVICE_SID,
        sid: process.env.TWILIO_MESSAGING_SERVICE_SID?.slice(0, 6) + '****',
      },
    }
  });
});

// ===== ERROR HANDLERS =====
app.use(notFoundHandler);
app.use(errorHandler);

// 🚨 UNHANDLED ERRORS
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});

// ===== START SERVER =====
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 CORS enabled for: ${corsOptions.origin}`);
  console.log(`🎯 API documentation: http://localhost:${PORT}/`);
});

server.on('error', (err) => {
  console.error('❌ Server startup error:', err);
  process.exit(1);
});
