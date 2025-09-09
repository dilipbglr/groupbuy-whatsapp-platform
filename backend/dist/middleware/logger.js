"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLogger = exports.logger = void 0;
const isDev = process.env.NODE_ENV !== 'production';
exports.logger = {
    info: (msg, ctx = {}) => isDev && console.info(JSON.stringify({ level: 'info', msg, ...ctx })),
    warn: (msg, err, ctx = {}) => isDev && console.warn(JSON.stringify({ level: 'warn', msg, err, ...ctx })),
    error: (msg, err, ctx = {}) => {
        const errorPayload = {
            level: 'error',
            msg,
            code: err?.code,
            message: err?.message,
            stack: err?.stack,
            ...ctx
        };
        if (isDev)
            console.error(JSON.stringify(errorPayload));
    }
};
const requestLogger = (req, res, next) => {
    const timestamp = new Date().toISOString();
    const method = req.method;
    const url = req.url;
    const ip = req.ip || req.connection.remoteAddress;
    if (isDev) {
        console.log(`[${timestamp}] ${method} ${url} - ${ip}`);
    }
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        if (isDev) {
            console.log(`[${timestamp}] ${method} ${url} - ${res.statusCode} - ${duration}ms`);
        }
    });
    next();
};
exports.requestLogger = requestLogger;
//# sourceMappingURL=logger.js.map