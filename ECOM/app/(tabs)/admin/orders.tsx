import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  LayoutAnimation,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { useTheme } from "@/src/shared/providers/ThemeProvider";
import { Text } from "@/src/shared/ui/Text";
import { Card } from "@/src/shared/ui/Card";
import { Button } from "@/src/shared/ui/Button";
import { Input } from "@/src/shared/ui/Input";
import { SPACING, BORDER_RADIUS } from "@/src/shared/constants/spacing";
import { apiClient } from "@/src/services/api/apiClient";
import { PopulatedOrder } from "@/src/features/auth/types/auth.types";
import { ORDER_PAGINATION } from "@/src/features/orders/config/pagination";
import { OrderSkeletonCard } from "@/src/shared/ui/Skeleton";

export default function AdminOrders() {
  const { colors, isDark } = useTheme();
  const router = useRouter();

  const [orders, setOrders] = useState<PopulatedOrder[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // Status edit state
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PopulatedOrder | null>(null);
  const [orderStatusForm, setOrderStatusForm] = useState<"pending" | "processing" | "shipped" | "delivered">("pending");

  const loadOrders = async (pageNum: number, searchVal: string, isAppend = false) => {
    setLoading(true);
    try {
      const res = await apiClient.get("/api/v1/orders", {
        params: {
          page: pageNum,
          limit: ORDER_PAGINATION.ADMIN_LIMIT,
          search: searchVal || undefined,
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

      setHasMore(res.data?.pagination?.hasNextPage ?? false);
    } catch (err) {
      console.log("Failed to load orders list:", err);
      Alert.alert("Error", "Could not fetch orders log from backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setPage(1);
      setHasMore(true);
      loadOrders(1, searchQuery, false);
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setPage(1);
    setHasMore(true);
    await loadOrders(1, searchQuery, false);
    setRefreshing(false);
  };

  const handleLoadMore = async () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      await loadOrders(nextPage, searchQuery, true);
    }
  };

  const toggleOrderExpand = (orderId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  const openStatusModal = (order: PopulatedOrder) => {
    setSelectedOrder(order);
    setOrderStatusForm(order.status);
    setIsModalVisible(true);
  };

  const handleUpdateOrderStatus = async () => {
    if (!selectedOrder) return;
    try {
      setLoading(true);
      await apiClient.put(`/api/v1/orders/update/${selectedOrder._id}`, {
        status: orderStatusForm,
      });
      Alert.alert("Success", "Order shipment status updated.");
      setIsModalVisible(false);
      loadOrders(1, searchQuery, false);
    } catch (err: any) {
      console.log("Order status update error:", err);
      Alert.alert("Failed", err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status?: string) => {
    const s = (status || "").toLowerCase();
    if (s === "paid" || s === "delivered") return colors.success;
    if (s === "pending" || s === "processing") return colors.warning;
    if (s === "shipped") return colors.primary;
    return colors.error;
  };

  return (
    <View style={[styles.mainContainer, { backgroundColor: colors.background }]}>
      {/* Header bar */}
      <View style={[styles.viewHeader, { borderBottomColor: colors.border, backgroundColor: colors.surface }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back-outline" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text variant="lg" weight="bold" style={styles.headerTitle}>
          Manage Orders
        </Text>
      </View>

      {/* Search Input Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Input
          placeholder="Search order ID or buyer name..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon="search-outline"
          containerStyle={styles.searchInputContainer}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {loading && !refreshing && orders.length > 0 && (
          <View style={styles.inlineLoader}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        )}

        {loading && !refreshing && orders.length === 0 ? (
          <View style={{ gap: SPACING.md }}>
            {Array.from({ length: ORDER_PAGINATION.ADMIN_LIMIT }).map((_, i) => (
              <OrderSkeletonCard key={`admin-order-initial-skeleton-${i}`} />
            ))}
          </View>
        ) : orders.length === 0 ? (
          <Text variant="sm" color={colors.textMuted} align="center" style={{ marginTop: SPACING.xxl }}>
            {searchQuery ? "No matching orders found." : "No orders registered on server yet."}
          </Text>
        ) : (
          <>
            {orders.map((order) => {
              const isExpanded = expandedOrderId === order._id;
              const buyer = order.user as any;
              const statusCol = getStatusColor(order.status);
              const payCol = getStatusColor(order.paymentStatus);
              const shippingAddr = order.shippingAddress as any;

              return (
                <Card key={order._id} style={[styles.orderCard, { borderColor: colors.border }]}>
                  <TouchableOpacity
                    style={styles.orderHeaderRow}
                    onPress={() => toggleOrderExpand(order._id)}
                    activeOpacity={0.9}
                  >
                    <View style={{ flex: 1 }}>
                      <Text variant="sm" weight="bold">
                        Order #{order.orderNumber}
                      </Text>
                      <Text variant="xs" color={colors.textMuted} style={{ marginTop: 2 }}>
                        Buyer: {buyer?.fullname || "Unknown"} ({buyer?.email || "N/A"})
                      </Text>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text variant="sm" weight="bold" color={colors.primary}>
                        ${order.totalPrice.toFixed(2)}
                      </Text>
                      <Ionicons
                        name={isExpanded ? "chevron-up" : "chevron-down"}
                        size={18}
                        color={colors.textMuted}
                      />
                    </View>
                  </TouchableOpacity>

                  {/* Quick status badges */}
                  <View style={styles.badgeRow}>
                    <View style={[styles.badgeContainer, { backgroundColor: payCol + "15" }]}>
                      <Text variant="xs" weight="semibold" color={payCol}>
                        Payment: {order.paymentStatus}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.badgeContainer, { backgroundColor: statusCol + "15" }]}
                      onPress={() => openStatusModal(order)}
                      activeOpacity={0.7}
                    >
                      <Text variant="xs" weight="semibold" color={statusCol}>
                        Shipment: {order.status} ✏️
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Expandable info details */}
                  {isExpanded && (
                    <View style={styles.expandedOrderView}>
                      <View style={[styles.hDivider, { backgroundColor: colors.border }]} />
                      <Text variant="xs" weight="semibold" style={{ marginBottom: SPACING.xs }}>
                        Purchased Items:
                      </Text>
                      {order.orderItems?.map((item, index) => (
                        <View key={`${item._id || ""}-${index}`} style={styles.orderItemRow}>
                          <Text variant="xs" style={{ flex: 1 }}>
                            {item.name} x {item.qty}
                          </Text>
                          <Text variant="xs" color={colors.textMuted}>
                            ${(item.price * item.qty).toFixed(2)}
                          </Text>
                        </View>
                      ))}

                      <View style={[styles.hDivider, { backgroundColor: colors.border }]} />
                      <Text variant="xs" weight="semibold" style={{ marginBottom: SPACING.xs }}>
                        Shipping Address:
                      </Text>
                      <Text variant="xs" color={colors.textMuted}>
                        {shippingAddr?.recipientFirstName || shippingAddr?.firstName} {shippingAddr?.recipientLastName || shippingAddr?.lastName}
                      </Text>
                      <Text variant="xs" color={colors.textMuted}>
                        {shippingAddr?.streetAddress || shippingAddr?.address}, {shippingAddr?.city}
                      </Text>
                      <Text variant="xs" color={colors.textMuted}>
                        {shippingAddr?.state || shippingAddr?.province}, {shippingAddr?.country}
                      </Text>
                      <Text variant="xs" color={colors.textMuted}>
                        Phone: {shippingAddr?.recipientPhone || shippingAddr?.phone}
                      </Text>
                    </View>
                  )}
                </Card>
              );
            })}
            {hasMore && !loading && (
              <Button
                title="Load More"
                onPress={handleLoadMore}
                loading={false}
                disabled={loading}
                variant="outline"
                style={{ marginTop: SPACING.md, height: 44, borderRadius: 22 }}
              />
            )}
            {loading && orders.length > 0 && (
              <View style={{ marginTop: SPACING.md, gap: SPACING.md }}>
                {Array.from({ length: ORDER_PAGINATION.ADMIN_LIMIT }).map((_, i) => (
                  <OrderSkeletonCard key={`admin-order-loadmore-skeleton-${i}`} />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* UPDATE STATUS MODAL */}
      <Modal visible={isModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text variant="md" weight="bold">
                Update shipment status
              </Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll}>
              {selectedOrder && (
                <View>
                  <Text variant="sm" weight="semibold" style={{ marginBottom: SPACING.md }}>
                    Choose shipment status for #{selectedOrder.orderNumber}:
                  </Text>
                  {["pending", "processing", "shipped", "delivered"].map((st) => (
                    <TouchableOpacity
                      key={st}
                      style={[
                        styles.statusSelectRow,
                        { borderColor: colors.border },
                        orderStatusForm === st && { backgroundColor: colors.inputBg },
                      ]}
                      onPress={() => setOrderStatusForm(st as any)}
                    >
                      <Ionicons
                        name={orderStatusForm === st ? "radio-button-on" : "radio-button-off"}
                        size={20}
                        color={colors.primary}
                      />
                      <Text variant="sm" weight="medium" style={{ marginLeft: 8 }}>
                        {st.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <Button
                title="Save Changes"
                onPress={handleUpdateOrderStatus}
                loading={loading}
                disabled={loading}
                style={{ marginTop: SPACING.lg }}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  viewHeader: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    marginRight: SPACING.md,
  },
  headerTitle: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  inlineLoader: {
    marginVertical: SPACING.xs,
    alignItems: "center",
  },
  orderCard: {
    marginBottom: SPACING.md,
    padding: SPACING.md,
    borderWidth: 1,
  },
  orderHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  badgeRow: {
    flexDirection: "row",
    marginTop: SPACING.md,
    gap: SPACING.xs,
  },
  badgeContainer: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.xs,
  },
  expandedOrderView: {
    marginTop: SPACING.sm,
  },
  hDivider: {
    height: 1,
    marginVertical: SPACING.sm,
  },
  orderItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    maxHeight: "80%",
    borderTopLeftRadius: BORDER_RADIUS.lg,
    borderTopRightRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  modalScroll: {
    paddingBottom: SPACING.xxxl,
  },
  statusSelectRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.md,
    borderWidth: 1.5,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
  },
  searchContainer: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  searchInputContainer: {
    marginBottom: SPACING.md,
  },
});
