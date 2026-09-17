import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isHttpException = exception instanceof HttpException;

    const statusCode = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse = isHttpException
      ? exception.getResponse()
      : null;

    const message = this.extractMessage(exceptionResponse, exception);
    const errorName = this.extractErrorName(exceptionResponse, statusCode);

    if (statusCode >= 500) {
      this.logger.error(
        `${request.method} ${request.url} -> ${statusCode}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else {
      this.logger.warn(`${request.method} ${request.url} -> ${statusCode}`);
    }

    response.status(statusCode).json({
      success: false,
      statusCode,
      error: errorName,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }

  private extractMessage(
    exceptionResponse: unknown,
    exception: unknown,
  ): string | string[] {
    if (
      exceptionResponse &&
      typeof exceptionResponse === 'object' &&
      'message' in exceptionResponse
    ) {
      return (exceptionResponse as { message: string | string[] }).message;
    }
    if (exception instanceof Error) {
      return exception.message;
    }
    return 'Internal server error';
  }

  private extractErrorName(
    exceptionResponse: unknown,
    statusCode: number,
  ): string {
    if (
      exceptionResponse &&
      typeof exceptionResponse === 'object' &&
      'error' in exceptionResponse
    ) {
      return (exceptionResponse as { error: string }).error;
    }
    return HttpStatus[statusCode] ?? 'Error';
  }
}