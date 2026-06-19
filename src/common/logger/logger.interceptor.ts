import { CallHandler, ExecutionContext, Inject, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { UserResponse } from 'src/models/user.model';
import { CustomRequest } from 'src/types/index.type';
import { randomUUID } from 'node:crypto';

@Injectable()
export class LoggerInterceptor implements NestInterceptor {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request: CustomRequest = context.switchToHttp().getRequest();
    const requestId = `req-${randomUUID()}`;
    const user = request.user as UserResponse | undefined;
    const userInfo = {
      id: user?.id,
      email: user?.email,
    };
    const { method, url } = request;

    this.logger.info(`REQUEST RECIVED [${method}] ${url}`, {
      layer: 'INTERCEPTOR',
      request_id: requestId,
      user: userInfo,
    });

    const now = Date.now();

    return next.handle().pipe(
      tap((response: Response) => {
        const duration = Date.now() - now;

        this.logger.info(`REQUEST COMPLETED [${method}] ${url}`, {
          layer: 'INTERCEPTOR',
          request_id: requestId,
          user: userInfo,
          duration: `${duration}ms`,
        });

        return response;
      }),
    );
  }
}
