import React, { useState, useMemo } from "react";
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
import { useLocation } from "@/src/features/location/hooks/useLocation";
import { LocationBottomSheet } from "@/src/features/location/components/LocationBottomSheet";
import { AutoScrollingList } from "@/src/shared/ui/AutoScrollingList";

export function CustomHeader() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch();
  const [isLocationSheetVisible, setIsLocationSheetVisible] = useState(false);
  const { selectedLocation } = useLocation();

  const searchQuery = useSelector((state: RootState) => state.search.query);
  const wishlistItems = useSelector((state: RootState) => state.wishlist.items);

  // Fetch active coupon code from backend Coupon API
  const { data: couponsData } = useCoupons();
  const coupons = couponsData?.coupons || [];
  const activeCoupons = useMemo(() => {
    const now = new Date();
    return coupons.filter((c) => new Date(c.endDate) > now);
  }, [coupons]);

  // Combine coupons and free delivery banner for auto scrolling
  const promoItems = useMemo(() => {
    const items = activeCoupons.map((c) => ({
      type: "coupon" as const,
      id: c._id,
      code: c.code,
      discount: c.discount,
    }));

    // items.push({
    //   type: "free_delivery" as const,
    //   id: "free_delivery",
    //   code: "",
    //   discount: 0,
    // });

    return items;
  }, [activeCoupons]);

  const handleSearchChange = (text: string) => {
    dispatch(setSearchQuery(text));

    // Redirect to home catalog if on a non-searchable screen
    if (pathname !== "/" && pathname !== "/categories") {
      router.push("/");
    }
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.surface, borderBottomColor: colors.border },
      ]}
    >
      {/* Status Bar Spacer */}
      <View style={{ height: insets.top, backgroundColor: colors.surface }} />

      {/* Row 1: Location & Wishlist */}
      <View style={styles.topRow}>
        {/* Location Selector (Left) */}
        <TouchableOpacity
          onPress={() => setIsLocationSheetVisible(true)}
          style={styles.locationSelector}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.iconCircle,
              {
                backgroundColor: isDark
                  ? "rgba(99, 102, 241, 0.15)"
                  : "#e0e7ff",
              },
            ]}
          >
            <Ionicons name="location" size={18} color={colors.primary} />
          </View>
          <View style={styles.locationTextWrapper}>
            <Text variant="xs" weight="medium" color={colors.textMuted}>
              Deliver to
            </Text>
            <View style={styles.cityRow}>
              <Text
                variant="sm"
                weight="bold"
                color={colors.text}
                numberOfLines={1}
              >
                {selectedLocation
                  ? `${selectedLocation.city}, ${selectedLocation.state}`
                  : "Select Location"}
              </Text>
              <Ionicons
                name="chevron-down"
                size={12}
                color={colors.textMuted}
                style={{ marginLeft: 2 }}
              />
            </View>
          </View>
        </TouchableOpacity>

        {/* Wishlist Button (Right) */}
        <TouchableOpacity
          onPress={() => router.push("/wishlist")}
          style={[
            styles.wishlistCircle,
            { backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#f1f5f9" },
          ]}
          activeOpacity={0.7}
        >
          <Ionicons name="heart" size={20} color={colors.error} />
          {wishlistItems.length > 0 && (
            <View style={[styles.badge, { backgroundColor: colors.primary }]}>
              <Text
                variant="xs"
                weight="bold"
                color="#ffffff"
                style={styles.badgeText}
              >
                {wishlistItems.length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Row 2: Search Input */}
      <View style={styles.searchRow}>
        <View style={[styles.searchBox, { backgroundColor: colors.inputBg }]}>
          <Ionicons
            name="search-outline"
            size={18}
            color={colors.inputPlaceholder}
            style={styles.searchIcon}
          />
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
              <Ionicons
                name="close-circle"
                size={16}
                color={colors.inputPlaceholder}
                style={styles.clearIcon}
              />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Row 3: Promo / Coupon Horizontal Carousel */}
      <View style={styles.promoWrapper}>
        <AutoScrollingList
          data={promoItems}
          contentContainerStyle={styles.promoScroll}
          renderItem={(item) => {
            if (item.type === "coupon") {
              return (
                <View
                  style={[
                    styles.promoPill,
                    {
                      backgroundColor: isDark
                        ? "rgba(16, 185, 129, 0.1)"
                        : "#ecfdf5",
                      borderColor: isDark
                        ? "rgba(16, 185, 129, 0.2)"
                        : "#d1fae5",
                      borderWidth: 1,
                      marginRight: SPACING.sm,
                    },
                  ]}
                >
                  <Ionicons
                    name="pricetag"
                    size={12}
                    color={isDark ? "#34d399" : "#059669"}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    variant="xs"
                    weight="bold"
                    color={isDark ? "#34d399" : "#059669"}
                  >
                    Code {item.code.toUpperCase()}: Get {item.discount}% OFF
                  </Text>
                </View>
              );
            } else {
              return (
                <View
                  style={[
                    styles.promoPill,
                    {
                      backgroundColor: isDark
                        ? "rgba(99, 102, 241, 0.08)"
                        : "#eff6ff",
                      borderColor: isDark
                        ? "rgba(99, 102, 241, 0.15)"
                        : "#dbeafe",
                      borderWidth: 1,
                      marginRight: SPACING.sm,
                    },
                  ]}
                >
                  <Ionicons
                    name="gift-outline"
                    size={12}
                    color={colors.primary}
                    style={{ marginRight: 6 }}
                  />
                  <Text variant="xs" weight="bold" color={colors.primary}>
                    Free delivery on orders over $50!
                  </Text>
                </View>
              );
            }
          }}
        />
      </View>

      {/* Location Bottom Sheet */}
      <LocationBottomSheet
        visible={isLocationSheetVisible}
        onClose={() => setIsLocationSheetVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    borderBottomWidth: 1,
    paddingBottom: SPACING.sm,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  locationSelector: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: SPACING.md,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  locationTextWrapper: {
    marginLeft: SPACING.sm,
    flex: 1,
  },
  cityRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 1,
  },
  wishlistCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  badge: {
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
  searchRow: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    height: 42,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.sm,
    width: "100%",
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    height: "100%",
    fontSize: 14,
    padding: 0,
  },
  clearIcon: {
    marginLeft: 4,
  },
  promoWrapper: {
    paddingHorizontal: SPACING.md,
    marginTop: 2,
    alignItems: "flex-start",
  },
  promoScroll: {
    alignItems: "center",
    paddingVertical: 2,
  },
  promoPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.md,
    paddingVertical: 5,
    borderRadius: BORDER_RADIUS.round,
  },
});

export default CustomHeader;
