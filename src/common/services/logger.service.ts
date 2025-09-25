import { Injectable } from '@nestjs/common';
import * as winston from 'winston';

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  context?: string;
  trace?: string;
  metadata?: Record<string, any>;
  service: string;
  environment: string;
}

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

  warn(message: string, contextOrMetadata?: string | any, metadata?: any) {
    // Handle backward compatibility
    let context = 'Application';
    let meta = {};
    
    if (typeof contextOrMetadata === 'string') {
      context = contextOrMetadata;
      meta = metadata || {};
    } else {
      meta = contextOrMetadata || {};
    }

    this.logger.warn({
      timestamp: new Date().toISOString(),
      level: 'warn',
      message,
      service: 'smtrack-auth-service',
      environment: process.env.NODE_ENV || 'development',
      context,
      metadata: meta
    });
  }

  error(message: string, error?: Error, contextOrMetadata?: string | any, metadata?: any) {
    // Handle backward compatibility
    let context = 'Application';
    let meta = {};
    
    if (typeof contextOrMetadata === 'string') {
      context = contextOrMetadata;
      meta = metadata || {};
    } else {
      meta = contextOrMetadata || {};
    }

    const logData: any = {
      timestamp: new Date().toISOString(),
      level: 'error',
      message,
      service: 'smtrack-auth-service',
      environment: process.env.NODE_ENV || 'development',
      context,
      metadata: meta
    };

    if (error) {
      logData.error = {
        message: error.message,
        stack: error.stack,
        name: error.name
      };
    }

    this.logger.error(logData);
  }

  // Method for HTTP-specific logging
  logHttpError(
    message: string,
    status: number,
    path: string,
    method: string,
    userAgent?: string,
    ip?: string,
    context: string = 'AllExceptionsFilter'
  ) {
    const level = status >= 500 ? 'error' : 'warn';
    const httpMessage = `HTTP ${status} ${level === 'error' ? 'Error' : 'Warning'}: ${message}`;

    this.logger[level]({
      timestamp: new Date().toISOString(),
      level,
      message: httpMessage,
      service: 'smtrack-auth-service',
      environment: process.env.NODE_ENV || 'development',
      context,
      metadata: {
        status,
        path,
        method,
        userAgent: userAgent || 'Unknown',
        ip: ip || 'Unknown'
      }
    });
  }
}