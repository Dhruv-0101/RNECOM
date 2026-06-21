import React, { useMemo, useState, useEffect } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  Alert,
  TextInput,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useDispatch, useSelector } from "react-redux";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/src/shared/providers/ThemeProvider";
import { useProduct } from "@/src/features/products/hooks/useProducts";
import { useCurrentUser } from "@/src/features/auth/hooks/useCurrentUser";
import { AuthRequiredModal } from "@/src/features/auth/components/AuthRequiredModal";
import { addToCart } from "@/src/features/cart/store/cartSlice";
import { AppDispatch, RootState } from "@/src/store/store";
import {
  addToWishlistLocal,
  removeFromWishlistLocal,
} from "@/src/features/wishlist/store/wishlistSlice";
import { wishlistApi } from "@/src/features/wishlist/api/wishlistApi";
import { Text } from "@/src/shared/ui/Text";
import { Button } from "@/src/shared/ui/Button";
import { Card } from "@/src/shared/ui/Card";
import { ProductDetailSkeleton } from "@/src/shared/ui/Skeleton";
import { BORDER_RADIUS, SPACING } from "@/src/shared/constants/spacing";
import { apiClient } from "@/src/services/api/apiClient";
import { REVIEW_PAGINATION } from "@/src/features/reviews/config/pagination";

const fallbackImage = require("@/assets/images/react-logo.png");

