import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import * as Location from "expo-location";
import { RootState } from "@/src/store/store";
import {
  setLocationStart,
  setLocationSuccess,
  setLocationFailure,
  setPermissionStatus,
} from "../store/locationSlice";
import { LocationData } from "../types";

export function useLocation() {
  const dispatch = useDispatch();
  const { selectedLocation, loading, error, permissionStatus } = useSelector(
    (state: RootState) => state.location
  );

  const requestPermission = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      dispatch(setPermissionStatus(status as any));
      return status === "granted";
    } catch (err: any) {
      dispatch(setLocationFailure("Failed to request location permission"));
      return false;
    }
  }, [dispatch]);

  const fetchCurrentLocation = useCallback(async () => {
    dispatch(setLocationStart());
    try {
      // 1. Check current permission
      let { status } = await Location.getForegroundPermissionsAsync();
      
      // 2. Request permission if undetermined
      if (status !== "granted") {
        const { status: newStatus } = await Location.requestForegroundPermissionsAsync();
        status = newStatus;
        dispatch(setPermissionStatus(status as any));
      }

      if (status !== "granted") {
        dispatch(setLocationFailure("Permission to access location was denied. Please enable it in settings."));
        return { success: false, error: "Permission denied" };
      }

      // 3. Get coordinates
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = location.coords;

      // 4. Reverse geocode
      const geocodeResults = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (geocodeResults && geocodeResults.length > 0) {
        const address = geocodeResults[0];
        
        // Sometimes city is empty, check district or subregion
        const city = address.city || address.district || address.subregion || address.name || "Unknown City";
        const state = address.region || "Unknown State";
        const country = address.country || "India";

        const locationData: LocationData = {
          latitude,
          longitude,
          city,
          state,
          country,
          source: "gps",
        };

        dispatch(setLocationSuccess(locationData));
        return { success: true, data: locationData };
      } else {
        // Fallback if reverse geocoding returned nothing but we have GPS coordinates
        const locationData: LocationData = {
          latitude,
          longitude,
          city: "Detected Location",
          state: "GPS",
          country: "India",
          source: "gps",
        };
        dispatch(setLocationSuccess(locationData));
        return { success: true, data: locationData };
      }
    } catch (err: any) {
      console.error("Error in fetchCurrentLocation:", err);
      const errMsg = err.message || "Failed to fetch current location";
      dispatch(setLocationFailure(errMsg));
      return { success: false, error: errMsg };
    }
  }, [dispatch]);

  const selectManualLocation = useCallback((data: Omit<LocationData, "source">) => {
    const locationData: LocationData = {
      ...data,
      source: "manual",
    };
    dispatch(setLocationSuccess(locationData));
  }, [dispatch]);

  return {
    selectedLocation,
    loading,
    error,
    permissionStatus,
    requestPermission,
    fetchCurrentLocation,
    selectManualLocation,
  };
}
