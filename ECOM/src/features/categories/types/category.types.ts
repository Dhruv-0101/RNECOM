export interface Category {
  _id: string;
  name: string;
  image: string;
  products?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CategoriesResponse {
  status: string;
  message: string;
  categories: Category[];
}