export default function ProductDetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, isDark } = useTheme();
  const { user, isAuthenticated } = useCurrentUser();
  const dispatch = useDispatch<AppDispatch>();
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const {
    data: product,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useProduct(id);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [selectionError, setSelectionError] = useState("");
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [visibleReviewsLimit, setVisibleReviewsLimit] = useState<number>(
    REVIEW_PAGINATION.LIMIT,
  );

  // Reset reviews limit when product ID changes
  useEffect(() => {
    setVisibleReviewsLimit(REVIEW_PAGINATION.LIMIT);
  }, [id]);

  // Review states
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewMessage, setReviewMessage] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewFormError, setReviewFormError] = useState("");

  const reviewsToDisplay = useMemo(() => {
    if (!product?.reviews) return [];
    return product.reviews.slice(0, visibleReviewsLimit);
  }, [product?.reviews, visibleReviewsLimit]);

  const userReview = useMemo(() => {
    if (!user || !product?.reviews) return null;
    return product.reviews.find((r) => {
      const reviewerId = typeof r.user === "string" ? r.user : r.user?._id;
      return reviewerId === user._id;
    });
  }, [product?.reviews, user]);

  const handleSubmitReview = async () => {
    if (!reviewMessage.trim()) {
      setReviewFormError("Please enter a review message.");
      return;
    }
    try {
      setIsSubmittingReview(true);
      setReviewFormError("");

      await apiClient.post(`/api/v1/reviews/${id}`, {
        rating: reviewRating,
        message: reviewMessage.trim(),
      });

      setReviewMessage("");
      setReviewRating(0);
      refetch();
      Alert.alert(
        "Success",
        "Thank you! Your review has been submitted successfully.",
      );
    } catch (err) {
      console.log("Failed to submit review:", err);
      // Backend createReviewCtrl returns custom errors when already reviewed or not purchased (if applicable)
      setReviewFormError(
        err instanceof Error && err.message
          ? err.message
          : "You can only review items you have purchased, or you already reviewed this product.",
      );
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const images = useMemo(
    () => product?.images?.filter(Boolean) || [],
    [product?.images],
  );
  const imageSource = images[selectedImage]
    ? { uri: images[selectedImage] }
    : fallbackImage;

  /*
    Live Example
Let's assume the backend returns this product with 4 individual customer reviews:

javascript
const product = {
  averageRating: "4.25", // average rating string
  reviews: [
    { rating: 5, message: "Excellent product!" },
    { rating: 4.3, message: "Really good, minor issues." },
    { rating: 3.8, message: "It is okay." },
    { rating: 2.1, message: "Did not like it much." }
  ]
};
Here is how the code executes:

1. Calculate Average Rating:
rawRating = Number("4.25") $\rightarrow$ 4.25
rating = 4.25 (Since 4.25 is a valid number, not NaN)
2. Loop Through Reviews (product.reviews.forEach):
Start State: counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }

Review 1 (rating: 5):

Math.round(5) $\rightarrow$ 5
Increments slot 5.
counts becomes: { 5: 1, 4: 0, 3: 0, 2: 0, 1: 0 }
Review 2 (rating: 4.3):

Math.round(4.3) $\rightarrow$ 4
Increments slot 4.
counts becomes: { 5: 1, 4: 1, 3: 0, 2: 0, 1: 0 }
Review 3 (rating: 3.8):

Math.round(3.8) $\rightarrow$ 4
Increments slot 4.
counts becomes: { 5: 1, 4: 2, 3: 0, 2: 0, 1: 0 }
Review 4 (rating: 2.1):

Math.round(2.1) $\rightarrow$ 2
Increments slot 2.
counts becomes: { 5: 1, 4: 2, 3: 0, 2: 1, 1: 0 }
3. Output:
The ratingBreakdown returns:

javascript
{ 5: 1, 4: 2, 3: 0, 2: 1, 1: 0 }
5 Stars: 1 review
4 Stars: 2 reviews
3 Stars: 0 reviews
2 Stars: 1 review
1 Star: 0 reviews
    */
  // 1. Convert the product's average rating from string/unknown type to a number
  const rawRating = Number(product?.averageRating);

  // 2. Fallback to 0 if the raw rating is not a valid number (e.g., NaN, undefined, or missing)
  const rating = isNaN(rawRating) ? 0 : rawRating;

  // 3. Compute the count of each star rating (1 to 5 stars) from individual customer reviews.
  // We use useMemo to optimize performance and prevent recalculating on every re-render.
  const ratingBreakdown = useMemo(() => {
    // Initialize an empty counter object for star ratings 1 to 5
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

    // If there are no reviews, return the initial counts of all zeros
    if (!product?.reviews?.length) return counts;

    // Iterate through all reviews and increment the count for the corresponding star rating
    product.reviews.forEach((r) => {
      // Round the review's rating to the nearest whole integer (e.g., 4.6 becomes 5, 4.3 becomes 4)
      const rate = Math.round(r.rating);

      // Ensure the rating is within the valid range of 1 to 5 stars before incrementing
      if (rate >= 1 && rate <= 5) {
        counts[rate as keyof typeof counts]++;
      }
    });

    return counts;
  }, [product?.reviews]); // Re-calculate only when the product's reviews array changes
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
    setQuantity((currentQuantity) =>
      Math.min(maxQuantity, currentQuantity + 1),
    );
  };

  const handleAddToCart = () => {
    if (!product || outOfStock) return;

    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    if (product.colors?.length && !selectedColor) {
      Alert.alert(
        "Selection Required",
        "Please select a color before adding to cart.",
      );
      setSelectionError("Please select product color.");
      return;
    }

    if (product.sizes?.length && !selectedSize) {
      Alert.alert(
        "Selection Required",
        "Please select a size before adding to cart.",
      );
      setSelectionError("Please select product size.");
      return;
    }

    dispatch(
      addToCart({
        product,
        color: selectedColor || "Default",
        size: selectedSize || "Default",
        quantity,
      }),
    );
    setSelectionError("");
    router.push("/cart");
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <AuthRequiredModal
          visible={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />

        {/* Standard Premium Top Action Bar (respects status bar) */}
        <View style={{ height: insets.top, backgroundColor: colors.surface }} />
        <View
          style={[
            styles.header,
            {
              backgroundColor: colors.surface,
              borderBottomColor: colors.border,
            },
          ]}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.headerBtn, { backgroundColor: colors.inputBg }]}
            activeOpacity={0.8}
          >
            <Ionicons name="chevron-back" size={20} color={colors.text} />
          </TouchableOpacity>
          <Text variant="md" weight="bold" color={colors.text}>
            Product Details
          </Text>
          <TouchableOpacity
            onPress={handleToggleWishlist}
            disabled={!product}
            style={[styles.headerBtn, { backgroundColor: colors.inputBg }]}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isWishlisted ? "heart" : "heart-outline"}
              size={20}
              color={isWishlisted ? colors.error : colors.text}
            />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <ScrollView showsVerticalScrollIndicator={false}>
            <ProductDetailSkeleton />
          </ScrollView>
        ) : error || !product ? (
          <View style={styles.centerState}>
            <Ionicons
              name="alert-circle-outline"
              size={40}
              color={colors.error}
            />
            <Text
              variant="md"
              weight="semibold"
              align="center"
              style={styles.stateTitle}
            >
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
          <>
            <ScrollView
              contentContainerStyle={[styles.content, { paddingBottom: 120 }]}
              showsVerticalScrollIndicator={false}
            >
              {/* Product Hero Image Stage with Rounded Bottom */}
              <View
                style={[
                  styles.imageStage,
                  { backgroundColor: isDark ? colors.surface : "#f1f5f9" },
                ]}
              >
                <Image
                  source={imageSource}
                  style={styles.heroImage}
                  contentFit="contain"
                  transition={250}
                />

                {/* Left/Right Overlays */}
                <View
                  style={[
                    styles.stockBadge,
                    {
                      backgroundColor: outOfStock
                        ? "rgba(239, 68, 68, 0.9)"
                        : "rgba(16, 185, 129, 0.9)",
                    },
                  ]}
                >
                  <Text variant="xs" weight="bold" color="#ffffff">
                    {outOfStock ? "SOLD OUT" : `${qtyLeft} LEFT`}
                  </Text>
                </View>

                {inCartQty > 0 && (
                  <View
                    style={[
                      styles.cartBadge,
                      { backgroundColor: colors.primary },
                    ]}
                  >
                    <Text variant="xs" weight="bold" color="#ffffff">
                      {inCartQty} IN CART
                    </Text>
                  </View>
                )}
              </View>

              {/* Thumbnails list */}
              {images.length > 1 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.thumbnails}
                >
                  {images.map((image, index) => {
                    const selected = selectedImage === index;
                    return (
                      <TouchableOpacity
                        key={`${image}-${index}`}
                        onPress={() => setSelectedImage(index)}
                        style={[
                          styles.thumbnail,
                          {
                            borderColor: selected
                              ? colors.primary
                              : colors.border,
                            borderWidth: selected ? 2 : 1,
                            backgroundColor: colors.surface,
                            opacity: selected ? 1 : 0.7,
                          },
                        ]}
                        activeOpacity={0.8}
                      >
                        <Image
                          source={{ uri: image }}
                          style={styles.thumbnailImage}
                          contentFit="cover"
                        />
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}

              {/* Title & Brand Group */}
              <View style={styles.titleSection}>
                <View
                  style={[
                    styles.brandPill,
                    {
                      backgroundColor: isDark
                        ? "rgba(99, 102, 241, 0.15)"
                        : "#e0e7ff",
                    },
                  ]}
                >
                  <Text
                    variant="xs"
                    weight="bold"
                    color={colors.primary}
                    style={styles.brandText}
                  >
                    {product.brand || "BRAND"}
                  </Text>
                </View>
                <Text
                  variant="xxl"
                  weight="bold"
                  color={colors.text}
                  style={styles.productName}
                >
                  {product.name}
                </Text>
              </View>

              {/* Stars & Rating Summary Tag */}
              <View style={styles.ratingRow}>
                <View
                  style={[
                    styles.ratingPill,
                    {
                      backgroundColor: isDark
                        ? "rgba(251, 191, 36, 0.12)"
                        : "#fef3c7",
                    },
                  ]}
                >
                  <Ionicons
                    name="star"
                    size={14}
                    color="#f59e0b"
                    style={{ marginRight: 4 }}
                  />
                  <Text
                    variant="sm"
                    weight="bold"
                    color={isDark ? "#fbbf24" : "#b45309"}
                  >
                    {rating.toFixed(1)}
                  </Text>
                </View>
                <Text
                  variant="sm"
                  color={colors.textMuted}
                  style={styles.ratingCount}
                >
                  ({product.totalReviews ?? product.reviews?.length ?? 0}{" "}
                  verified reviews)
                </Text>
              </View>

              {/* Color Swatches Grid */}
              {product.colors?.length > 0 && (
                <Card style={styles.sectionCard}>
                  <Text variant="md" weight="bold" style={styles.sectionTitle}>
                    Available Colors
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
                            styles.swatchOuterRing,
                            {
                              borderColor: selected
                                ? colors.primary
                                : "transparent",
                            },
                          ]}
                          activeOpacity={0.85}
                        >
                          <View
                            style={[
                              styles.swatchInnerDot,
                              {
                                backgroundColor: color,
                                borderColor: colors.border,
                              },
                            ]}
                          />
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </Card>
              )}

              {/* Size Swatches Row */}
              {product.sizes?.length > 0 && (
                <Card style={styles.sectionCard}>
                  <Text variant="md" weight="bold" style={styles.sectionTitle}>
                    Select Size
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
                              borderColor: selected
                                ? colors.primary
                                : colors.border,
                              backgroundColor: selected
                                ? colors.primary
                                : colors.inputBg,
                            },
                          ]}
                          activeOpacity={0.85}
                        >
                          <Text
                            variant="sm"
                            weight="semibold"
                            color={selected ? "#ffffff" : colors.text}
                          >
                            {size}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </Card>
              )}

              {/* Stepper Quantity Stepper card */}
              <Card style={styles.sectionCard}>
                <Text variant="md" weight="bold" style={styles.sectionTitle}>
                  Select Quantity
                </Text>
                <View style={styles.quantityRow}>
                  <View
                    style={[
                      styles.quantityStepper,
                      { backgroundColor: colors.inputBg },
                    ]}
                  >
                    <TouchableOpacity
                      onPress={decreaseQuantity}
                      disabled={quantity <= 1}
                      style={styles.quantityButton}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name="remove"
                        size={20}
                        color={quantity <= 1 ? colors.textMuted : colors.text}
                      />
                    </TouchableOpacity>
                    <Text
                      variant="lg"
                      weight="bold"
                      style={styles.quantityValue}
                    >
                      {quantity}
                    </Text>
                    <TouchableOpacity
                      onPress={increaseQuantity}
                      disabled={quantity >= maxQuantity}
                      style={styles.quantityButton}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name="add"
                        size={20}
                        color={
                          quantity >= maxQuantity
                            ? colors.textMuted
                            : colors.text
                        }
                      />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.quantityMeta}>
                    <Text variant="sm" color={colors.textMuted}>
                      Max available: {maxQuantity}
                    </Text>
                    {inCartQty > 0 && (
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => router.push("/cart")}
                      >
                        <Text
                          variant="sm"
                          color={colors.success}
                          weight="semibold"
                          style={{
                            marginTop: 2,
                            textDecorationLine: "underline",
                          }}
                        >
                          {inCartQty} currently in cart
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
                {!!selectionError && (
                  <Text
                    variant="sm"
                    color={colors.error}
                    style={styles.selectionError}
                  >
                    {selectionError}
                  </Text>
                )}
              </Card>

              {/* Information Row Grid */}
              <Card style={styles.sectionCard}>
                <Text variant="md" weight="bold" style={styles.sectionTitle}>
                  Product Specifications
                </Text>
                <DetailRow label="Category" value={product.category} />
                <DetailRow label="Brand" value={product.brand} />
                <DetailRow label="Available Stock" value={`${qtyLeft} units`} />
                <DetailRow
                  label="Popularity"
                  value={`${product.totalSold ?? 0} sold`}
                />
              </Card>

              {/* Description Details */}
              <Card style={styles.sectionCard}>
                <Text variant="md" weight="bold" style={styles.sectionTitle}>
                  Product Description
                </Text>
                <Text
                  variant="md"
                  color={colors.textMuted}
                  style={styles.description}
                  numberOfLines={isDescriptionExpanded ? undefined : 3}
                >
                  {product.description ||
                    "No description available for this premium product."}
                </Text>
                {product.description && product.description.length > 120 && (
                  <TouchableOpacity
                    onPress={() =>
                      setIsDescriptionExpanded(!isDescriptionExpanded)
                    }
                    style={{ marginTop: SPACING.xs }}
                  >
                    <Text variant="sm" color={colors.primary} weight="semibold">
                      {isDescriptionExpanded ? "Show Less" : "...show more"}
                    </Text>
                  </TouchableOpacity>
                )}
              </Card>

              {/* Customer Reviews Area */}
              <Card style={styles.sectionCard}>
                <Text variant="md" weight="bold" style={styles.sectionTitle}>
                  Customer Feedback
                </Text>

                {/* Rating statistics summary */}
                <View
                  style={[
                    styles.reviewStatsContainer,
                    {
                      backgroundColor: isDark
                        ? "rgba(255,255,255,0.03)"
                        : "#f8fafc",
                    },
                  ]}
                >
                  <View style={styles.statsLeft}>
                    <Text variant="xxl" weight="bold" color={colors.text}>
                      {rating.toFixed(1)}
                    </Text>
                    <View style={styles.statsStarsRow}>
                      {[0, 1, 2, 3, 4].map((star) => (
                        <Ionicons
                          key={star}
                          name={rating > star ? "star" : "star-outline"}
                          size={14}
                          color="#f59e0b"
                        />
                      ))}
                    </View>
                    <Text
                      variant="xxs"
                      color={colors.textMuted}
                      style={{ marginTop: 2 }}
                    >
                      {product.totalReviews ?? product.reviews?.length ?? 0}{" "}
                      reviews
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statsDivider,
                      { backgroundColor: colors.border },
                    ]}
                  />
                  <View style={styles.statsRight}>
                    {/* Loop through star ratings from 5 down to 1 to draw each breakdown bar row */}
                    {[5, 4, 3, 2, 1].map((star) => {
                      // Total count of all reviews
                      const totalReviews = product.reviews?.length || 0;
                      
                      // Number of reviews that have this specific star rating (e.g., how many 5-star reviews)
                      const count =
                        ratingBreakdown[star as keyof typeof ratingBreakdown] ||
                        0;
                        
                      // Percentage of total reviews that fall into this star rating
                      const pct =
                        totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                        
                      return (
                        <View key={star} style={styles.ratingBarRow}>
                          {/* Left: Star rating number label */}
                          <Text
                            variant="xxs"
                            color={colors.text}
                            style={{ width: 12 }}
                          >
                            {star}
                          </Text>
                          
                          {/* Small star icon next to the number label */}
                          <Ionicons
                            name="star"
                            size={9}
                            color="#f59e0b"
                            style={{ marginRight: 6 }}
                          />
                          
                          {/* Middle: Horizontal progress bar background container */}
                          <View
                            style={[
                              styles.ratingBarBg,
                              {
                                backgroundColor: isDark ? "#334155" : "#e2e8f0",
                              },
                            ]}
                          >
                            {/* Inner fill bar reflecting the calculated percentage */}
                            <View
                              style={[
                                styles.ratingBarFill,
                                {
                                  width: `${pct}%`,
                                  backgroundColor: colors.primary,
                                },
                              ]}
                            />
                          </View>
                          
                          {/* Right: Percentage label text (e.g., "75%") */}
                          <Text
                            variant="xxs"
                            color={colors.textMuted}
                            style={{
                              width: 32,
                              textAlign: "right",
                              marginLeft: 4,
                            }}
                          >
                            {Math.round(pct)}%
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>

                {/* Write Review Form */}
                <View
                  style={[
                    styles.writeReviewWrapper,
                    { borderTopColor: colors.border },
                  ]}
                >
                  <Text
                    variant="sm"
                    weight="bold"
                    style={{ marginBottom: SPACING.sm }}
                  >
                    Write a Customer Review
                  </Text>

                  {!isAuthenticated ? (
                    <View
                      style={[
                        styles.reviewAlertBox,
                        {
                          backgroundColor: isDark
                            ? "rgba(99, 102, 241, 0.1)"
                            : "#f5f3ff",
                          borderColor: colors.primary,
                        },
                      ]}
                    >
                      <Ionicons
                        name="lock-closed"
                        size={16}
                        color={colors.primary}
                        style={{ marginRight: 6 }}
                      />
                      <Text
                        variant="xs"
                        color={colors.textMuted}
                        style={{ flex: 1 }}
                      >
                        Please login to write a review.
                      </Text>
                      <TouchableOpacity
                        onPress={() => router.push("/login")}
                        style={[
                          styles.smallLoginBtn,
                          { backgroundColor: colors.primary },
                        ]}
                      >
                        <Text variant="xxs" weight="bold" color="#ffffff">
                          LOGIN
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : userReview ? (
                    <View
                      style={[
                        styles.reviewAlertBox,
                        {
                          flexDirection: "column",
                          alignItems: "stretch",
                          backgroundColor: isDark
                            ? "rgba(16, 185, 129, 0.08)"
                            : "#f0fdf4",
                          borderColor: colors.success,
                          padding: SPACING.md,
                        },
                      ]}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          marginBottom: SPACING.sm,
                        }}
                      >
                        <Ionicons
                          name="checkmark-circle"
                          size={18}
                          color={colors.success}
                          style={{ marginRight: 6 }}
                        />
                        <Text variant="xs" weight="bold" color={colors.success}>
                          You have already reviewed this product
                        </Text>
                      </View>

                      <View
                        style={{
                          backgroundColor: colors.surface,
                          borderColor: colors.border,
                          borderWidth: 1,
                          padding: SPACING.sm,
                          borderRadius: 8,
                        }}
                      >
                        <View
                          style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: 6,
                          }}
                        >
                          <View style={styles.starRow}>
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Ionicons
                                key={star}
                                name={
                                  userReview.rating >= star
                                    ? "star"
                                    : "star-outline"
                                }
                                size={12}
                                color="#f59e0b"
                                style={{ marginRight: 2 }}
                              />
                            ))}
                          </View>
                          <Text variant="xxs" color={colors.textMuted}>
                            {userReview.createdAt
                              ? new Date(
                                  userReview.createdAt,
                                ).toLocaleDateString(undefined, {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                })
                              : "Recently"}
                          </Text>
                        </View>
                        <Text
                          variant="sm"
                          color={colors.text}
                          style={{ fontStyle: "italic", lineHeight: 18 }}
                        >
                          "{userReview.message}"
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <View>
                      {/* Clickable Star Input */}
                      <View style={styles.ratingInputContainer}>
                        <Text
                          variant="xs"
                          color={colors.textMuted}
                          style={{ marginRight: SPACING.sm }}
                        >
                          Your Rating:
                        </Text>
                        <View style={styles.starRow}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <TouchableOpacity
                              key={star}
                              onPress={() => setReviewRating(star)}
                              activeOpacity={0.7}
                            >
                              <Ionicons
                                name={
                                  reviewRating >= star ? "star" : "star-outline"
                                }
                                size={22}
                                color="#f59e0b"
                                style={{ marginRight: 4 }}
                              />
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>

                      {/* Message Input Box */}
                      <TextInput
                        placeholder="Write details of your experience with this product..."
                        placeholderTextColor={colors.textMuted}
                        value={reviewMessage}
                        onChangeText={(val) => {
                          setReviewMessage(val);
                          setReviewFormError("");
                        }}
                        style={[
                          styles.reviewInputText,
                          {
                            color: colors.text,
                            borderColor: reviewFormError
                              ? colors.error
                              : colors.border,
                            backgroundColor: colors.inputBg,
                          },
                        ]}
                        multiline
                        numberOfLines={3}
                        textAlignVertical="top"
                      />

                      {reviewFormError ? (
                        <Text
                          variant="xs"
                          color={colors.error}
                          style={{
                            marginTop: 4,
                            marginBottom: 8,
                            fontWeight: "600",
                          }}
                        >
                          {reviewFormError}
                        </Text>
                      ) : null}

                      <TouchableOpacity
                        onPress={handleSubmitReview}
                        disabled={isSubmittingReview}
                        style={[
                          styles.submitReviewBtn,
                          { backgroundColor: colors.primary },
                        ]}
                        activeOpacity={0.8}
                      >
                        {isSubmittingReview ? (
                          <ActivityIndicator size="small" color="#ffffff" />
                        ) : (
                          <>
                            <Ionicons
                              name="send"
                              size={14}
                              color="#ffffff"
                              style={{ marginRight: 6 }}
                            />
                            <Text variant="xs" weight="bold" color="#ffffff">
                              Submit Review
                            </Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                {/* Reviews List */}
                <View
                  style={[
                    styles.reviewsListContainer,
                    { borderTopColor: colors.border },
                  ]}
                >
                  <Text
                    variant="sm"
                    weight="bold"
                    style={{ marginBottom: SPACING.md }}
                  >
                    User Reviews
                  </Text>

                  {product.reviews?.length ? (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.reviewsScrollContainer}
                    >
                      {/* Map through the slice of reviews to render them horizontally */}
                      {reviewsToDisplay.map((review) => {
                        // 1. Resolve reviewer's name (handle populated user object vs plain ID string)
                        const reviewerName =
                          typeof review.user === "string"
                            ? "Customer"
                            : review.user?.fullname || "Customer";
                            
                        // 2. Extract initials for the avatar placeholder (e.g., "John Doe" -> "JD")
                        const reviewerInitial = reviewerName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2);
                          
                        // 3. Determine if the review belongs to the currently logged-in user
                        const isOwnReview =
                          user &&
                          (typeof review.user === "string"
                            ? review.user === user._id
                            : review.user?._id === user._id);
                            
                        // 4. Format the review creation date (e.g., "Jun 21, 2026")
                        const reviewDate = review.createdAt
                          ? new Date(review.createdAt).toLocaleDateString(
                              undefined,
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              },
                            )
                          : "Recently";

                        return (
                          <View
                            key={review._id}
                            style={[
                              styles.reviewItemCardHorizontal,
                              {
                                // Highlight user's own review with brand color borders and light background shading
                                borderColor: isOwnReview
                                  ? colors.primary
                                  : colors.border,
                                backgroundColor: isOwnReview
                                  ? isDark
                                    ? "rgba(99,102,241,0.06)"
                                    : "#f5f3ff"
                                  : colors.surface,
                              },
                            ]}
                          >
                            {/* Reviewer Header Profile Row */}
                            <View style={styles.reviewUserRow}>
                              {/* Avatar circle containing user's initials */}
                              <View
                                style={[
                                  styles.reviewAvatar,
                                  {
                                    backgroundColor: isOwnReview
                                      ? colors.primary
                                      : isDark
                                        ? "rgba(255,255,255,0.08)"
                                        : "#e2e8f0",
                                  },
                                ]}
                              >
                                <Text
                                  variant="xs"
                                  weight="bold"
                                  color={
                                    isOwnReview ? "#ffffff" : colors.textMuted
                                  }
                                >
                                  {reviewerInitial}
                                </Text>
                              </View>
                              
                              {/* Details: Name and formatted date */}
                              <View style={styles.reviewUserDetails}>
                                <View style={styles.reviewNameRow}>
                                  <Text
                                    variant="sm"
                                    weight="semibold"
                                    numberOfLines={1}
                                    style={{ maxWidth: 100 }}
                                  >
                                    {reviewerName}
                                  </Text>
                                  {/* Small indicator label for user's own review */}
                                  {isOwnReview && (
                                    <View
                                      style={[
                                        styles.ownReviewBadge,
                                        { backgroundColor: colors.primary },
                                      ]}
                                    >
                                      <Text
                                        variant="xxs"
                                        weight="bold"
                                        color="#ffffff"
                                      >
                                        YOU
                                      </Text>
                                    </View>
                                  )}
                                </View>
                                <Text variant="xxs" color={colors.textMuted}>
                                  {reviewDate}
                                </Text>
                              </View>
                            </View>

                            {/* Stars rating row showing 5 stars (filled or empty outline) */}
                            <View style={styles.reviewStarsRow}>
                              {[0, 1, 2, 3, 4].map((star) => (
                                <Ionicons
                                  key={star}
                                  name={
                                    review.rating > star
                                      ? "star"
                                      : "star-outline"
                                  }
                                  size={11}
                                  color="#f59e0b"
                                  style={{ marginRight: 2 }}
                                />
                              ))}
                            </View>

                            {/* Truncated review message text (max 3 lines) */}
                            <Text
                              variant="sm"
                              color={colors.text}
                              numberOfLines={3}
                              style={styles.reviewText}
                            >
                              {review.message}
                            </Text>
                          </View>
                        );
                      })}

                      {/* Right-aligned Load More card: only rendered when there are remaining paginated reviews left to load */}
                      {product.reviews.length > visibleReviewsLimit && (
                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={() =>
                            setVisibleReviewsLimit(
                              (prev) => prev + REVIEW_PAGINATION.LIMIT,
                            )
                          }
                          style={[
                            styles.loadMoreReviewsCard,
                            {
                              borderColor: colors.primary,
                              backgroundColor: isDark
                                ? "rgba(99, 102, 241, 0.05)"
                                : "#eff6ff",
                            },
                          ]}
                        >
                          <Ionicons
                            name="chevron-forward-circle-outline"
                            size={28}
                            color={colors.primary}
                          />
                          <Text
                            variant="xs"
                            weight="bold"
                            color={colors.primary}
                            style={{ marginTop: 6, textAlign: "center" }}
                          >
                            Load More
                          </Text>
                        </TouchableOpacity>
                      )}
                    </ScrollView>
                  ) : (
                    <Text
                      variant="sm"
                      color={colors.textMuted}
                      align="center"
                      style={{ marginVertical: SPACING.md }}
                    >
                      No reviews written yet. Be the first to share your
                      experience!
                    </Text>
                  )}
                </View>
              </Card>
            </ScrollView>

            {/* Premium Fixed Sticky Footer Container */}
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
                <Text
                  variant="xs"
                  color={colors.textMuted}
                  style={styles.totalPriceLabel}
                >
                  TOTAL PRICE
                </Text>
                <Text variant="xl" weight="bold" color={colors.primary}>
                  ${(product.price * quantity).toFixed(2)}
                </Text>
              </View>

              {!isAuthenticated ? (
                <TouchableOpacity
                  onPress={() => router.push("/login")}
                  style={[styles.footerBtn, { backgroundColor: colors.text }]}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name="log-in-outline"
                    size={20}
                    color={colors.surface}
                    style={{ marginRight: 6 }}
                  />
                  <Text variant="md" weight="bold" color={colors.surface}>
                    Login to Shop
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={handleAddToCart}
                  disabled={outOfStock}
                  style={[
                    styles.footerBtn,
                    {
                      backgroundColor: outOfStock
                        ? colors.border
                        : colors.primary,
                    },
                  ]}
                  activeOpacity={0.86}
                >
                  <Ionicons
                    name="cart-outline"
                    size={20}
                    color="#ffffff"
                    style={{ marginRight: 6 }}
                  />
                  <Text variant="md" weight="bold" color="#ffffff">
                    {outOfStock ? "Out of Stock" : "Add to Cart"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        )}
      </View>
    </>
  );
}

