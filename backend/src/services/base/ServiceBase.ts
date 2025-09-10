// src/services/base/ServiceBase.ts
import { ServiceConfig } from '../../config/services';

export abstract class ServiceBase {
  protected enabled: boolean = false;
  protected serviceName: string;

  constructor(serviceName: string, config: ServiceConfig) {
    this.serviceName = serviceName;

    if (!config.enabled && config.required) {
      throw new Error(`❌ Required service '${serviceName}' is not configured`);
    }

    if (config.enabled) {
      try {
        this.initialize(config.config || {});
        this.enabled = true;
        console.log(`✅ ${serviceName} service initialized successfully`);
      } catch (err: any) {
        console.error(`❌ ${serviceName} init error:`, err.message);
        if (config.required) throw err;
      }
    } else {
      console.warn(`⚠️ ${serviceName} disabled - missing env vars`);
    }
  }

  protected abstract initialize(config: Record<string, any>): void;

  protected requireEnabled(action: string) {
    if (!this.enabled) throw new Error(`${this.serviceName} not available for: ${action}`);
  }

  protected log(action: string, payload?: any) {
    if (!this.enabled) {
      console.log(`🔇 [${this.serviceName}] Mock ${action}`, payload);
      return false;
    }
    return true;
  }
}