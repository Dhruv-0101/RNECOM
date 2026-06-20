import React, { useState, useEffect, useMemo } from "react";
import { View, StyleSheet, TouchableOpacity, FlatList, Dimensions, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSelector } from "react-redux";
import { RootState } from "@/src/store/store";
import { useTheme } from "@/src/shared/providers/ThemeProvider";
import { Text } from "@/src/shared/ui/Text";
import { Loader } from "@/src/shared/ui/Loader";
import { Button } from "@/src/shared/ui/Button";
import { SPACING, BORDER_RADIUS } from "@/src/shared/constants/spacing";
import { useCategories } from "@/src/features/categories/hooks/useCategories";
import { useProducts } from "@/src/features/products/hooks/useProducts";
import { ProductCard } from "@/src/features/products/components/ProductCard";
import { Category } from "@/src/features/categories/types/category.types";
import { Product } from "@/src/features/products/types/product.types";
import { ENV } from "@/src/config/env";

const { width } = Dimensions.get("window");
const SIDEBAR_WIDTH = 100;
const PADDING = 12;
const RIGHT_PANEL_WIDTH = width - SIDEBAR_WIDTH;
const CARD_WIDTH = (RIGHT_PANEL_WIDTH - PADDING * 3) / 2;

const mockNoneCategory: Category = {
  _id: "none_category",
  name: "None",
  image: "",
  products: [],
  user: "",
  createdAt: "",
  updatedAt: "",
};

