import React, { useState } from "react";
import { StyleSheet, View, FlatList } from "react-native";
import { useDispatch } from "react-redux";
import { useTheme } from "@/src/shared/providers/ThemeProvider";
import { useCurrentUser } from "@/src/features/auth/hooks/useCurrentUser";
import { useLogout } from "@/src/features/auth/hooks/useLogout";
import { Text } from "@/src/shared/ui/Text";
import { Button } from "@/src/shared/ui/Button";
import { Card } from "@/src/shared/ui/Card";
import { Input } from "@/src/shared/ui/Input";
import { Loader } from "@/src/shared/ui/Loader";
import { SPACING } from "@/src/shared/constants/spacing";
import { useRouter } from "expo-router";
import { useProducts } from "@/src/features/products/hooks/useProducts";
import { ProductCard } from "@/src/features/products/components/ProductCard";
import { ProductOptionsModal } from "@/src/features/products/components/ProductOptionsModal";
import { AuthRequiredModal } from "@/src/features/auth/components/AuthRequiredModal";
import { addToCart } from "@/src/features/cart/store/cartSlice";
import { AppDispatch } from "@/src/store/store";
import { Product } from "@/src/features/products/types/product.types";

export default function Home() {
  const { colors, toggleTheme, theme } = useTheme();
  const { user, isAuthenticated } = useCurrentUser();
  const { logout } = useLogout();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  // Search filter state
  const [search, setSearch] = useState("");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedQuantity, setSelectedQuantity] = useState(1);

  // TanStack query to fetch products
  const { data, isLoading, refetch, isFetching } = useProducts({
    name: search || undefined,
  });

  const products = data?.products || [];

  const handleAddToCart = (product: Product, quantity: number) => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    setSelectedProduct(product);
    setSelectedQuantity(quantity);
  };

  const confirmAddToCart = (options: { color: string; size: string; quantity: number }) => {
    if (!selectedProduct) return;

    dispatch(addToCart({ product: selectedProduct, ...options }));
    setSelectedProduct(null);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AuthRequiredModal visible={showAuthModal} onClose={() => setShowAuthModal(false)} />
      <ProductOptionsModal
        visible={Boolean(selectedProduct)}
        product={selectedProduct}
        quantity={selectedQuantity}
        onQuantityChange={setSelectedQuantity}
        onClose={() => setSelectedProduct(null)}
        onConfirm={confirmAddToCart}
      />
      <FlatList
        data={products}
        keyExtractor={(item) => item._id}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.scrollContent}
        onRefresh={refetch}
        refreshing={isFetching && !isLoading}
        ListHeaderComponent={
          <View style={styles.headerContainer}>
            {/* Greetings Banner */}
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
            )}

            {/* Quick Guest CTA if not logged in */}
            {!isAuthenticated && (
              <Card style={styles.card}>
                <Text variant="lg" weight="semibold" style={styles.cardTitle}>
                  Guest Account
                </Text>
                <Text variant="sm" color={colors.textMuted} style={{ marginBottom: SPACING.md }}>
                  Sign in to customize your catalog, save items to your wishlist, and checkout with easy payments.
                </Text>
                <Button
                  title="Sign In / Register"
                  onPress={() => router.push("/login")}
                  icon="log-in-outline"
                />
              </Card>
            )}

            {/* Search Input Filter */}
            <Input
              placeholder="Search products, brands, or categories..."
              value={search}
              onChangeText={setSearch}
              leftIcon="search-outline"
              clearButtonMode="while-editing"
              containerStyle={styles.searchBar}
            />

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
            onAddToCart={handleAddToCart}
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
          <View style={styles.footerContainer}>
            <Button
              title={`Switch to ${theme === "light" ? "Dark" : "Light"} Mode`}
              onPress={toggleTheme}
              variant="outline"
              icon={theme === "light" ? "moon-outline" : "sunny-outline"}
              style={styles.actionBtn}
            />

            {isAuthenticated && (
              <Button
                title="Sign Out"
                onPress={logout}
                variant="primary"
                icon="log-out-outline"
                style={[styles.actionBtn, { backgroundColor: colors.error }]}
              />
            )}
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
