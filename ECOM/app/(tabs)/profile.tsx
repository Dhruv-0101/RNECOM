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
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
import { ORDER_PAGINATION } from "@/src/features/orders/config/pagination";
import { Skeleton, OrderSkeletonCard } from "@/src/shared/ui/Skeleton";
import { apiClient } from "@/src/services/api/apiClient";

// Enable LayoutAnimation for Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function Profile() {
  const { colors, isDark, toggleTheme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch<AppDispatch>();

  const { user, isAuthenticated } = useCurrentUser();
  const { logout } = useLogout();
  const { isLoading, refetch, isFetching } = useUserProfile();

  const [activeTab, setActiveTab] = useState<"orders" | "address">("orders");
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Pagination states for customer orders
  const [orders, setOrders] = useState<PopulatedOrder[]>([]);
  const [ordersPage, setOrdersPage] = useState(1);
  const [hasMoreOrders, setHasMoreOrders] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);

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

  // Fetch paginated customer orders
  const loadUserOrders = async (pageNum: number, isAppend = false) => {
    if (!isAuthenticated) return;
    setLoadingOrders(true);
    try {
      const res = await apiClient.get("/api/v1/orders", {
        params: {
          page: pageNum,
          limit: ORDER_PAGINATION.CUSTOMER_LIMIT,
        },
      });
      const fetchedOrders = res.data?.orders || [];
      if (isAppend) {
        setOrders((prev) => {
          const existingIds = new Set(prev.map((o) => o._id));
          const uniqueNew = fetchedOrders.filter((o: any) => !existingIds.has(o._id));
          return [...prev, ...uniqueNew];
        });
      } else {
        setOrders(fetchedOrders);
      }

      setHasMoreOrders(res.data?.pagination?.hasNextPage ?? false);
    } catch (err) {
      console.log("Failed to load user orders:", err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleLoadMoreOrders = async () => {
    if (!loadingOrders && hasMoreOrders) {
      const nextPage = ordersPage + 1;
      setOrdersPage(nextPage);
      await loadUserOrders(nextPage, true);
    }
  };

  // Load customer orders initially and on login state change
  useEffect(() => {
    if (isAuthenticated) {
      setOrdersPage(1);
      setHasMoreOrders(true);
      loadUserOrders(1, false);
    } else {
      setOrders([]);
    }
  }, [isAuthenticated]);

  // Pull-to-refresh
  const handleRefresh = async () => {
    if (!isAuthenticated) return;
    setRefreshing(true);
    try {
      await refetch();
      setOrdersPage(1);
      await loadUserOrders(1, false);
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
        <Card style={[styles.guestCard, { borderColor: colors.border }]}>
          <View style={[styles.guestIconContainer, { backgroundColor: isDark ? "rgba(99, 102, 241, 0.12)" : "#eff6ff" }]}>
            <Ionicons name="person-circle-outline" size={64} color={colors.primary} />
          </View>
          <Text variant="xl" weight="bold" align="center" style={styles.guestTitle}>
            Unlock Your Profile
          </Text>
          <Text
            variant="sm"
            color={colors.textMuted}
            align="center"
            style={styles.guestDescription}
          >
            Sign in to track orders, manage default shipping locations, and enjoy a faster, personalized checkout experience.
          </Text>
          <Button
            title="Sign In / Register"
            onPress={() => router.push("/login")}
            icon="log-in-outline"
            style={{ width: "100%", height: 48, borderRadius: 24 }}
          />
        </Card>
      </View>
    );
  }

  // Loading indicator for authenticated fetch
  const isProfileLoading = isLoading && !refreshing;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Safe Area Spacer at the top */}
      <View style={{ height: insets.top, backgroundColor: colors.surface }} />

      <ScrollView
        showsVerticalScrollIndicator={false}
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
        <Card style={[styles.headerCard, { borderColor: colors.border }]}>
          <View style={styles.headerRow}>
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
              <Text variant="lg" weight="bold" color="#ffffff">
                {user.fullname ? user.fullname.split(" ").map((n) => n[0]).join("").toUpperCase() : "U"}
              </Text>
            </View>
            <View style={styles.userInfo}>
              <View style={styles.nameRow}>
                <Text variant="lg" weight="bold" numberOfLines={1}>
                  {user.fullname}
                </Text>
                <View style={styles.verifyBadge}>
                  <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                </View>
              </View>
              <Text variant="xs" color={colors.textMuted} numberOfLines={1}>
                {user.email}
              </Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={[styles.actionBtnHeader, { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9", marginRight: SPACING.sm }]}
                onPress={toggleTheme}
                activeOpacity={0.7}
              >
                <Ionicons name={isDark ? "sunny" : "moon"} size={16} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtnHeader, { backgroundColor: isDark ? "rgba(239, 68, 68, 0.15)" : "#fef2f2" }]}
                onPress={handleLogoutPress}
                activeOpacity={0.7}
              >
                <Ionicons name="log-out-outline" size={16} color={colors.error} />
              </TouchableOpacity>
            </View>
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
              size={16}
              color={activeTab === "orders" ? colors.primary : colors.textMuted}
            />
            <Text
              variant="sm"
              weight={activeTab === "orders" ? "semibold" : "medium"}
              color={activeTab === "orders" ? colors.text : colors.textMuted}
              style={{ marginLeft: 6 }}
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
              size={16}
              color={activeTab === "address" ? colors.primary : colors.textMuted}
            />
            <Text
              variant="sm"
              weight={activeTab === "address" ? "semibold" : "medium"}
              color={activeTab === "address" ? colors.text : colors.textMuted}
              style={{ marginLeft: 6 }}
            >
              Address Book
            </Text>
          </TouchableOpacity>
        </View>

        {/* 3. Tab contents block */}
        {isProfileLoading ? (
          <View style={{ padding: SPACING.xs }}>
            {/* Header Profile card skeleton */}
            <Card style={[styles.headerCard, { borderColor: colors.border, padding: SPACING.md, marginBottom: SPACING.md }]}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Skeleton width={50} height={50} borderRadius={25} style={{ marginRight: SPACING.md }} />
                <View style={{ flex: 1 }}>
                  <Skeleton width={120} height={16} style={{ marginBottom: 8 }} />
                  <Skeleton width={160} height={10} />
                </View>
              </View>
            </Card>

            {/* Profile Tab select bar skeleton */}
            <View style={{ flexDirection: "row", marginBottom: SPACING.md, gap: SPACING.md, paddingHorizontal: SPACING.sm }}>
              <Skeleton width="48%" height={36} borderRadius={18} />
              <Skeleton width="48%" height={36} borderRadius={18} />
            </View>

            {/* Orders list skeletons */}
            {Array.from({ length: ORDER_PAGINATION.CUSTOMER_LIMIT }).map((_, i) => (
              <OrderSkeletonCard key={`profile-initial-skeleton-${i}`} />
            ))}
          </View>
        ) : activeTab === "orders" ? (
          // ORDERS LIST
          <View>
            {loadingOrders && orders.length === 0 ? (
              <View>
                {Array.from({ length: ORDER_PAGINATION.CUSTOMER_LIMIT }).map((_, i) => (
                  <OrderSkeletonCard key={`orders-initial-skeleton-${i}`} />
                ))}
              </View>
            ) : orders.length === 0 ? (
              <Card style={[styles.emptyCard, { borderColor: colors.border }]}>
                <View style={[styles.emptyIconCircle, { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "#f8fafc" }]}>
                  <Ionicons name="receipt-outline" size={44} color={colors.textMuted} />
                </View>
                <Text variant="md" weight="bold" style={styles.emptyTitle}>
                  No Orders Yet
                </Text>
                <Text variant="sm" color={colors.textMuted} align="center" style={styles.emptyText}>
                  All details concerning your shipping history and package tracking will display here once you make a purchase.
                </Text>
                <Button
                  title="Shop Trending Catalog"
                  onPress={() => router.push("/")}
                  icon="cart-outline"
                  style={{ height: 44, borderRadius: 22 }}
                />
              </Card>
            ) : (
              <>
                {orders
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
                      <Card key={order._id} style={[styles.orderCard, { borderColor: colors.border }]}>
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
                              Placed {dateStr}
                            </Text>
                          </View>
                          <View style={styles.orderHeaderRight}>
                            <Text variant="md" weight="bold" color={colors.primary}>
                              ${order.totalPrice.toFixed(2)}
                            </Text>
                            <Ionicons
                              name={isExpanded ? "chevron-up" : "chevron-down"}
                              size={18}
                              color={colors.textMuted}
                              style={{ marginLeft: SPACING.xs }}
                            />
                          </View>
                        </TouchableOpacity>

                        {/* Status Badges Row */}
                        <View style={styles.badgesRow}>
                          <View style={[styles.statusBadge, { backgroundColor: paymentColors.bg }]}>
                            <Text variant="xs" weight="bold" color={paymentColors.text}>
                              Payment: {order.paymentStatus?.toUpperCase() || "PENDING"}
                            </Text>
                          </View>
                          <View style={[styles.statusBadge, { backgroundColor: shippingColors.bg }]}>
                            <Text variant="xs" weight="bold" color={shippingColors.text}>
                              Status: {order.status?.toUpperCase() || "PROCESSING"}
                            </Text>
                          </View>
                        </View>

                        {/* Collapsible expanded details */}
                        {isExpanded && (
                          <View style={styles.expandedContent}>
                            <View style={[styles.divider, { backgroundColor: colors.border }]} />

                            <Text variant="xs" weight="bold" color={colors.textMuted} style={styles.sectionTitle}>
                              ITEMS PURCHASED
                            </Text>
                            {order.orderItems?.map((item, index) => (
                              <View key={`${item._id || ""}-${index}`} style={styles.itemRow}>
                                <View style={styles.itemLeft}>
                                  <Text variant="sm" weight="semibold">
                                    {item.name}
                                  </Text>
                                  {item.description ? (
                                    <Text variant="xs" color={colors.textMuted} style={{ marginTop: 1 }}>
                                      {item.description}
                                    </Text>
                                  ) : null}
                                  <Text variant="xs" color={colors.textMuted} style={{ marginTop: 2 }}>
                                    {item.qty} x ${item.price.toFixed(2)}
                                  </Text>
                                </View>
                                <Text variant="sm" weight="bold">
                                  ${(item.qty * item.price).toFixed(2)}
                                </Text>
                              </View>
                            ))}

                            <View style={[styles.divider, { backgroundColor: colors.border }]} />

                            <Text variant="xs" weight="bold" color={colors.textMuted} style={styles.sectionTitle}>
                              DELIVERY ADDRESS
                            </Text>
                            <View style={[styles.addressDetails, { backgroundColor: colors.inputBg }]}>
                              <Text variant="sm" weight="semibold">
                                {order.shippingAddress?.recipientFirstName || order.shippingAddress?.firstName} {order.shippingAddress?.recipientLastName || order.shippingAddress?.lastName}
                              </Text>
                              <Text variant="xs" color={colors.textMuted} style={{ marginTop: 4 }}>
                                {order.shippingAddress?.streetAddress || order.shippingAddress?.address}
                              </Text>
                              <Text variant="xs" color={colors.textMuted} style={{ marginTop: 2 }}>
                                {order.shippingAddress?.city}, {order.shippingAddress?.state || order.shippingAddress?.province} {order.shippingAddress?.postalCode}
                              </Text>
                              <Text variant="xs" color={colors.textMuted} style={{ marginTop: 2 }}>
                                {order.shippingAddress?.country}
                              </Text>
                              <Text variant="xs" color={colors.textMuted} style={{ marginTop: 6 }}>
                                📞 {order.shippingAddress?.recipientPhone || order.shippingAddress?.phone}
                              </Text>
                            </View>
                          </View>
                        )}
                      </Card>
                    );
                  })}
                {hasMoreOrders && !loadingOrders && (
                  <Button
                    title="Load More Orders"
                    onPress={handleLoadMoreOrders}
                    loading={false}
                    disabled={loadingOrders}
                    variant="outline"
                    style={{ marginTop: SPACING.md, height: 44, borderRadius: 22 }}
                  />
                )}
                {loadingOrders && orders.length > 0 && (
                  <View style={{ marginTop: SPACING.md }}>
                    {Array.from({ length: ORDER_PAGINATION.CUSTOMER_LIMIT }).map((_, i) => (
                      <OrderSkeletonCard key={`orders-load-more-skeleton-${i}`} />
                    ))}
                  </View>
                )}
              </>
            )}
          </View>
        ) : (
          // ADDRESS BOOK
          <View>
            {!isEditingAddress && user?.hasShippingAddress ? (
              <Card style={[styles.addressCard, { borderColor: colors.border }]}>
                <View style={styles.addressCardHeader}>
                  <View style={[styles.addressIconWrapper, { backgroundColor: isDark ? "rgba(99, 102, 241, 0.15)" : "#e0e7ff" }]}>
                    <Ionicons name="location" size={20} color={colors.primary} />
                  </View>
                  <Text variant="md" weight="bold" style={{ flex: 1, marginLeft: SPACING.sm }}>
                    Primary Shipping Location
                  </Text>
                </View>

                <View style={[styles.addressViewContent, { backgroundColor: colors.inputBg }]}>
                  <Text variant="md" weight="semibold">
                    {user?.shippingAddress?.firstName} {user?.shippingAddress?.lastName}
                  </Text>
                  <Text variant="sm" color={colors.textMuted} style={{ marginTop: SPACING.xs }}>
                    {user?.shippingAddress?.address}
                  </Text>
                  <Text variant="sm" color={colors.textMuted} style={{ marginTop: 2 }}>
                    {user?.shippingAddress?.city}, {user?.shippingAddress?.province} {user?.shippingAddress?.postalCode}
                  </Text>
                  <Text variant="sm" color={colors.textMuted} style={{ marginTop: 2 }}>
                    {user?.shippingAddress?.country}
                  </Text>
                  <Text variant="sm" color={colors.textMuted} style={{ marginTop: SPACING.sm }}>
                    📞 {user?.shippingAddress?.phone}
                  </Text>
                </View>

                <Button
                  title="Modify Details"
                  onPress={() => setIsEditingAddress(true)}
                  icon="create-outline"
                  variant="outline"
                  style={{ marginTop: SPACING.md, height: 44, borderRadius: 22 }}
                />
              </Card>
            ) : (
              <Card style={[styles.formCard, { borderColor: colors.border }]}>
                <Text variant="md" weight="bold" style={{ marginBottom: SPACING.md }}>
                  {user?.hasShippingAddress ? "Modify Shipping Details" : "Setup Shipping Location"}
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
                    title="Save Changes"
                    onPress={handleSaveAddress}
                    loading={isSavingAddress}
                    disabled={isSavingAddress}
                    icon="checkmark-outline"
                    style={{ height: 44, borderRadius: 22 }}
                  />
                  {user?.hasShippingAddress && (
                    <Button
                      title="Cancel"
                      onPress={() => {
                        setIsEditingAddress(false);
                        setFormErrors({});
                      }}
                      variant="text"
                      style={{ height: 44, borderRadius: 22 }}
                    />
                  )}
                </View>
              </Card>
            )}
          </View>
        )}


      </ScrollView>
    </View>
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
    paddingVertical: SPACING.xxl * 1.2,
    paddingHorizontal: SPACING.xl,
    borderRadius: 16,
    borderWidth: 1,
  },
  guestIconContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.lg,
  },
  guestTitle: {
    marginBottom: SPACING.xs,
  },
  guestDescription: {
    marginBottom: SPACING.xl,
    lineHeight: 20,
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
    borderRadius: 16,
    borderWidth: 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  userInfo: {
    flex: 1,
    marginLeft: SPACING.md,
    justifyContent: "center",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  verifyBadge: {
    marginLeft: 6,
  },
  logoutBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
    borderRadius: 16,
    borderWidth: 1,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    marginBottom: SPACING.xs,
  },
  emptyText: {
    lineHeight: 20,
    marginBottom: SPACING.lg,
  },
  orderCard: {
    marginBottom: SPACING.md,
    padding: SPACING.md,
    borderRadius: 16,
    borderWidth: 1,
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
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.sm,
  },
  expandedContent: {
    marginTop: SPACING.md,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
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
    borderRadius: 16,
    borderWidth: 1,
  },
  addressCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  addressIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  addressViewContent: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  formCard: {
    padding: SPACING.lg,
    borderRadius: 16,
    borderWidth: 1,
  },
  formRow: {
    flexDirection: "row",
    marginHorizontal: -SPACING.xs,
  },
  formActions: {
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },
  settingsCard: {
    padding: SPACING.md,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: SPACING.xl,
  },
  settingsTitle: {
    marginBottom: SPACING.sm,
  },
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  settingsRowLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingsIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.sm,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionBtnHeader: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
});
