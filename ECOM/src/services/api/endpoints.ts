/**
 * Central registry of all API routing endpoints.
 * 
 * Maps business operations to relative REST paths on the backend server.
 * Separated by feature domains to keep integrations clean and scalable.
 */
export const ENDPOINTS = {
  AUTH: {
    REGISTER: "/api/v1/users/register", // POST - User Sign Up (fullname, email, password)
    LOGIN: "/api/v1/users/login",       // POST - User Sign In (email, password)
    PROFILE: "/api/v1/users/profile",   // GET - Active authenticated user credentials & orders
    UPDATE_SHIPPING: "/api/v1/users/update/shipping", // PUT - Update shipping address details
    MOBILE_LOGIN: "/api/v1/users/mobile/login",       // POST - Mobile User Sign In
    MOBILE_REFRESH: "/api/v1/users/mobile/refresh",   // POST - Mobile Token Rotation Refresh
    MOBILE_LOGOUT: "/api/v1/users/mobile/logout",     // POST - Mobile User Sign Out
  },
  PRODUCTS: {
    LIST: "/api/v1/products", // GET - Fetch products list with filtering/pagination
    DETAIL: (id: string) => `/api/v1/products/${id}`, // GET - Fetch full product details
  },
};

export default ENDPOINTS;
