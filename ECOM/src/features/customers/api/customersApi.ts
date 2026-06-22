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

import { PaginatedResponse } from "@/src/shared/types/pagination.types";

export interface CustomersResponse extends PaginatedResponse<Customer> {
  total: number;
  results: number;
  users: Customer[];
}

export const customersApi = {
  async getCustomers(params?: { page?: number; limit?: number; search?: string }): Promise<CustomersResponse> {
    const response = await apiClient.get<CustomersResponse>("/api/v1/users", { params });
    return response.data;
  },
};

export default customersApi;
