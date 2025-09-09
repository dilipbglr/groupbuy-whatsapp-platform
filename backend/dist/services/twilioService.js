"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.twilioService = void 0;
const twilio_1 = __importDefault(require("twilio"));
const dotenv_1 = __importDefault(require("dotenv"));
const logger_1 = require("../middleware/logger");
dotenv_1.default.config();
console.log('🔍 TWILIO DEBUG INFO:');
console.log('TWILIO_ACCOUNT_SID:', process.env.TWILIO_ACCOUNT_SID);
console.log('TWILIO_AUTH_TOKEN:', process.env.TWILIO_AUTH_TOKEN?.substring(0, 8) + '...');
console.log('TWILIO_WHATSAPP_NUMBER:', process.env.TWILIO_WHATSAPP_NUMBER);
console.log('========================');
if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_WHATSAPP_NUMBER) {
    console.error('❌ MISSING TWILIO ENVIRONMENT VARIABLES!');
    throw new Error('Twilio configuration is incomplete');
}
const client = (0, twilio_1.default)(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const FROM = process.env.TWILIO_WHATSAPP_NUMBER;
exports.twilioService = {
    sendMessage: async (to, body) => {
        try {
            logger_1.logger.info('Sending WhatsApp message', {
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
            logger_1.logger.info('WhatsApp message sent successfully', {
                to,
                messageSid: message.sid,
                status: message.status,
                source: 'twilioService > sendMessage',
            });
            return message;
        }
        catch (error) {
            logger_1.logger.error('Failed to send WhatsApp message', error, {
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
//# sourceMappingURL=twilioService.js.map