export default function Categories() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { category: routeCategory } = useLocalSearchParams<{ category?: string }>();

  // Fetch categories using custom React Query hook
  const {
    data: categoriesData,
    isLoading: isCategoriesLoading,
    error: categoriesError,
    refetch: refetchCategories,
  } = useCategories();

  const categories = categoriesData?.categories || [];
  const categoriesWithNone = useMemo(() => {
    return [mockNoneCategory, ...categories];
  }, [categories]);

  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [page, setPage] = useState(1);
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [hasMore, setHasMore] = useState(true);

  // Set selected category from route parameter or fall back to default None
  useEffect(() => {
    if (categories.length > 0) {
      if (routeCategory) {
        const matchedCategory = categories.find(
          (c) => c.name.toLowerCase() === routeCategory.toLowerCase()
        );
        if (matchedCategory) {
          setSelectedCategory(matchedCategory);
          setPage(1);
          setProductsList([]);
          setHasMore(true);
          return;
        }
      }

      // Default to "None" category if none is selected yet
      if (!selectedCategory) {
        setSelectedCategory(mockNoneCategory);
        setPage(1);
        setProductsList([]);
        setHasMore(true);
      }
    }
  }, [categories, routeCategory]);

  // Read global search query from Redux store
  const searchQuery = useSelector((state: RootState) => state.search.query);

  // Reset pagination when search query changes
  useEffect(() => {
    setPage(1);
    setProductsList([]);
    setHasMore(true);
  }, [searchQuery]);

  // Fetch products matching selected category and search filter with pagination
  const queryParams = useMemo(() => {
    if (!selectedCategory) return undefined;
    return {
      category: selectedCategory._id === "none_category" ? undefined : selectedCategory.name,
      name: searchQuery || undefined,
      page,
      limit: 10,
    };
  }, [selectedCategory, searchQuery, page]);

  const {
    data: productsData,
    isLoading: isProductsLoading,
    isFetching: isProductsFetching,
    refetch: refetchProducts,
  } = useProducts(queryParams);

  // Sync server products into aggregated local state for infinite scroll
  useEffect(() => {
    if (productsData?.products) {
      const fetchedProducts = productsData.products;
      if (page === 1) {
        setProductsList(fetchedProducts);
      } else {
        setProductsList((prev) => {
          const existingIds = new Set(prev.map((p) => p._id));
          const uniqueNew = fetchedProducts.filter((p) => !existingIds.has(p._id));
          return [...prev, ...uniqueNew];
        });
      }
      // If server returned less than our page limit, we've reached the end
      if (fetchedProducts.length < 10) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }
    }
  }, [productsData, page]);

  // Helper to resolve absolute URLs or local dev server paths for category images
  const getCategoryImageUrl = (imagePath: string) => {
    if (!imagePath) return null;
    if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
      return { uri: imagePath };
    }
    const cleanPath = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;
    return { uri: `${ENV.API_URL}${cleanPath}` };
  };

  // Pull to refresh handler for products
  const handleRefreshProducts = () => {
    setPage(1);
    setProductsList([]);
    setHasMore(true);
    refetchProducts();
  };

  // Trigger loading next page when scrolling reaches end
  const handleLoadMore = () => {
    if (hasMore && !isProductsFetching && !isProductsLoading) {
      setPage((p) => p + 1);
    }
  };

  const handleCategorySelect = (category: Category) => {
    setSelectedCategory(category);
    setPage(1);
    setProductsList([]);
    setHasMore(true);
  };

  // Rendering individual category item in the left sidebar
  const renderCategoryItem = ({ item }: { item: Category }) => {
    const isActive = selectedCategory?._id === item._id;
    const displayName = item.name.charAt(0).toUpperCase() + item.name.slice(1);
    const categoryImage = getCategoryImageUrl(item.image);
    const isNone = item._id === "none_category";

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        style={[
          styles.sidebarItem,
          {
            backgroundColor: isActive ? colors.primaryLight : "transparent",
          },
        ]}
        onPress={() => handleCategorySelect(item)}
      >
        {isActive && (
          <View style={[styles.activeIndicator, { backgroundColor: colors.primary }]} />
        )}
        <View
          style={[
            styles.imageWrapper,
            {
              borderColor: isActive ? colors.primary : colors.border,
              backgroundColor: isDark ? colors.surface : "#f1f5f9",
            },
          ]}
        >
          {isNone ? (
            <Ionicons name="apps-outline" size={18} color={isActive ? colors.primary : colors.textMuted} />
          ) : categoryImage ? (
            <Image
              source={categoryImage}
              style={styles.categoryImage}
              contentFit="cover"
              transition={200}
              cachePolicy="disk"
            />
          ) : (
            <Ionicons name="grid-outline" size={18} color={colors.textMuted} />
          )}
        </View>
        <Text
          variant="xs"
          weight={isActive ? "bold" : "medium"}
          color={isActive ? colors.primary : colors.text}
          align="center"
          numberOfLines={2}
          style={styles.categoryText}
        >
          {displayName}
        </Text>
      </TouchableOpacity>
    );
  };

  // Render Full Screen Loading
  if (isCategoriesLoading) {
    return (
      <View style={[styles.loaderContainer, { backgroundColor: colors.background }]}>
        <Loader size="large" />
      </View>
    );
  }

  // Render Categories Loading Error Screen
  if (categoriesError) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
        <Text variant="md" weight="semibold" style={{ marginTop: SPACING.md }}>
          Failed to load categories
        </Text>
        <Text variant="sm" color={colors.textMuted} align="center" style={{ marginTop: SPACING.xs }}>
          {categoriesError instanceof Error ? categoriesError.message : "An unexpected error occurred"}
        </Text>
        <Button
          title="Retry"
          onPress={() => {
            refetchCategories();
          }}
          style={styles.retryButton}
          icon="refresh-outline"
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Left Sidebar - Categories List (includes None) */}
      <View style={[styles.sidebar, { backgroundColor: colors.surface, borderRightColor: colors.border }]}>
        <FlatList
          data={categoriesWithNone}
          keyExtractor={(item) => item._id}
          renderItem={renderCategoryItem}
          contentContainerStyle={styles.sidebarContent}
          showsVerticalScrollIndicator={false}
        />
      </View>

      {/* Right Grid - Products List */}
      <View style={styles.rightPanel}>
        {selectedCategory ? (
          <FlatList
            data={productsList}
            keyExtractor={(item) => item._id}
            numColumns={2}
            columnWrapperStyle={styles.columnWrapper}
            contentContainerStyle={styles.rightPanelContent}
            onRefresh={handleRefreshProducts}
            refreshing={isProductsFetching && page === 1 && !isProductsLoading}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListHeaderComponent={
              <View style={styles.rightPanelHeader}>
                <Text variant="lg" weight="bold" color={colors.text} style={styles.categoryTitle}>
                  {selectedCategory.name === "None" ? "All Products" : selectedCategory.name}
                </Text>
                {!isProductsLoading && (
                  <Text variant="xs" color={colors.textMuted} style={styles.productCount}>
                    {productsData?.total || productsList.length} {(productsData?.total || productsList.length) === 1 ? "product" : "products"} available
                  </Text>
                )}
              </View>
            }
            renderItem={({ item }) => (
              <ProductCard
                product={item}
                width={CARD_WIDTH}
                onPress={(prod) => {
                  router.push({
                    pathname: "/product/[id]",
                    params: { id: prod._id },
                  });
                }}
              />
            )}
            ListFooterComponent={
              isProductsFetching && page > 1 ? (
                <View style={styles.loaderContainer}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              ) : null
            }
            ListEmptyComponent={
              isProductsLoading ? (
                <View style={styles.loaderContainer}>
                  <Loader size="large" />
                </View>
              ) : (
                <View style={styles.emptyContainer}>
                  <Ionicons name="basket-outline" size={48} color={colors.textMuted} />
                  <Text variant="md" weight="semibold" style={styles.emptyTitle}>
                    No Products Found
                  </Text>
                  <Text variant="sm" color={colors.textMuted} align="center" style={styles.emptySubtitle}>
                    There are no products available matching this query.
                  </Text>
                </View>
              )
            }
          />
        ) : (
          <View style={styles.loaderContainer}>
            <Loader size="large" />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
  },
  sidebar: {
    width: SIDEBAR_WIDTH,
    borderRightWidth: 1,
  },
  sidebarContent: {
    paddingVertical: SPACING.md,
  },
  sidebarItem: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xs,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    marginVertical: SPACING.xs,
    marginHorizontal: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  activeIndicator: {
    position: "absolute",
    left: 2,
    top: "20%",
    bottom: "20%",
    width: 4,
    borderRadius: BORDER_RADIUS.xs,
  },
  imageWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.xs,
  },
  categoryImage: {
    width: "100%",
    height: "100%",
  },
  categoryText: {
    marginTop: 2,
    fontSize: 10,
    lineHeight: 12,
  },
  rightPanel: {
    flex: 1,
  },
  rightPanelContent: {
    padding: PADDING,
    paddingBottom: SPACING.xxl,
  },
  columnWrapper: {
    justifyContent: "space-between",
  },
  rightPanelHeader: {
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.xs,
  },
  categoryTitle: {
    textTransform: "capitalize",
  },
  productCount: {
    marginTop: 2,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 80,
    paddingHorizontal: SPACING.lg,
  },
  emptyTitle: {
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  emptySubtitle: {
    lineHeight: 18,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.lg,
  },
  retryButton: {
    marginTop: SPACING.md,
    minWidth: 120,
  },
});
