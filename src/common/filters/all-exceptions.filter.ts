import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    let status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error'; 

    if (exception instanceof Error) {
      message = exception.message;
    }
    
    if (exception instanceof HttpException) {
      if (typeof exception.getResponse() === 'object') { 
        message = exception.getResponse()['message']; 
      } else { 
        message = exception.getResponse().toString(); 
      }
    }

    if (exception instanceof PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2002':
          message = `The value for field '${exception.meta?.target}' already exists`;
          status = HttpStatus.CONFLICT;
          break;
        case 'P2003':
          message = 'Foreign key constraint failed';
          status = HttpStatus.BAD_REQUEST;
          break;
        case 'P2024': // Record not found
          message = 'Timed out fetching a new connection from the connection pool';
          status = HttpStatus.INTERNAL_SERVER_ERROR;
          break;
        case 'P2025': // Record not found
          message = 'The requested resource was not found';
          status = HttpStatus.NOT_FOUND;
          break;
        default:
          message = exception.message;
          status = HttpStatus.BAD_REQUEST;
          break;
      }
    }
    this.logger.error(`Http Status: ${status} Error Message: ${message}`);
    response.status(status).json({
      message: message,
      success: false,
      data: null,
      traceStack: process.env.NODE_ENV === 'development' && exception instanceof Error ? exception.stack : undefined,
    });
  }
}
