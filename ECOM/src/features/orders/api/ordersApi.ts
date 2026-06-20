import { apiClient } from "@/src/services/api/apiClient";
import { ENDPOINTS } from "@/src/services/api/endpoints";
import { UserProfile } from "@/src/features/auth/types/auth.types";

export interface OrderItemInput {
  _id: string; // Product ID
  name: string;
  qty: number;
  price: number;
  description?: string;
}

export interface CreateOrderPayload {
  orderItems: OrderItemInput[];
  shippingAddress: UserProfile["shippingAddress"];
  totalPrice: number;
  coupon?: string;
}

export interface CreateOrderResponse {
  url: string; // Stripe checkout session URL
  orderId?: string; // Database Order ID
}

export const ordersApi = {
  /**
   * Place a new order and retrieve the Stripe payment session URL
   */
  async createOrder(payload: CreateOrderPayload): Promise<CreateOrderResponse> {
    const response = await apiClient.post<CreateOrderResponse>(ENDPOINTS.ORDERS.CREATE, payload);
    return response.data;
  },

  /**
   * Fetch a single order status by ID
   */
  async getOrder(id: string): Promise<any> {
    const response = await apiClient.get<any>(ENDPOINTS.ORDERS.DETAIL(id));
    return response.data;
  },
};

export default ordersApi;
