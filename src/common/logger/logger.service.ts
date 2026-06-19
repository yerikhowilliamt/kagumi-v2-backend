import { Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { randomUUID } from 'node:crypto';
import { LogLayer, LogLevel } from 'src/types/index.type';
import { Logger } from 'winston';

@Injectable()
export class LoggerService {
  constructor(@Inject(WINSTON_MODULE_PROVIDER) private logger: Logger) {}

  private log(
    level: LogLevel,
    service: string,
    layer: LogLayer,
    message: string,
    details?: object,
    error?: Error,
  ) {
    const baseMeta = {
      layer: `[${service.toUpperCase()} - ${layer.toUpperCase()}]`,
      request_id: `req-${randomUUID()}`,
      ...details,
    };

    const errorMeta = error
      ? {
          error_name: error.name,
          error_message: error.message,
          stack: error.stack,
        }
      : {};

    this.logger.log(level, message, {
      ...baseMeta,
      ...errorMeta,
    });
  }

  info(service: string, layer: LogLayer, message: string, details?: object) {
    this.log('info', service, layer, message, details);
  }

  warn(service: string, layer: LogLayer, message: string, details?: object) {
    this.log('warn', service, layer, message, details);
  }

  error(
    service: string,
    layer: LogLayer,
    message: string,
    details?: object,
    error?: Error,
  ) {
    this.log('error', service, layer, message, details, error);
  }

  debug(service: string, layer: LogLayer, message: string, details?: object) {
    this.log('debug', service, layer, message, details);
  }
}
