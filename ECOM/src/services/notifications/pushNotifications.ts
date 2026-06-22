import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { apiClient } from "@/src/services/api/apiClient";
import { ENDPOINTS } from "@/src/services/api/endpoints";
import { secureStorage } from "@/src/services/storage/secureStorage";

/**
 * Request notification permissions and fetch the Expo Push Token.
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  let token: string | null = null;

  if (Platform.OS === "web") {
    console.log("Web push notification registration is not supported.");
    return null;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("Failed to get push token (permission not granted).");
      return null;
    }

    // Expo projectId fallback from app.json extra config
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId ??
      "a3777e56-32d4-42ec-973b-7e80e188fdea";

    if (!projectId) {
      console.error("Project ID is missing. Push notifications require an EAS Project ID.");
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    token = tokenData.data;
    console.log("Generated Expo Push Token:", token);
    await secureStorage.setPushToken(token);

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#6366F1",
      });
    }
  } catch (error) {
    console.error("Error during push notification setup:", error);
  }

  return token;
}

/**
 * Register push token to the backend
 */
export async function registerPushTokenOnBackend(token: string): Promise<boolean> {
  try {
    await apiClient.post(ENDPOINTS.AUTH.REGISTER_PUSH_TOKEN, { token });
    console.log("Successfully registered push token on backend.");
    return true;
  } catch (error) {
    console.error("Failed to register push token on backend:", error);
    return false;
  }
}

/**
 * Unregister push token from the backend
 */
export async function unregisterPushTokenOnBackend(token: string): Promise<boolean> {
  try {
    await apiClient.delete(ENDPOINTS.AUTH.UNREGISTER_PUSH_TOKEN, {
      data: { token }, // DELETE request with body uses 'data' in axios
    });
    console.log("Successfully unregistered push token from backend.");
    return true;
  } catch (error) {
    console.error("Failed to unregister push token from backend:", error);
    return false;
  }
}
