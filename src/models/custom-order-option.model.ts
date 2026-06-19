import { ProductResponse, ProductSummary } from "./product.model";

export class CustomOrderOptionResponse {
  id: number;
  productId: number;
  label: string;
  placeholder?: string | null;
  required: boolean;
  createdAt: string;
  updatedAt: string;

  product: ProductSummary;

  constructor(params: {
    id: number;
    productId: number;
    label: string;
    required: boolean;
    createdAt: string;
    updatedAt: string;
    product: ProductResponse;
  }) {
    const { id, productId, label, required, createdAt, updatedAt, product } = params;
    this.id = id;
    this.productId = productId;
    this.label = label;
    this.required = required;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.product = product;
  }
}

export class CustomOrderOptionSummary {
  id: number;
  productId: number;
  label: string;
  placeholder?: string | null;
  required: boolean;

  constructor(params: {
    id: number;
    productId: number;
    label: string;
    required: boolean;
  }) {
    const { id, productId, label, required } = params;
    this.id = id;
    this.productId = productId;
    this.label = label;
    this.required = required;
  }
}