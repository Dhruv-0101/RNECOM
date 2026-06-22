import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  ActivityIndicator,
} from "react-native";
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
import {
  ProductSkeletonCard,
  CategorySkeletonItem,
  ProductSkeletonFooter,
} from "@/src/shared/ui/Skeleton";
import { Category } from "@/src/features/categories/types/category.types";
import { Product } from "@/src/features/products/types/product.types";
import { ENV } from "@/src/config/env";
import { PRODUCT_PAGINATION } from "@/src/features/products/config/pagination";
import { CATEGORY_PAGINATION } from "@/src/features/categories/config/pagination";

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
  createdAt: "",
  updatedAt: "",
};

export default function Categories() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { category: routeCategory } = useLocalSearchParams<{
    category?: string;
  }>();

  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );
  const [page, setPage] = useState(1);
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [hasMore, setHasMore] = useState(true);

  const [categoryPage, setCategoryPage] = useState(1);
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);
  const [hasMoreCategories, setHasMoreCategories] = useState(true);

  // Fetch categories using custom React Query hook
  const {
    data: categoriesData,
    isLoading: isCategoriesLoading,
    isFetching: isCategoriesFetching,
    error: categoriesError,
    refetch: refetchCategories,
  } = useCategories({
    page: categoryPage,
    limit: CATEGORY_PAGINATION.SIDEBAR_LIMIT,
  });

  const categoriesWithNone = useMemo(() => {
    return [mockNoneCategory, ...categoriesList];
  }, [categoriesList]);

  // Sync server categories into aggregated local state for pagination
  useEffect(() => {
    if (categoriesData?.categories) {
      const fetchedCategories = categoriesData.categories;
      if (categoryPage === 1) {
        setCategoriesList(fetchedCategories);
      } else {
        setCategoriesList((prev) => {
          const existingIds = new Set(prev.map((c) => c._id));
          const uniqueNew = fetchedCategories.filter(
            (c) => !existingIds.has(c._id),
          );
          return [...prev, ...uniqueNew];
        });
      }
      setHasMoreCategories(categoriesData?.pagination?.hasNextPage ?? false);
    }
  }, [categoriesData, categoryPage]);

  /*
  We set setProductsList([]) here for three main reasons:

1. Showing the Loading Skeletons
In the component, we determine whether to show the loading skeleton cards using this condition:

const displayedProducts = (isProductsLoading && productsList.length === 0) || isCategoriesLoading 
  ? dummyProductSkeletons 
  : productsList;
If we do not clear the productsList (meaning productsList.length > 0), the screen will continue to show the old category's products while the new category's products are being fetched from the backend. The user won't see the premium loading skeletons, making the app feel frozen or unresponsive.

2. Preventing "Stale Data" Display
If you switch from Electronics to Clothing, keeping the old products list means the user will see phones and laptops labeled under the Clothing header for a split second until the backend request completes. Clearing the list ensures they don't see incorrect, mismatched data.

3. Resetting Pagination for the New Category
Since we reset setPage(1), the new query is starting fresh on Page 1. Clearing the accumulated list prevents new products from being appended or incorrectly merged with the old category's products.
  */
  // Set selected category from route parameter or fall back to default None
  useEffect(() => {
    if (categoriesList.length > 0) {
      if (routeCategory) {
        const matchedCategory = categoriesList.find(
          (c) => c.name.toLowerCase() === routeCategory.toLowerCase(),
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
  }, [categoriesList, routeCategory]);
  /*
  जब आप होम स्क्रीन से आते हैं, तो स्क्रीन पर पहले से लोड हो चुके पुराने/स्टेल (stale) प्रोडक्ट्स को हटाने के लिए और नयी सिलेक्टेड कैटेगरी के लिए लोडिंग स्केलेटन को एक्टिवेट करने के लिए लिस्ट को खाली किया जाता है।
  */

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
      category:
        selectedCategory._id === "none_category"
          ? undefined
          : selectedCategory.name,
      name: searchQuery || undefined,
      page,
      limit: PRODUCT_PAGINATION.CATEGORY_LIMIT,
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
          const uniqueNew = fetchedProducts.filter(
            (p) => !existingIds.has(p._id),
          );
          return [...prev, ...uniqueNew];
        });
      }
      setHasMore(productsData?.pagination?.hasNextPage ?? false);
    }
  }, [productsData, page]);

  const dummySidebarSkeletons = useMemo(
    () =>
      Array.from(
        { length: CATEGORY_PAGINATION.SIDEBAR_LIMIT },
        (_, i) =>
          ({
            _id: `sidebar-skeleton-${i}`,
            isSkeleton: true,
          }) as unknown as Category,
      ),
    [],
  );
  const dummyProductSkeletons = useMemo(
    () =>
      Array.from(
        { length: PRODUCT_PAGINATION.CATEGORY_LIMIT },
        (_, i) =>
          ({
            _id: `product-skeleton-${i}`,
            isSkeleton: true,
          }) as unknown as Product,
      ),
    [],
  );
  const displayedProducts =
    (isProductsLoading && productsList.length === 0) || isCategoriesLoading
      ? dummyProductSkeletons
      : productsList;

  // Helper to resolve absolute URLs or local dev server paths for category images
  const getCategoryImageUrl = (imagePath: string) => {
    if (!imagePath) return null;
    if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
      return { uri: imagePath };
    }
    const cleanPath = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;
    return { uri: `${ENV.API_URL}${cleanPath}` };
  };

  // Pull to refresh handler for products and categories
  const handleRefreshProducts = () => {
    setPage(1);
    setProductsList([]);
    setHasMore(true);
    refetchProducts().catch(() => {});

    if (categoryPage === 1) {
      refetchCategories().catch(() => {});
    } else {
      setCategoryPage(1);
    }
  };

  // Trigger loading next page of products
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
    if ("isSkeleton" in item) {
      return <CategorySkeletonItem />;
    }
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
          <View
            style={[
              styles.activeIndicator,
              { backgroundColor: colors.primary },
            ]}
          />
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
            <Ionicons
              name="apps-outline"
              size={18}
              color={isActive ? colors.primary : colors.textMuted}
            />
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

  // Render Full Screen Loading bypassed in favor of skeleton loading

  // Render Categories Loading Error Screen
  if (categoriesError) {
    return (
      <View
        style={[styles.errorContainer, { backgroundColor: colors.background }]}
      >
        <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
        <Text variant="md" weight="semibold" style={{ marginTop: SPACING.md }}>
          Failed to load categories
        </Text>
        <Text
          variant="sm"
          color={colors.textMuted}
          align="center"
          style={{ marginTop: SPACING.xs }}
        >
          {categoriesError instanceof Error
            ? categoriesError.message
            : "An unexpected error occurred"}
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
      <View
        style={[
          styles.sidebar,
          { backgroundColor: colors.surface, borderRightColor: colors.border },
        ]}
      >
        <FlatList
          data={
            isCategoriesLoading && categoriesList.length === 0
              ? dummySidebarSkeletons
              : categoriesWithNone
          }
          keyExtractor={(item) => item._id}
          renderItem={renderCategoryItem}
          contentContainerStyle={styles.sidebarContent}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            !isCategoriesLoading && hasMoreCategories && !isCategoriesFetching ? (
              <TouchableOpacity
                activeOpacity={0.7}
                style={[
                  styles.loadMoreSidebarBtn,
                  {
                    borderColor: colors.primary,
                    backgroundColor: isDark
                      ? "rgba(99, 102, 241, 0.05)"
                      : "#eff6ff",
                  },
                ]}
                onPress={() => setCategoryPage((p) => p + 1)}
              >
                <Ionicons name="add" size={16} color={colors.primary} />
                <Text
                  variant="xxs"
                  weight="bold"
                  color={colors.primary}
                  style={{ marginTop: 2 }}
                >
                  Load More
                </Text>
              </TouchableOpacity>
            ) : isCategoriesFetching && categoryPage > 1 ? (
              <View style={{ paddingVertical: 12, gap: 12 }}>
                {Array.from({ length: CATEGORY_PAGINATION.SIDEBAR_LIMIT }).map((_, i) => (
                  <CategorySkeletonItem key={`sidebar-loadmore-skeleton-${i}`} />
                ))}
              </View>
            ) : null
          }
        />
      </View>

      {/* Right Grid - Products List */}
      <View style={styles.rightPanel}>
        {selectedCategory || isCategoriesLoading ? (
          <FlatList
            data={displayedProducts}
            keyExtractor={(item) => item._id}
            numColumns={2}
            columnWrapperStyle={styles.columnWrapper}
            contentContainerStyle={styles.rightPanelContent}
            onRefresh={handleRefreshProducts}
            refreshing={isProductsFetching && page === 1 && !isProductsLoading}
            ListHeaderComponent={
              <View style={styles.rightPanelHeader}>
                <Text
                  variant="lg"
                  weight="bold"
                  color={colors.text}
                  style={styles.categoryTitle}
                >
                  {isCategoriesLoading
                    ? "All Products"
                    : selectedCategory?.name === "None"
                      ? "All Products"
                      : selectedCategory?.name}
                </Text>
                {!isProductsLoading && !isCategoriesLoading && (
                  <Text
                    variant="xs"
                    color={colors.textMuted}
                    style={styles.productCount}
                  >
                    {productsData?.total || productsList.length}{" "}
                    {(productsData?.total || productsList.length) === 1
                      ? "product"
                      : "products"}{" "}
                    available
                  </Text>
                )}
              </View>
            }
            renderItem={({ item }) => {
              if ("isSkeleton" in item) {
                return <ProductSkeletonCard width={CARD_WIDTH} />;
              }
              return (
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
              );
            }}
            ListFooterComponent={
              isProductsFetching && page > 1 ? (
                <ProductSkeletonFooter
                  count={PRODUCT_PAGINATION.CATEGORY_LIMIT}
                  cardWidth={CARD_WIDTH}
                />
              ) : hasMore && productsList.length > 0 ? (
                <View style={styles.loadMoreProductsWrapper}>
                  <Button
                    title="Load More Products"
                    onPress={handleLoadMore}
                    loading={isProductsFetching}
                    icon="chevron-down-outline"
                    variant="outline"
                    style={{
                      height: 40,
                      borderRadius: 20,
                    }}
                  />
                </View>
              ) : null
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons
                  name="basket-outline"
                  size={48}
                  color={colors.textMuted}
                />
                <Text variant="md" weight="semibold" style={styles.emptyTitle}>
                  No Products Found
                </Text>
                <Text
                  variant="sm"
                  color={colors.textMuted}
                  align="center"
                  style={styles.emptySubtitle}
                >
                  There are no products available matching this query.
                </Text>
              </View>
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
  loadMoreSidebarBtn: {
    paddingVertical: SPACING.md,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: BORDER_RADIUS.sm,
    marginVertical: SPACING.xs,
    marginHorizontal: SPACING.xs,
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
  loadMoreProductsWrapper: {
    marginVertical: SPACING.md,
    alignItems: "stretch",
    paddingHorizontal: SPACING.xs,
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
