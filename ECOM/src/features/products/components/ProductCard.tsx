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
                <View style={styles.badgeGroup}>
                  <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                    <Text variant="xs" weight="bold" color="#ffffff">
                      {product.category?.toUpperCase() || "NEW"}
                    </Text>
                  </View>
                  {inCartQty > 0 && (
                    <View style={[styles.badge, { backgroundColor: colors.success }]}>
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

            {/* Price Row */}
            <View style={styles.priceRow}>
              <Text variant="md" weight="bold" color={colors.primary}>
                ${product.price?.toFixed(2)}
              </Text>
            </View>
          </View>
        </Card>
      </TouchableOpacity>

      {/* Top-right Heart button overlay (sibling to wrapper, absolute positioning over image container) */}
      <TouchableOpacity
        onPress={handleToggleWishlist}
        style={[
          styles.heartButton,
          { backgroundColor: isDark ? "rgba(15, 23, 42, 0.65)" : "rgba(255, 255, 255, 0.85)" },
        ]}
        activeOpacity={0.8}
      >
        <Ionicons
          name={isWishlisted ? "heart" : "heart-outline"}
          size={16}
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
    height: 220,
    width: "100%",
  },
  imageContainer: {
    width: "100%",
    height: 110,
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
    flexDirection: "row",
    gap: SPACING.xs,
    alignItems: "center",
  },
  badge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.xs,
  },
  heartButton: {
    position: "absolute",
    top: SPACING.xs,
    right: SPACING.xs,
    width: 26,
    height: 26,
    borderRadius: BORDER_RADIUS.round,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    zIndex: 10,
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
    marginTop: 2,
  },
});

export default ProductCard;
