import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { LoggerService } from '../services';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) { }
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    // let errorDetails: any = {};

    // Extract error message
    if (exception instanceof Error) {
      message = exception.message;
    }

    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'object') {
        message = exceptionResponse['message'] || message;
        // errorDetails = { ...errorDetails, ...exceptionResponse };
      } else {
        message = exceptionResponse.toString();
      }
    }

    // Handle Prisma errors
    if (exception instanceof PrismaClientKnownRequestError) {
      // errorDetails.prismaCode = exception.code;
      // errorDetails.prismaMeta = exception.meta;

      switch (exception.code) {
        case 'P2002':
          message = `The value for field '${exception.meta?.target}' already exists`;
          status = HttpStatus.CONFLICT;
          break;
        case 'P2003':
          message = 'Foreign key constraint failed';
          status = HttpStatus.BAD_REQUEST;
          break;
        case 'P2024':
          message = 'Timed out fetching a new connection from the connection pool';
          status = HttpStatus.INTERNAL_SERVER_ERROR;
          break;
        case 'P2025':
          message = 'The requested resource was not found';
          status = HttpStatus.NOT_FOUND;
          break;
        default:
          message = exception.message;
          status = HttpStatus.BAD_REQUEST;
          break;
      }
    }

    // Log errors and warnings using the new pattern
    if (status >= 500) {
      this.logger.logHttpError(
        message,
        status,
        request.url,
        request.method,
        request.headers['user-agent'],
        request.ip || request.connection?.remoteAddress || 'Unknown'
      );
    }
  
    response.status(status).json({
      message: message,
      success: false,
      data: null,
      traceStack: process.env.NODE_ENV === 'development' && exception instanceof Error ? exception.stack : undefined,
    });
  }
}
