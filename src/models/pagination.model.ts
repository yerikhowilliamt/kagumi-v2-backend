import { Paging } from './web.model';

export class PaginationRequest {
  page: number;
  size: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class PaginatedResponse<T> {
  data: T[];
  paging: Paging;
}
