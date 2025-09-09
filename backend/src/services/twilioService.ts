import twilio from 'twilio';
import dotenv from 'dotenv';
import { logger } from '../middleware/logger';

dotenv.config();

// Debug logging - REMOVE THIS AFTER FIXING
console.log('🔍 TWILIO DEBUG INFO:');
console.log('TWILIO_ACCOUNT_SID:', process.env.TWILIO_ACCOUNT_SID);
console.log('TWILIO_AUTH_TOKEN:', process.env.TWILIO_AUTH_TOKEN?.substring(0, 8) + '...');
console.log('TWILIO_WHATSAPP_NUMBER:', process.env.TWILIO_WHATSAPP_NUMBER);
console.log('========================');

if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_WHATSAPP_NUMBER) {
  console.error('❌ MISSING TWILIO ENVIRONMENT VARIABLES!');
  throw new Error('Twilio configuration is incomplete');
}

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

const FROM = process.env.TWILIO_WHATSAPP_NUMBER!;

export const twilioService = {
  sendMessage: async (to: string, body: string) => {
    try {
      logger.info('Sending WhatsApp message', {
        to,
        body,
        from: FROM,
        source: 'twilioService > sendMessage',
      });

      const message = await client.messages.create({
        from: FROM,
        to,
        body,
      });

      logger.info('WhatsApp message sent successfully', {
        to,
        messageSid: message.sid,
        status: message.status,
        source: 'twilioService > sendMessage',
      });

      return message;
    } catch (error: any) {
      logger.error('Failed to send WhatsApp message', error, {
        to,
        body,
        from: FROM,
        source: 'twilioService > sendMessage',
        code: error?.code,
        message: error?.message,
      });
      throw error;
    }
  },
};