export interface ShippingAddress {
  id: string;
  label: "Home" | "Work" | "Other" | string;
  recipientFirstName: string;
  recipientLastName: string;
  recipientPhone: string;
  streetAddress: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

export interface ShippingAddressForm {
  recipientFirstName: string;
  recipientLastName: string;
  recipientPhone: string;
  streetAddress: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  label: "Home" | "Work" | "Other" | string;
  isOrderForMe: boolean;
}

export interface ShippingAddressState {
  addresses: ShippingAddress[];
  selectedAddressId: string | null;
  currentForm: ShippingAddressForm;
  loading: boolean;
  error: string | null;
}
