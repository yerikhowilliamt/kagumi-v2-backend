export default class WebResponse<T> {
  success: boolean;
  data?: T | T[];
  message?: string;
  errors?: ErrorResponse[];
  status?: number;
  paging?: Paging;
  code?: string;
  timestamp?: string;

  constructor(success: boolean) {
    this.success = success;
  }
}

export class Paging {
  size: number;
  totalData: number;
  totalPage: number;
  currentPage: number;

  constructor(params: {
    size: number;
    totalData: number;
    totalPage: number;
    currentPage: number;
  }) {
    this.size = params.size;
    this.totalData = params.totalData;
    this.totalPage = params.totalPage;
    this.currentPage = params.currentPage;
  }
}

type ResponseParams<T> =
  | {
      success: boolean;
      data: T;
      status: number;
      message?: string;
      code?: string;
      pagination?: false;
    }
  | {
      success: boolean;
      data: T[];
      status: number;
      message?: string;
      code?: string;
      pagination: true;
      paging: Paging;
    };

export function response<T>(params: ResponseParams<T>): WebResponse<T> {
  return {
    success: params.success,
    data: params.data,
    message: params.message,
    status: params.status,
    ...(params.pagination ? { paging: params.paging } : {}),
    ...(params.code ? { code: params.code } : {}),
    timestamp: new Date().toISOString(),
  };
}

export class ErrorResponse {
  field?: string;
  message: string;

  constructor(message: string) {
    this.message = message;
  }
}

export interface ErrorResponseObject {
  message: string | string[];
  code?: string;
  errors?: ErrorResponse[];
}

export interface JwtPayload {
  id: number;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}
