// backend/src/utils/sendWhatsApp.ts
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID!;
const authToken = process.env.TWILIO_AUTH_TOKEN!;
const fromWhatsApp = 'whatsapp:+14155238886'; // Twilio sandbox number

const client = twilio(accountSid, authToken);

export async function sendWhatsAppMessage(toPhone: string, message: string): Promise<void> {
  try {
    await client.messages.create({
      from: fromWhatsApp,
      to: `whatsapp:${toPhone}`,
      body: message,
    });
    console.log('✅ WhatsApp message sent to:', toPhone);
  } catch (error) {
    console.error('❌ Failed to send WhatsApp message:', error);
  }
}
