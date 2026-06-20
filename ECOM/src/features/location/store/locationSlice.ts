import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { LocationData, LocationState } from "../types";

const initialState: LocationState = {
  selectedLocation: null,
  loading: false,
  error: null,
  permissionStatus: null,
};

const locationSlice = createSlice({
  name: "location",
  initialState,
  reducers: {
    setLocationStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    setLocationSuccess: (state, action: PayloadAction<LocationData>) => {
      state.selectedLocation = action.payload;
      state.loading = false;
      state.error = null;
    },
    setLocationFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    setPermissionStatus: (
      state,
      action: PayloadAction<LocationState["permissionStatus"]>
    ) => {
      state.permissionStatus = action.payload;
    },
    clearLocation: (state) => {
      state.selectedLocation = null;
      state.error = null;
    },
  },
});

export const {
  setLocationStart,
  setLocationSuccess,
  setLocationFailure,
  setPermissionStatus,
  clearLocation,
} = locationSlice.actions;

export default locationSlice.reducer;
