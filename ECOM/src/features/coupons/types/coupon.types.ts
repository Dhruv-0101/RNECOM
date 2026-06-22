import { PaginatedResponse } from "@/src/shared/types/pagination.types";

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

export interface CouponsResponse extends PaginatedResponse<Coupon> {
  coupons: Coupon[];
  total?: number;
  results?: number;
}

export interface SingleCouponResponse {
  status: string;
  message: string;
  coupon: Coupon;
}
