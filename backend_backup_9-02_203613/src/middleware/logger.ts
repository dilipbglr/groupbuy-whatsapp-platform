import { Request, Response, NextFunction } from 'express';

const isDev = process.env.NODE_ENV !== 'production';

export const logger = {
  info: (msg: string, ctx: any = {}) => isDev && console.info(JSON.stringify({ level: 'info', msg, ...ctx })),
  warn: (msg: string, err: any, ctx: any = {}) => isDev && console.warn(JSON.stringify({ level: 'warn', msg, err, ...ctx })),
  error: (msg: string, err: any, ctx: any = {}) => {
    const errorPayload = {
      level: 'error',
      msg,
      code: err?.code,
      message: err?.message,
      stack: err?.stack,
      ...ctx
    };
    if (isDev) console.error(JSON.stringify(errorPayload));
  }
};

// Request logger middleware
export const requestLogger = (req: any, res: any, next: any) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.url;
  const ip = req.ip || req.connection.remoteAddress;

  if (isDev) {
    console.log(`[${timestamp}] ${method} ${url} - ${ip}`);
  }

  // Log response time
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (isDev) {
      console.log(`[${timestamp}] ${method} ${url} - ${res.statusCode} - ${duration}ms`);
    }
  });

  next();
};