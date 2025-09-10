// backend/src/index.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { requestLogger } from './middleware/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import healthRoutes from './routes/health';
import whatsappRoutes from './routes/whatsapp';
import dealsRoutes from './routes/deals';

dotenv.config();

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
app.use('/health', healthRoutes);
app.use('/whatsapp', whatsappRoutes);
app.use('/api', dealsRoutes);

// ===== WHATSAPP WEBHOOK ENDPOINTS =====
// Add both webhook routes for flexibility
import { handleWebhook } from './controllers/whatsappController';
app.post('/webhook/whatsapp', express.urlencoded({ extended: false }), handleWebhook);
app.post('/whatsapp/webhook', express.urlencoded({ extended: false }), handleWebhook);

// =====  AUTHENTICATION ENDPOINTS =====

// 🔐 Mock login
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

// 🔐 Auth check
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

// ===== DEALS ENDPOINTS =====

// 📦 Get all deals
app.get('/api/deals', async (req, res) => {
  try {
    const { data, error } = await supabase.from('deals').select('*').order('created_at', { ascending: false });
    if (error) return res.status(500).json({ success: false, error });
    return res.json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// 📦 Create new deal
app.post('/api/deals', async (req, res) => {
  try {
    const payload = {
      ...req.body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: 'active',
    };

    const { data, error } = await supabase.from('deals').insert(payload).select();
    if (error) return res.status(400).json({ success: false, error });
    return res.status(201).json({ success: true, data: data[0], message: 'Deal created successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// 📦 Update deal
app.put('/api/deals/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('deals')
      .update({ ...req.body, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select();

    if (error) return res.status(400).json({ success: false, error });
    return res.json({ success: true, data: data[0], message: 'Deal updated successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// 📦 Delete deal
app.delete('/api/deals/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('deals').delete().eq('id', req.params.id);
    if (error) return res.status(400).json({ success: false, error });
    return res.json({ success: true, message: 'Deal deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// 👥 Get participants by Deal ID
app.get('/api/deals/:id/participants', async (req, res) => {
  try {
    const { data, error } = await supabase.from('participants').select('*').eq('deal_id', req.params.id);
    if (error) return res.status(500).json({ success: false, error });
    return res.json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ===== ANALYTICS ENDPOINTS =====

// 📊 Get analytics data
app.get('/api/analytics', async (req, res) => {
  try {
    const { count: totalDeals } = await supabase.from('deals').select('*', { count: 'exact', head: true });
    const { count: totalParticipants } = await supabase.from('participants').select('*', { count: 'exact', head: true });

    const { data: revenueData } = await supabase.from('participants').select('deal_id');
    const dealIds = revenueData?.map(p => p.deal_id) || [];

    let totalRevenue = 0;
    if (dealIds.length) {
      const { data: dealPrices } = await supabase.from('deals').select('id, group_price').in('id', dealIds);
      totalRevenue = (dealPrices || []).reduce((sum, d) => sum + (d.group_price || 0), 0);
    }

    const { data: allDeals } = await supabase.from('deals').select('status');
    const dealsByStatus: Record<string, number> = {};
    (allDeals || []).forEach(d => {
      const status = d.status || 'unknown';
      dealsByStatus[status] = (dealsByStatus[status] || 0) + 1;
    });

    const { data: completedDeals } = await supabase.from('deals').select('created_at, group_price, status').eq('status', 'finished');
    const revenueByMonthMap: Record<string, number> = {};
    (completedDeals || []).forEach(deal => {
      const month = new Date(deal.created_at).toLocaleString('default', { month: 'short', year: 'numeric' });
      revenueByMonthMap[month] = (revenueByMonthMap[month] || 0) + (deal.group_price || 0);
    });

    const revenueByMonth = Object.entries(revenueByMonthMap).map(([month, revenue]) => ({ month, revenue }));
    const finished = dealsByStatus['finished'] || 0;
    const successRate = totalDeals && finished ? (finished / totalDeals) * 100 : 0;

    return res.json({
      success: true,
      data: {
        activeDeals: dealsByStatus['active'] || 0,
        totalParticipants: totalParticipants || 0,
        totalRevenue,
        successRate,
        dealsByStatus,
        revenueByMonth,
      },
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch analytics' });
  }
});

// ===== USER MANAGEMENT ENDPOINTS =====

// 👥 Get all users
app.get('/api/users', async (req, res) => {
  try {
    console.log('📋 Fetching users from database...');
    
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Database error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch users',
        details: error.message
      });
    }

    console.log(`✅ Found ${users.length} users`);
    return res.json({
      success: true,
      data: users,
      count: users.length
    });

  } catch (error) {
    console.error('❌ Server error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// 👥 Update user
app.put('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    console.log(`📝 Updating user ${id}:`, updates);
    
    // Remove sensitive fields
    delete updates.id;
    delete updates.created_at;
    
    const { data, error } = await supabase
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ Update error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to update user'
      });
    }

    console.log('✅ User updated successfully');
    return res.json({
      success: true,
      data: data,
      message: 'User updated successfully'
    });

  } catch (error) {
    console.error('❌ Server error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// 👥 Toggle user blacklist status
app.patch('/api/users/:id/blacklist', async (req, res) => {
  try {
    const { id } = req.params;
    const { blacklist } = req.body;

    const { data, error } = await supabase
      .from('users')
      .update({ blacklist })
      .eq('id', id)
      .select();

    if (error) return res.status(400).json({ success: false, error });
    return res.json({ success: true, data: data[0], message: `User ${blacklist ? 'blacklisted' : 'whitelisted'} successfully` });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// 👥 Get user's deal history
app.get('/api/users/:phone/deals', async (req, res) => {
  try {
    const { phone } = req.params;
    
    console.log(`📊 Fetching deals for user: ${phone}`);
    
    const { data: participants, error } = await supabase
      .from('participants')
      .select(`
        *,
        deal:deals (
          id,
          product_name,
          status,
          group_price,
          original_price,
          end_time,
          created_at
        )
      `)
      .eq('phone_number', phone)
      .order('joined_at', { ascending: false });

    if (error) {
      console.error('❌ Database error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch user deals'
      });
    }

    console.log(`✅ Found ${participants?.length || 0} deals for user`);
    return res.json({
      success: true,
      data: participants || [],
      count: participants?.length || 0
    });

  } catch (error) {
    console.error('❌ Server error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// ===== ROOT ENDPOINT =====

// 🏁 Root endpoint with API documentation
app.get('/', (req, res) => {
  return res.json({
    success: true,
    message: 'Group Buying API server running ✅',
    version: '2.0',
    endpoints: [
      '/api/deals',
      '/api/deals/:id',
      '/api/auth/login',
      '/api/auth/me',
      '/api/deals/:id/participants',
      '/api/analytics',
      '/api/users',
      '/api/users/:id',
      '/api/users/:id/blacklist',
      '/api/users/:phone/deals',
      '/whatsapp/webhook',
      '/webhook/whatsapp'
    ],
  });
});

// ===== ERROR HANDLERS =====

app.use(notFoundHandler);
app.use(errorHandler);

// ===== START SERVER =====

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 CORS enabled for: ${corsOptions.origin}`);
  console.log(`🎯 API documentation: http://localhost:${PORT}/`);
});