import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { LoggerService } from '../logger/logger.service';
import { ErrorService } from './error.service';
import { ResponseService } from 'src/helpers/response/response.service';
import { ZodValidationException } from 'nestjs-zod';
import { ZodError } from 'zod/v3';
import { ErrorResponse } from 'src/models/web.model';
import { Request, Response } from 'express';

@Catch()
export class ErrorFilter<T> implements ExceptionFilter {
  constructor(
    private readonly loggerService: LoggerService,
    private readonly errorService: ErrorService,
    private readonly responseService: ResponseService,
  ) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    const { status, message, errors, code } = this.handleException(exception);

    // ✅ LOG
    this.loggerService.error(
      'GLOBAL',
      'EXCEPTION-FILTER',
      message,
      {
        method: req.method,
        url: req.url,
        ip: req.ip,
        status,
        code,
        errors,
      },
      exception instanceof Error ? exception : new Error(String(exception)),
    );

    // ✅ RESPONSE
    const responseBody = this.responseService.error({
      message,
      status,
      errors,
      code,
    });

    res.status(status).json(responseBody);
  }

  // ========================
  // EXCEPTION HANDLER
  // ========================
  private handleException(exception: unknown): {
    status: number;
    message: string;
    errors: ErrorResponse[];
    code: string;
  } {
    // default
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    const message = 'Internal server error';
    const errors: ErrorResponse[] = [];
    const code = 'INTERNAL_SERVER_ERROR';

    // 🔹 ZOD
    if (exception instanceof ZodValidationException) {
      const zodError = exception.getZodError() as ZodError;

      return {
        status: HttpStatus.BAD_REQUEST,
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        errors: zodError.issues.map((issue) => ({
          field: issue.path.length ? issue.path.join('.') : undefined,
          message: issue.message,
        })),
      };
    }

    // 🔹 HTTP EXCEPTION
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        return {
          status,
          message: res,
          errors: [{ message: res }],
          code: this.errorService.mapStatusToCode(status),
        };
      }

      if (typeof res === 'object' && res !== null) {
        const obj: any = res;
        const rawMessage = obj.message || obj.error || message;

        if (Array.isArray(rawMessage)) {
          return {
            status,
            message: rawMessage.join(', '),
            errors: rawMessage.map((msg) => ({ message: msg })),
            code: obj.code || this.errorService.mapStatusToCode(status),
          };
        }

        return {
          status,
          message: rawMessage,
          errors: [{ message: rawMessage }],
          code: obj.code || this.errorService.mapStatusToCode(status),
        };
      }
    }

    // 🔹 GENERIC ERROR
    if (exception instanceof Error) {
      return {
        status,
        message: exception.message || message,
        errors: [{ message: exception.message }],
        code: this.errorService.mapStatusToCode(status),
      };
    }

    return { status, message, errors, code };
  }
}
