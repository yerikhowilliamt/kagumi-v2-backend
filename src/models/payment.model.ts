import { Prisma } from 'src/generated/prisma/client';
import { OrderSummary } from './order.model';
import { UserSummary } from './user.model';

export class PaymentResponse {
  id: number;
  userId: number;
  orderId: number;
  transactionId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  paymentProof?: string | null;
  metaData?: Prisma.JsonValue | null;
  failureReason?: string | null;
  refundAmount?: string | null;
  refundedAt?: string;
  createdAt: string;
  updatedAt: string;

  order: OrderSummary;
  user: UserSummary;

  constructor(params: {
    id: number;
    userId: number;
    orderId: number;
    transactionId: string;
    amount: number;
    paymentMethod: PaymentMethod;
    status: PaymentStatus;
    createdAt: string;
    updatedAt: string;
    order: OrderSummary;
    user: UserSummary;
  }) {
    const {
      id,
      userId,
      orderId,
      transactionId,
      amount,
      paymentMethod,
      status,
      createdAt,
      updatedAt,
      order,
      user,
    } = params;
    this.id = id;
    this.userId = userId;
    this.orderId = orderId;
    this.transactionId = transactionId;
    this.amount = amount;
    this.paymentMethod = paymentMethod;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.status = status;
    this.order = order;
    this.user = user;
  }
}

export enum PaymentMethod {
  TRANSFER = 'TRANSFER',
  E_WALLET = 'E_WALLET',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  SETTLEMENT = 'SETTLEMENT',
  FAILED = 'FAILED',
  CANCELED = 'CANCELED',
  REFUNDED = 'REFUNDED',
}

export class PaymentSummary {
  id: number;
  userId: number;
  orderId: number;
  transactionId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  paymentProof?: string | null;
  metaData?: Prisma.JsonValue | null;
  failureReason?: string | null;
  refundAmount?: string | null;
  refundedAt?: string | null;

  constructor(params: {
    id: number;
    userId: number;
    orderId: number;
    transactionId: string;
    amount: number;
    paymentMethod: PaymentMethod;
    status: PaymentStatus;
  }) {
    const {
      id,
      userId,
      orderId,
      transactionId,
      amount,
      paymentMethod,
      status,
    } = params;
    this.id = id;
    this.userId = userId;
    this.orderId = orderId;
    this.transactionId = transactionId;
    this.amount = amount;
    this.paymentMethod = paymentMethod;
    this.status = status;
  }
}
