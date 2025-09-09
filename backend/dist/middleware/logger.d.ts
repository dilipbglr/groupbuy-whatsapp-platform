export declare const logger: {
    info: (msg: string, ctx?: any) => false | void;
    warn: (msg: string, err: any, ctx?: any) => false | void;
    error: (msg: string, err: any, ctx?: any) => void;
};
export declare const requestLogger: (req: any, res: any, next: any) => void;
//# sourceMappingURL=logger.d.ts.map