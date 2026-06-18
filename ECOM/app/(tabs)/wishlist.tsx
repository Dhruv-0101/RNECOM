import React from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { useSelector } from "react-redux";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/shared/providers/ThemeProvider";
import { Text } from "@/src/shared/ui/Text";
import { Button } from "@/src/shared/ui/Button";
import { ProductCard } from "@/src/features/products/components/ProductCard";
import { RootState } from "@/src/store/store";
import { useRouter } from "expo-router";
import { SPACING } from "@/src/shared/constants/spacing";

export default function Wishlist() {
  const { colors } = useTheme();
  const router = useRouter();
  const wishlistItems = useSelector((state: RootState) => state.wishlist.items);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={wishlistItems}
        keyExtractor={(item) => item._id}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text variant="xxl" weight="bold">
              Wishlist
            </Text>
            <Text variant="sm" color={colors.textMuted}>
              {wishlistItems.length} {wishlistItems.length === 1 ? "item" : "items"} saved
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
          <View style={styles.emptyState}>
            <Ionicons name="heart-outline" size={48} color={colors.textMuted} />
            <Text variant="lg" weight="semibold" style={styles.emptyTitle}>
              Your Wishlist is Empty
            </Text>
            <Text variant="sm" color={colors.textMuted} align="center" style={styles.emptySubtitle}>
              Tap the heart icon on any product to save it here.
            </Text>
            <Button
              title="Explore Products"
              onPress={() => router.push("/")}
              style={styles.exploreBtn}
              icon="search-outline"
            />
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
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  columnWrapper: {
    justifyContent: "space-between",
  },
  header: {
    marginBottom: SPACING.lg,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },
  emptyTitle: {
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  emptySubtitle: {
    marginBottom: SPACING.xl,
    paddingHorizontal: SPACING.xl,
  },
  exploreBtn: {
    minWidth: 180,
  },
});
