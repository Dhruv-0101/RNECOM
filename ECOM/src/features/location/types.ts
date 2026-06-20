export interface LocationData {
  latitude: number;
  longitude: number;
  city: string;
  state: string;
  country: string;
  source: "gps" | "manual";
}

export interface LocationState {
  selectedLocation: LocationData | null;
  loading: boolean;
  error: string | null;
  permissionStatus: "granted" | "denied" | "undetermined" | null;
}
