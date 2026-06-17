export interface ProductReview {
  _id: string;
  user: {
    _id: string;
    fullname: string;
  } | string;
  rating: number;
  message: string;
  createdAt: string;
}

export interface Product {
  _id: string;
  id?: string;
  name: string;
  description: string;
  brand: string;
  category: string;
  sizes: Array<"S" | "M" | "L" | "XL" | "XXL" | string>;
  colors: string[];
  user: string;
  images: string[];
  reviews?: ProductReview[];
  price: number;
  totalQty: number;
  totalSold: number;
  qtyLeft?: number;
  averageRating?: string | number;
  totalReviews?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductsResponse {
  status: string;
  total: number;
  results: number;
  pagination: {
    next?: {
      page: number;
      limit: number;
    };
    prev?: {
      page: number;
      limit: number;
    };
  };
  message: string;
  products: Product[];
}
