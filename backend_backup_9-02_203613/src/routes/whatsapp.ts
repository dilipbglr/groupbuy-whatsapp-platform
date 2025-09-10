// backend/routes/whatsapp.ts
import express from 'express';
import { handleWebhook } from '../controllers/whatsappController';

const router = express.Router();

// POST /whatsapp/webhook
router.post('/webhook', express.urlencoded({ extended: false }), handleWebhook);

export default router;
