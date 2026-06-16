import * as SecureStore from "expo-secure-store";

// The local key identifier used to store the user's JWT
const TOKEN_KEY = "auth_token";

/**
 * Secure Storage Utility wrapper.
 * 
 * We use Expo's 'SecureStore' rather than standard 'AsyncStorage' because:
 * - AsyncStorage stores data in plain unencrypted text on-disk.
 * - SecureStore utilizes hardware-backed encryption (iOS Keychain / Android Keystore)
 *   to securely encrypt and save sensitive credentials like user auth tokens.
 */
export const secureStorage = {
  /**
   * Persists the user's authentication JWT token.
   * 
   * @param {string} token The JWT auth token received from the login endpoint.
   * @returns {Promise<void>}
   */
  async setToken(token: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    } catch (error) {
      console.error("Error setting secure token:", error);
    }
  },

  /**
   * Retrieves the persisted JWT token.
   * Used on application boot to hydrate credentials and on API requests.
   * 
   * @returns {Promise<string | null>} The active token string or null if not found.
   */
  async getToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch (error) {
      console.error("Error getting secure token:", error);
      return null;
    }
  },

  /**
   * Deletes the persisted JWT token from on-device keychains.
   * Called during user sign-out or session expiries.
   * 
   * @returns {Promise<void>}
   */
  async removeToken(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    } catch (error) {
      console.error("Error deleting secure token:", error);
    }
  },
};

export default secureStorage;
