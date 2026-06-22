export interface Category {
  _id: string;
  name: string;
  image: string;
  products?: string[];
  createdAt: string;
  updatedAt: string;
}

import { PaginatedResponse } from "@/src/shared/types/pagination.types";

export interface CategoriesResponse extends PaginatedResponse<Category> {
  categories: Category[];
  total?: number;
  results?: number;
}
