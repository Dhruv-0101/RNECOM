import React from "react";
import { FlatList, StyleSheet, TouchableOpacity, View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "expo-router";
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
  const { colors } = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
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
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text variant="xxl" weight="bold">
              Cart
            </Text>
            <Text variant="sm" color={colors.textMuted}>
              {items.length} {items.length === 1 ? "item" : "items"} ready for checkout
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Card style={styles.itemCard}>
            <Image
              source={item.image ? { uri: item.image } : fallbackImage}
              style={styles.image}
              contentFit="cover"
            />
            <View style={styles.itemInfo}>
              <Text variant="md" weight="semibold" numberOfLines={2}>
                {item.name}
              </Text>
              <Text variant="xs" color={colors.textMuted} style={styles.brand}>
                {item.brand}
              </Text>
              <Text variant="xs" color={colors.textMuted}>
                {item.color} / {item.size}
              </Text>
              <View style={styles.priceQuantityRow}>
                <Text variant="sm" weight="bold" color={colors.primary}>
                  ${item.price.toFixed(2)}
                </Text>
                <View style={[styles.stepper, { backgroundColor: colors.inputBg }]}>
                  <TouchableOpacity
                    onPress={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                    style={styles.stepButton}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="remove" size={14} color={colors.text} />
                  </TouchableOpacity>
                  <Text variant="xs" weight="bold" color={colors.text} style={styles.quantityText}>
                    {item.quantity}
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                    disabled={item.quantity >= item.qtyLeft}
                    style={styles.stepButton}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="add" size={14} color={item.quantity >= item.qtyLeft ? colors.textMuted : colors.text} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => dispatch(removeFromCart(item.id))}
              style={[styles.removeButton, { backgroundColor: colors.inputBg }]}
              activeOpacity={0.8}
            >
              <Ionicons name="trash-outline" size={18} color={colors.error} />
            </TouchableOpacity>
          </Card>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="cart-outline" size={44} color={colors.textMuted} />
            <Text variant="lg" weight="semibold" align="center" style={styles.emptyTitle}>
              Your cart is empty
            </Text>
            <Text variant="sm" color={colors.textMuted} align="center">
              Add products from the list or product details page.
            </Text>
          </View>
        }
        ListFooterComponent={
          items.length ? (
            <Card style={styles.summaryCard}>
              <View style={styles.totalRow}>
                <Text variant="lg" weight="semibold">
                  Total
                </Text>
                <Text variant="xl" weight="bold" color={colors.primary}>
                  ${total.toFixed(2)}
                </Text>
              </View>
              <Button
                title="Checkout"
                onPress={() => {
                  if (isAuthenticated) {
                    router.push("/checkout");
                  } else {
                    router.push("/login");
                  }
                }}
                icon="card-outline"
              />
            </Card>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  header: {
    marginBottom: SPACING.lg,
  },
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  image: {
    width: 72,
    height: 72,
    borderRadius: BORDER_RADIUS.sm,
  },
  itemInfo: {
    flex: 1,
    marginHorizontal: SPACING.md,
  },
  brand: {
    textTransform: "uppercase",
    marginVertical: SPACING.xs,
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
    borderRadius: BORDER_RADIUS.sm,
    padding: 2,
  },
  stepButton: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  quantityText: {
    minWidth: 24,
    textAlign: "center",
  },
  removeButton: {
    width: 38,
    height: 38,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.xxxl,
  },
  emptyTitle: {
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  summaryCard: {
    marginTop: SPACING.lg,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
});
