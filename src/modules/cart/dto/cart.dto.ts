export class AddCartItemRequest {
  productId: number;
  quantity: number;
}

export class UpdateCartItemRequest {
  quantity: number;
}

export class SyncCartRequest {
  items: AddCartItemRequest[];
}
