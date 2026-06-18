import React, { useState, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity, FlatList, Dimensions } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
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
import { ENV } from "@/src/config/env";

const { width } = Dimensions.get("window");
const SIDEBAR_WIDTH = 100;
const PADDING = 12;
const RIGHT_PANEL_WIDTH = width - SIDEBAR_WIDTH;
const CARD_WIDTH = (RIGHT_PANEL_WIDTH - PADDING * 3) / 2;

export default function Categories() {
  const { colors, isDark } = useTheme();
  const router = useRouter();

  // Fetch categories using custom React Query hook
  const {
    data: categoriesData,
    isLoading: isCategoriesLoading,
    error: categoriesError,
    refetch: refetchCategories,
  } = useCategories();

  const categories = categoriesData?.categories || [];
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  // Set first category as default once loaded
  useEffect(() => {
    if (categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0]);
    }
  }, [categories, selectedCategory]);

  // Read global search query from Redux store
  const searchQuery = useSelector((state: RootState) => state.search.query);

  // Fetch products matching selected category and search filter
  const {
    data: productsData,
    isLoading: isProductsLoading,
    isFetching: isProductsFetching,
    refetch: refetchProducts,
  } = useProducts(
    selectedCategory
      ? {
          category: selectedCategory.name,
          name: searchQuery || undefined,
        }
      : undefined
  );

  const products = productsData?.products || [];

  // Helper to resolve absolute URLs or local dev server paths for category images
  const getCategoryImageUrl = (imagePath: string) => {
    if (!imagePath) return null;
    if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
      return { uri: imagePath };
    }
    const cleanPath = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;
    return { uri: `${ENV.API_URL}${cleanPath}` };
  };

  // Pull to refresh handler for products in selected category
  const handleRefreshProducts = () => {
    if (selectedCategory) {
      refetchProducts();
    }
  };

  // Rendering individual category item in the left sidebar
  const renderCategoryItem = ({ item }: { item: Category }) => {
    const isActive = selectedCategory?._id === item._id;
    const displayName = item.name.charAt(0).toUpperCase() + item.name.slice(1);
    const categoryImage = getCategoryImageUrl(item.image);

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        style={[
          styles.sidebarItem,
          {
            backgroundColor: isActive ? colors.primaryLight : "transparent",
          },
        ]}
        onPress={() => setSelectedCategory(item)}
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
          {categoryImage ? (
            <Image
              source={categoryImage}
              style={styles.categoryImage}
              contentFit="cover"
              transition={200}
              cachePolicy="disk"
            />
          ) : (
            <Ionicons name="grid-outline" size={20} color={colors.textMuted} />
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
      {/* Left Sidebar - Categories List */}
      <View style={[styles.sidebar, { backgroundColor: colors.surface, borderRightColor: colors.border }]}>
        <FlatList
          data={categories}
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
            data={products}
            keyExtractor={(item) => item._id}
            numColumns={2}
            columnWrapperStyle={styles.columnWrapper}
            contentContainerStyle={styles.rightPanelContent}
            onRefresh={handleRefreshProducts}
            refreshing={isProductsFetching && !isProductsLoading}
            ListHeaderComponent={
              <View style={styles.rightPanelHeader}>
                <Text variant="lg" weight="bold" color={colors.text} style={styles.categoryTitle}>
                  {selectedCategory.name}
                </Text>
                {!isProductsLoading && (
                  <Text variant="xs" color={colors.textMuted} style={styles.productCount}>
                    {products.length} {products.length === 1 ? "product" : "products"} available
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
                    There are no products in this category right now.
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
