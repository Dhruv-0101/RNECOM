import React from "react";
import { FlatList, StyleSheet, TouchableOpacity, View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/src/shared/providers/ThemeProvider";
import { Text } from "@/src/shared/ui/Text";
import { Card } from "@/src/shared/ui/Card";
import { Button } from "@/src/shared/ui/Button";
import { BORDER_RADIUS, SPACING } from "@/src/shared/constants/spacing";
import { AppDispatch, RootState } from "@/src/store/store";
import { removeFromCart, updateCartQuantity } from "@/src/features/cart/store/cartSlice";
import { useCurrentUser } from "@/src/features/auth/hooks/useCurrentUser";

const fallbackImage = require("@/assets/images/react-logo.png");

export default function Cart() {
  const { colors, isDark } = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useCurrentUser();
  const items = useSelector((state: RootState) => state.cart.items);
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleUpdateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      dispatch(removeFromCart(id));
    } else {
      dispatch(updateCartQuantity({ id, quantity }));
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Header spacer */}
      <View style={{ height: insets.top, backgroundColor: colors.surface }} />
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text variant="xxl" weight="bold">
          Cart
        </Text>
        <Text variant="xs" color={colors.textMuted} style={{ marginTop: 2 }}>
          {items.length} {items.length === 1 ? "item" : "items"} ready for checkout
        </Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.content, { paddingBottom: 110 }]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <Card style={[styles.itemCard, { borderColor: colors.border }]}>
            <Image
              source={item.image ? { uri: item.image } : fallbackImage}
              style={styles.image}
              contentFit="cover"
              transition={200}
            />
            <View style={styles.itemInfo}>
              <Text variant="sm" weight="semibold" numberOfLines={1}>
                {item.name}
              </Text>
              <Text variant="xxs" weight="bold" color={colors.textMuted} style={styles.brand}>
                {item.brand?.toUpperCase() || "BRAND"}
              </Text>

              {/* Variant Badge Pills */}
              <View style={styles.badgeRow}>
                <View style={[styles.badgePill, { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9" }]}>
                  <Text variant="xxs" color={colors.textMuted}>
                    Color: {item.color}
                  </Text>
                </View>
                <View style={[styles.badgePill, { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9" }]}>
                  <Text variant="xxs" color={colors.textMuted}>
                    Size: {item.size}
                  </Text>
                </View>
              </View>

              <View style={styles.priceQuantityRow}>
                <Text variant="md" weight="bold" color={colors.primary}>
                  ${item.price.toFixed(2)}
                </Text>
                
                {/* Stepper with circular controls */}
                <View style={[styles.stepper, { backgroundColor: colors.inputBg }]}>
                  <TouchableOpacity
                    onPress={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                    style={styles.stepButton}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="remove" size={14} color={colors.text} />
                  </TouchableOpacity>
                  <Text variant="sm" weight="bold" color={colors.text} style={styles.quantityText}>
                    {item.quantity}
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                    disabled={item.quantity >= item.qtyLeft}
                    style={styles.stepButton}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name="add"
                      size={14}
                      color={item.quantity >= item.qtyLeft ? colors.textMuted : colors.text}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Trash button */}
            <TouchableOpacity
              onPress={() => dispatch(removeFromCart(item.id))}
              style={[styles.removeButton, { backgroundColor: isDark ? "rgba(239, 68, 68, 0.15)" : "#fef2f2" }]}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={16} color={colors.error} />
            </TouchableOpacity>
          </Card>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconContainer, { backgroundColor: isDark ? "rgba(99, 102, 241, 0.1)" : "#e0e7ff" }]}>
              <Ionicons name="cart-outline" size={44} color={colors.primary} />
            </View>
            <Text variant="lg" weight="bold" style={styles.emptyTitle}>
              Your Cart is Empty
            </Text>
            <Text variant="sm" color={colors.textMuted} align="center" style={styles.emptyText}>
              Explore our trending collections and add your favorite items to check out!
            </Text>
            <Button
              title="Shop Now"
              onPress={() => router.push("/")}
              icon="chevron-forward-outline"
              style={{ minWidth: 160 }}
            />
          </View>
        }
      />

      {/* Premium Sticky Footer Bottom Bar */}
      {items.length > 0 && (
        <View
          style={[
            styles.stickyFooter,
            {
              backgroundColor: colors.surface,
              borderTopColor: colors.border,
              paddingBottom: Math.max(insets.bottom, SPACING.md),
            },
          ]}
        >
          <View style={styles.footerPriceBlock}>
            <Text variant="xs" color={colors.textMuted} style={styles.totalPriceLabel}>
              SUBTOTAL
            </Text>
            <Text variant="xl" weight="bold" color={colors.primary}>
              ${total.toFixed(2)}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              if (isAuthenticated) {
                router.push("/checkout");
              } else {
                router.push("/login");
              }
            }}
            style={[styles.checkoutBtn, { backgroundColor: colors.primary }]}
            activeOpacity={0.85}
          >
            <Ionicons name="card-outline" size={20} color="#ffffff" style={{ marginRight: 6 }} />
            <Text variant="md" weight="bold" color="#ffffff">
              Checkout
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  content: {
    padding: SPACING.lg,
  },
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderRadius: 16,
    borderWidth: 1,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.md,
  },
  itemInfo: {
    flex: 1,
    marginLeft: SPACING.md,
    marginRight: SPACING.sm,
  },
  brand: {
    fontSize: 9,
    letterSpacing: 0.5,
    marginVertical: 2,
  },
  badgeRow: {
    flexDirection: "row",
    gap: SPACING.xs,
    marginVertical: 4,
  },
  badgePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.round,
  },
  priceQuantityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: SPACING.xs,
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: BORDER_RADIUS.round,
    padding: 2,
  },
  stepButton: {
    width: 26,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  quantityText: {
    minWidth: 22,
    textAlign: "center",
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.xxxl * 1.5,
    paddingHorizontal: SPACING.xl,
  },
  emptyIconContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.lg,
  },
  emptyTitle: {
    marginBottom: SPACING.xs,
  },
  emptyText: {
    lineHeight: 20,
    marginBottom: SPACING.xl,
  },
  stickyFooter: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
  },
  footerPriceBlock: {
    flexDirection: "column",
  },
  totalPriceLabel: {
    fontSize: 9,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  checkoutBtn: {
    height: 48,
    borderRadius: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SPACING.xl,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
});
