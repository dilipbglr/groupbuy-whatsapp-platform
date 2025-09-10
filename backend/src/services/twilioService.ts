// src/services/twilioService.ts
import { ServiceBase } from './base/ServiceBase';
import { serviceConfigs } from '../config/services';

export interface WhatsAppMessage {
  to: string;
  message: string;
  mediaUrl?: string;
}

export interface WhatsAppResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  mock?: boolean;
}

class TwilioService extends ServiceBase {
  private client: any = null;

  constructor() {
    super('Twilio', serviceConfigs.twilio);
  }

  protected initialize(config: Record<string, any>) {
    const twilio = require('twilio');
    this.client = twilio(config.accountSid, config.authToken);
    this.client.api.accounts(config.accountSid).fetch(); // ping test
  }

  async sendMessage(to: string, message: string): Promise<WhatsAppResponse> {
    return this.sendWhatsAppMessage({ to, message });
  }

  async sendWhatsAppMessage(data: WhatsAppMessage): Promise<WhatsAppResponse> {
    if (!this.enabled) {
      console.log(`🔕 Mock mode: WhatsApp message to ${data.to}: ${data.message}`);
      return { success: false, error: 'Twilio disabled', mock: true };
    }

    try {
      const msg = await this.client.messages.create({
        messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID,
        to: data.to,
        body: data.message,
        ...(data.mediaUrl && { mediaUrl: [data.mediaUrl] }),
      });
      
      console.log(`✅ WhatsApp Message sent! SID: ${msg.sid}`);
      console.log(`✅ Sent to: ${data.to}, SID: ${msg.sid}, Preview: ${data.message.slice(0, 50)}...`);
      
      return { success: true, messageId: msg.sid };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async sendBulk(messages: WhatsAppMessage[]): Promise<WhatsAppResponse[]> {
    if (!this.enabled) {
      return messages.map(() => ({ success: false, error: 'Twilio disabled', mock: true }));
    }

    const results = await Promise.allSettled(
      messages.map(msg => this.sendWhatsAppMessage(msg))
    );

    return results.map(r =>
      r.status === 'fulfilled' ? r.value : { success: false, error: 'Send failed' }
    );
  }

  getStatus() {
    return {
      enabled: this.enabled,
      service: 'Twilio',
      capabilities: this.enabled ? ['whatsapp'] : ['mock_logging']
    };
  }
}

export const twilioService = new TwilioService();
