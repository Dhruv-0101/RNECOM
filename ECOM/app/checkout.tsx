import React, { useState, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity, ScrollView, Alert, TextInput, ActivityIndicator } from "react-native";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import * as WebBrowser from "expo-web-browser";
import { useTheme } from "@/src/shared/providers/ThemeProvider";
import { Text } from "@/src/shared/ui/Text";
import { Card } from "@/src/shared/ui/Card";
import { Input } from "@/src/shared/ui/Input";
import { Button } from "@/src/shared/ui/Button";
import { SPACING, BORDER_RADIUS } from "@/src/shared/constants/spacing";
import { RootState, AppDispatch } from "@/src/store/store";
import { useCurrentUser } from "@/src/features/auth/hooks/useCurrentUser";
import { updateUser } from "@/src/features/auth/store/authSlice";
import { authApi } from "@/src/features/auth/api/authApi";
import { ordersApi } from "@/src/features/orders/api/ordersApi";
import { couponsApi } from "@/src/features/coupons/api/couponsApi";
import { Coupon } from "@/src/features/coupons/types/coupon.types";
import { clearCart } from "@/src/features/cart/store/cartSlice";

export default function CheckoutScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  const { user } = useCurrentUser();
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Address states
  const [form, setForm] = useState({
    firstName: user?.shippingAddress?.firstName || "",
    lastName: user?.shippingAddress?.lastName || "",
    address: user?.shippingAddress?.address || "",
    city: user?.shippingAddress?.city || "",
    province: user?.shippingAddress?.province || "",
    postalCode: user?.shippingAddress?.postalCode || "",
    country: user?.shippingAddress?.country || "",
    phone: user?.shippingAddress?.phone || "",
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isEditingAddress, setIsEditingAddress] = useState(!user?.hasShippingAddress);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Coupon states
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState("");
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  // Pre-fill form if user shipping address updates
  useEffect(() => {
    if (user?.shippingAddress) {
      setForm({
        firstName: user.shippingAddress.firstName || "",
        lastName: user.shippingAddress.lastName || "",
        address: user.shippingAddress.address || "",
        city: user.shippingAddress.city || "",
        province: user.shippingAddress.province || "",
        postalCode: user.shippingAddress.postalCode || "",
        country: user.shippingAddress.country || "",
        phone: user.shippingAddress.phone || "",
      });
      setIsEditingAddress(!user.hasShippingAddress);
    }
  }, [user]);

  const handleInputChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleSaveAddress = async () => {
    // Basic field validation
    const errors: Record<string, string> = {};
    if (!form.firstName.trim()) errors.firstName = "First name is required";
    if (!form.lastName.trim()) errors.lastName = "Last name is required";
    if (!form.address.trim()) errors.address = "Address is required";
    if (!form.city.trim()) errors.city = "City is required";
    if (!form.province.trim()) errors.province = "Province is required";
    if (!form.postalCode.trim()) errors.postalCode = "Postal code is required";
    if (!form.country.trim()) errors.country = "Country is required";
    if (!form.phone.trim()) errors.phone = "Phone number is required";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setIsSavingAddress(true);
      const response = await authApi.updateShippingAddress(form);
      if (response.userFound || response.user) {
        const updatedUser = response.userFound || response.user;
        dispatch(updateUser(updatedUser!));
        setIsEditingAddress(false);
      } else {
        throw new Error("Failed to retrieve updated user profile.");
      }
    } catch (err) {
      console.log("Save address error:", err);
      Alert.alert("Address Update Failed", err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setIsSavingAddress(false);
    }
  };

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

  // Compute pricing totals with coupon discounts applied
  const discountAmount = appliedCoupon ? total * (appliedCoupon.discount / 100) : 0;
  const finalTotal = total - discountAmount;

  const handlePayment = async () => {
    if (!user?.shippingAddress) {
      Alert.alert("Error", "Please complete your shipping address details first.");
      return;
    }

    if (cartItems.length === 0) {
      Alert.alert("Error", "Your shopping cart is empty.");
      return;
    }

    try {
      setIsProcessingPayment(true);

      // Structure items exactly as expected by the backend controllers
      const orderItems = cartItems.map((item) => ({
        _id: item.productId,
        name: item.name,
        qty: item.quantity,
        price: item.price,
        description: `${item.brand} | Size: ${item.size}, Color: ${item.color}`,
      }));

      const payload = {
        orderItems,
        shippingAddress: user.shippingAddress,
        totalPrice: total,
        coupon: appliedCoupon ? appliedCoupon.code : undefined,
      };

      const res = await ordersApi.createOrder(payload);

      if (res?.url) {
        // Open payment page in Web Browser (webview overlay)
        await WebBrowser.openBrowserAsync(res.url);

        // Once the browser resolves/closes:
        // 1. Clear cart locally
        dispatch(clearCart());
        // 2. Redirect to Order Success screen
        router.replace("/order-success");
      } else {
        throw new Error("Payment session creation failed. URL not found.");
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
      <View style={[styles.container, { backgroundColor: colors.background }]}>
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
            /* Shipping Form Stage */
            <Card style={styles.sectionCard}>
              <Text variant="lg" weight="bold" style={styles.sectionTitle}>
                Shipping Address
              </Text>
              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: SPACING.sm }}>
                  <Input
                    label="First Name"
                    placeholder="John"
                    value={form.firstName}
                    onChangeText={(val) => handleInputChange("firstName", val)}
                    error={formErrors.firstName}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Input
                    label="Last Name"
                    placeholder="Doe"
                    value={form.lastName}
                    onChangeText={(val) => handleInputChange("lastName", val)}
                    error={formErrors.lastName}
                  />
                </View>
              </View>

              <Input
                label="Street Address"
                placeholder="123 Shopping Avenue"
                value={form.address}
                onChangeText={(val) => handleInputChange("address", val)}
                error={formErrors.address}
              />

              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: SPACING.sm }}>
                  <Input
                    label="City"
                    placeholder="San Francisco"
                    value={form.city}
                    onChangeText={(val) => handleInputChange("city", val)}
                    error={formErrors.city}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Input
                    label="State / Province"
                    placeholder="CA"
                    value={form.province}
                    onChangeText={(val) => handleInputChange("province", val)}
                    error={formErrors.province}
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: SPACING.sm }}>
                  <Input
                    label="Postal Code"
                    placeholder="94103"
                    value={form.postalCode}
                    onChangeText={(val) => handleInputChange("postalCode", val)}
                    error={formErrors.postalCode}
                    keyboardType="numeric"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Input
                    label="Country"
                    placeholder="United States"
                    value={form.country}
                    onChangeText={(val) => handleInputChange("country", val)}
                    error={formErrors.country}
                  />
                </View>
              </View>

              <Input
                label="Phone Number"
                placeholder="+1 555 123 4567"
                value={form.phone}
                onChangeText={(val) => handleInputChange("phone", val)}
                error={formErrors.phone}
                keyboardType="phone-pad"
              />

              <Button
                title="Save & Continue"
                onPress={handleSaveAddress}
                loading={isSavingAddress}
                style={styles.saveButton}
              />
              {user?.hasShippingAddress && (
                <Button
                  title="Cancel"
                  onPress={() => setIsEditingAddress(false)}
                  variant="outline"
                  style={styles.cancelBtn}
                />
              )}
            </Card>
          ) : (
            /* Order Overview Stage */
            <>
              {/* Shipping Address Overview */}
              <Card style={styles.sectionCard}>
                <View style={styles.cardHeader}>
                  <Text variant="lg" weight="bold">
                    Shipping Details
                  </Text>
                  <TouchableOpacity
                    onPress={() => setIsEditingAddress(true)}
                    style={[styles.editAddressBtn, { backgroundColor: colors.inputBg }]}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="create-outline" size={16} color={colors.primary} />
                    <Text variant="xs" weight="bold" color={colors.primary} style={{ marginLeft: 4 }}>
                      Edit
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={[styles.addressDetails, { borderColor: colors.border }]}>
                  <Text variant="md" weight="semibold">
                    {user?.shippingAddress?.firstName} {user?.shippingAddress?.lastName}
                  </Text>
                  <Text variant="sm" color={colors.textMuted} style={{ marginTop: 4 }}>
                    {user?.shippingAddress?.address}
                  </Text>
                  <Text variant="sm" color={colors.textMuted}>
                    {user?.shippingAddress?.city}, {user?.shippingAddress?.province} {user?.shippingAddress?.postalCode}
                  </Text>
                  <Text variant="sm" color={colors.textMuted}>
                    {user?.shippingAddress?.country}
                  </Text>
                  <Text variant="sm" color={colors.textMuted} style={{ marginTop: 6 }}>
                    📞 {user?.shippingAddress?.phone}
                  </Text>
                </View>
              </Card>

              {/* Order Items List */}
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
  row: {
    flexDirection: "row",
    width: "100%",
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
  editAddressBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
  },
  addressDetails: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
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
});
