import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, usePathname } from "expo-router";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/src/store/store";
import { useTheme } from "@/src/shared/providers/ThemeProvider";
import { Text } from "@/src/shared/ui/Text";
import { SPACING, BORDER_RADIUS } from "@/src/shared/constants/spacing";
import { setSearchQuery } from "@/src/features/search/store/searchSlice";
import { useLocation } from "@/src/features/location/hooks/useLocation";
import { LocationBottomSheet } from "@/src/features/location/components/LocationBottomSheet";
import { COUPON_PAGINATION } from "@/src/features/coupons/config/pagination";
import { couponsApi } from "@/src/features/coupons/api/couponsApi";
import { Coupon } from "@/src/features/coupons/types/coupon.types";
import { CouponSkeleton } from "@/src/shared/ui/Skeleton";

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

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [couponPage, setCouponPage] = useState(1);
  const [hasMoreCoupons, setHasMoreCoupons] = useState(true);
  const [loadingCoupons, setLoadingCoupons] = useState(true);

  const loadCoupons = async (pageNum: number, isAppend = false) => {
    setLoadingCoupons(true);
    try {
      const res = await couponsApi.getCoupons({
        page: pageNum,
        limit: COUPON_PAGINATION.HEADER_LIMIT,
      });
      const fetchedCoupons = res?.coupons || [];
      if (isAppend) {
        setCoupons((prev) => {
          const existingIds = new Set(prev.map((c) => c._id));
          const uniqueNew = fetchedCoupons.filter(
            (c) => !existingIds.has(c._id),
          );
          return [...prev, ...uniqueNew];
        });
      } else {
        setCoupons(fetchedCoupons);
      }
      setHasMoreCoupons(res?.pagination?.hasNextPage ?? false);

      /*
      Case 1: Backend me total 5 coupons hain.
Humne Page 1 request kiya (limit = 2).
API ne hume 2 coupons laakar diye (fetchedCoupons.length is 2).
Check hua: 2 === 2 (jo ki true hai).
setHasMoreCoupons(true) run hoga -> App me "Load More Offers ⚡" button dikhega kyuki abhi aur data bacha hai.
Case 2: Backend me total sirf 1 coupon hai.
Humne Page 1 request kiya (limit = 2).
API ne hume sirf 1 coupon diya (fetchedCoupons.length is 1).
Check hua: 1 === 2 (jo ki false hai).
setHasMoreCoupons(false) run hoga -> "Load More Offers ⚡" button screen se chhip (hide) jayega kyuki backend me aur coupons nahi bache.
      */
    } catch (err) {
      console.log("Failed to load coupons:", err);
    } finally {
      setLoadingCoupons(false);
    }
  };

  useEffect(() => {
    loadCoupons(1, false);
  }, []);

  const handleLoadMoreCoupons = async () => {
    if (!loadingCoupons && hasMoreCoupons) {
      const nextPage = couponPage + 1;
      setCouponPage(nextPage);
      await loadCoupons(nextPage, true);
    }
  };

  const activeCoupons = useMemo(() => {
    const now = new Date();
    return coupons.filter((c) => new Date(c.endDate) > now);
  }, [coupons]);

  const promoItems = useMemo(() => {
    const items: Array<
      | { type: "coupon"; id: string; code: string; discount: number }
      | { type: "load_more"; id: string; code: string; discount: number }
    > = activeCoupons.map((c) => ({
      type: "coupon",
      id: c._id,
      code: c.code,
      discount: c.discount,
    }));

    if (hasMoreCoupons) {
      items.push({
        type: "load_more",
        id: "load_more",
        code: "LOAD MORE",
        discount: 0,
      });
    }
    return items;
  }, [activeCoupons, hasMoreCoupons]);

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

      {/* Row 2: Search Input (Hidden on Cart and Profile Screens) */}
      {pathname !== "/cart" && pathname !== "/profile" && (
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
      )}

      {/* Skeletons ki count 

pagination.ts
 file ke COUPON_PAGINATION.HEADER_LIMIT constant ke basis par decide hoti hai.

Abhi aapne us file me use HEADER_LIMIT: 2 kiya hai:

Code logic: */}

      {/* CustomHeader.tsx
 me humne yeh code likha hai:

typescript
Array.from({ length: COUPON_PAGINATION.HEADER_LIMIT }).map((_, i) => (
  <CouponSkeleton key={`coupon-skeleton-${i}`} />
))
Yeh kaise kaam karta hai?
Array.from({ length: 2 }) se React Native memory me 2 empty items ka ek list/array bana deta hai.
Uske baad .map(...) loop us array par chalta hai aur har empty item ke liye ek <CouponSkeleton /> render karta hai.
Result: Agar limit 2 hai toh exact 2 skeletons load hote hain. Agar aap HEADER_LIMIT ko badal kar 5 ya 1 karenge, toh skeletons ki count bhi usi ke mutabik automatically badal jayegi. */}

      {/* Row 3: Promo / Coupon Horizontal Carousel */}
      <View style={styles.promoWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.promoScroll}
        >
          {loadingCoupons && coupons.length === 0 ? (
            Array.from({ length: COUPON_PAGINATION.HEADER_LIMIT }).map(
              (_, i) => <CouponSkeleton key={`coupon-skeleton-${i}`} />,
            )
          ) : (
            <>
              {promoItems.map((item, index) => {
                if (item.type === "load_more") {
                  if (loadingCoupons) return null;
                  return (
                    <TouchableOpacity
                      key={item.id || index}
                      onPress={handleLoadMoreCoupons}
                      activeOpacity={0.7}
                      style={[
                        styles.promoPill,
                        {
                          backgroundColor: isDark
                            ? "rgba(99, 102, 241, 0.15)"
                            : "#e0e7ff",
                          borderColor: colors.primary,
                          borderWidth: 1,
                          marginRight: SPACING.sm,
                        },
                      ]}
                    >
                      <Ionicons
                        name="chevron-forward-circle"
                        size={12}
                        color={colors.primary}
                        style={{ marginRight: 6 }}
                      />
                      <Text variant="xs" weight="bold" color={colors.primary}>
                        Load More Offers ⚡
                      </Text>
                    </TouchableOpacity>
                  );
                } else if (item.type === "coupon") {
                  return (
                    <View
                      key={item.id || index}
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
                }
              })}
              {loadingCoupons && (
                Array.from({ length: COUPON_PAGINATION.HEADER_LIMIT }).map((_, i) => (
                  <CouponSkeleton key={`header-coupon-loadmore-skeleton-${i}`} />
                ))
              )}
            </>
          )}
        </ScrollView>
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
