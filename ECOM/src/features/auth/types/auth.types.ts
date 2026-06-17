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
  orders?: string[];
  wishLists?: string[];
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
