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
  },
  // We can add other endpoints like PRODUCTS, CATEGORIES, ORDERS, etc. here later
};

export default ENDPOINTS;
