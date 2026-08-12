export interface Review {
  reviewId: string;
  contractId: string;
  reviewerId: string;
  targetId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

export interface CreateReviewRequest {
  contractId: string;
  targetId: string;
  rating: number;
  comment?: string | null;
}
