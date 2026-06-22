import React, { useMemo, useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  FlatList,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useSelector } from "react-redux";
import { RootState } from "@/src/store/store";
import { useTheme } from "@/src/shared/providers/ThemeProvider";
import { useCurrentUser } from "@/src/features/auth/hooks/useCurrentUser";
import { useLogout } from "@/src/features/auth/hooks/useLogout";
import { Text } from "@/src/shared/ui/Text";
import { Button } from "@/src/shared/ui/Button";
import { Card } from "@/src/shared/ui/Card";
import { SPACING } from "@/src/shared/constants/spacing";
import { useRouter } from "expo-router";
import { useProducts } from "@/src/features/products/hooks/useProducts";
import { useCategories } from "@/src/features/categories/hooks/useCategories";
import { ProductCard } from "@/src/features/products/components/ProductCard";
import {
  ProductSkeletonCard,
  CategorySkeletonItem,
  ProductSkeletonFooter,
} from "@/src/shared/ui/Skeleton";
import { Product } from "@/src/features/products/types/product.types";
import { Category } from "@/src/features/categories/types/category.types";
import { ENV } from "@/src/config/env";
import { PRODUCT_PAGINATION } from "@/src/features/products/config/pagination";
import { CATEGORY_PAGINATION } from "@/src/features/categories/config/pagination";

