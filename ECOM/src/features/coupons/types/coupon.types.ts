export interface Coupon {
  _id: string;
  code: string;
  startDate: string;
  endDate: string;
  discount: number;
  user: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaginationDetails {
  page: number;
  limit: number;
}

export interface Pagination {
  next?: PaginationDetails;
  prev?: PaginationDetails;
}

export interface CouponsResponse {
  status: string;
  message: string;
  coupons: Coupon[];
  total?: number;
  results?: number;
  pagination?: Pagination;
}

export interface SingleCouponResponse {
  status: string;
  message: string;
  coupon: Coupon;
}
