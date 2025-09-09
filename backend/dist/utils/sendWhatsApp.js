"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendWhatsAppMessage = sendWhatsAppMessage;
const twilio_1 = __importDefault(require("twilio"));
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromWhatsApp = 'whatsapp:+14155238886';
const client = (0, twilio_1.default)(accountSid, authToken);
async function sendWhatsAppMessage(toPhone, message) {
    try {
        await client.messages.create({
            from: fromWhatsApp,
            to: `whatsapp:${toPhone}`,
            body: message,
        });
        console.log('✅ WhatsApp message sent to:', toPhone);
    }
    catch (error) {
        console.error('❌ Failed to send WhatsApp message:', error);
    }
}
//# sourceMappingURL=sendWhatsApp.js.map