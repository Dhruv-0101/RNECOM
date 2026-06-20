import React, { useEffect } from "react";
import { StyleSheet, View, TouchableOpacity, Dimensions } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { useTheme } from "@/src/shared/providers/ThemeProvider";
import { Text } from "@/src/shared/ui/Text";
import { Card } from "@/src/shared/ui/Card";
import { SPACING, BORDER_RADIUS } from "@/src/shared/constants/spacing";
import { Product } from "../types/product.types";
import { RootState } from "@/src/store/store";
import { addToWishlistLocal, removeFromWishlistLocal } from "@/src/features/wishlist/store/wishlistSlice";
import { wishlistApi } from "@/src/features/wishlist/api/wishlistApi";

interface ProductCardProps {
  product: Product;
  onPress?: (product: Product) => void;
  width?: number | string;
}

const { width } = Dimensions.get("window");
// 2 column layout margin calculation
const CARD_WIDTH = (width - SPACING.lg * 3) / 2;

export const ProductCard: React.FC<ProductCardProps> = ({ product, onPress, width: customWidth }) => {
  const { colors, isDark } = useTheme();
  const dispatch = useDispatch();

  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const inCartQty = cartItems
    .filter((item) => item.productId === product._id)
    .reduce((sum, item) => sum + item.quantity, 0);

  const wishlistItems = useSelector((state: RootState) => state.wishlist.items);
  const isWishlisted = wishlistItems.some((item) => item._id === product._id);

  const handleToggleWishlist = async () => {
    if (isAuthenticated) {
      try {
        if (isWishlisted) {
          dispatch(removeFromWishlistLocal(product._id));
        } else {
          dispatch(addToWishlistLocal(product));
        }
        await wishlistApi.toggleWishlist(product._id);
      } catch (err) {
        console.log("Failed to toggle wishlist on server:", err);
        // Revert on failure
        if (isWishlisted) {
          dispatch(addToWishlistLocal(product));
        } else {
          dispatch(removeFromWishlistLocal(product._id));
        }
      }
    } else {
      // Guest: persists to AsyncStorage automatically via redux-persist
      if (isWishlisted) {
        dispatch(removeFromWishlistLocal(product._id));
      } else {
        dispatch(addToWishlistLocal(product));
      }
    }
  };

  // Handle fallback placeholder images
  const imageSource = product.images && product.images.length > 0
    ? { uri: product.images[0] }
    : require("@/assets/images/react-logo.png"); // fallback local image

  const outOfStock = product.qtyLeft !== undefined ? product.qtyLeft <= 0 : product.totalQty <= 0;

  return (
    <View style={[styles.wrapper, { width: customWidth !== undefined ? customWidth : CARD_WIDTH }]}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => onPress?.(product)}
        style={{ flex: 1 }}
      >
        <Card style={[styles.card, { borderColor: colors.border, borderRadius: 16 }]}>
          {/* Product Image Area */}
          <View style={[styles.imageContainer, { backgroundColor: isDark ? colors.background : "#f8fafc" }]}>
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
                <View style={[styles.badge, { backgroundColor: "rgba(239, 68, 68, 0.9)" }]}>
                  <Text variant="xs" weight="bold" color="#ffffff">
                    SOLD OUT
                  </Text>
                </View>
              ) : (
                <View style={styles.badgeGroup}>
                  <View
                    style={[
                      styles.badge,
                      {
                        backgroundColor: isDark ? "rgba(99, 102, 241, 0.2)" : "rgba(99, 102, 241, 0.08)",
                        borderColor: colors.primary,
                        borderWidth: 0.5,
                      },
                    ]}
                  >
                    <Text variant="xs" weight="bold" color={colors.primary}>
                      {product.category?.toUpperCase() || "NEW"}
                    </Text>
                  </View>
                  {inCartQty > 0 && (
                    <View style={[styles.badge, { backgroundColor: "rgba(16, 185, 129, 0.9)" }]}>
                      <Text variant="xs" weight="bold" color="#ffffff">
                        {inCartQty} IN CART
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          </View>

          {/* Info Area */}
          <View style={styles.infoContainer}>
            <View>
              <Text variant="xs" weight="bold" color={colors.textMuted} style={styles.brand}>
                {product.brand}
              </Text>

              <Text variant="sm" weight="semibold" color={colors.text} numberOfLines={2} style={styles.title}>
                {product.name}
              </Text>
            </View>

            <View>
              {/* Rating Row */}
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={11} color={colors.warning} />
                <Text variant="xs" weight="bold" color={colors.text} style={styles.ratingText}>
                  {isNaN(Number(product.averageRating)) ? "0.0" : Number(product.averageRating).toFixed(1)}
                </Text>
                <Text variant="xs" color={colors.textMuted}>
                  ({product.totalReviews || 0})
                </Text>
              </View>

              {/* Price Row */}
              <View style={styles.priceRow}>
                <Text variant="md" weight="bold" color={colors.primary}>
                  ${product.price?.toFixed(2)}
                </Text>
                <View style={[styles.actionCircle, { backgroundColor: colors.primary }]}>
                  <Ionicons name="chevron-forward" size={13} color="#ffffff" />
                </View>
              </View>
            </View>
          </View>
        </Card>
      </TouchableOpacity>

      {/* Top-right Heart button overlay (sibling to wrapper, absolute positioning over image container) */}
      <TouchableOpacity
        onPress={handleToggleWishlist}
        style={[
          styles.heartButton,
          { backgroundColor: isDark ? "rgba(15, 23, 42, 0.75)" : "rgba(255, 255, 255, 0.9)" },
        ]}
        activeOpacity={0.8}
      >
        <Ionicons
          name={isWishlisted ? "heart" : "heart-outline"}
          size={15}
          color={isWishlisted ? colors.error : colors.text}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: SPACING.md,
    position: "relative",
  },
  card: {
    padding: 0,
    overflow: "hidden",
    height: 255,
    width: "100%",
    borderWidth: 1,
  },
  imageContainer: {
    width: "100%",
    height: 135,
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
  badgeGroup: {
    flexDirection: "column",
    gap: 4,
    alignItems: "flex-start",
  },
  badge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2.5,
    borderRadius: BORDER_RADIUS.sm,
  },
  heartButton: {
    position: "absolute",
    top: SPACING.xs,
    right: SPACING.xs,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    zIndex: 10,
  },
  infoContainer: {
    padding: SPACING.sm,
    flex: 1,
    justifyContent: "space-between",
  },
  brand: {
    textTransform: "uppercase",
    fontSize: 9,
    letterSpacing: 1,
    marginBottom: 2,
  },
  title: {
    fontSize: 13,
    lineHeight: 17,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  ratingText: {
    marginHorizontal: 3,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  actionCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default ProductCard;
