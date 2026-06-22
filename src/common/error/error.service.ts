import { Injectable } from '@nestjs/common';

@Injectable()
export class ErrorService {
  //   isCloudinaryError(error: any): error is UploadApiErrorResponse {
  //     return (
  //       error &&
  //       typeof error === 'object' &&
  //       'http_code' in error &&
  //       'message' in error &&
  //       typeof error.message === 'string'
  //     );
  //   }
  mapStatusToCode(status: number): string {
    switch (status) {
      case 400:
        return 'BAD_REQUEST';
      case 401:
        return 'UNAUTHORIZED';
      case 403:
        return 'FORBIDDEN';
      case 404:
        return 'NOT_FOUND';
      case 409:
        return 'CONFLICT';
      case 422:
        return 'UNPROCESSABLE_ENTITY';
      default:
        return 'INTERNAL_SERVER_ERROR';
    }
  }
}
