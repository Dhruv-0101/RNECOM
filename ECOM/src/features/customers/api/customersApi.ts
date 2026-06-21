import { apiClient } from "@/src/services/api/apiClient";

export interface Customer {
  _id: string;
  fullname: string;
  email: string;
  shippingAddress?: {
    firstName?: string;
    lastName?: string;
    address?: string;
    city?: string;
    postalCode?: string;
    province?: string;
    country?: string;
    phone?: string;
  };
  totalOrders: number;
  totalSpent: number;
  createdAt: string;
}

export interface CustomersResponse {
  status: string;
  total: number;
  results: number;
  pagination: {
    next?: { page: number; limit: number };
    prev?: { page: number; limit: number };
  };
  message: string;
  users: Customer[];
}

export const customersApi = {
  async getCustomers(params?: { page?: number; limit?: number; search?: string }): Promise<CustomersResponse> {
    const response = await apiClient.get<CustomersResponse>("/api/v1/users", { params });
    return response.data;
  },
};

export default customersApi;
