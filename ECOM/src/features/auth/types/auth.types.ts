export interface UserProfile {
  _id: string;
  fullname: string;
  email: string;
  isAdmin: boolean;
  hasShippingAddress: boolean;
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
  orders?: string[] | PopulatedOrder[];
  wishLists?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PopulatedOrder {
  _id: string;
  user?: {
    _id: string;
    fullname: string;
    email: string;
    shippingAddress?: UserProfile["shippingAddress"];
  } | string;
  orderNumber: string;
  orderItems: {
    _id: string;
    name: string;
    qty: number;
    price: number;
    description?: string;
  }[];
  shippingAddress: {
    firstName?: string;
    lastName?: string;
    address?: string;
    city?: string;
    postalCode?: string;
    province?: string;
    country?: string;
    phone?: string;
    recipientFirstName?: string;
    recipientLastName?: string;
    streetAddress?: string;
    state?: string;
    recipientPhone?: string;
  };
  paymentStatus: string;
  paymentMethod?: string;
  totalPrice: number;
  currency?: string;
  status: "pending" | "processing" | "shipped" | "delivered";
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
}

export interface AuthResponse {
  status: string;
  message: string;
  token?: string;
  accessToken?: string;
  refreshToken?: string;
  userFound?: UserProfile;
  user?: UserProfile; // used in profile fetch/register responses sometimes
}
