import { Injectable } from '@nestjs/common';
import * as winston from 'winston';

@Injectable()
export class LoggerService {
  private readonly logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: 'warn',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          )
        })
      ]
    });
  }

  warn(message: string, meta?: any) {
    this.logger.warn(message, {
      service: 'smtrack-auth-service',
      level: 'warn',
      ...meta
    });
  }

  error(message: string, error?: Error, meta?: any) {
    this.logger.error(message, {
      service: 'smtrack-auth-service',
      level: 'error',
      error: error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : undefined,
      ...meta
    });
  }
}