export default function Home() {
  const { colors, isDark } = useTheme();
  const { isAuthenticated } = useCurrentUser();
  const router = useRouter();

  // Search filter from Redux store
  const search = useSelector((state: RootState) => state.search.query);

  const [currentProductPage, setCurrentProductPage] = useState(1);
  const [productsList, setProductsList] = useState<Product[]>([]);

  const [currentCategoryPage, setCurrentCategoryPage] = useState(1);
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);

  // Reset pagination when search query changes
  useEffect(() => {
    setCurrentProductPage(1);
    setCurrentCategoryPage(1);
    setProductsList([]);
    setCategoriesList([]);
  }, [search]);

  // TanStack query to fetch products
  const { data, isLoading, refetch, isFetching } = useProducts({
    name: search || undefined,
    page: currentProductPage,
    limit: PRODUCT_PAGINATION.HOME_TRENDING_LIMIT,
  });

  // Sync server products into local state
  useEffect(() => {
    if (data?.products) {
      const fetchedProducts = data.products;
      if (currentProductPage === 1) {
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
    }
  }, [data, currentProductPage]);

  // Fetch categories
  const {
    data: categoriesData,
    isLoading: isCategoriesLoading,
    isFetching: isCategoriesFetching,
    refetch: refetchCategories,
  } = useCategories({
    page: currentCategoryPage,
    limit: CATEGORY_PAGINATION.HOME_SLIDER_LIMIT,
  });

  // Sync server categories into local state
  useEffect(() => {
    if (categoriesData?.categories) {
      const fetchedCategories = categoriesData.categories;
      if (currentCategoryPage === 1) {
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
    }
  }, [categoriesData, currentCategoryPage]);

  const dummyCategorySkeletons = useMemo(
    () =>
      Array.from(
        { length: CATEGORY_PAGINATION.HOME_SLIDER_LIMIT },
        (_, i) =>
          ({
            _id: `cat-skeleton-${i}`,
            isSkeleton: true,
          }) as unknown as Category,
      ),
    [],
  );

  const displayedCategories =
    (isCategoriesLoading || isCategoriesFetching) && categoriesList.length === 0
      ? dummyCategorySkeletons
      : categoriesList;

  const dummySkeletons = useMemo(
    () =>
      Array.from(
        { length: PRODUCT_PAGINATION.HOME_TRENDING_LIMIT },
        (_, i) =>
          ({ _id: `skeleton-${i}`, isSkeleton: true }) as unknown as Product,
      ),
    [],
  );
  const displayedProducts =
    (isLoading || isFetching) && productsList.length === 0
      ? dummySkeletons
      : productsList;

  const hasMoreToLoad =
    productsList.length > 0 &&
    productsList.length < 12 &&
    (data?.pagination?.hasNextPage ?? false);

  const shouldShowExplore =
    productsList.length > 0 &&
    (productsList.length >= 12 ||
      !(data?.pagination?.hasNextPage ?? false));

  const hasMoreCategoriesToLoad =
    categoriesList.length > 0 &&
    categoriesList.length < 10 &&
    (categoriesData?.pagination?.hasNextPage ?? false);

  const shouldShowExploreCategories =
    categoriesList.length > 0 &&
    (categoriesList.length >= 10 ||
      !(categoriesData?.pagination?.hasNextPage ?? false));

  const handleRefresh = async () => {
    try {
      await Promise.all([
        currentProductPage === 1 ? refetch() : Promise.resolve(setCurrentProductPage(1)),
        currentCategoryPage === 1 ? refetchCategories() : Promise.resolve(setCurrentCategoryPage(1)),
      ]);
    } catch (err) {
      console.log("Error during pull-to-refresh:", err);
    }
  };

  const getCategoryImageUrl = (imagePath: string) => {
    if (!imagePath) return null;
    if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
      return { uri: imagePath };
    }
    const cleanPath = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;
    return { uri: `${ENV.API_URL}${cleanPath}` };
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={displayedProducts}
        keyExtractor={(item) => item._id}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.scrollContent}
        onRefresh={handleRefresh}
        refreshing={isFetching && currentProductPage === 1 && !isLoading}
        ListHeaderComponent={
          <View style={styles.headerContainer}>
            {/* Greetings Banner
            {isAuthenticated ? (
              <View style={styles.header}>
                <Text variant="xxl" weight="bold">
                  Hello, {user?.fullname || "Shopper"}! 👋
                </Text>
                <Text variant="sm" color={colors.textMuted}>
                  Welcome to your premium e-commerce app
                </Text>
              </View>
            ) : (
              <View style={styles.header}>
                <Text variant="xxl" weight="bold">
                  Welcome to E-Shop! 🛍️
                </Text>
                <Text variant="sm" color={colors.textMuted}>
                  Discover the best brands and products
                </Text>
              </View>
            )} */}

            {/* Quick Guest CTA if not logged in */}
            {!isAuthenticated && (
              <Card style={styles.card}>
                <Text variant="lg" weight="semibold" style={styles.cardTitle}>
                  Guest Account
                </Text>
                <Text
                  variant="sm"
                  color={colors.textMuted}
                  style={{ marginBottom: SPACING.md }}
                >
                  Sign in to customize your catalog, save items to your
                  wishlist, and checkout with easy payments.
                </Text>
                <Button
                  title="Sign In / Register"
                  onPress={() => router.push("/login")}
                  icon="log-in-outline"
                />
              </Card>
            )}

            {/* Horizontal Categories */}
            {(isCategoriesLoading || categoriesList.length > 0) && !search && (
              <View style={styles.categoriesSection}>
                <Text
                  variant="md"
                  weight="bold"
                  style={styles.categoriesSectionTitle}
                >
                  Shop by Category
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.categoriesScroll}
                >
                  {(isCategoriesLoading || isCategoriesFetching) &&
                  categoriesList.length === 0 ? (
                    Array.from({
                      length: CATEGORY_PAGINATION.HOME_SLIDER_LIMIT,
                    }).map((_, i) => (
                      <CategorySkeletonItem key={`cat-skeleton-${i}`} />
                    ))
                  ) : (
                    <>
                      {displayedCategories.map((item) => {
                        if ("isSkeleton" in item) {
                          return <CategorySkeletonItem key={item._id} />;
                        }
                        const categoryImage = getCategoryImageUrl(item.image);
                        const displayName =
                          item.name.charAt(0).toUpperCase() +
                          item.name.slice(1);
                        return (
                          <TouchableOpacity
                            key={item._id}
                            activeOpacity={0.75}
                            style={styles.categoryItem}
                            onPress={() => {
                              router.push({
                                pathname: "/categories",
                                params: { category: item.name },
                              });
                            }}
                          >
                            <View
                              style={[
                                styles.categoryImageWrapper,
                                {
                                  backgroundColor: isDark
                                    ? colors.surface
                                    : "#f1f5f9",
                                  borderColor: colors.border,
                                },
                              ]}
                            >
                              {categoryImage ? (
                                <Image
                                  source={categoryImage}
                                  style={styles.categoryImage}
                                  contentFit="cover"
                                />
                              ) : (
                                <Ionicons
                                  name="grid-outline"
                                  size={20}
                                  color={colors.textMuted}
                                />
                              )}
                            </View>
                            <Text
                              variant="xs"
                              weight="semibold"
                              color={colors.text}
                              align="center"
                              numberOfLines={1}
                              style={styles.categoryName}
                            >
                              {displayName}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}

                      {isCategoriesFetching &&
                        currentCategoryPage > 1 &&
                        Array.from({
                          length: CATEGORY_PAGINATION.HOME_SLIDER_LIMIT,
                        }).map((_, i) => (
                          <CategorySkeletonItem
                            key={`cat-loading-skeleton-${i}`}
                          />
                        ))}

                      {!isCategoriesFetching && hasMoreCategoriesToLoad && (
                        <TouchableOpacity
                          activeOpacity={0.75}
                          style={styles.categoryItem}
                          onPress={() => {
                            setCurrentCategoryPage((p) => p + 1);
                          }}
                        >
                          <View
                            style={[
                              styles.categoryImageWrapper,
                              {
                                backgroundColor: isDark
                                  ? colors.surface
                                  : "#f8fafc",
                                borderColor: colors.primary,
                                borderWidth: 1.5,
                              },
                            ]}
                          >
                            <Ionicons
                              name="chevron-forward"
                              size={24}
                              color={colors.primary}
                            />
                          </View>
                          <Text
                            variant="xs"
                            weight="semibold"
                            color={colors.primary}
                            align="center"
                            numberOfLines={1}
                            style={styles.categoryName}
                          >
                            Load More
                          </Text>
                        </TouchableOpacity>
                      )}

                      {!isCategoriesFetching && shouldShowExploreCategories && (
                        <TouchableOpacity
                          activeOpacity={0.75}
                          style={styles.categoryItem}
                          onPress={() => {
                            router.push("/categories");
                          }}
                        >
                          <View
                            style={[
                              styles.categoryImageWrapper,
                              {
                                backgroundColor: isDark
                                  ? colors.surface
                                  : "#eff6ff",
                                borderColor: colors.primary,
                                borderWidth: 1.5,
                              },
                            ]}
                          >
                            <Ionicons
                              name="chevron-forward"
                              size={24}
                              color={colors.primary}
                            />
                          </View>
                          <Text
                            variant="xs"
                            weight="semibold"
                            color={colors.primary}
                            align="center"
                            numberOfLines={1}
                            style={styles.categoryName}
                          >
                            Explore
                          </Text>
                        </TouchableOpacity>
                      )}
                    </>
                  )}
                </ScrollView>
              </View>
            )}

            {/* Section Title */}
            <Text variant="lg" weight="bold" style={styles.sectionTitle}>
              {search ? `Search Results for "${search}"` : "Trending Products"}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          if ("isSkeleton" in item) {
            return <ProductSkeletonCard />;
          }
          return (
            <ProductCard
              product={item}
              onPress={(prod) => {
                router.push({
                  pathname: "/product/[id]",
                  params: { id: prod._id },
                });
              }}
            />
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text variant="md" color={colors.textMuted} align="center">
              No products found matching your search.
            </Text>
          </View>
        }
        ListFooterComponent={
          isFetching && currentProductPage > 1 ? (
            <ProductSkeletonFooter
              count={PRODUCT_PAGINATION.HOME_TRENDING_LIMIT}
            />
          ) : (
            <View style={styles.footerContainer}>
              {hasMoreToLoad && (
                <Button
                  title="Load More Products"
                  onPress={() => setCurrentProductPage((p) => p + 1)}
                  icon="chevron-down-outline"
                  variant="outline"
                  style={{
                    marginBottom: SPACING.md,
                    height: 48,
                    borderRadius: 24,
                  }}
                />
              )}
              {shouldShowExplore && (
                <Button
                  title="Explore More Products"
                  onPress={() => router.push("/categories")}
                  icon="arrow-forward-outline"
                  variant="outline"
                  style={{
                    marginBottom: SPACING.md,
                    height: 48,
                    borderRadius: 24,
                  }}
                />
              )}
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  categoriesSection: {
    marginVertical: SPACING.md,
  },
  categoriesSectionTitle: {
    marginBottom: SPACING.sm,
  },
  categoriesScroll: {
    paddingRight: SPACING.lg,
  },
  categoryItem: {
    alignItems: "center",
    marginRight: 18,
    width: 64,
  },
  categoryImageWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1.5,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  categoryImage: {
    width: "100%",
    height: "100%",
  },
  categoryName: {
    fontSize: 10,
    lineHeight: 12,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  columnWrapper: {
    justifyContent: "space-between",
  },
  headerContainer: {
    marginBottom: SPACING.md,
  },
  header: {
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
  },
  cardTitle: {
    marginBottom: SPACING.md,
  },
  card: {
    marginVertical: SPACING.md,
  },
  searchBar: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  emptyContainer: {
    paddingVertical: SPACING.xxl,
    alignItems: "center",
    justifyContent: "center",
  },
  footerContainer: {
    marginTop: SPACING.xl,
  },
  actionBtn: {
    marginVertical: SPACING.sm,
  },
});
