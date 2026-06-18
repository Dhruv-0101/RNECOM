import React, { useState } from "react";
import { StyleSheet, View, TouchableOpacity, Dimensions, GestureResponderEvent } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/shared/providers/ThemeProvider";
import { Text } from "@/src/shared/ui/Text";
import { Card } from "@/src/shared/ui/Card";
import { SPACING, BORDER_RADIUS } from "@/src/shared/constants/spacing";
import { Product } from "../types/product.types";

interface ProductCardProps {
  product: Product;
  onPress?: (product: Product) => void;
  onAddToCart?: (product: Product, quantity: number) => void;
}

const { width } = Dimensions.get("window");
// 2 column layout margin calculation
const CARD_WIDTH = (width - SPACING.lg * 3) / 2;

export const ProductCard: React.FC<ProductCardProps> = ({ product, onPress, onAddToCart }) => {
  const { colors, isDark } = useTheme();
  const [quantity, setQuantity] = useState(0);

  // Handle fallback placeholder images
  const imageSource = product.images && product.images.length > 0
    ? { uri: product.images[0] }
    : require("@/assets/images/react-logo.png"); // fallback local image

  const outOfStock = product.qtyLeft !== undefined ? product.qtyLeft <= 0 : product.totalQty <= 0;
  const maxQuantity = Math.max(product.qtyLeft ?? product.totalQty ?? 1, 1);

  const changeQuantity = (event: GestureResponderEvent, nextQuantity: number) => {
    event.stopPropagation();
    setQuantity(Math.min(Math.max(nextQuantity, 1), maxQuantity));
  };

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => onPress?.(product)}
      style={[styles.wrapper, { width: CARD_WIDTH }]}
    >
      <Card style={[styles.card, { borderColor: colors.border }]}>
        {/* Product Image Area */}
        <View style={[styles.imageContainer, { backgroundColor: isDark ? colors.background : "#f1f5f9" }]}>
          <Image
            source={imageSource}
            style={styles.image}
            contentFit="cover"
            transition={300}
            cachePolicy="disk"
          />

          {/* Top Badges overlay */}
          <View style={styles.badgeContainer}>
            {outOfStock ? (
              <View style={[styles.badge, { backgroundColor: colors.error }]}>
                <Text variant="xs" weight="bold" color="#ffffff">
                  OUT OF STOCK
                </Text>
              </View>
            ) : (
              <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                <Text variant="xs" weight="bold" color="#ffffff">
                  {product.category?.toUpperCase() || "NEW"}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Info Area */}
        <View style={styles.infoContainer}>
          <Text variant="xs" weight="medium" color={colors.textMuted} style={styles.brand}>
            {product.brand}
          </Text>

          <Text variant="sm" weight="semibold" color={colors.text} numberOfLines={2} style={styles.title}>
            {product.name}
          </Text>

          {/* Rating Row */}
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={14} color={colors.warning} />
            <Text variant="xs" weight="medium" color={colors.text} style={styles.ratingText}>
              {product.averageRating || "0.0"}
            </Text>
            <Text variant="xs" color={colors.textMuted}>
              ({product.totalReviews || 0})
            </Text>
          </View>

          {/* Price & Action Row */}
          <View style={styles.priceRow}>
            <Text variant="md" weight="bold" color={colors.primary}>
              ${product.price?.toFixed(2)}
            </Text>

            <View style={styles.actionGroup}>
              <View style={[styles.compactStepper, { backgroundColor: colors.inputBg }]}>
                <TouchableOpacity
                  onPress={(event) => changeQuantity(event, quantity - 1)}
                  disabled={outOfStock || quantity <= 1}
                  style={styles.stepButton}
                >
                  <Ionicons name="remove" size={14} color={quantity <= 1 ? colors.textMuted : colors.text} />
                </TouchableOpacity>
                <Text variant="xs" weight="bold" color={colors.text} style={styles.quantityText}>
                  {quantity}
                </Text>
                <TouchableOpacity
                  onPress={(event) => changeQuantity(event, quantity + 1)}
                  disabled={outOfStock || quantity >= maxQuantity}
                  style={styles.stepButton}
                >
                  <Ionicons name="add" size={14} color={quantity >= maxQuantity ? colors.textMuted : colors.text} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={(event: GestureResponderEvent) => {
                  event.stopPropagation();
                  onAddToCart?.(product, quantity);
                }}
                style={[
                  styles.addBtn,
                  { backgroundColor: outOfStock ? colors.border : colors.primary }
                ]}
                disabled={outOfStock}
              >
                <Ionicons
                  name="cart-outline"
                  size={16}
                  color={outOfStock ? colors.textMuted : "#ffffff"}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: SPACING.md,
  },
  card: {
    padding: 0,
    overflow: "hidden",
    height: 272,
  },
  imageContainer: {
    width: "100%",
    height: 120,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  badgeContainer: {
    position: "absolute",
    top: SPACING.xs,
    left: SPACING.xs,
  },
  badge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.xs,
  },
  infoContainer: {
    padding: SPACING.sm,
    flex: 1,
    justifyContent: "space-between",
  },
  brand: {
    textTransform: "uppercase",
    fontSize: 10,
    letterSpacing: 0.5,
  },
  title: {
    marginVertical: 2,
    lineHeight: 16,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 2,
  },
  ratingText: {
    marginHorizontal: 4,
  },
  priceRow: {
    marginTop: 4,
  },
  actionGroup: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: SPACING.xs,
  },
  compactStepper: {
    height: 28,
    borderRadius: BORDER_RADIUS.sm,
    flexDirection: "row",
    alignItems: "center",
  },
  stepButton: {
    width: 26,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  quantityText: {
    width: 24,
    textAlign: "center",
  },
  addBtn: {
    width: 28,
    height: 28,
    borderRadius: BORDER_RADIUS.sm,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default ProductCard;
