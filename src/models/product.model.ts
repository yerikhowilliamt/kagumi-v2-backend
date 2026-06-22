import { CategoryResponse, CategorySummary } from './category.model';
import {
  CustomOrderOptionResponse,
  CustomOrderOptionSummary,
} from './custom-order-option.model';
import { ImageResponse, ImageSummary } from './image.model';
import { OrderItemResponse, OrderItemSummary } from './order-item.model';

export class ProductResponse {
  id: number;
  categoryId: number;
  name: string;
  description: string;
  price: number;
  type: ProductType;
  stock: number;
  createdAt: string;
  updatedAt: string;

  category: CategorySummary;
  orderItems: OrderItemSummary[];
  customOrders: CustomOrderOptionSummary[];
  images: ImageSummary[];

  constructor(params: {
    id: number;
    categoryId: number;
    name: string;
    description: string;
    price: number;
    type: ProductType;
    stock: number;
    createdAt: string;
    updatedAt: string;
    category: CategoryResponse;
  }) {
    const {
      id,
      categoryId,
      name,
      description,
      price,
      type,
      stock,
      createdAt,
      updatedAt,
      category,
    } = params;
    this.id = id;
    this.categoryId = categoryId;
    this.name = name;
    this.description = description;
    this.price = price;
    this.type = type;
    this.stock = stock;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.category = category;
    this.orderItems = [];
    this.customOrders = [];
    this.images = [];
  }
}

export enum ProductType {
  REGULAR = 'REGULAR',
  DAILY_BAKE = 'DAILY_BAKE',
  CUSTOM = 'CUSTOM',
}

export class ProductSummary {
  id: number;
  categoryId: number;
  name: string;
  description: string;
  price: number;
  type: ProductType;
  stock: number;

  constructor(params: {
    id: number;
    categoryId: number;
    name: string;
    description: string;
    price: number;
    type: ProductType;
    stock: number;
  }) {
    const { id, categoryId, name, description, price, type, stock } = params;
    this.id = id;
    this.categoryId = categoryId;
    this.name = name;
    this.description = description;
    this.price = price;
    this.type = type;
    this.stock = stock;
  }
}
