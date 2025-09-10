// backend/src/utils/sendWhatsApp.ts
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID!;
const authToken = process.env.TWILIO_AUTH_TOKEN!;

const client = twilio(accountSid, authToken);

export async function sendWhatsAppMessage(toPhone: string, message: string): Promise<void> {
  try {
    await client.messages.create({
      messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID,
      to: `whatsapp:${toPhone}`,
      body: message,
    });
    console.log('✅ WhatsApp message sent to:', toPhone);
  } catch (error) {
    console.error('❌ Failed to send WhatsApp message:', error);
  }
}
