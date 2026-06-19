import { OrderSummary } from './order.model';
import { ProductSummary } from './product.model';

export class OrderItemResponse {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  note?: string | null;
  priceEach: number;
  createdAt: string;
  updatedAt: string;

  order: OrderSummary;
  product: ProductSummary;

  constructor(params: {
    id: number;
    orderId: number;
    productId: number;
    quantity: number;
    priceEach: number;
    createdAt: string;
    updatedAt: string;
    order: OrderSummary;
    product: ProductSummary;
  }) {
    const {
      id,
      orderId,
      productId,
      quantity,
      priceEach,
      createdAt,
      updatedAt,
      order,
      product,
    } = params;
    this.id = id;
    this.orderId = orderId;
    this.productId = productId;
    this.quantity = quantity;
    this.priceEach = priceEach;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.order = order;
    this.product = product;
  }
}

export class OrderItemSummary {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  note?: string | null;
  priceEach: number;

  constructor(params: {
    id: number;
    orderId: number;
    productId: number;
    quantity: number;
    priceEach: number;
  }) {
    const { id, orderId, productId, quantity, priceEach } = params;
    this.id = id;
    this.orderId = orderId;
    this.productId = productId;
    this.quantity = quantity;
    this.priceEach = priceEach;
  }
}
