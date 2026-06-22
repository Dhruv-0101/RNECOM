import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { useTheme } from "@/src/shared/providers/ThemeProvider";
import { Text } from "@/src/shared/ui/Text";
import { Card } from "@/src/shared/ui/Card";
import { Input } from "@/src/shared/ui/Input";
import { Button } from "@/src/shared/ui/Button";
import { SPACING, BORDER_RADIUS } from "@/src/shared/constants/spacing";
import { CUSTOMER_PAGINATION } from "@/src/features/customers/config/pagination";
import { customersApi, Customer } from "@/src/features/customers/api/customersApi";
import { AdminCustomerSkeleton } from "@/src/shared/ui/Skeleton";

export default function AdminCustomers() {
  const { colors } = useTheme();
  const router = useRouter();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadCustomers = async (pageNum: number, searchVal: string, isAppend = false) => {
    setLoading(true);
    try {
      const res = await customersApi.getCustomers({
        page: pageNum,
        limit: CUSTOMER_PAGINATION.ADMIN_LIMIT,
        search: searchVal || undefined,
      });
      const fetchedCustomers = res.users || [];
      if (isAppend) {
        setCustomers((prev) => {
          const existingIds = new Set(prev.map((c) => c._id));
          const uniqueNew = fetchedCustomers.filter((c: any) => !existingIds.has(c._id));
          return [...prev, ...uniqueNew];
        });
      } else {
        setCustomers(fetchedCustomers);
      }

      setHasMore(res.pagination?.hasNextPage ?? false);
    } catch (err) {
      console.log("Failed to load customers list:", err);
      Alert.alert("Error", "Could not fetch customers list from backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setPage(1);
      setHasMore(true);
      loadCustomers(1, searchQuery, false);
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setPage(1);
    setHasMore(true);
    await loadCustomers(1, searchQuery, false);
    setRefreshing(false);
  };

  const handleLoadMore = async () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      await loadCustomers(nextPage, searchQuery, true);
    }
  };

  return (
    <View style={[styles.mainContainer, { backgroundColor: colors.background }]}>
      {/* Header bar */}
      <View style={[styles.viewHeader, { borderBottomColor: colors.border, backgroundColor: colors.surface }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back-outline" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text variant="lg" weight="bold" style={styles.headerTitle}>
          Customers Ledger
        </Text>
      </View>

      {/* Search Input Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Input
          placeholder="Search by customer name or email..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon="search-outline"
          containerStyle={styles.searchInputContainer}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {loading && !refreshing && customers.length > 0 && (
          <View style={styles.inlineLoader}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        )}

        {loading && !refreshing && customers.length === 0 ? (
          <View style={{ gap: SPACING.md }}>
            {Array.from({ length: CUSTOMER_PAGINATION.ADMIN_LIMIT }).map((_, i) => (
              <AdminCustomerSkeleton key={`admin-customer-initial-skeleton-${i}`} />
            ))}
          </View>
        ) : customers.length === 0 ? (
          <Text variant="sm" color={colors.textMuted} align="center" style={{ marginTop: SPACING.xxl }}>
            {searchQuery ? "No matching customers found." : "No customer transactions recorded in system yet."}
          </Text>
        ) : (
          <>
            {customers.map((cust, index) => (
              <Card key={cust._id || index} style={[styles.customerCard, { borderColor: colors.border }]}>
                <View style={styles.customerAvatarRow}>
                  <View style={[styles.avatarCircle, { backgroundColor: colors.primaryLight }]}>
                    <Text variant="sm" weight="bold" color={colors.primary}>
                      {cust.fullname ? cust.fullname[0].toUpperCase() : "C"}
                    </Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text variant="sm" weight="bold">
                      {cust.fullname}
                    </Text>
                    <Text variant="xs" color={colors.textMuted}>
                      {cust.email}
                    </Text>
                  </View>
                </View>

                {cust.shippingAddress ? (
                  <View style={[styles.custAddressContainer, { backgroundColor: colors.inputBg }]}>
                    <Text variant="xs" color={colors.textMuted}>
                      Address: {cust.shippingAddress.address || (cust.shippingAddress as any).streetAddress}, {cust.shippingAddress.city}
                    </Text>
                    <Text variant="xs" color={colors.textMuted} style={{ marginTop: 2 }}>
                      Region: {cust.shippingAddress.province || (cust.shippingAddress as any).state}, {cust.shippingAddress.country}
                    </Text>
                    <Text variant="xs" color={colors.textMuted} style={{ marginTop: 2 }}>
                      Phone: {cust.shippingAddress.phone || (cust.shippingAddress as any).recipientPhone}
                    </Text>
                  </View>
                ) : (
                  <Text variant="xs" color={colors.textMuted} style={{ marginTop: 8 }}>
                    No shipping address saved.
                  </Text>
                )}

                {/* Customer Orders & Spent Stats */}
                <View style={[styles.statsRow, { borderTopColor: colors.border }]}>
                  <View style={styles.statBlock}>
                    <Text variant="xxs" color={colors.textMuted}>Orders Placed</Text>
                    <Text variant="sm" weight="bold">{cust.totalOrders || 0}</Text>
                  </View>
                  <View style={styles.statBlock}>
                    <Text variant="xxs" color={colors.textMuted}>Total Amount Spent</Text>
                    <Text variant="sm" weight="bold" color={colors.primary}>${(cust.totalSpent || 0).toFixed(2)}</Text>
                  </View>
                </View>
              </Card>
            ))}
            {hasMore && !loading && (
              <Button
                title="Load More"
                onPress={handleLoadMore}
                loading={false}
                disabled={loading}
                variant="outline"
                style={{ marginTop: SPACING.md, height: 44, borderRadius: 22 }}
              />
            )}
            {loading && customers.length > 0 && (
              <View style={{ marginTop: SPACING.md, gap: SPACING.md }}>
                {Array.from({ length: CUSTOMER_PAGINATION.ADMIN_LIMIT }).map((_, i) => (
                  <AdminCustomerSkeleton key={`admin-customer-loadmore-skeleton-${i}`} />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  viewHeader: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    marginRight: SPACING.md,
  },
  headerTitle: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  inlineLoader: {
    marginVertical: SPACING.xs,
    alignItems: "center",
  },
  customerCard: {
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
  },
  customerAvatarRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  custAddressContainer: {
    marginTop: SPACING.md,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
  },
  searchContainer: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  searchInputContainer: {
    marginBottom: SPACING.md,
  },
  statsRow: {
    flexDirection: "row",
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: SPACING.lg,
  },
  statBlock: {
    flexDirection: "column",
  },
});
