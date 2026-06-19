import { ProductResponse, ProductSummary } from "./product.model";

export class CategoryResponse {
  id: number;
  parentId?: number | null;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;

  products: ProductSummary[];
  children: CategorySummary[];

  constructor(
    params : {
        id: number,
        name: string,
        description: string,
        createdAt: string,
        updatedAt: string
    }
  ) {
    const { id, name, description, createdAt, updatedAt } = params;
    this.id = id;
    this.name = name;
    this.description = description;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.products = [];
    this.children = [];
  }
}

export class CategorySummary {
  id: number;
  parentId?: number | null;
  name: string;
  description: string;

  constructor(params: {
    id: number;
    parentId?: number | null;
    name: string;
    description: string;
  }) {
    const { id, parentId, name, description } = params;
    this.id = id;
    this.parentId = parentId;
    this.name = name;
    this.description = description;
  }
}