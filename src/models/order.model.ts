import { OrderItemSummary } from './order-item.model';
import { PaymentMethod, PaymentSummary } from './payment.model';
import { UserSummary } from './user.model';

export class OrderResponse {
  id: number;
  userId: number;
  totalPrice: number;
  status: OrderStatus;
  deliveryMethod: DeliveryMethod;
  paymentMethod: PaymentMethod;
  createdAt: string;
  updatedAt: string;

  user: UserSummary;
  orderItems: OrderItemSummary[];
  payment?: PaymentSummary | null;

  constructor(params: {
    id: number;
    userId: number;
    totalPrice: number;
    status: OrderStatus;
    deliveryMethod: DeliveryMethod;
    paymentMethod: PaymentMethod;
    createdAt: string;
    updatedAt: string;
    user: UserSummary;
  }) {
    const {
      id,
      userId,
      totalPrice,
      status,
      deliveryMethod,
      paymentMethod,
      createdAt,
      updatedAt,
      user,
    } = params;
    this.id = id;
    this.userId = userId;
    this.totalPrice = totalPrice;
    this.status = status;
    this.deliveryMethod = deliveryMethod;
    this.paymentMethod = paymentMethod;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.user = user;
    this.orderItems = [];
    this.payment = null;
  }
}

export enum DeliveryMethod {
  DELIVERY = 'DELIVERY',
  COD = 'COD',
}

export enum OrderStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  PROCESSING = 'PROCESSING',
  DELIVERING = 'DELIVERING',
  COMPLETED = 'COMPLETED',
  CANCELED = 'CANCELED',
}

export class OrderSummary {
  id: number;
  userId: number;
  totalPrice: number;
  status: OrderStatus;
  deliveryMethod: DeliveryMethod;
  paymentMethod: PaymentMethod;

  constructor(params: {
    id: number;
    userId: number;
    totalPrice: number;
    status: OrderStatus;
    deliveryMethod: DeliveryMethod;
    paymentMethod: PaymentMethod;
  }) {
    const { id, userId, totalPrice, status, deliveryMethod, paymentMethod } =
      params;
    this.id = id;
    this.userId = userId;
    this.totalPrice = totalPrice;
    this.status = status;
    this.deliveryMethod = deliveryMethod;
    this.paymentMethod = paymentMethod;
  }
}
