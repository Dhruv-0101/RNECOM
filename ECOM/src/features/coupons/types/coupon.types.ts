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

export interface CouponsResponse {
  status: string;
  message: string;
  coupons: Coupon[];
}

export interface SingleCouponResponse {
  status: string;
  message: string;
  coupon: Coupon;
}
