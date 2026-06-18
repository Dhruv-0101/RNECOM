import React from "react";
import { View, StyleSheet, TouchableOpacity, TextInput } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, usePathname } from "expo-router";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/src/store/store";
import { useTheme } from "@/src/shared/providers/ThemeProvider";
import { Text } from "@/src/shared/ui/Text";
import { SPACING, BORDER_RADIUS } from "@/src/shared/constants/spacing";
import { setSearchQuery } from "@/src/features/search/store/searchSlice";
import { useCoupons } from "@/src/features/coupons/hooks/useCoupons";

export function CustomHeader() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch();

  const searchQuery = useSelector((state: RootState) => state.search.query);
  const wishlistItems = useSelector((state: RootState) => state.wishlist.items);

  // Fetch active coupon code from backend Coupon API
  const { data: couponsData } = useCoupons();
  const coupons = couponsData?.coupons || [];
  const activeCoupon = coupons.length > 0 ? coupons[0] : null;

  const handleSearchChange = (text: string) => {
    dispatch(setSearchQuery(text));
    
    // If user is on a non-searchable screen (like Cart, Profile, or inside wishlist),
    // redirect them to the home screen catalog page so they can see the filtered results.
    if (pathname !== "/" && pathname !== "/categories") {
      router.push("/");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      {/* Status Bar Spacer */}
      <View style={{ height: insets.top, backgroundColor: colors.surface }} />

      {/* 1. Offer Banner (Below status bar) */}
      <View
        style={[
          styles.offerBanner,
          {
            backgroundColor: isDark ? "#78350f" : "#fef3c7",
            paddingVertical: 6,
          },
        ]}
      >
        <Text
          variant="xs"
          weight="bold"
          color={isDark ? "#fef3c7" : "#b45309"}
          align="center"
          numberOfLines={1}
        >
          {activeCoupon
            ? `🔥 Use coupon code ${activeCoupon.code.toUpperCase()} for ${activeCoupon.discount}% OFF!`
            : "🎉 SPECIAL OFFER: FREE SHIPPING ON ALL ORDERS OVER $50!"}
        </Text>
      </View>

      {/* 2. Main Row containing Search Input and Wishlist Access Button */}
      <View
        style={[
          styles.mainHeader,
          {
            borderBottomColor: colors.border,
          },
        ]}
      >
        {/* Rounded Input Box */}
        <View style={[styles.searchContainer, { backgroundColor: colors.inputBg }]}>
          <Ionicons name="search-outline" size={18} color={colors.inputPlaceholder} style={styles.searchIcon} />
          <TextInput
            placeholder="Search products..."
            placeholderTextColor={colors.inputPlaceholder}
            value={searchQuery}
            onChangeText={handleSearchChange}
            style={[styles.searchInput, { color: colors.text }]}
            clearButtonMode="while-editing"
            autoCapitalize="none"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => dispatch(setSearchQuery(""))}>
              <Ionicons name="close-circle" size={16} color={colors.inputPlaceholder} style={styles.clearIcon} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Wishlist Icon Button */}
        <TouchableOpacity
          onPress={() => router.push("/wishlist")}
          style={[styles.wishlistButton, { backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#f1f5f9" }]}
          activeOpacity={0.7}
        >
          <Ionicons name="heart" size={20} color={colors.error} />
          {wishlistItems.length > 0 && (
            <View style={[styles.badgeContainer, { backgroundColor: colors.primary }]}>
              <Text variant="xs" weight="bold" color="#ffffff" style={styles.badgeText}>
                {wishlistItems.length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  offerBanner: {
    width: "100%",
    paddingBottom: 6,
    paddingHorizontal: SPACING.md,
    justifyContent: "center",
    alignItems: "center",
  },
  mainHeader: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.sm,
    marginRight: SPACING.sm,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    height: "100%",
    fontSize: 14,
    padding: 0, // Reset default Android inputs padding
  },
  clearIcon: {
    marginLeft: 4,
  },
  wishlistButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.round,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  badgeContainer: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeText: {
    fontSize: 9,
    lineHeight: 11,
  },
});

export default CustomHeader;
