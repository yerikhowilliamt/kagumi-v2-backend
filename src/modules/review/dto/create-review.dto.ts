export interface CreateReviewRequest {
  productId: number;
  orderId?: number | null;
  rating: number;
  comment?: string | null;
}
