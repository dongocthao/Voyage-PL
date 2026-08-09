import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : undefined;
    const body = this.normalizeBody(exceptionResponse);

    response.status(status).json({
      statusCode: status,
      code: body.code ?? (status === 500 ? 'INTERNAL_SERVER_ERROR' : 'HTTP_ERROR'),
      message: body.message ?? 'Unexpected error',
      details: body.details ?? [],
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }

  private normalizeBody(value: unknown): { code?: string; message?: string; details?: unknown[] } {
    if (typeof value === 'object' && value !== null) {
      const body = value as { code?: string; message?: string | string[]; details?: unknown[] };
      return {
        code: body.code,
        message: Array.isArray(body.message) ? body.message.join('; ') : body.message,
        details: body.details,
      };
    }

    return { message: typeof value === 'string' ? value : undefined };
  }
}
