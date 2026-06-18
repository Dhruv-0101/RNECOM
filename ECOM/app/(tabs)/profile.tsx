import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useDispatch } from "react-redux";

import { useTheme } from "@/src/shared/providers/ThemeProvider";
import { Text } from "@/src/shared/ui/Text";
import { Button } from "@/src/shared/ui/Button";
import { Card } from "@/src/shared/ui/Card";
import { Input } from "@/src/shared/ui/Input";
import { SPACING, BORDER_RADIUS } from "@/src/shared/constants/spacing";

import { useCurrentUser } from "@/src/features/auth/hooks/useCurrentUser";
import { useLogout } from "@/src/features/auth/hooks/useLogout";
import { useUserProfile } from "@/src/features/auth/hooks/useUserProfile";
import { authApi } from "@/src/features/auth/api/authApi";
import { updateUser } from "@/src/features/auth/store/authSlice";
import { PopulatedOrder } from "@/src/features/auth/types/auth.types";
import { AppDispatch } from "@/src/store/store";

// Enable LayoutAnimation for Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function Profile() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  const { user, isAuthenticated } = useCurrentUser();
  const { logout } = useLogout();
  const { isLoading, refetch, isFetching } = useUserProfile();

  const [activeTab, setActiveTab] = useState<"orders" | "address">("orders");
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Address editing states
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [addressForm, setAddressForm] = useState({
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    province: "",
    postalCode: "",
    country: "",
    phone: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSavingAddress, setIsSavingAddress] = useState(false);

  // Synchronize address form values when user changes
  useEffect(() => {
    if (user?.shippingAddress) {
      setAddressForm({
        firstName: user.shippingAddress.firstName || "",
        lastName: user.shippingAddress.lastName || "",
        address: user.shippingAddress.address || "",
        city: user.shippingAddress.city || "",
        province: user.shippingAddress.province || "",
        postalCode: user.shippingAddress.postalCode || "",
        country: user.shippingAddress.country || "",
        phone: user.shippingAddress.phone || "",
      });
    }
  }, [user]);

  // Pull-to-refresh
  const handleRefresh = async () => {
    if (!isAuthenticated) return;
    setRefreshing(true);
    try {
      await refetch();
    } catch (err) {
      console.log("Error refreshing profile:", err);
    } finally {
      setRefreshing(false);
    }
  };

  // Layout Animation on Expand/Collapse
  const toggleOrderExpand = (orderId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  // Logout conformation
  const handleLogoutPress = () => {
    Alert.alert("Log Out", "Are you sure you want to log out of your account?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/");
        },
      },
    ]);
  };

  // Validate and Save Address Book updates
  const handleSaveAddress = async () => {
    const errors: Record<string, string> = {};
    if (!addressForm.firstName.trim()) errors.firstName = "First name is required";
    if (!addressForm.lastName.trim()) errors.lastName = "Last name is required";
    if (!addressForm.address.trim()) errors.address = "Address is required";
    if (!addressForm.city.trim()) errors.city = "City is required";
    if (!addressForm.province.trim()) errors.province = "Province is required";
    if (!addressForm.postalCode.trim()) errors.postalCode = "Postal code is required";
    if (!addressForm.country.trim()) errors.country = "Country is required";
    if (!addressForm.phone.trim()) errors.phone = "Phone number is required";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setIsSavingAddress(true);
      const response = await authApi.updateShippingAddress(addressForm);
      if (response.userFound || response.user) {
        const updatedUser = response.userFound || response.user;
        dispatch(updateUser(updatedUser!));
        setIsEditingAddress(false);
        Alert.alert("Success", "Your shipping address has been updated successfully.");
      } else {
        throw new Error("Failed to receive updated profile details from server.");
      }
    } catch (err) {
      console.log("Failed to save shipping address:", err);
      Alert.alert(
        "Update Failed",
        err instanceof Error ? err.message : "An unexpected error occurred while saving."
      );
    } finally {
      setIsSavingAddress(false);
    }
  };

  // Form input changes
  const handleInputChange = (field: string, value: string) => {
    setAddressForm((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  // Get status color tokens
  const getStatusColors = (status?: string) => {
    const s = (status || "").toLowerCase();
    if (s === "paid" || s === "delivered") {
      return {
        bg: colors.success + "15",
        text: colors.success,
      };
    }
    if (s === "pending" || s === "processing") {
      return {
        bg: colors.warning + "15",
        text: colors.warning,
      };
    }
    if (s === "shipped") {
      return {
        bg: colors.primary + "15",
        text: colors.primary,
      };
    }
    return {
      bg: colors.error + "15",
      text: colors.error,
    };
  };

  // GUEST VIEW (Not Logged In)
  if (!isAuthenticated || !user) {
    return (
      <View style={[styles.guestContainer, { backgroundColor: colors.background }]}>
        <Card style={styles.guestCard}>
          <View style={[styles.guestIconContainer, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="person-circle-outline" size={64} color={colors.primary} />
          </View>
          <Text variant="xl" weight="bold" align="center" style={styles.guestTitle}>
            Unlock Your Dashboard
          </Text>
          <Text
            variant="sm"
            color={colors.textMuted}
            align="center"
            style={styles.guestDescription}
          >
            Sign in to track your order history, manage your shipping addresses, and enjoy a faster, personalized checkout experience.
          </Text>
          <Button
            title="Sign In / Register"
            onPress={() => router.push("/login")}
            icon="log-in-outline"
            style={styles.guestButton}
          />
        </Card>
      </View>
    );
  }

  // Loading indicator for authenticated fetch
  const isProfileLoading = isLoading && !refreshing;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing || isFetching}
          onRefresh={handleRefresh}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
    >
      {/* 1. Header Profile block */}
      <Card style={styles.headerCard}>
        <View style={styles.headerRow}>
          <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
            <Text variant="lg" weight="bold" color={colors.primary}>
              {user.fullname ? user.fullname.split(" ").map((n) => n[0]).join("").toUpperCase() : "U"}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text variant="lg" weight="bold" numberOfLines={1}>
              {user.fullname}
            </Text>
            <Text variant="xs" color={colors.textMuted} numberOfLines={1}>
              {user.email}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.logoutBtn, { borderColor: colors.border }]}
            onPress={handleLogoutPress}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={20} color={colors.error} />
          </TouchableOpacity>
        </View>
      </Card>

      {/* 2. Segmented tab selection control */}
      <View style={[styles.tabContainer, { backgroundColor: colors.inputBg }]}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "orders" && [styles.tabButtonActive, { backgroundColor: colors.surface }],
          ]}
          onPress={() => setActiveTab("orders")}
          activeOpacity={0.8}
        >
          <Ionicons
            name="receipt-outline"
            size={18}
            color={activeTab === "orders" ? colors.primary : colors.textMuted}
          />
          <Text
            variant="sm"
            weight={activeTab === "orders" ? "semibold" : "medium"}
            color={activeTab === "orders" ? colors.text : colors.textMuted}
            style={{ marginLeft: SPACING.xs }}
          >
            My Orders
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "address" && [styles.tabButtonActive, { backgroundColor: colors.surface }],
          ]}
          onPress={() => setActiveTab("address")}
          activeOpacity={0.8}
        >
          <Ionicons
            name="location-outline"
            size={18}
            color={activeTab === "address" ? colors.primary : colors.textMuted}
          />
          <Text
            variant="sm"
            weight={activeTab === "address" ? "semibold" : "medium"}
            color={activeTab === "address" ? colors.text : colors.textMuted}
            style={{ marginLeft: SPACING.xs }}
          >
            Address Book
          </Text>
        </TouchableOpacity>
      </View>

      {/* 3. Tab contents block */}
      {isProfileLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text variant="sm" color={colors.textMuted} style={{ marginTop: SPACING.md }}>
            Loading your profile...
          </Text>
        </View>
      ) : activeTab === "orders" ? (
        // ORDERS LIST
        <View>
          {!user.orders || user.orders.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Ionicons name="receipt-outline" size={48} color={colors.textMuted} />
              <Text variant="md" weight="semibold" style={styles.emptyTitle}>
                No Orders Yet
              </Text>
              <Text variant="sm" color={colors.textMuted} align="center" style={styles.emptyText}>
                When you make a purchase, your complete order history and tracking info will show up here.
              </Text>
              <Button
                title="Start Shopping"
                onPress={() => router.push("/")}
                icon="cart-outline"
                style={{ marginTop: SPACING.md }}
              />
            </Card>
          ) : (
            // Orders loop (using array iteration since we scroll inside ScrollView)
            (user.orders as PopulatedOrder[])
              .filter((order) => order && typeof order === "object" && order._id)
              .map((order) => {
                const isExpanded = expandedOrderId === order._id;
                const dateStr = order.createdAt ? new Date(order.createdAt).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                }) : "N/A";
                const paymentColors = getStatusColors(order.paymentStatus);
                const shippingColors = getStatusColors(order.status);

              return (
                <Card key={order._id} style={styles.orderCard}>
                  <TouchableOpacity
                    onPress={() => toggleOrderExpand(order._id)}
                    activeOpacity={0.9}
                    style={styles.orderHeader}
                  >
                    <View style={styles.orderHeaderLeft}>
                      <Text variant="md" weight="bold">
                        #{order.orderNumber}
                      </Text>
                      <Text variant="xs" color={colors.textMuted} style={{ marginTop: 2 }}>
                        Placed on {dateStr}
                      </Text>
                    </View>
                    <View style={styles.orderHeaderRight}>
                      <Text variant="md" weight="bold" color={colors.primary}>
                        ${order.totalPrice.toFixed(2)}
                      </Text>
                      <Ionicons
                        name={isExpanded ? "chevron-up" : "chevron-down"}
                        size={20}
                        color={colors.textMuted}
                        style={{ marginLeft: SPACING.xs }}
                      />
                    </View>
                  </TouchableOpacity>

                  {/* Status Badges Row */}
                  <View style={styles.badgesRow}>
                    <View style={[styles.badge, { backgroundColor: paymentColors.bg }]}>
                      <Text variant="xs" weight="semibold" color={paymentColors.text}>
                        Payment: {order.paymentStatus}
                      </Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: shippingColors.bg }]}>
                      <Text variant="xs" weight="semibold" color={shippingColors.text}>
                        Shipment: {order.status}
                      </Text>
                    </View>
                  </View>

                  {/* Expanded Order Content */}
                  {isExpanded && (
                    <View style={styles.expandedContent}>
                      <View style={[styles.divider, { backgroundColor: colors.border }]} />
                      
                      {/* Products List */}
                      <Text variant="sm" weight="semibold" style={styles.sectionTitle}>
                        Items Purchased
                      </Text>
                      {order.orderItems?.map((item, index) => (
                        <View key={item._id || index} style={styles.itemRow}>
                          <View style={styles.itemLeft}>
                            <Text variant="sm" weight="medium">
                              {item.name}
                            </Text>
                            {item.description && (
                              <Text variant="xs" color={colors.textMuted} style={{ marginTop: 2 }}>
                                {item.description}
                              </Text>
                            )}
                            <Text variant="xs" color={colors.textMuted} style={{ marginTop: 2 }}>
                              {item.qty} x ${item.price.toFixed(2)}
                            </Text>
                          </View>
                          <Text variant="sm" weight="semibold">
                            ${(item.qty * item.price).toFixed(2)}
                          </Text>
                        </View>
                      ))}

                      <View style={[styles.divider, { backgroundColor: colors.border }]} />

                      {/* Delivery Address Details */}
                      <Text variant="sm" weight="semibold" style={styles.sectionTitle}>
                        Shipping Details
                      </Text>
                      <View style={[styles.addressDetails, { backgroundColor: colors.inputBg }]}>
                        <Text variant="sm" weight="medium">
                          {order.shippingAddress?.firstName} {order.shippingAddress?.lastName}
                        </Text>
                        <Text variant="xs" color={colors.textMuted} style={{ marginTop: 4 }}>
                          {order.shippingAddress?.address}
                        </Text>
                        <Text variant="xs" color={colors.textMuted} style={{ marginTop: 2 }}>
                          {order.shippingAddress?.city}, {order.shippingAddress?.province} {order.shippingAddress?.postalCode}
                        </Text>
                        <Text variant="xs" color={colors.textMuted} style={{ marginTop: 2 }}>
                          {order.shippingAddress?.country}
                        </Text>
                        <Text variant="xs" color={colors.textMuted} style={{ marginTop: 6 }}>
                          📞 {order.shippingAddress?.phone}
                        </Text>
                      </View>
                    </View>
                  )}
                </Card>
              );
            })
          )}
        </View>
      ) : (
        // ADDRESS BOOK
        <View>
          {!isEditingAddress && user.hasShippingAddress ? (
            // Address Info display card
            <Card style={styles.addressCard}>
              <View style={styles.addressCardHeader}>
                <View style={styles.addressIconWrapper}>
                  <Ionicons name="location" size={24} color={colors.primary} />
                </View>
                <Text variant="md" weight="bold" style={{ flex: 1, marginLeft: SPACING.sm }}>
                  Default Shipping Address
                </Text>
              </View>

              <View style={[styles.addressViewContent, { backgroundColor: colors.inputBg }]}>
                <Text variant="md" weight="semibold">
                  {user.shippingAddress?.firstName} {user.shippingAddress?.lastName}
                </Text>
                <Text variant="sm" color={colors.textMuted} style={{ marginTop: SPACING.xs }}>
                  {user.shippingAddress?.address}
                </Text>
                <Text variant="sm" color={colors.textMuted} style={{ marginTop: 2 }}>
                  {user.shippingAddress?.city}, {user.shippingAddress?.province} {user.shippingAddress?.postalCode}
                </Text>
                <Text variant="sm" color={colors.textMuted} style={{ marginTop: 2 }}>
                  {user.shippingAddress?.country}
                </Text>
                <Text variant="sm" color={colors.textMuted} style={{ marginTop: SPACING.sm }}>
                  📞 {user.shippingAddress?.phone}
                </Text>
              </View>

              <Button
                title="Edit Address"
                onPress={() => setIsEditingAddress(true)}
                icon="create-outline"
                variant="outline"
                style={{ marginTop: SPACING.md }}
              />
            </Card>
          ) : (
            // Edit Address Form
            <Card style={styles.formCard}>
              <Text variant="md" weight="bold" style={{ marginBottom: SPACING.md }}>
                {user.hasShippingAddress ? "Edit Shipping Address" : "Save Shipping Address"}
              </Text>
              
              <View style={styles.formRow}>
                <Input
                  label="First Name"
                  placeholder="John"
                  value={addressForm.firstName}
                  onChangeText={(val) => handleInputChange("firstName", val)}
                  error={formErrors.firstName}
                  containerStyle={{ flex: 1, marginRight: SPACING.xs }}
                />
                <Input
                  label="Last Name"
                  placeholder="Doe"
                  value={addressForm.lastName}
                  onChangeText={(val) => handleInputChange("lastName", val)}
                  error={formErrors.lastName}
                  containerStyle={{ flex: 1, marginLeft: SPACING.xs }}
                />
              </View>

              <Input
                label="Street Address"
                placeholder="123 Main St, Apt 4B"
                value={addressForm.address}
                onChangeText={(val) => handleInputChange("address", val)}
                error={formErrors.address}
              />

              <View style={styles.formRow}>
                <Input
                  label="City"
                  placeholder="Toronto"
                  value={addressForm.city}
                  onChangeText={(val) => handleInputChange("city", val)}
                  error={formErrors.city}
                  containerStyle={{ flex: 1, marginRight: SPACING.xs }}
                />
                <Input
                  label="Province / State"
                  placeholder="Ontario"
                  value={addressForm.province}
                  onChangeText={(val) => handleInputChange("province", val)}
                  error={formErrors.province}
                  containerStyle={{ flex: 1, marginLeft: SPACING.xs }}
                />
              </View>

              <View style={styles.formRow}>
                <Input
                  label="Postal / ZIP Code"
                  placeholder="M4B 1B3"
                  value={addressForm.postalCode}
                  onChangeText={(val) => handleInputChange("postalCode", val)}
                  error={formErrors.postalCode}
                  containerStyle={{ flex: 1, marginRight: SPACING.xs }}
                />
                <Input
                  label="Country"
                  placeholder="Canada"
                  value={addressForm.country}
                  onChangeText={(val) => handleInputChange("country", val)}
                  error={formErrors.country}
                  containerStyle={{ flex: 1, marginLeft: SPACING.xs }}
                />
              </View>

              <Input
                label="Phone Number"
                placeholder="+1 416-555-0199"
                keyboardType="phone-pad"
                value={addressForm.phone}
                onChangeText={(val) => handleInputChange("phone", val)}
                error={formErrors.phone}
              />

              <View style={styles.formActions}>
                <Button
                  title="Save Address"
                  onPress={handleSaveAddress}
                  loading={isSavingAddress}
                  disabled={isSavingAddress}
                  icon="checkmark-outline"
                  style={styles.saveBtn}
                />
                {user.hasShippingAddress && (
                  <Button
                    title="Cancel"
                    onPress={() => {
                      setIsEditingAddress(false);
                      setFormErrors({});
                    }}
                    variant="text"
                    style={styles.cancelBtn}
                  />
                )}
              </View>
            </Card>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  guestContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.xl,
  },
  guestCard: {
    width: "100%",
    alignItems: "center",
    paddingVertical: SPACING.xxl,
    paddingHorizontal: SPACING.xl,
  },
  guestIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.lg,
  },
  guestTitle: {
    marginBottom: SPACING.sm,
  },
  guestDescription: {
    marginBottom: SPACING.xl,
    lineHeight: 20,
  },
  guestButton: {
    marginTop: SPACING.xs,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  headerCard: {
    marginBottom: SPACING.lg,
    padding: SPACING.md,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  userInfo: {
    flex: 1,
    marginLeft: SPACING.md,
    justifyContent: "center",
  },
  logoutBtn: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  tabContainer: {
    flexDirection: "row",
    borderRadius: BORDER_RADIUS.md,
    padding: 4,
    marginBottom: SPACING.lg,
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
  },
  tabButtonActive: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  loaderContainer: {
    paddingVertical: SPACING.xxxl,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyCard: {
    alignItems: "center",
    paddingVertical: SPACING.xxxl,
    paddingHorizontal: SPACING.xl,
  },
  emptyTitle: {
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  emptyText: {
    lineHeight: 20,
    marginBottom: SPACING.md,
  },
  orderCard: {
    marginBottom: SPACING.md,
    padding: SPACING.md,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderHeaderLeft: {
    flex: 1,
  },
  orderHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  badgesRow: {
    flexDirection: "row",
    marginTop: SPACING.md,
    gap: SPACING.xs,
  },
  badge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.xs,
  },
  expandedContent: {
    marginTop: SPACING.md,
  },
  divider: {
    height: 1,
    marginVertical: SPACING.md,
  },
  sectionTitle: {
    marginBottom: SPACING.sm,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: SPACING.xs,
  },
  itemLeft: {
    flex: 1,
    paddingRight: SPACING.md,
  },
  addressDetails: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.xs,
  },
  addressCard: {
    padding: SPACING.lg,
  },
  addressCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  addressIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  addressViewContent: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  formCard: {
    padding: SPACING.lg,
  },
  formRow: {
    flexDirection: "row",
    marginHorizontal: -SPACING.xs,
  },
  formActions: {
    marginTop: SPACING.md,
    gap: SPACING.xs,
  },
  saveBtn: {
    width: "100%",
  },
  cancelBtn: {
    width: "100%",
  },
});
