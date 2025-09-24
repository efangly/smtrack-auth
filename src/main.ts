import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LoggerService } from './common/services';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule, {
      logger: false // Disable default logger to use custom winston logger
    });
    
    const customLogger = app.get(LoggerService);
    
    // Validate required environment variables
    if (!process.env.RABBITMQ) {
      throw new Error('RABBITMQ environment variable is required');
    }

    // Setup microservice
    const microservice = app.connectMicroservice<MicroserviceOptions>({
      transport: Transport.RMQ,
      options: {
        urls: [process.env.RABBITMQ],
        queue: 'auth_queue',
        queueOptions: { durable: true },
        noAck: false,
        prefetchCount: 1
      }
    });

    // Setup global configurations
    const reflector = app.get(Reflector);
    
    app.useGlobalPipes(new ValidationPipe({ 
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      validateCustomDecorators: true
    }));
    
    app.useGlobalInterceptors(new ResponseInterceptor(reflector));
    app.useGlobalFilters(new AllExceptionsFilter(customLogger));
    app.setGlobalPrefix('auth');

    // Enable CORS if needed
    app.enableCors({
      origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
      credentials: true
    });

    const port = process.env.PORT || 8080;
    
    await microservice.listen();
    await app.listen(port);
  } catch (error) {
    const logger = new Logger('Bootstrap');
    logger.error('Failed to start application', error.stack);
    process.exit(1);
  }
}

bootstrap();
