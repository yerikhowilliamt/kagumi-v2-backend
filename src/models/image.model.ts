import { ProductResponse, ProductSummary } from "./product.model";

export class ImageResponse {
  id: number;
  productId: number;
  publicId: string;
  urls: string | [];
  createdAt: string;
  updatedAt: string;

  product: ProductSummary;

  constructor(params: {
    id: number;
    productId: number;
    publicId: string;
    urls: string;
    createdAt: string;
    updatedAt: string;
    product: ProductResponse;
  }) {
    const { id, productId, publicId, urls, createdAt, updatedAt, product } = params;
    this.id = id;
    this.productId = productId;
    this.publicId = publicId;
    this.urls = urls;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.product = product;
  }
}

export class ImageSummary {
  id: number;
  productId: number;
  publicId: string;
  urls: string | [];

  constructor(params: {
    id: number;
    productId: number;
    publicId: string;
    urls: string;
  }) {
    const { id, productId, publicId, urls } = params;
    this.id = id;
    this.productId = productId;
    this.publicId = publicId;
    this.urls = urls;
  }
}