function DetailRow({ label, value }: { label: string; value?: string }) {
  const { colors } = useTheme();

  return (
    <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
      <Text variant="sm" color={colors.textMuted}>
        {label}
      </Text>
      <Text
        variant="sm"
        weight="semibold"
        color={colors.text}
        style={styles.detailValue}
      >
        {value || "-"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 56,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.lg,
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
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
    width: 160,
  },
  content: {
    paddingBottom: SPACING.xxxl,
  },
  imageStage: {
    height: 380,
    width: "100%",
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: "hidden",
    position: "relative",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  stockBadge: {
    position: "absolute",
    bottom: SPACING.md,
    left: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: 5,
  },
  cartBadge: {
    position: "absolute",
    bottom: SPACING.md,
    right: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: 5,
  },
  thumbnails: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: BORDER_RADIUS.md,
    overflow: "hidden",
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
  },
  titleSection: {
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.xs,
    alignItems: "flex-start",
  },
  brandPill: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.round,
    marginBottom: SPACING.sm,
  },
  brandText: {
    fontSize: 10,
    letterSpacing: 0.8,
  },
  productName: {
    fontSize: 22,
    lineHeight: 28,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  ratingPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.round,
  },
  ratingCount: {
    marginLeft: SPACING.sm,
  },
  sectionCard: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    padding: SPACING.md,
    borderRadius: 16,
    borderWidth: 1,
  },
  sectionTitle: {
    marginBottom: SPACING.sm,
    fontSize: 14,
    letterSpacing: 0.2,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
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
    gap: SPACING.sm,
  },
  swatchOuterRing: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  swatchInnerDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
  },
  sizeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
  },
  sizePill: {
    minWidth: 50,
    height: 38,
    borderRadius: BORDER_RADIUS.md,
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
    padding: 3,
  },
  quantityButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  quantityValue: {
    minWidth: 40,
    textAlign: "center",
  },
  quantityMeta: {
    alignItems: "flex-end",
  },
  selectionError: {
    marginTop: SPACING.sm,
    fontWeight: "600",
  },
  description: {
    lineHeight: 22,
    fontSize: 14,
  },
  reviewStatsContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.md,
    borderRadius: 12,
    marginVertical: SPACING.sm,
  },
  statsLeft: {
    alignItems: "center",
    paddingHorizontal: SPACING.sm,
  },
  statsStarsRow: {
    flexDirection: "row",
    marginVertical: 2,
  },
  statsDivider: {
    width: 1,
    height: "80%",
    marginHorizontal: SPACING.md,
  },
  statsRight: {
    flex: 1,
  },
  writeReviewWrapper: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: SPACING.md,
    marginTop: SPACING.md,
  },
  reviewAlertBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.sm,
  },
  smallLoginBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 5,
    borderRadius: 12,
  },
  ratingInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  starRow: {
    flexDirection: "row",
  },
  reviewInputText: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: 13,
    minHeight: 70,
    marginBottom: SPACING.md,
  },
  submitReviewBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 38,
    borderRadius: 19,
    paddingHorizontal: SPACING.lg,
    alignSelf: "flex-end",
    marginBottom: SPACING.sm,
  },
  reviewsListContainer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: SPACING.md,
    marginTop: SPACING.md,
  },
  reviewItemCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  reviewsScrollContainer: {
    paddingVertical: SPACING.xs,
    paddingRight: SPACING.lg,
  },
  reviewItemCardHorizontal: {
    width: 260,
    height: 135,
    borderWidth: 1,
    borderRadius: 12,
    padding: SPACING.md,
    marginRight: SPACING.md,
    justifyContent: "space-between",
  },
  loadMoreReviewsCard: {
    width: 120,
    height: 135,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.sm,
    marginRight: SPACING.md,
  },
  reviewUserRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  reviewAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.sm,
  },
  reviewUserDetails: {
    flex: 1,
  },
  reviewNameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  ownReviewBadge: {
    marginLeft: SPACING.xs,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  reviewStarsRow: {
    flexDirection: "row",
    marginBottom: 6,
  },
  reviewText: {
    lineHeight: 18,
    fontSize: 13,
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
  footerBtn: {
    flex: 1,
    marginLeft: SPACING.lg,
    height: 48,
    borderRadius: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SPACING.lg,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  ratingBarRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  ratingBarBg: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
    marginHorizontal: 8,
  },
  ratingBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  ratingRowNoPadding: {
    flexDirection: "row",
    alignItems: "center",
  },
});
