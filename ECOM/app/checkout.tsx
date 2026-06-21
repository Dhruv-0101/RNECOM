import React, { useState, useMemo } from "react";
import { View, StyleSheet, TouchableOpacity, ScrollView, Alert, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import * as WebBrowser from "expo-web-browser";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/src/shared/providers/ThemeProvider";
import { Text } from "@/src/shared/ui/Text";
import { Card } from "@/src/shared/ui/Card";
import { Input } from "@/src/shared/ui/Input";
import { Button } from "@/src/shared/ui/Button";
import { SPACING, BORDER_RADIUS } from "@/src/shared/constants/spacing";
import { RootState, AppDispatch } from "@/src/store/store";
import { useCurrentUser } from "@/src/features/auth/hooks/useCurrentUser";
import { authApi } from "@/src/features/auth/api/authApi";
import { updateUser } from "@/src/features/auth/store/authSlice";
import { ordersApi } from "@/src/features/orders/api/ordersApi";
import { couponsApi } from "@/src/features/coupons/api/couponsApi";
import { useCoupons } from "@/src/features/coupons/hooks/useCoupons";
import { Coupon } from "@/src/features/coupons/types/coupon.types";
import { CouponSkeleton } from "@/src/shared/ui/Skeleton";
import { COUPON_PAGINATION } from "@/src/features/coupons/config/pagination";

import { clearCart } from "@/src/features/cart/store/cartSlice";
import {
  updateFormFields,
  setOrderForMe,
  saveCurrentFormAddress,
  addSavedAddress,
  selectAddress,
  deleteAddress,
  loadAddressIntoForm,
  resetFormState,
  syncProfileAddress,
} from "@/src/features/shippingAddress/store/shippingAddressSlice";

export default function CheckoutScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch<AppDispatch>();

  const { user } = useCurrentUser();
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Address Redux States
  const { addresses, selectedAddressId, currentForm } = useSelector(
    (state: RootState) => state.shippingAddress
  );

  const selectedAddress = useMemo(() => {
    return addresses.find((a) => a.id === selectedAddressId) || (addresses.length > 0 ? addresses[0] : null);
  }, [addresses, selectedAddressId]);

  const [isEditingAddress, setIsEditingAddress] = useState(addresses.length === 0);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showValidationErrors, setShowValidationErrors] = useState(false);

  // Synchronize and initialize Redux address list with user's profile shipping address
  React.useEffect(() => {
    if (user?.shippingAddress?.address) {
      const names = (user.fullname || "").trim().split(/\s+/);
      const firstName = names[0] || "";
      const lastName = names.slice(1).join(" ") || "";
      
      const profileAddr = {
        recipientFirstName: user.shippingAddress.firstName || firstName,
        recipientLastName: user.shippingAddress.lastName || lastName,
        recipientPhone: user.shippingAddress.phone || "",
        streetAddress: user.shippingAddress.address || "",
        city: user.shippingAddress.city || "",
        state: user.shippingAddress.province || "",
        postalCode: user.shippingAddress.postalCode || "",
        country: user.shippingAddress.country || "",
        label: "Home" as const,
        isDefault: addresses.length === 0,
      };
      
      dispatch(syncProfileAddress(profileAddr));
      
      if (addresses.length === 0) {
        setIsEditingAddress(false);
      }
    }
  }, [user, dispatch]);

  // Coupon states with pagination
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [couponPage, setCouponPage] = useState(1);
  const [hasMoreCoupons, setHasMoreCoupons] = useState(true);
  const [loadingCoupons, setLoadingCoupons] = useState(false);

  const loadCoupons = async (pageNum: number, isAppend = false) => {
    setLoadingCoupons(true);
    try {
      const res = await couponsApi.getCoupons({
        page: pageNum,
        limit: COUPON_PAGINATION.CHECKOUT_LIMIT,
      });
      const fetchedCoupons = res?.coupons || [];
      if (isAppend) {
        setCoupons((prev) => {
          const existingIds = new Set(prev.map((c) => c._id));
          const uniqueNew = fetchedCoupons.filter((c) => !existingIds.has(c._id));
          return [...prev, ...uniqueNew];
        });
      } else {
        setCoupons(fetchedCoupons);
      }
      setHasMoreCoupons(fetchedCoupons.length === COUPON_PAGINATION.CHECKOUT_LIMIT);
    } catch (err) {
      console.log("Failed to load coupons in checkout:", err);
    } finally {
      setLoadingCoupons(false);
    }
  };

  React.useEffect(() => {
    loadCoupons(1, false);
  }, []);

  const handleLoadMoreCoupons = async () => {
    if (!loadingCoupons && hasMoreCoupons) {
      const nextPage = couponPage + 1;
      setCouponPage(nextPage);
      await loadCoupons(nextPage, true);
    }
  };

  const activeCoupons = useMemo(() => {
    const now = new Date();
    return coupons.filter((c) => new Date(c.endDate) > now);
  }, [coupons]);

  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState("");
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  // Form Validation
  const { errors, isValid } = useMemo(() => {
    const errs: Record<string, string> = {};
    const {
      recipientFirstName,
      recipientLastName,
      recipientPhone,
      streetAddress,
      city,
      state,
      postalCode,
      country,
    } = currentForm;

    if (!recipientFirstName.trim()) errs.recipientFirstName = "First name is required";
    if (!recipientLastName.trim()) errs.recipientLastName = "Last name is required";
    if (!streetAddress.trim()) errs.streetAddress = "Street address is required";
    if (!city.trim()) errs.city = "City is required";
    if (!state.trim()) errs.state = "State is required";
    
    if (!postalCode.trim()) {
      errs.postalCode = "Postal code is required";
    } else if (!/^[A-Z0-9\s-]{3,10}$/i.test(postalCode.trim())) {
      errs.postalCode = "Invalid postal code format";
    }
    
    if (!country.trim()) errs.country = "Country is required";
    
    if (!recipientPhone.trim()) {
      errs.recipientPhone = "Phone number is required";
    } else if (!/^\+?[\d\s-]{10,15}$/.test(recipientPhone.trim())) {
      errs.recipientPhone = "Invalid phone number format (min 10 digits)";
    }

    return {
      errors: errs,
      isValid: Object.keys(errs).length === 0,
    };
  }, [currentForm]);

  const handleInputChange = (field: keyof typeof currentForm, value: string | boolean) => {
    dispatch(updateFormFields({ [field]: value }));
  };

  const handleToggleOrderForMe = () => {
    const newChecked = !currentForm.isOrderForMe;
    if (newChecked && user) {
      const names = (user.fullname || "").trim().split(/\s+/);
      const firstName = names[0] || "";
      const lastName = names.slice(1).join(" ") || "";
      dispatch(
        setOrderForMe({
          checked: true,
          profile: {
            firstName: user.shippingAddress?.firstName || firstName,
            lastName: user.shippingAddress?.lastName || lastName,
            phone: user.shippingAddress?.phone || "",
            streetAddress: user.shippingAddress?.address || "",
            city: user.shippingAddress?.city || "",
            state: user.shippingAddress?.province || "",
            postalCode: user.shippingAddress?.postalCode || "",
            country: user.shippingAddress?.country || "",
          },
        })
      );
    } else {
      dispatch(setOrderForMe({ checked: false }));
    }
  };

  const handleSaveAddress = async () => {
    if (!isValid) {
      setShowValidationErrors(true);
      return;
    }

    const isProfileAddr = selectedAddressId === "profile-default" || currentForm.isOrderForMe || addresses.length === 0;

    dispatch(saveCurrentFormAddress());
    setIsEditingAddress(false);
    setShowValidationErrors(false);

    if (isProfileAddr) {
      const profileData = {
        firstName: currentForm.recipientFirstName,
        lastName: currentForm.recipientLastName,
        address: currentForm.streetAddress,
        city: currentForm.city,
        province: currentForm.state,
        postalCode: currentForm.postalCode,
        country: currentForm.country,
        phone: currentForm.recipientPhone,
      };
      try {
        const response = await authApi.updateShippingAddress(profileData);
        if (response?.user) {
          dispatch(updateUser(response.user));
        }
      } catch (err) {
        console.log("Failed to auto-sync address update to profile:", err);
      }
    }
  };

  const handleEditAddress = (addressId: string) => {
    dispatch(loadAddressIntoForm(addressId));
    setIsEditingAddress(true);
  };

  const handleDeleteAddress = (addressId: string) => {
    Alert.alert(
      "Delete Address",
      "Are you sure you want to remove this delivery address?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => dispatch(deleteAddress(addressId)),
        },
      ]
    );
  };

  const handleAddNewAddress = () => {
    dispatch(resetFormState());
    setIsEditingAddress(true);
  };

  // Coupon handling
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError("Please enter a coupon code");
      return;
    }

    try {
      setIsValidatingCoupon(true);
      setCouponError("");
      const res = await couponsApi.getCoupon(couponCode.trim());
      if (res?.coupon) {
        setAppliedCoupon(res.coupon);
        setCouponError("");
      } else {
        throw new Error("Coupon not found.");
      }
    } catch (err) {
      console.log("Coupon apply error:", err);
      setCouponError(err instanceof Error ? err.message : "Invalid or expired coupon code.");
      setAppliedCoupon(null);
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError("");
  };

  const handleQuickApplyCoupon = async (code: string) => {
    setCouponCode(code);
    try {
      setIsValidatingCoupon(true);
      setCouponError("");
      const res = await couponsApi.getCoupon(code.trim());
      if (res?.coupon) {
        setAppliedCoupon(res.coupon);
        setCouponError("");
      } else {
        throw new Error("Coupon not found.");
      }
    } catch (err) {
      console.log("Coupon apply error:", err);
      setCouponError(err instanceof Error ? err.message : "Invalid or expired coupon code.");
      setAppliedCoupon(null);
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const discountAmount = appliedCoupon ? total * (appliedCoupon.discount / 100) : 0;
  const finalTotal = total - discountAmount;

  const handlePayment = async () => {
    if (!selectedAddress) {
      Alert.alert("Error", "Please complete your shipping address details first.");
      return;
    }

    if (cartItems.length === 0) {
      Alert.alert("Error", "Your shopping cart is empty.");
      return;
    }

    try {
      setIsProcessingPayment(true);

      const orderItems = cartItems.map((item) => ({
        _id: item.productId,
        name: item.name,
        qty: item.quantity,
        price: item.price,
        description: `${item.brand} | Size: ${item.size}, Color: ${item.color}`,
        image: item.image,
      }));

      // Structure exactly matching the requested ShippingAddress model
      const payload = {
        orderItems,
        shippingAddress: {
          recipientFirstName: selectedAddress.recipientFirstName,
          recipientLastName: selectedAddress.recipientLastName,
          recipientPhone: selectedAddress.recipientPhone,
          streetAddress: selectedAddress.streetAddress,
          city: selectedAddress.city,
          state: selectedAddress.state,
          postalCode: selectedAddress.postalCode,
          country: selectedAddress.country,
        },
        totalPrice: total,
        coupon: appliedCoupon ? appliedCoupon.code : undefined,
      };

      const res = await ordersApi.createOrder(payload);

      if (res?.url && res?.orderId) {
        await WebBrowser.openBrowserAsync(res.url);

        // Poll for payment status confirmation from Stripe webhook (5 attempts, 1.5s delay)
        let attempts = 0;
        let isPaid = false;

        while (attempts < 5) {
          try {
            const orderRes = await ordersApi.getOrder(res.orderId);
            if (orderRes?.order?.paymentStatus === "Paid") {
              isPaid = true;
              break;
            }
          } catch (pollErr) {
            console.log("Error polling order status:", pollErr);
          }
          await new Promise((resolve) => setTimeout(resolve, 1500));
          attempts++;
        }

        if (isPaid) {
          dispatch(clearCart());
          router.replace({
            pathname: "/order-success",
            params: { orderId: res.orderId },
          });
        } else {
          Alert.alert(
            "Payment Unconfirmed",
            "We could not verify your payment. If you cancelled or backed out, your cart items are preserved."
          );
        }
      } else {
        throw new Error("Payment session creation failed. URL or Order ID not found.");
      }
    } catch (err) {
      console.log("Stripe Checkout Error:", err);
      Alert.alert("Checkout Failed", err instanceof Error ? err.message : "Could not complete payment setup.");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          {/* Status Bar Spacer */}
          <View style={{ height: insets.top, backgroundColor: colors.surface }} />
          {/* Custom Header Bar */}
          <View style={[styles.topBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={[styles.backButton, { backgroundColor: colors.inputBg }]}
              activeOpacity={0.8}
            >
              <Ionicons name="chevron-back" size={22} color={colors.text} />
            </TouchableOpacity>
            <Text variant="lg" weight="semibold" style={styles.headerTitle}>
              Checkout
            </Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {isEditingAddress ? (
              /* Address Edit Form Stage */
              <Card style={styles.sectionCard}>
                <View style={styles.cardHeader}>
                  <Text variant="lg" weight="bold" style={styles.sectionTitle}>
                    {selectedAddressId ? "Edit Delivery Address" : "Add Delivery Address"}
                  </Text>
                  {addresses.length > 0 && (
                    <TouchableOpacity onPress={() => setIsEditingAddress(false)}>
                      <Text variant="sm" weight="semibold" color={colors.primary}>
                        View Saved
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* 'Order is for me' Checkbox */}
                <TouchableOpacity
                  style={[styles.checkboxRow, { borderColor: colors.border }]}
                  onPress={handleToggleOrderForMe}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={currentForm.isOrderForMe ? "checkbox" : "square-outline"}
                    size={22}
                    color={currentForm.isOrderForMe ? colors.primary : colors.textMuted}
                  />
                  <Text variant="sm" weight="semibold" color={colors.text} style={styles.checkboxLabel}>
                    Order is for me (Autofill details)
                  </Text>
                </TouchableOpacity>

                <View style={styles.row}>
                  <View style={{ flex: 1, marginRight: SPACING.sm }}>
                    <Input
                      label="First Name *"
                      placeholder="Recipient First Name"
                      value={currentForm.recipientFirstName}
                      onChangeText={(val) => handleInputChange("recipientFirstName", val)}
                      error={showValidationErrors ? errors.recipientFirstName : undefined}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Input
                      label="Last Name *"
                      placeholder="Recipient Last Name"
                      value={currentForm.recipientLastName}
                      onChangeText={(val) => handleInputChange("recipientLastName", val)}
                      error={showValidationErrors ? errors.recipientLastName : undefined}
                    />
                  </View>
                </View>

                <Input
                  label="Street Address *"
                  placeholder="Flat/House No, Building, Area"
                  value={currentForm.streetAddress}
                  onChangeText={(val) => handleInputChange("streetAddress", val)}
                  error={showValidationErrors ? errors.streetAddress : undefined}
                />

                <View style={styles.row}>
                  <View style={{ flex: 1, marginRight: SPACING.sm }}>
                    <Input
                      label="City *"
                      placeholder="Mumbai / New York"
                      value={currentForm.city}
                      onChangeText={(val) => handleInputChange("city", val)}
                      error={showValidationErrors ? errors.city : undefined}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Input
                      label="State *"
                      placeholder="MH / NY"
                      value={currentForm.state}
                      onChangeText={(val) => handleInputChange("state", val)}
                      error={showValidationErrors ? errors.state : undefined}
                    />
                  </View>
                </View>

                <View style={styles.row}>
                  <View style={{ flex: 1, marginRight: SPACING.sm }}>
                    <Input
                      label="Postal Code *"
                      placeholder="400001 / 10001"
                      value={currentForm.postalCode}
                      onChangeText={(val) => handleInputChange("postalCode", val)}
                      error={showValidationErrors ? errors.postalCode : undefined}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Input
                      label="Country *"
                      placeholder="India / United States"
                      value={currentForm.country}
                      onChangeText={(val) => handleInputChange("country", val)}
                      error={showValidationErrors ? errors.country : undefined}
                    />
                  </View>
                </View>

                <Input
                  label="Phone Number *"
                  placeholder="Recipient Mobile Number (min 10 digits)"
                  value={currentForm.recipientPhone}
                  onChangeText={(val) => handleInputChange("recipientPhone", val)}
                  error={showValidationErrors ? errors.recipientPhone : undefined}
                  keyboardType="phone-pad"
                />

                {/* Address Label selection */}
                <Text variant="xs" weight="bold" color={colors.textMuted} style={styles.sectionSub}>
                  ADDRESS LABEL
                </Text>
                <View style={styles.chipRow}>
                  {["Home", "Work", "Other"].map((lbl) => {
                    const isSelected = currentForm.label === lbl;
                    return (
                      <TouchableOpacity
                        key={lbl}
                        onPress={() => handleInputChange("label", lbl)}
                        style={[
                          styles.chip,
                          {
                            backgroundColor: isSelected ? colors.primary : colors.inputBg,
                            borderColor: isSelected ? colors.primary : colors.border,
                          },
                        ]}
                      >
                        <Text variant="xs" weight="bold" color={isSelected ? "#ffffff" : colors.text}>
                          {lbl}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Button
                  title="Save & Continue"
                  onPress={handleSaveAddress}
                  disabled={!isValid}
                  style={styles.saveButton}
                />
                {addresses.length > 0 && (
                  <Button
                    title="Cancel"
                    onPress={() => {
                      setIsEditingAddress(false);
                      setShowValidationErrors(false);
                    }}
                    variant="outline"
                    style={styles.cancelBtn}
                  />
                )}
              </Card>
            ) : (
              /* Order Overview & Address Selection Stage */
              <>
                {/* Delivery Address Details */}
                <Card style={styles.sectionCard}>
                  <View style={styles.cardHeader}>
                    <Text variant="lg" weight="bold">
                      Delivery Address
                    </Text>
                    <TouchableOpacity
                      onPress={handleAddNewAddress}
                      style={[styles.addAddressBtn, { backgroundColor: colors.inputBg }]}
                    >
                      <Ionicons name="add" size={16} color={colors.primary} />
                      <Text variant="xs" weight="bold" color={colors.primary} style={{ marginLeft: 2 }}>
                        Add New
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* List of Saved Addresses */}
                  {addresses.map((item) => {
                    const isSelected = selectedAddress?.id === item.id;
                    return (
                      <TouchableOpacity
                        key={item.id}
                        onPress={() => dispatch(selectAddress(item.id))}
                        style={[
                          styles.addressOption,
                          {
                            borderColor: isSelected ? colors.primary : colors.border,
                            backgroundColor: isSelected
                              ? isDark
                                ? "rgba(99, 102, 241, 0.05)"
                                : "#f5f3ff"
                              : "transparent",
                          },
                        ]}
                        activeOpacity={0.8}
                      >
                        <View style={styles.addressLeft}>
                          <Ionicons
                            name={isSelected ? "radio-button-on" : "radio-button-off"}
                            size={18}
                            color={isSelected ? colors.primary : colors.textMuted}
                            style={{ marginRight: SPACING.sm, marginTop: 2 }}
                          />
                          <View style={{ flex: 1 }}>
                            <View style={styles.nameLabelRow}>
                              <Text variant="sm" weight="semibold">
                                {item.recipientFirstName} {item.recipientLastName}
                              </Text>
                              <View style={[styles.labelBadge, { backgroundColor: colors.inputBg }]}>
                                <Text variant="xs" weight="bold" color={colors.textMuted} style={styles.labelText}>
                                  {item.label}
                                </Text>
                              </View>
                              {item.isDefault && (
                                <View style={[styles.labelBadge, { backgroundColor: colors.success + "15" }]}>
                                  <Text variant="xs" weight="bold" color={colors.success} style={styles.labelText}>
                                    Default
                                  </Text>
                                </View>
                              )}
                            </View>
                            <Text variant="xs" color={colors.textMuted} style={{ marginTop: 2 }}>
                              {item.streetAddress}
                            </Text>
                            <Text variant="xs" color={colors.textMuted}>
                              {item.city}, {item.state} {item.postalCode}
                            </Text>
                            <Text variant="xs" color={colors.textMuted}>
                              {item.country}
                            </Text>
                            <Text variant="xs" color={colors.textMuted} style={{ marginTop: 4 }}>
                              📞 {item.recipientPhone}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.addressActions}>
                          <TouchableOpacity onPress={() => handleEditAddress(item.id)} style={styles.actionBtn}>
                            <Ionicons name="pencil-outline" size={16} color={colors.primary} />
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => handleDeleteAddress(item.id)} style={styles.actionBtn}>
                            <Ionicons name="trash-outline" size={16} color={colors.error} />
                          </TouchableOpacity>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </Card>

                {/* Items Summary */}
                <Card style={styles.sectionCard}>
                  <Text variant="lg" weight="bold" style={styles.sectionTitle}>
                    Items Summary
                  </Text>
                  {cartItems.map((item) => (
                    <View key={item.id} style={[styles.orderItemRow, { borderBottomColor: colors.border }]}>
                      <View style={{ flex: 1 }}>
                        <Text variant="sm" weight="semibold" numberOfLines={1}>
                          {item.name}
                        </Text>
                        <Text variant="xs" color={colors.textMuted} style={{ marginTop: 2 }}>
                          {item.brand} • Size: {item.size} • Color: {item.color}
                        </Text>
                      </View>
                      <View style={styles.qtyPriceBlock}>
                        <Text variant="sm" color={colors.textMuted}>
                          Qty {item.quantity}
                        </Text>
                        <Text variant="sm" weight="bold" style={{ marginLeft: 16 }}>
                          ${(item.price * item.quantity).toFixed(2)}
                        </Text>
                      </View>
                    </View>
                  ))}
                </Card>

                {/* Coupon Section */}
                <Card style={styles.sectionCard}>
                  <Text variant="lg" weight="bold" style={styles.sectionTitle}>
                    Promo Code
                  </Text>

                  {appliedCoupon ? (
                    <View style={[styles.appliedCouponRow, { backgroundColor: colors.success + "12", borderColor: colors.success }]}>
                      <View style={{ flex: 1 }}>
                        <Text variant="sm" weight="semibold" color={colors.success}>
                          🎉 Coupon "{appliedCoupon.code.toUpperCase()}" Applied
                        </Text>
                        <Text variant="xs" color={colors.textMuted} style={{ marginTop: 2 }}>
                          Get {appliedCoupon.discount}% OFF on your purchase
                        </Text>
                      </View>
                      <TouchableOpacity onPress={handleRemoveCoupon} style={styles.removeCouponBtn}>
                        <Ionicons name="close-circle" size={20} color={colors.error} />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <>
                      <View style={styles.couponInputRow}>
                        <TextInput
                          placeholder="Enter promo code (e.g. EXTRA10)"
                          placeholderTextColor={colors.inputPlaceholder}
                          value={couponCode}
                          onChangeText={(val) => {
                            setCouponCode(val);
                            setCouponError("");
                          }}
                          style={[
                            styles.couponInput,
                            {
                              color: colors.text,
                              borderColor: couponError ? colors.error : colors.border,
                              backgroundColor: colors.inputBg,
                            },
                          ]}
                          autoCapitalize="characters"
                        />
                        <TouchableOpacity
                          onPress={handleApplyCoupon}
                          disabled={isValidatingCoupon}
                          style={[styles.applyCouponBtn, { backgroundColor: colors.primary }]}
                          activeOpacity={0.8}
                        >
                          {isValidatingCoupon ? (
                            <ActivityIndicator size="small" color="#ffffff" />
                          ) : (
                            <Text variant="sm" weight="bold" color="#ffffff">
                              Apply
                            </Text>
                          )}
                        </TouchableOpacity>
                      </View>

                      {/* Horizontal Available Coupons List */}
                      {(loadingCoupons || activeCoupons.length > 0) && (
                        <View style={styles.availableCouponsWrapper}>
                          <Text variant="xs" weight="bold" color={colors.textMuted} style={styles.availableCouponsTitle}>
                            AVAILABLE COUPONS
                          </Text>
                          <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.couponsListScroll}
                          >
                            {loadingCoupons && coupons.length === 0 ? (
                              Array.from({ length: COUPON_PAGINATION.CHECKOUT_LIMIT }).map((_, i) => (
                                <CouponSkeleton key={`checkout-coupon-skeleton-${i}`} />
                              ))
                            ) : (
                              <>
                                {activeCoupons.map((item, index) => (
                                  <TouchableOpacity
                                    key={item._id || index}
                                    activeOpacity={0.7}
                                    onPress={() => handleQuickApplyCoupon(item.code)}
                                    style={[
                                      styles.couponCard,
                                      {
                                        backgroundColor: isDark ? "rgba(99, 102, 241, 0.08)" : "#f5f3ff",
                                        borderColor: isDark ? "rgba(99, 102, 241, 0.2)" : "#ddd6fe",
                                      },
                                    ]}
                                  >
                                    <View style={styles.couponCardLeft}>
                                      <Text variant="xs" weight="bold" color={colors.primary}>
                                        {item.code.toUpperCase()}
                                      </Text>
                                      <Text variant="xxs" color={colors.textMuted} style={{ marginTop: 2 }}>
                                        Save {item.discount}%
                                      </Text>
                                    </View>
                                    <View style={[styles.couponDottedLine, { borderColor: isDark ? "rgba(99, 102, 241, 0.2)" : "#c7d2fe" }]} />
                                    <View style={styles.couponCardRight}>
                                      <Text variant="xs" weight="bold" color={colors.primary}>
                                        APPLY
                                      </Text>
                                    </View>
                                  </TouchableOpacity>
                                ))}

                                {hasMoreCoupons && (
                                  <TouchableOpacity
                                    onPress={handleLoadMoreCoupons}
                                    activeOpacity={0.7}
                                    style={[
                                      styles.couponCard,
                                      {
                                        backgroundColor: isDark ? "rgba(99, 102, 241, 0.15)" : "#e0e7ff",
                                        borderColor: colors.primary,
                                        borderWidth: 1,
                                        justifyContent: "center",
                                        alignItems: "center",
                                      },
                                    ]}
                                  >
                                    {loadingCoupons ? (
                                      <ActivityIndicator size="small" color={colors.primary} />
                                    ) : (
                                      <View style={{ flexDirection: "row", alignItems: "center" }}>
                                        <Ionicons
                                          name="chevron-forward-circle"
                                          size={12}
                                          color={colors.primary}
                                          style={{ marginRight: 6 }}
                                        />
                                        <Text variant="xs" weight="bold" color={colors.primary}>
                                          Load More Offers ⚡
                                        </Text>
                                      </View>
                                    )}
                                  </TouchableOpacity>
                                )}
                              </>
                            )}
                          </ScrollView>
                        </View>
                      )}
                    </>
                  )}
                  {couponError ? (
                    <Text variant="xs" color={colors.error} style={styles.couponErrorText}>
                      {couponError}
                    </Text>
                  ) : null}
                </Card>

                {/* Payment Summary */}
                <Card style={styles.sectionCard}>
                  <Text variant="lg" weight="bold" style={styles.sectionTitle}>
                    Pricing Summary
                  </Text>
                  <View style={styles.priceRow}>
                    <Text variant="sm" color={colors.textMuted}>
                      Subtotal
                    </Text>
                    <Text variant="sm" weight="semibold">
                      ${total.toFixed(2)}
                    </Text>
                  </View>
                  {appliedCoupon ? (
                    <View style={styles.priceRow}>
                      <Text variant="sm" color={colors.textMuted}>
                        Discount ({appliedCoupon.discount}%)
                      </Text>
                      <Text variant="sm" weight="semibold" color={colors.error}>
                        -${discountAmount.toFixed(2)}
                      </Text>
                    </View>
                  ) : null}
                  <View style={styles.priceRow}>
                    <Text variant="sm" color={colors.textMuted}>
                      Shipping
                    </Text>
                    <Text variant="sm" weight="semibold" color={colors.success}>
                      FREE
                    </Text>
                  </View>
                  <View style={[styles.divider, { backgroundColor: colors.border }]} />
                  <View style={styles.priceRow}>
                    <Text variant="md" weight="bold">
                      Order Total
                    </Text>
                    <Text variant="lg" weight="bold" color={colors.primary}>
                      ${finalTotal.toFixed(2)}
                    </Text>
                  </View>

                  <Button
                    title="Proceed to Payment"
                    onPress={handlePayment}
                    loading={isProcessingPayment}
                    icon="card-outline"
                    style={styles.payBtn}
                  />
                </Card>
              </>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    height: 64,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  sectionCard: {
    marginBottom: SPACING.md,
    padding: SPACING.md,
  },
  sectionTitle: {
    marginBottom: SPACING.md,
  },
  sectionSub: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: "row",
    width: "100%",
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    marginBottom: SPACING.md,
  },
  checkboxLabel: {
    marginLeft: SPACING.sm,
  },
  chipRow: {
    flexDirection: "row",
    marginBottom: SPACING.lg,
  },
  chip: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.round,
    borderWidth: 1.5,
    marginRight: SPACING.sm,
  },
  saveButton: {
    marginTop: SPACING.sm,
  },
  cancelBtn: {
    marginTop: SPACING.xs,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  addAddressBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
  },
  addressOption: {
    borderWidth: 1.5,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  addressLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  nameLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  labelBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.xs,
    marginLeft: 6,
  },
  labelText: {
    fontSize: 9,
    lineHeight: 11,
  },
  addressActions: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: SPACING.sm,
  },
  actionBtn: {
    padding: 6,
    marginLeft: 4,
  },
  orderItemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
  },
  qtyPriceBlock: {
    flexDirection: "row",
    alignItems: "center",
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 4,
  },
  divider: {
    height: 1,
    marginVertical: SPACING.md,
  },
  payBtn: {
    marginTop: SPACING.lg,
  },
  couponInputRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  couponInput: {
    flex: 1,
    height: 48,
    borderWidth: 1.5,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    fontSize: 14,
    marginRight: SPACING.sm,
  },
  applyCouponBtn: {
    width: 80,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
  },
  couponErrorText: {
    marginTop: 6,
    marginLeft: 2,
  },
  appliedCouponRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
  },
  removeCouponBtn: {
    padding: SPACING.xs,
  },
  availableCouponsWrapper: {
    marginTop: SPACING.lg,
  },
  availableCouponsTitle: {
    marginBottom: SPACING.sm,
    letterSpacing: 0.5,
  },
  couponsListScroll: {
    paddingRight: SPACING.md,
    paddingVertical: 2,
  },
  couponCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    borderStyle: "dashed",
    marginRight: SPACING.sm,
    height: 52,
    width: 140,
    overflow: "hidden",
  },
  couponCardLeft: {
    flex: 1.2,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  couponDottedLine: {
    borderLeftWidth: 1.5,
    borderStyle: "dotted",
    height: "80%",
  },
  couponCardRight: {
    flex: 0.8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
});
