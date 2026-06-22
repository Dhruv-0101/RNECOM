import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ShippingAddress, ShippingAddressForm, ShippingAddressState } from "../types";

const initialForm: ShippingAddressForm = {
  recipientFirstName: "",
  recipientLastName: "",
  recipientPhone: "",
  streetAddress: "",
  city: "",
  state: "",
  postalCode: "",
  country: "",
  label: "Home",
  isOrderForMe: false,
};

const initialState: ShippingAddressState = {
  addresses: [],
  selectedAddressId: null,
  currentForm: initialForm,
  loading: false,
  error: null,
  hasSyncedProfile: false,
  profileAddressDeleted: false,
};

const shippingAddressSlice = createSlice({
  name: "shippingAddress",
  initialState,
  reducers: {
    syncProfileAddress: (state, action: PayloadAction<Omit<ShippingAddress, "id" | "isProfileAddress">>) => {
      if (state.profileAddressDeleted) {
        // Do not re-sync if the user explicitly deleted the profile address
        return;
      }

      const index = state.addresses.findIndex((a) => a.isProfileAddress);
      if (index !== -1) {
        state.addresses[index] = {
          ...state.addresses[index],
          ...action.payload,
        };
      } else {
        const newId = "profile-default";
        state.addresses.unshift({
          ...action.payload,
          id: newId,
          isProfileAddress: true,
          isDefault: state.addresses.length === 0,
        });
        if (!state.selectedAddressId) {
          state.selectedAddressId = newId;
        }
      }
      state.hasSyncedProfile = true;
    },
    updateFormFields: (state, action: PayloadAction<Partial<ShippingAddressForm>>) => {
      state.currentForm = {
        ...state.currentForm,
        ...action.payload,
      };
    },
    setOrderForMe: (
      state,
      action: PayloadAction<{
        checked: boolean;
        profile?: {
          firstName: string;
          lastName: string;
          phone: string;
          streetAddress?: string;
          city?: string;
          state?: string;
          postalCode?: string;
          country?: string;
        };
      }>
    ) => {
      const { checked, profile } = action.payload;
      state.currentForm.isOrderForMe = checked;

      if (checked && profile) {
        state.currentForm.recipientFirstName = profile.firstName;
        state.currentForm.recipientLastName = profile.lastName;
        state.currentForm.recipientPhone = profile.phone;
        state.currentForm.streetAddress = profile.streetAddress || "";
        state.currentForm.city = profile.city || "";
        state.currentForm.state = profile.state || "";
        state.currentForm.postalCode = profile.postalCode || "";
        state.currentForm.country = profile.country || "";
      } else if (!checked) {
        state.currentForm.recipientFirstName = "";
        state.currentForm.recipientLastName = "";
        state.currentForm.recipientPhone = "";
        state.currentForm.streetAddress = "";
        state.currentForm.city = "";
        state.currentForm.state = "";
        state.currentForm.postalCode = "";
        state.currentForm.country = "";
      }
    },
    saveCurrentFormAddress: (state) => {
      const isNew = !state.selectedAddressId || !state.addresses.some(a => a.id === state.selectedAddressId);
      const addressId = isNew ? Math.random().toString(36).substring(7) : state.selectedAddressId!;

      const newAddress: ShippingAddress = {
        id: addressId,
        label: state.currentForm.label,
        recipientFirstName: state.currentForm.recipientFirstName,
        recipientLastName: state.currentForm.recipientLastName,
        recipientPhone: state.currentForm.recipientPhone,
        streetAddress: state.currentForm.streetAddress,
        city: state.currentForm.city,
        state: state.currentForm.state,
        postalCode: state.currentForm.postalCode,
        country: state.currentForm.country,
        isDefault: state.addresses.length === 0, // Default if first address
      };

      if (isNew) {
        state.addresses.push(newAddress);
        state.selectedAddressId = addressId;
      } else {
        const index = state.addresses.findIndex((a) => a.id === addressId);
        if (index !== -1) {
          state.addresses[index] = {
            ...newAddress,
            isDefault: state.addresses[index].isDefault,
            isProfileAddress: state.addresses[index].isProfileAddress,
          };
        }
      }
    },
    loadAddressIntoForm: (state, action: PayloadAction<string>) => {
      const addr = state.addresses.find((a) => a.id === action.payload);
      if (addr) {
        state.selectedAddressId = addr.id;
        state.currentForm = {
          recipientFirstName: addr.recipientFirstName,
          recipientLastName: addr.recipientLastName,
          recipientPhone: addr.recipientPhone,
          streetAddress: addr.streetAddress,
          city: addr.city,
          state: addr.state,
          postalCode: addr.postalCode,
          country: addr.country,
          label: addr.label,
          isOrderForMe: false,
        };
      }
    },
    deleteAddress: (state, action: PayloadAction<string>) => {
      const addressToDelete = state.addresses.find((a) => a.id === action.payload);
      if (addressToDelete?.isProfileAddress) {
        state.profileAddressDeleted = true;
      }

      state.addresses = state.addresses.filter((a) => a.id !== action.payload);
      if (state.selectedAddressId === action.payload) {
        if (state.addresses.length > 0) {
          state.selectedAddressId = state.addresses[0].id;
        } else {
          state.selectedAddressId = null;
        }
      }
    },
    selectAddress: (state, action: PayloadAction<string>) => {
      state.selectedAddressId = action.payload;
      const addr = state.addresses.find((a) => a.id === action.payload);
      if (addr) {
        state.currentForm = {
          recipientFirstName: addr.recipientFirstName,
          recipientLastName: addr.recipientLastName,
          recipientPhone: addr.recipientPhone,
          streetAddress: addr.streetAddress,
          city: addr.city,
          state: addr.state,
          postalCode: addr.postalCode,
          country: addr.country,
          label: addr.label,
          isOrderForMe: false, // reset checkbox when picking custom
        };
      }
    },
    resetFormState: (state) => {
      state.currentForm = initialForm;
      state.selectedAddressId = null;
    },

    addSavedAddress: (state, action: PayloadAction<Omit<ShippingAddress, "id">>) => {
      const newId = Math.random().toString(36).substring(7);
      const newAddress: ShippingAddress = {
        ...action.payload,
        id: newId,
      };
      state.addresses.push(newAddress);
      if (!state.selectedAddressId) {
        state.selectedAddressId = newId;
      }
    },
    setDefaultAddress: (state, action: PayloadAction<string>) => {
      state.addresses = state.addresses.map((a) => ({
        ...a,
        isDefault: a.id === action.payload,
      }));
    }
  },
});

export const {
  updateFormFields,
  setOrderForMe,
  saveCurrentFormAddress,
  addSavedAddress,
  selectAddress,
  setDefaultAddress,
  deleteAddress,
  loadAddressIntoForm,
  resetFormState,
  syncProfileAddress,
} = shippingAddressSlice.actions;

export default shippingAddressSlice.reducer;
