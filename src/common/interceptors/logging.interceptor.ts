import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import type { Request } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

const SENSITIVE_KEYS = ['password', 'accessToken', 'refreshToken'];

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url } = request;
    const safeBody = this.sanitize(request.body);
    const startTime = Date.now();

    this.logger.log(`--> ${method} ${url} ${JSON.stringify(safeBody)}`);

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;
        this.logger.log(`<-- ${method} ${url} (${duration}ms)`);
      }),
    );
  }

  private sanitize(body: unknown): unknown {
    if (!body || typeof body !== 'object') return body;

    const clone: Record<string, unknown> = { ...(body as object) };
    for (const key of SENSITIVE_KEYS) {
      if (key in clone) {
        clone[key] = '***HIDDEN***';
      }
    }
    return clone;
  }
}