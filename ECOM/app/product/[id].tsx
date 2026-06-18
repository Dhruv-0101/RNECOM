import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useDispatch, useSelector } from "react-redux";
import { useTheme } from "@/src/shared/providers/ThemeProvider";
import { useProduct } from "@/src/features/products/hooks/useProducts";
import { useCurrentUser } from "@/src/features/auth/hooks/useCurrentUser";
import { AuthRequiredModal } from "@/src/features/auth/components/AuthRequiredModal";
import { addToCart } from "@/src/features/cart/store/cartSlice";
import { AppDispatch, RootState } from "@/src/store/store";
import { addToWishlistLocal, removeFromWishlistLocal } from "@/src/features/wishlist/store/wishlistSlice";
import { wishlistApi } from "@/src/features/wishlist/api/wishlistApi";
import { Text } from "@/src/shared/ui/Text";
import { Button } from "@/src/shared/ui/Button";
import { Card } from "@/src/shared/ui/Card";
import { BORDER_RADIUS, SPACING } from "@/src/shared/constants/spacing";

const fallbackImage = require("@/assets/images/react-logo.png");

export default function ProductDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, isDark } = useTheme();
  const { isAuthenticated } = useCurrentUser();
  const dispatch = useDispatch<AppDispatch>();
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const { data: product, isLoading, error, refetch, isFetching } = useProduct(id);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [selectionError, setSelectionError] = useState("");

  const images = useMemo(() => product?.images?.filter(Boolean) || [], [product?.images]);
  const imageSource = images[selectedImage] ? { uri: images[selectedImage] } : fallbackImage;
  const rating = Number(product?.averageRating || 0);
  const qtyLeft = product?.qtyLeft ?? product?.totalQty ?? 0;
  const outOfStock = qtyLeft <= 0;
  const maxQuantity = Math.max(qtyLeft, 1);

  const inCartQty = useMemo(() => {
    if (!product) return 0;
    return cartItems
      .filter((item) => item.productId === product._id)
      .reduce((sum, item) => sum + item.quantity, 0);
  }, [cartItems, product]);

  const wishlistItems = useSelector((state: RootState) => state.wishlist.items);
  const isWishlisted = useMemo(() => {
    if (!product) return false;
    return wishlistItems.some((item) => item._id === product._id);
  }, [wishlistItems, product]);

  const handleToggleWishlist = async () => {
    if (!product) return;

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
        if (isWishlisted) {
          dispatch(addToWishlistLocal(product));
        } else {
          dispatch(removeFromWishlistLocal(product._id));
        }
      }
    } else {
      if (isWishlisted) {
        dispatch(removeFromWishlistLocal(product._id));
      } else {
        dispatch(addToWishlistLocal(product));
      }
    }
  };

  const decreaseQuantity = () => {
    setQuantity((currentQuantity) => Math.max(1, currentQuantity - 1));
  };

  const increaseQuantity = () => {
    setQuantity((currentQuantity) => Math.min(maxQuantity, currentQuantity + 1));
  };

  const handleAddToCart = () => {
    if (!product || outOfStock) return;

    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    if (product.colors?.length && !selectedColor) {
      setSelectionError("Please select product color.");
      return;
    }

    if (product.sizes?.length && !selectedSize) {
      setSelectionError("Please select product size.");
      return;
    }

    dispatch(
      addToCart({
        product,
        color: selectedColor || "Default",
        size: selectedSize || "Default",
        quantity,
      })
    );
    setSelectionError("");
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <AuthRequiredModal visible={showAuthModal} onClose={() => setShowAuthModal(false)} />
        <View style={[styles.topBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.iconButton, { backgroundColor: colors.inputBg }]}
            activeOpacity={0.8}
          >
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text variant="lg" weight="semibold" numberOfLines={1} style={styles.headerTitle}>
            Product Details
          </Text>
          <TouchableOpacity
            onPress={handleToggleWishlist}
            disabled={!product}
            style={[styles.iconButton, { backgroundColor: colors.inputBg }]}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isWishlisted ? "heart" : "heart-outline"}
              size={22}
              color={isWishlisted ? colors.error : colors.text}
            />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : error || !product ? (
          <View style={styles.centerState}>
            <Ionicons name="alert-circle-outline" size={40} color={colors.error} />
            <Text variant="md" weight="semibold" align="center" style={styles.stateTitle}>
              Product details could not load
            </Text>
            <Button
              title="Try Again"
              onPress={() => refetch()}
              loading={isFetching}
              icon="refresh-outline"
              style={styles.retryButton}
            />
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={[styles.imageStage, { backgroundColor: isDark ? colors.surface : "#eef2f7" }]}>
              <Image source={imageSource} style={styles.heroImage} contentFit="cover" transition={250} />
              <View style={[styles.stockBadge, { backgroundColor: outOfStock ? colors.error : colors.success }]}>
                <Text variant="xs" weight="bold" color="#ffffff">
                  {outOfStock ? "OUT OF STOCK" : `${qtyLeft} LEFT`}
                </Text>
              </View>
              {inCartQty > 0 && (
                <View style={[styles.cartBadge, { backgroundColor: colors.success }]}>
                  <Text variant="xs" weight="bold" color="#ffffff">
                    {inCartQty} IN CART
                  </Text>
                </View>
              )}
            </View>

            {images.length > 1 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbnails}>
                {images.map((image, index) => (
                  <TouchableOpacity
                    key={`${image}-${index}`}
                    onPress={() => setSelectedImage(index)}
                    style={[
                      styles.thumbnail,
                      {
                        borderColor: selectedImage === index ? colors.primary : colors.border,
                        backgroundColor: colors.surface,
                      },
                    ]}
                    activeOpacity={0.8}
                  >
                    <Image source={{ uri: image }} style={styles.thumbnailImage} contentFit="cover" />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <View style={styles.titleRow}>
              <View style={styles.titleBlock}>
                <Text variant="xs" weight="semibold" color={colors.textMuted} style={styles.overline}>
                  {product.brand || "BRAND"}
                </Text>
                <Text variant="xxl" weight="bold" color={colors.text}>
                  {product.name}
                </Text>
              </View>
              <Text variant="xl" weight="bold" color={colors.primary}>
                ${product.price?.toFixed(2)}
              </Text>
            </View>

            <View style={styles.ratingRow}>
              {[0, 1, 2, 3, 4].map((star) => (
                <Ionicons
                  key={star}
                  name={rating > star ? "star" : "star-outline"}
                  size={18}
                  color={colors.warning}
                />
              ))}
              <Text variant="sm" weight="medium" color={colors.text} style={styles.ratingText}>
                {rating.toFixed(1)}
              </Text>
              <Text variant="sm" color={colors.textMuted}>
                ({product.totalReviews ?? product.reviews?.length ?? 0} reviews)
              </Text>
            </View>

            <Card style={styles.section}>
              <Text variant="lg" weight="semibold" style={styles.sectionTitle}>
                Product Information
              </Text>
              <DetailRow label="Category" value={product.category} />
              <DetailRow label="Brand" value={product.brand} />
              <DetailRow label="Available Quantity" value={`${qtyLeft}`} />
              <DetailRow label="Total Sold" value={`${product.totalSold ?? 0}`} />
            </Card>

            {product.colors?.length > 0 && (
              <Card style={styles.section}>
                <Text variant="lg" weight="semibold" style={styles.sectionTitle}>
                  Choose Color
                </Text>
                <View style={styles.swatchRow}>
                  {product.colors.map((color) => {
                    const selected = selectedColor === color;
                    return (
                      <TouchableOpacity
                        key={color}
                        onPress={() => {
                          setSelectedColor(color);
                          setSelectionError("");
                        }}
                        style={[
                          styles.swatchItem,
                          {
                            borderColor: selected ? colors.primary : colors.border,
                            backgroundColor: selected ? colors.primaryLight : "transparent",
                          },
                        ]}
                        activeOpacity={0.85}
                      >
                        <View style={[styles.swatch, { backgroundColor: color, borderColor: colors.border }]} />
                        <Text variant="xs" color={colors.textMuted} numberOfLines={1} style={styles.swatchLabel}>
                          {color}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </Card>
            )}

            {product.sizes?.length > 0 && (
              <Card style={styles.section}>
                <Text variant="lg" weight="semibold" style={styles.sectionTitle}>
                  Choose Size
                </Text>
                <View style={styles.sizeRow}>
                  {product.sizes.map((size) => {
                    const selected = selectedSize === size;
                    return (
                      <TouchableOpacity
                        key={size}
                        onPress={() => {
                          setSelectedSize(size);
                          setSelectionError("");
                        }}
                        style={[
                          styles.sizePill,
                          {
                            borderColor: selected ? colors.primary : colors.border,
                            backgroundColor: selected ? colors.primary : colors.inputBg,
                          },
                        ]}
                        activeOpacity={0.85}
                      >
                        <Text variant="sm" weight="semibold" color={selected ? "#ffffff" : colors.text}>
                          {size}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </Card>
            )}

            <Card style={styles.section}>
              <Text variant="lg" weight="semibold" style={styles.sectionTitle}>
                Quantity
              </Text>
              <View style={styles.quantityRow}>
                <View style={[styles.quantityStepper, { backgroundColor: colors.inputBg }]}>
                  <TouchableOpacity
                    onPress={decreaseQuantity}
                    disabled={quantity <= 1}
                    style={styles.quantityButton}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="remove" size={22} color={quantity <= 1 ? colors.textMuted : colors.text} />
                  </TouchableOpacity>
                  <Text variant="xl" weight="bold" style={styles.quantityValue}>
                    {quantity}
                  </Text>
                  <TouchableOpacity
                    onPress={increaseQuantity}
                    disabled={quantity >= maxQuantity}
                    style={styles.quantityButton}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="add" size={22} color={quantity >= maxQuantity ? colors.textMuted : colors.text} />
                  </TouchableOpacity>
                </View>
                <View style={styles.quantityMeta}>
                  <Text variant="sm" color={colors.textMuted}>
                    Max {maxQuantity}
                  </Text>
                  {inCartQty > 0 && (
                    <Text variant="sm" color={colors.success} weight="semibold" style={{ marginTop: 2 }}>
                      ({inCartQty} in cart)
                    </Text>
                  )}
                </View>
              </View>
              {!!selectionError && (
                <Text variant="sm" color={colors.error} style={styles.selectionError}>
                  {selectionError}
                </Text>
              )}

              {!isAuthenticated ? (
                <TouchableOpacity
                  onPress={() => router.push("/login")}
                  style={[styles.addToCartHero, { backgroundColor: colors.border }]}
                  activeOpacity={0.85}
                >
                  <Ionicons name="log-in-outline" size={22} color={colors.text} />
                  <Text variant="lg" weight="bold" color={colors.text}>
                    Login / Sign Up to Add to Cart
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={handleAddToCart}
                  disabled={outOfStock}
                  style={[
                    styles.addToCartHero,
                    { backgroundColor: outOfStock ? colors.border : colors.primary },
                  ]}
                  activeOpacity={0.86}
                >
                  <Ionicons name="cart-outline" size={22} color="#ffffff" />
                  <Text variant="lg" weight="bold" color="#ffffff">
                    {outOfStock ? "Out of Stock" : `Add ${quantity} to Cart`}
                  </Text>
                </TouchableOpacity>
              )}
            </Card>

            <Card style={styles.section}>
              <Text variant="lg" weight="semibold" style={styles.sectionTitle}>
                Description
              </Text>
              <Text variant="md" color={colors.textMuted} style={styles.description}>
                {product.description || "No description available."}
              </Text>
            </Card>

            <Card style={styles.section}>
              <Text variant="lg" weight="semibold" style={styles.sectionTitle}>
                Recent Reviews
              </Text>
              {product.reviews?.length ? (
                product.reviews.map((review) => (
                  <View key={review._id} style={[styles.reviewItem, { borderTopColor: colors.border }]}>
                    <View style={styles.reviewHeader}>
                      <Text variant="sm" weight="semibold">
                        {typeof review.user === "string" ? "Customer" : review.user.fullname}
                      </Text>
                      <View style={styles.reviewStars}>
                        {[0, 1, 2, 3, 4].map((star) => (
                          <Ionicons
                            key={star}
                            name={review.rating > star ? "star" : "star-outline"}
                            size={14}
                            color={colors.warning}
                          />
                        ))}
                      </View>
                    </View>
                    <Text variant="sm" color={colors.textMuted} style={styles.reviewMessage}>
                      {review.message}
                    </Text>
                  </View>
                ))
              ) : (
                <Text variant="sm" color={colors.textMuted}>
                  No reviews yet.
                </Text>
              )}
            </Card>
          </ScrollView>
        )}
      </View>
    </>
  );
}

function DetailRow({ label, value }: { label: string; value?: string }) {
  const { colors } = useTheme();

  return (
    <View style={styles.detailRow}>
      <Text variant="sm" color={colors.textMuted}>
        {label}
      </Text>
      <Text variant="sm" weight="semibold" color={colors.text} style={styles.detailValue}>
        {value || "-"}
      </Text>
    </View>
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
    paddingHorizontal: SPACING.lg,
  },
  iconButton: {
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
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.xl,
  },
  stateTitle: {
    marginVertical: SPACING.md,
  },
  retryButton: {
    maxWidth: 220,
  },
  imageStage: {
    height: 340,
    borderRadius: BORDER_RADIUS.md,
    overflow: "hidden",
    position: "relative",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  stockBadge: {
    position: "absolute",
    top: SPACING.md,
    left: SPACING.md,
    borderRadius: BORDER_RADIUS.xs,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  thumbnails: {
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  thumbnail: {
    width: 64,
    height: 64,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 2,
    overflow: "hidden",
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: SPACING.md,
    marginTop: SPACING.sm,
  },
  titleBlock: {
    flex: 1,
  },
  overline: {
    textTransform: "uppercase",
    marginBottom: SPACING.xs,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: SPACING.md,
  },
  ratingText: {
    marginLeft: SPACING.sm,
    marginRight: SPACING.xs,
  },
  section: {
    marginTop: SPACING.lg,
  },
  sectionTitle: {
    marginBottom: SPACING.md,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: SPACING.sm,
  },
  detailValue: {
    flex: 1,
    textAlign: "right",
    marginLeft: SPACING.md,
    textTransform: "capitalize",
  },
  swatchRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.md,
  },
  swatchItem: {
    width: 72,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.sm,
    paddingVertical: SPACING.sm,
    alignItems: "center",
  },
  swatch: {
    width: 34,
    height: 34,
    borderRadius: BORDER_RADIUS.round,
    borderWidth: 1,
  },
  swatchLabel: {
    marginTop: SPACING.xs,
    maxWidth: 72,
  },
  sizeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
  },
  sizePill: {
    minWidth: 48,
    height: 40,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SPACING.md,
  },
  quantityRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  quantityStepper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.xs,
  },
  quantityButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  quantityValue: {
    minWidth: 52,
    textAlign: "center",
  },
  selectionError: {
    marginTop: SPACING.md,
  },
  addToCartHero: {
    height: 58,
    borderRadius: BORDER_RADIUS.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    marginTop: SPACING.lg,
  },
  description: {
    lineHeight: 22,
  },
  reviewItem: {
    borderTopWidth: 1,
    paddingTop: SPACING.md,
    marginTop: SPACING.md,
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: SPACING.md,
  },
  reviewStars: {
    flexDirection: "row",
  },
  reviewMessage: {
    marginTop: SPACING.xs,
    lineHeight: 20,
  },
  cartBadge: {
    position: "absolute",
    top: SPACING.md,
    right: SPACING.md,
    borderRadius: BORDER_RADIUS.xs,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  quantityMeta: {
    alignItems: "flex-end",
  },
});
