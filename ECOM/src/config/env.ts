// import { Platform } from "react-native";
// import Constants from "expo-constants";

// /**
//  * Resolves the computer's local network IP address in development mode.
//  * 
//  * In React Native, using 'localhost' or '127.0.0.1' points to the phone/emulator's
//  * own internal network loopback, not the host development machine where the server runs.
//  * 
//  * Expo CLI serves the bundle from a local network IP (e.g. 192.168.1.15).
//  * We extract this IP from 'Constants.expoConfig.hostUri' so that physical devices 
//  * running Expo Go over Wi-Fi can reach the local backend server seamlessly.
//  * 
//  * @returns {string | null} The local host IP address or null if not resolved.
//  */
// const getHostIp = (): string | null => {
//   const hostUri = Constants.expoConfig?.hostUri;
//   if (hostUri) {
//     // hostUri is formatted like "192.168.1.15:8081". We split to get the IP.
//     return hostUri.split(":")[0];
//   }
  
//   // Fallback for manifest on older or alternative configurations
//   const debuggerHost = (Constants as any).manifest?.debuggerHost;
//   if (debuggerHost) {
//     return debuggerHost.split(":")[0];
//   }
//   return null;
// };

// /**
//  * Determines the target server API base URL based on the runtime context.
//  * 
//  * 1. Development Mode (__DEV__ is true):
//  *    - Attempts to connect to the dynamically resolved host IP address on port 2030.
//  *    - Falls back to '10.0.2.2' for Android Emulators (loopback redirection interface).
//  *    - Falls back to 'localhost' for iOS Simulators and Web.
//  * 
//  * 2. Production Mode:
//  *    - Uses 'EXPO_PUBLIC_API_URL' environment variable from the build bundle.
//  *    - Falls back to the production backend deployment URL if not set.
//  * 
//  * @returns {string} The base URL string.
//  */
// const getBaseUrl = (): string => {
//   if (__DEV__) {
//     const hostIp = getHostIp();
//     if (hostIp) {
//       return `http://${hostIp}:2030`;
//     }
//     // Android emulator sandbox maps the host machine's localhost to 10.0.2.2
//     return Platform.OS === "android" ? "http://10.0.2.2:2030" : "http://localhost:2030";
//   }
  
//   // Production URL fallback. Expo requires variables to be prefixed with EXPO_PUBLIC_
//   // to bundle them into the static client code during compilation.
//   return process.env.EXPO_PUBLIC_API_URL || "https://ecommerce-backend-powerful.onrender.com";
// };

// export const ENV = {
//   API_URL: getBaseUrl(),
//   IS_DEV: __DEV__,
// };

// export default ENV;
import { Platform } from "react-native";
import Constants from "expo-constants";

/**
 * Resolves the computer's local network IP address in development mode.
 * 
 * In React Native, using 'localhost' or '127.0.0.1' points to the phone/emulator's
 * own internal network loopback, not the host development machine where the server runs.
 * 
 * Expo CLI serves the bundle from a local network IP (e.g. 192.168.1.15).
 * We extract this IP from 'Constants.expoConfig.hostUri' so that physical devices 
 * running Expo Go over Wi-Fi can reach the local backend server seamlessly.
 * 
 * @returns {string | null} The local host IP address or null if not resolved.
 */
const getHostIp = (): string | null => {
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    // hostUri is formatted like "192.168.1.15:8081". We split to get the IP.
    return hostUri.split(":")[0];
  }
  
  // Fallback for manifest on older or alternative configurations
  const debuggerHost = (Constants as any).manifest?.debuggerHost;
  if (debuggerHost) {
    return debuggerHost.split(":")[0];
  }
  return null;
};

/**
 * Determines the target server API base URL based on the runtime context.
 * 
 * 1. Development Mode (__DEV__ is true):
 *    - Attempts to connect to the dynamically resolved host IP address on port 2030.
 *    - Falls back to '10.0.2.2' for Android Emulators (loopback redirection interface).
 *    - Falls back to 'localhost' for iOS Simulators and Web.
 * 
 * 2. Production Mode:
 *    - Uses 'EXPO_PUBLIC_API_URL' environment variable from the build bundle.
 *    - Falls back to the production backend deployment URL if not set.
 * 
 * @returns {string} The base URL string.
 */
const getBaseUrl = (): string => {
  if (__DEV__) {
    const hostIp = getHostIp();
    if (hostIp) {
      return `http://${hostIp}:2030`;
    }
    // Android emulator sandbox maps the host machine's localhost to 10.0.2.2
    return Platform.OS === "android" ? "http://10.0.2.2:2030" : "http://localhost:2030";
  }
  
  // Production URL fallback. Expo requires variables to be prefixed with EXPO_PUBLIC_
  // to bundle them into the static client code during compilation.
  return process.env.EXPO_PUBLIC_API_URL || "https://ecommerce-backend-powerful.onrender.com";
};

export const ENV = {
  API_URL: getBaseUrl(),
  IS_DEV: __DEV__,
};

export default ENV;
