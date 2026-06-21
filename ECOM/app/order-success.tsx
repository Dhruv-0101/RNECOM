import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useTheme } from "@/src/shared/providers/ThemeProvider";
import { Text } from "@/src/shared/ui/Text";
import { Button } from "@/src/shared/ui/Button";
import { Card } from "@/src/shared/ui/Card";
import { SPACING, BORDER_RADIUS } from "@/src/shared/constants/spacing";
import { ordersApi } from "@/src/features/orders/api/ordersApi";

const fallbackImage = require("@/assets/images/react-logo.png");

export default function OrderSuccessScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { orderId } = useLocalSearchParams<{ orderId: string }>();

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (orderId) {
      setLoading(true);
      ordersApi
        .getOrder(orderId)
        .then((res) => {
          if (res?.order) {
            setOrder(res.order);
          }
        })
        .catch((err) => {
          console.log("Failed to fetch order details in success page:", err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [orderId]);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          {/* Green Checkmark Circle Banner */}
          <View style={[styles.successIconWrapper, { backgroundColor: colors.success + "15" }]}>
            <Ionicons name="checkmark-circle" size={80} color={colors.success} />
          </View>

          {/* Success Messaging */}
          <Text variant="xxl" weight="bold" align="center" style={styles.title}>
            Order Placed Successfully!
          </Text>

          <Text variant="sm" color={colors.textMuted} align="center" style={styles.subtitle}>
            Thank you for shopping with us. Your payment has been processed successfully, and we have received your order.
          </Text>
        </View>

        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text variant="xs" color={colors.textMuted} style={{ marginTop: SPACING.sm }}>
              Retrieving your order summary...
            </Text>
          </View>
        ) : order ? (
          <View style={styles.orderContainer}>
            {/* 1. Order Meta Information */}
            <Card style={[styles.card, { borderColor: colors.border }]}>
              <View style={styles.metaRow}>
                <View>
                  <Text variant="xs" color={colors.textMuted} weight="bold">
                    ORDER NUMBER
                  </Text>
                  <Text variant="md" weight="bold" style={{ marginTop: 2 }}>
                    #{order.orderNumber}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text variant="xs" color={colors.textMuted} weight="bold">
                    STATUS
                  </Text>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor:
                          order.paymentStatus === "Paid"
                            ? colors.success + "15"
                            : colors.warning + "15",
                      },
                    ]}
                  >
                    <Text
                      variant="xs"
                      weight="bold"
                      color={order.paymentStatus === "Paid" ? colors.success : colors.warning}
                    >
                      {order.paymentStatus?.toUpperCase() || "PENDING"}
                    </Text>
                  </View>
                </View>
              </View>
              
              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              <Text variant="xs" color={colors.textMuted} weight="bold" style={{ marginBottom: SPACING.sm }}>
                ITEMS ORDERED
              </Text>

              {/* Items List */}
              {order.orderItems?.map((item: any, idx: number) => {
                const itemImg = item.image ? { uri: item.image } : fallbackImage;
                return (
                  <View key={`${item._id || ""}-${idx}`} style={styles.itemRow}>
                    <Image
                      source={itemImg}
                      style={styles.itemImage}
                      contentFit="cover"
                      transition={200}
                    />
                    <View style={styles.itemDetails}>
                      <Text variant="sm" weight="semibold" numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text variant="xs" color={colors.textMuted} style={{ marginTop: 2, fontSize: 11 }} numberOfLines={1}>
                        {item.description || "Default variant"}
                      </Text>
                      <Text variant="xs" color={colors.textMuted} style={{ marginTop: 4 }}>
                        Qty: {item.qty} × ${item.price.toFixed(2)}
                      </Text>
                    </View>
                    <Text variant="sm" weight="bold" color={colors.text} style={styles.itemPrice}>
                      ${(item.price * item.qty).toFixed(2)}
                    </Text>
                  </View>
                );
              })}

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              {/* Order pricing summary */}
              <View style={styles.priceRow}>
                <Text variant="sm" color={colors.textMuted}>
                  Subtotal
                </Text>
                <Text variant="sm" color={colors.text} weight="semibold">
                  ${order.totalPrice?.toFixed(2)}
                </Text>
              </View>

              {order.coupon && (
                <View style={styles.priceRow}>
                  <Text variant="sm" color={colors.textMuted}>
                    Coupon Applied
                  </Text>
                  <Text variant="sm" color={colors.success} weight="semibold">
                    {order.coupon}
                  </Text>
                </View>
              )}

              <View style={styles.priceRow}>
                <Text variant="sm" weight="bold" color={colors.text}>
                  Total Paid
                </Text>
                <Text variant="md" weight="bold" color={colors.primary}>
                  ${order.totalPrice?.toFixed(2)}
                </Text>
              </View>
            </Card>

            {/* 2. Shipping Address Card */}
            {order.shippingAddress && (
              <Card style={[styles.card, { borderColor: colors.border, marginTop: SPACING.md }]}>
                <Text variant="xs" color={colors.textMuted} weight="bold" style={{ marginBottom: SPACING.sm }}>
                  SHIPPING ADDRESS
                </Text>
                <Text variant="sm" weight="bold">
                  {order.shippingAddress.recipientFirstName || order.shippingAddress.firstName} {order.shippingAddress.recipientLastName || order.shippingAddress.lastName}
                </Text>
                <Text variant="xs" color={colors.textMuted} style={{ marginTop: 2 }}>
                  {order.shippingAddress.streetAddress || order.shippingAddress.address}
                </Text>
                <Text variant="xs" color={colors.textMuted} style={{ marginTop: 2 }}>
                  {order.shippingAddress.city}, {order.shippingAddress.state || order.shippingAddress.province} {order.shippingAddress.postalCode}
                </Text>
                <Text variant="xs" color={colors.textMuted} style={{ marginTop: 2 }}>
                  {order.shippingAddress.country}
                </Text>
                <Text variant="xs" color={colors.textMuted} style={{ marginTop: 4 }} weight="semibold">
                  Phone: {order.shippingAddress.recipientPhone || order.shippingAddress.phone}
                </Text>
              </Card>
            )}
          </View>
        ) : null}

        {/* Continue Shopping button */}
        <Button
          title="Continue Shopping"
          onPress={() => router.replace("/")}
          icon="basket-outline"
          style={styles.homeBtn}
        />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingTop: SPACING.xl * 2,
    paddingBottom: SPACING.xxxl,
    alignItems: "center",
    width: "100%",
  },
  header: {
    alignItems: "center",
    width: "100%",
    marginBottom: SPACING.lg,
  },
  successIconWrapper: {
    width: 130,
    height: 130,
    borderRadius: 65,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.lg,
  },
  title: {
    marginBottom: SPACING.sm,
    lineHeight: 28,
  },
  subtitle: {
    lineHeight: 20,
    paddingHorizontal: SPACING.md,
  },
  loaderContainer: {
    paddingVertical: SPACING.xxl,
    alignItems: "center",
  },
  orderContainer: {
    width: "100%",
    marginBottom: SPACING.xl,
  },
  card: {
    width: "100%",
    padding: SPACING.md,
    borderRadius: 16,
    borderWidth: 1,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
    marginTop: 2,
  },
  divider: {
    height: 1,
    marginVertical: SPACING.md,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  itemImage: {
    width: 54,
    height: 54,
    borderRadius: BORDER_RADIUS.sm,
  },
  itemDetails: {
    flex: 1,
    marginLeft: SPACING.md,
    justifyContent: "center",
  },
  itemPrice: {
    alignSelf: "center",
    marginLeft: SPACING.xs,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 4,
  },
  homeBtn: {
    minWidth: 220,
    height: 48,
    borderRadius: 24,
    marginTop: SPACING.sm,
  },
});
