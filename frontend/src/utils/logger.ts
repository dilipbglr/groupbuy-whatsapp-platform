// ✅ frontend/src/utils/logger.ts
const isDev = process.env.NODE_ENV === 'development';

export class Logger {
  log(level: string, message: string, error?: any, context?: any) {
    if (!isDev) return; // Prevent logs in production
    const timestamp = new Date().toISOString();
    const payload = { timestamp, level, message, error, context };
    console[level === 'debug' ? 'log' : level](JSON.stringify(payload, null, 2));
  }

  info(msg: string, ctx?: any) { this.log('info', msg, undefined, ctx); }
  warn(msg: string, err?: any, ctx?: any) { this.log('warn', msg, err, ctx); }
  error(msg: string, err?: any, ctx?: any) { this.log('error', msg, err, ctx); }
}

export const logger = new Logger();
