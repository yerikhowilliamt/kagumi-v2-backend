import { TimeSortOption } from "./time-sort.type";

export type GetAllOrderItemParams = {
  limit: number;
  page: number;
  quantity?: string;
  priceEach?: string;
  minPrice?: string;
  maxPrice?: string;
  sort?: TimeSortOption;
};
