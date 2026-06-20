import React from "react";
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
import { Loader } from "@/src/shared/ui/Loader";
import { SPACING } from "@/src/shared/constants/spacing";
import { useRouter } from "expo-router";
import { useProducts } from "@/src/features/products/hooks/useProducts";
import { useCategories } from "@/src/features/categories/hooks/useCategories";
import { ProductCard } from "@/src/features/products/components/ProductCard";
import { AuthRequiredModal } from "@/src/features/auth/components/AuthRequiredModal";
import { Product } from "@/src/features/products/types/product.types";
import { ENV } from "@/src/config/env";

export default function Home() {
  const { colors, toggleTheme, theme, isDark } = useTheme();
  const { user, isAuthenticated } = useCurrentUser();
  const { logout } = useLogout();
  const router = useRouter();

  // Search filter from Redux store
  const search = useSelector((state: RootState) => state.search.query);

  // TanStack query to fetch products
  const { data, isLoading, refetch, isFetching } = useProducts({
    name: search || undefined,
    limit: 20,
  });

  const products = data?.products || [];
  const displayedProducts = products.slice(0, 8);
  const hasMoreProducts = products.length > 8;

  // Fetch categories
  const { data: categoriesData } = useCategories();
  const categories = categoriesData?.categories || [];
  const displayedCategories = categories.length > 7 ? categories.slice(0, 6) : categories;
  const hasMoreCategories = categories.length > 7;

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
        onRefresh={refetch}
        refreshing={isFetching && !isLoading}
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
            {categories.length > 0 && !search && (
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
                  {displayedCategories.map((item) => {
                    const categoryImage = getCategoryImageUrl(item.image);
                    const displayName =
                      item.name.charAt(0).toUpperCase() + item.name.slice(1);
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
                  {hasMoreCategories && (
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
                        More
                      </Text>
                    </TouchableOpacity>
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
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            onPress={(prod) => {
              router.push({
                pathname: "/product/[id]",
                params: { id: prod._id },
              });
            }}
          />
        )}
        ListEmptyComponent={
          isLoading ? (
            <Loader />
          ) : (
            <View style={styles.emptyContainer}>
              <Text variant="md" color={colors.textMuted} align="center">
                No products found matching your search.
              </Text>
            </View>
          )
        }
        ListFooterComponent={
          hasMoreProducts ? (
            <View style={styles.footerContainer}>
              <Button
                title="Explore More Products"
                onPress={() => router.push("/categories")}
                icon="arrow-forward-outline"
                variant="outline"
                style={{ marginBottom: SPACING.md, height: 48, borderRadius: 24 }}
              />
            </View>
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
