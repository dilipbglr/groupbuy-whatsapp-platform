// src/config/services.ts
console.log("🔍 ENV CHECK - TWILIO_ACCOUNT_SID:", process.env.TWILIO_ACCOUNT_SID);
console.log("🔍 ENV CHECK - TWILIO_AUTH_TOKEN:", process.env.TWILIO_AUTH_TOKEN);
console.log("🔍 ENV CHECK - TWILIO_WHATSAPP_NUMBER:", process.env.TWILIO_WHATSAPP_NUMBER);

export interface ServiceConfig {
  enabled: boolean;
  required: boolean;
  service: string;
  capabilities: string[];
  config?: Record<string, any>; // ✅ Optional type to avoid future crashes
}

export interface AppServices {
  twilio: ServiceConfig;
}

// ✅ Add these logs above the object definition
console.log("🧪 ENV VAR CHECK - Twilio:");
console.log("TWILIO_ACCOUNT_SID:", process.env.TWILIO_ACCOUNT_SID);
console.log("TWILIO_AUTH_TOKEN:", process.env.TWILIO_AUTH_TOKEN);
console.log("TWILIO_MESSAGING_SERVICE_SID:", process.env.TWILIO_MESSAGING_SERVICE_SID);
console.log("TWILIO_PHONE_NUMBER:", process.env.TWILIO_PHONE_NUMBER);

console.log("🧪 TWILIO CONFIG CHECK:");
console.log("TWILIO_ACCOUNT_SID:", process.env.TWILIO_ACCOUNT_SID);
console.log("TWILIO_AUTH_TOKEN:", process.env.TWILIO_AUTH_TOKEN);
console.log("TWILIO_MESSAGING_SERVICE_SID:", process.env.TWILIO_MESSAGING_SERVICE_SID);
console.log("TWILIO_PHONE_NUMBER:", process.env.TWILIO_PHONE_NUMBER);

// Then define your object
export const serviceConfigs: AppServices = {
  twilio: {
    enabled: Boolean(
      process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      (
        process.env.TWILIO_MESSAGING_SERVICE_SID ||
        process.env.TWILIO_PHONE_NUMBER
      )
    ),
    required: false,
    service: "Twilio",
    capabilities: process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      (
        process.env.TWILIO_MESSAGING_SERVICE_SID ||
        process.env.TWILIO_PHONE_NUMBER
      )
      ? ["send_messages", "receive_webhooks"]
      : ["mock_logging"],
    config: {
      accountSid: process.env.TWILIO_ACCOUNT_SID || '',
      authToken: process.env.TWILIO_AUTH_TOKEN || '',
      messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID || '',
      phoneNumber: process.env.TWILIO_PHONE_NUMBER || '',
    }
  }
};
