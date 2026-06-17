import * as SecureStore from "expo-secure-store";

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const OLD_TOKEN_KEY = "auth_token";

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
   * Persists the access token.
   * 
   * @param {string} token The JWT access token.
   * @returns {Promise<void>}
   */
  async setAccessToken(token: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
    } catch (error) {
      console.error("Error setting access token:", error);
    }
  },

  /**
   * Retrieves the persisted access token.
   * Checks the new key first, then falls back to the old key for smooth migrations.
   * 
   * @returns {Promise<string | null>} The active access token or null if not found.
   */
  async getAccessToken(): Promise<string | null> {
    try {
      const token = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
      if (token) return token;
      return await SecureStore.getItemAsync(OLD_TOKEN_KEY);
    } catch (error) {
      console.error("Error getting access token:", error);
      return null;
    }
  },

  /**
   * Removes the access token.
   * 
   * @returns {Promise<void>}
   */
  async removeAccessToken(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
      await SecureStore.deleteItemAsync(OLD_TOKEN_KEY);
    } catch (error) {
      console.error("Error deleting access token:", error);
    }
  },

  /**
   * Persists the refresh token.
   * 
   * @param {string} token The JWT refresh token.
   * @returns {Promise<void>}
   */
  async setRefreshToken(token: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
    } catch (error) {
      console.error("Error setting refresh token:", error);
    }
  },

  /**
   * Retrieves the persisted refresh token.
   * 
   * @returns {Promise<string | null>} The active refresh token or null if not found.
   */
  async getRefreshToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error("Error getting refresh token:", error);
      return null;
    }
  },

  /**
   * Removes the refresh token.
   * 
   * @returns {Promise<void>}
   */
  async removeRefreshToken(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error("Error deleting refresh token:", error);
    }
  },

  /**
   * Clears all session tokens from secure storage.
   * 
   * @returns {Promise<void>}
   */
  async clearTokens(): Promise<void> {
    await this.removeAccessToken();
    await this.removeRefreshToken();
  },

  /* ----------------------------------------------------
     Backward Compatibility Aliases
     ---------------------------------------------------- */
  async setToken(token: string): Promise<void> {
    await this.setAccessToken(token);
  },

  async getToken(): Promise<string | null> {
    return await this.getAccessToken();
  },

  async removeToken(): Promise<void> {
    await this.clearTokens();
  },
};

export default secureStorage;
