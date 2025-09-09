"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabase = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const supabase_js_1 = require("@supabase/supabase-js");
const logger_1 = require("./middleware/logger");
const errorHandler_1 = require("./middleware/errorHandler");
const health_1 = __importDefault(require("./routes/health"));
const whatsapp_1 = __importDefault(require("./routes/whatsapp"));
const deals_1 = __importDefault(require("./routes/deals"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
exports.supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const corsOptions = {
    origin: [process.env.FRONTEND_URL || 'http://localhost:5173', 'null', '*'],
    credentials: true,
    optionsSuccessStatus: 200,
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
};
app.use((0, cors_1.default)(corsOptions));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
app.use(logger_1.requestLogger);
app.use('/health', health_1.default);
app.use('/whatsapp', whatsapp_1.default);
app.use('/api', deals_1.default);
const whatsappController_1 = require("./controllers/whatsappController");
app.post('/webhook/whatsapp', express_1.default.urlencoded({ extended: false }), whatsappController_1.handleWebhook);
app.post('/whatsapp/webhook', express_1.default.urlencoded({ extended: false }), whatsappController_1.handleWebhook);
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
app.get('/api/deals', async (req, res) => {
    try {
        const { data, error } = await exports.supabase.from('deals').select('*').order('created_at', { ascending: false });
        if (error)
            return res.status(500).json({ success: false, error });
        return res.json({ success: true, data });
    }
    catch (error) {
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
});
app.post('/api/deals', async (req, res) => {
    try {
        const payload = {
            ...req.body,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            status: 'active',
        };
        const { data, error } = await exports.supabase.from('deals').insert(payload).select();
        if (error)
            return res.status(400).json({ success: false, error });
        return res.status(201).json({ success: true, data: data[0], message: 'Deal created successfully' });
    }
    catch (error) {
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
});
app.put('/api/deals/:id', async (req, res) => {
    try {
        const { data, error } = await exports.supabase
            .from('deals')
            .update({ ...req.body, updated_at: new Date().toISOString() })
            .eq('id', req.params.id)
            .select();
        if (error)
            return res.status(400).json({ success: false, error });
        return res.json({ success: true, data: data[0], message: 'Deal updated successfully' });
    }
    catch (error) {
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
});
app.delete('/api/deals/:id', async (req, res) => {
    try {
        const { error } = await exports.supabase.from('deals').delete().eq('id', req.params.id);
        if (error)
            return res.status(400).json({ success: false, error });
        return res.json({ success: true, message: 'Deal deleted successfully' });
    }
    catch (error) {
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
});
app.get('/api/deals/:id/participants', async (req, res) => {
    try {
        const { data, error } = await exports.supabase.from('participants').select('*').eq('deal_id', req.params.id);
        if (error)
            return res.status(500).json({ success: false, error });
        return res.json({ success: true, data });
    }
    catch (error) {
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
});
app.get('/api/analytics', async (req, res) => {
    try {
        const { count: totalDeals } = await exports.supabase.from('deals').select('*', { count: 'exact', head: true });
        const { count: totalParticipants } = await exports.supabase.from('participants').select('*', { count: 'exact', head: true });
        const { data: revenueData } = await exports.supabase.from('participants').select('deal_id');
        const dealIds = revenueData?.map(p => p.deal_id) || [];
        let totalRevenue = 0;
        if (dealIds.length) {
            const { data: dealPrices } = await exports.supabase.from('deals').select('id, group_price').in('id', dealIds);
            totalRevenue = (dealPrices || []).reduce((sum, d) => sum + (d.group_price || 0), 0);
        }
        const { data: allDeals } = await exports.supabase.from('deals').select('status');
        const dealsByStatus = {};
        (allDeals || []).forEach(d => {
            const status = d.status || 'unknown';
            dealsByStatus[status] = (dealsByStatus[status] || 0) + 1;
        });
        const { data: completedDeals } = await exports.supabase.from('deals').select('created_at, group_price, status').eq('status', 'finished');
        const revenueByMonthMap = {};
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
    }
    catch (error) {
        console.error('Error fetching analytics:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch analytics' });
    }
});
app.get('/api/users', async (req, res) => {
    try {
        console.log('📋 Fetching users from database...');
        const { data: users, error } = await exports.supabase
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
    }
    catch (error) {
        console.error('❌ Server error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});
app.put('/api/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        console.log(`📝 Updating user ${id}:`, updates);
        delete updates.id;
        delete updates.created_at;
        const { data, error } = await exports.supabase
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
    }
    catch (error) {
        console.error('❌ Server error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});
app.patch('/api/users/:id/blacklist', async (req, res) => {
    try {
        const { id } = req.params;
        const { blacklist } = req.body;
        const { data, error } = await exports.supabase
            .from('users')
            .update({ blacklist })
            .eq('id', id)
            .select();
        if (error)
            return res.status(400).json({ success: false, error });
        return res.json({ success: true, data: data[0], message: `User ${blacklist ? 'blacklisted' : 'whitelisted'} successfully` });
    }
    catch (error) {
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
});
app.get('/api/users/:phone/deals', async (req, res) => {
    try {
        const { phone } = req.params;
        console.log(`📊 Fetching deals for user: ${phone}`);
        const { data: participants, error } = await exports.supabase
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
    }
    catch (error) {
        console.error('❌ Server error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});
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
app.use(errorHandler_1.notFoundHandler);
app.use(errorHandler_1.errorHandler);
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 CORS enabled for: ${corsOptions.origin}`);
    console.log(`🎯 API documentation: http://localhost:${PORT}/`);
});
//# sourceMappingURL=index.js.map