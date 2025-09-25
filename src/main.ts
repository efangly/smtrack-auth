import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LoggerService } from './common/services';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule, { logger: false });
    const customLogger = app.get(LoggerService);
    if (!process.env.RABBITMQ) {
      throw new Error('RABBITMQ environment variable is required');
    }
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
    app.enableCors({ origin: '*' });
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
