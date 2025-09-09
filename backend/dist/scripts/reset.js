"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const supabaseClient_1 = require("../supabaseClient");
const sendWhatsApp_1 = require("../utils/sendWhatsApp");
async function autoExpireAndNotifyDeals() {
    console.log('🕓 Running deal reset cron job...');
    const { data: expiredDeals, error: fetchError } = await supabaseClient_1.supabase
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
        if (currentParticipants < minParticipants) {
            console.log(`❌ Marking deal ${deal.product_name} as FAILED`);
            const { error: updateError } = await supabaseClient_1.supabase
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
            const { data: participants, error: partError } = await supabaseClient_1.supabase
                .from('participants')
                .select('*')
                .eq('deal_id', dealId);
            if (partError) {
                console.error(`Error fetching participants for deal ${dealId}:`, partError.message);
                continue;
            }
            for (const p of participants || []) {
                await supabaseClient_1.supabase
                    .from('participants')
                    .update({ refund_status: 'initiated' })
                    .eq('id', p.id);
                const message = `😞 Sorry! The deal "${deal.product_name}" failed as only ${currentParticipants} of ${minParticipants} participants joined. A refund is being initiated.`;
                await (0, sendWhatsApp_1.sendWhatsAppMessage)(p.phone_number, message);
            }
        }
        else {
            const { data: participants } = await supabaseClient_1.supabase
                .from('participants')
                .select('phone_number')
                .eq('deal_id', dealId);
            for (const p of participants || []) {
                const message = `🎉 Great news! The deal "${deal.product_name}" succeeded with ${currentParticipants} participants. Shipping soon!`;
                await (0, sendWhatsApp_1.sendWhatsAppMessage)(p.phone_number, message);
            }
        }
    }
    console.log('✅ Deal reset cron job completed.');
}
autoExpireAndNotifyDeals().catch((err) => {
    console.error('🚨 Unexpected error in cron job:', err);
});
//# sourceMappingURL=reset.js.map