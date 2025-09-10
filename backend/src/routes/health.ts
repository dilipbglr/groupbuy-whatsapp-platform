import { Router, Request, Response } from 'express';
import { twilioService } from '../services/twilioService';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

router.get('/detailed', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Detailed health check',
    services: {
      twilio: twilioService.getStatus()
    },
    timestamp: new Date().toISOString()
  });
});

export default router;
