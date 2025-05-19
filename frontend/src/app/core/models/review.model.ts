import { Resource } from '../services/book.service';

export interface Review {
  id: string;
  userId: string;
  resourceId: string;
  content: string;
  rating?: number;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    email: string;
  };
  resource?: Resource;
}

export interface CreateReviewDto {
  resourceId: string;
  content: string;
  rating?: number;
}

export interface UpdateReviewDto {
  content?: string;
  rating?: number;
}
