import { DeliveryMethod, OrderStatus } from 'src/models/order.model';

export const ORDER_STATUS_OPTIONS = [
  OrderStatus.PENDING,
  OrderStatus.PAID,
  OrderStatus.PROCESSING,
  OrderStatus.DELIVERING,
  OrderStatus.COMPLETED,
  OrderStatus.CANCELED,
] as const;
export const DELIVERY_METHOD_OPTIONS = [DeliveryMethod.DELIVERY, DeliveryMethod.COD] as const;

export type TimeSortOption = (typeof ORDER_STATUS_OPTIONS)[number];
export type DeliveryMethodOption = (typeof DELIVERY_METHOD_OPTIONS)[number];