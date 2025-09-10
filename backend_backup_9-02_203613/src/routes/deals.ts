import express from 'express';
import { supabase } from '../supabaseClient';
import { sendWhatsAppMessage } from '../utils/sendWhatsApp'; // ✅ NEW LINE

const router = express.Router();

// GET /api/deals - Fetch all deals
router.get('/deals', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('deals')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return res.json({
      success: true,
      data,
      pagination: {
        page: 1,
        limit: data.length,
        total: data.length,
        totalPages: 1,
      },
    });
  } catch (err) {
    console.error('Error fetching deals:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch deals' });
  }
});

// POST /api/deals - Create a new deal
router.post('/deals', async (req, res) => {
  try {
    const deal = {
      ...req.body,
      status: 'active',
      current_participants: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase.from('deals').insert([deal]).select();

    if (error) throw error;

    return res.status(201).json({
      success: true,
      data,
      message: 'Deal created successfully',
    });
  } catch (err) {
    console.error('Error creating deal:', err);
    return res.status(500).json({ success: false, message: 'Failed to create deal' });
  }
});

// POST /api/deals/:id/join - Join a deal and auto-close if full
router.post('/deals/:id/join', async (req, res) => {
  const dealId = req.params.id;
  const { phone_number, quantity = 1 } = req.body;

  try {
    const { data: deal, error: dealError } = await supabase
      .from('deals')
      .select('*')
      .eq('id', dealId)
      .single();

    if (dealError || !deal) {
      return res.status(404).json({ success: false, message: 'Deal not found' });
    }

    if (deal.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Deal is not active' });
    }

    const now = new Date();
    const endTime = new Date(deal.end_time);

    if (now > endTime) {
      return res.status(400).json({ success: false, message: 'Deal has expired' });
    }

    const { data: existing, error: dupError } = await supabase
      .from('participants')
      .select('id')
      .eq('deal_id', dealId)
      .eq('phone_number', phone_number)
      .maybeSingle();

    if (dupError) throw dupError;
    if (existing) {
      return res.status(409).json({ success: false, message: 'User already joined this deal' });
    }

    const { error: insertError } = await supabase.from('participants').insert([{
      deal_id: dealId,
      phone_number,
      quantity,
      payment_status: 'paid',
      joined_at: now.toISOString(),
    }]);
    if (insertError) throw insertError;

    const newCount = (deal.current_participants || 0) + 1;

    const updates: any = {
      current_participants: newCount,
      updated_at: now.toISOString(),
    };

    if (deal.max_participants && newCount >= deal.max_participants) {
      updates.status = 'success';
      updates.ended_at = now.toISOString();
    }

    const { error: updateError } = await supabase
      .from('deals')
      .update(updates)
      .eq('id', dealId);

    if (updateError) throw updateError;

    // ✅ Send WhatsApp confirmation message
    const messageText =
      updates.status === 'success'
        ? `🎉 You joined the ${deal.product_name} deal as participant #${newCount}/${deal.max_participants}. The deal is now FULL and marked SUCCESS!`
        : `✅ You joined the ${deal.product_name} deal as participant #${newCount}/${deal.max_participants}. We'll notify you when it ends.`;
    await sendWhatsAppMessage(phone_number, messageText);

    return res.status(200).json({
      success: true,
      message: messageText,
    });
  } catch (err) {
    console.error('Error joining deal:', err);
    return res.status(500).json({ success: false, message: 'Failed to join deal' });
  }
});

// GET /api/deals/:id/status - Real-time deal progress
router.get('/deals/:id/status', async (req, res) => {
  const dealId = req.params.id;

  try {
    const { data: deal, error } = await supabase
      .from('deals')
      .select('id, product_name, status, current_participants, min_participants, max_participants, end_time')
      .eq('id', dealId)
      .single();

    if (error || !deal) {
      return res.status(404).json({ success: false, message: 'Deal not found' });
    }

    const now = new Date();
    const endTime = new Date(deal.end_time);
    const timeRemainingMs = endTime.getTime() - now.getTime();
    const timeRemainingMin = Math.max(Math.floor(timeRemainingMs / 60000), 0);

    const progressPercent = Math.round(
      (deal.current_participants / deal.max_participants) * 100
    );

    return res.json({
      success: true,
      deal_id: deal.id,
      product_name: deal.product_name,
      status: deal.status,
      joined: deal.current_participants,
      required: deal.max_participants,
      progress: `${deal.current_participants}/${deal.max_participants}`,
      progress_percent: progressPercent,
      time_remaining_minutes: timeRemainingMin,
    });
  } catch (err) {
    console.error('Error fetching deal status:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch deal status' });
  }
});

export default router;
