// backend/src/scripts/reset.ts
import { supabase } from '../supabaseClient';
import { sendWhatsAppMessage } from '../utils/sendWhatsApp';

async function autoExpireAndNotifyDeals() {
  console.log('🕓 Running deal reset cron job...');

  // 1. Find all active deals that have expired
  const { data: expiredDeals, error: fetchError } = await supabase
    .from('deals')
    .select('*')
    .eq('status', 'active')
    .lt('end_time', new Date().toISOString());

  if (fetchError) {
    console.error('❌ Error fetching expired deals:', fetchError.message);
    return;
  }

  if (!expiredDeals || expiredDeals.length === 0) {
    console.log('✅ No expired deals to process.');
    return;
  }

  for (const deal of expiredDeals) {
    const dealId = deal.id;
    const minParticipants = deal.min_participants || 1;
    const currentParticipants = deal.current_participants || 0;

    // 2. Mark failed deals
    if (currentParticipants < minParticipants) {
      console.log(`❌ Marking deal ${deal.product_name} as FAILED`);

      const { error: updateError } = await supabase
        .from('deals')
        .update({
          status: 'failed',
          ended_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', dealId);

      if (updateError) {
        console.error(`Error updating deal ${dealId} to failed:`, updateError.message);
        continue;
      }

      // 3. Set refund_status for all participants
      const { data: participants, error: partError } = await supabase
        .from('participants')
        .select('*')
        .eq('deal_id', dealId);

      if (partError) {
        console.error(`Error fetching participants for deal ${dealId}:`, partError.message);
        continue;
      }

      for (const p of participants || []) {
        await supabase
          .from('participants')
          .update({ refund_status: 'initiated' })
          .eq('id', p.id);

        // 4. Send WhatsApp "deal failed" message
        const message = `😞 Sorry! The deal "${deal.product_name}" failed as only ${currentParticipants} of ${minParticipants} participants joined. A refund is being initiated.`;
        await sendWhatsAppMessage(p.phone_number, message);
      }

    } else {
      // (Optional) Send success WhatsApp message
      const { data: participants } = await supabase
        .from('participants')
        .select('phone_number')
        .eq('deal_id', dealId);

      for (const p of participants || []) {
        const message = `🎉 Great news! The deal "${deal.product_name}" succeeded with ${currentParticipants} participants. Shipping soon!`;
        await sendWhatsAppMessage(p.phone_number, message);
      }
    }
  }

  console.log('✅ Deal reset cron job completed.');
}

autoExpireAndNotifyDeals().catch((err) => {
  console.error('🚨 Unexpected error in cron job:', err);
});
