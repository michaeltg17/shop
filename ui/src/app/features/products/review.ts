export interface Review {
  id: number;
  productId: number;
  author: string;
  rating: number; // 1-5
  title: string;
  comment: string;
  createdAt: string;
}
