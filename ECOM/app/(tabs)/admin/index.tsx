import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { useTheme } from "@/src/shared/providers/ThemeProvider";
import { Text } from "@/src/shared/ui/Text";
import { Card } from "@/src/shared/ui/Card";
import { SPACING, BORDER_RADIUS } from "@/src/shared/constants/spacing";
import { apiClient } from "@/src/services/api/apiClient";

/*
Bottom Tab Bar ➡️ Admin: Tab Navigation (switches tabs).
Admin Dashboard ➡️ Sub-controls (Orders, Products, etc.): Stack Navigation (pushes/pops screens on a stack).
*/

export default function AdminDashboard() {
  const { colors, isDark } = useTheme();
  const router = useRouter();

  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);

  // Stats State
  const [stats, setStats] = useState<{
    totalSales: number;
    minimumSale: number;
    maxSale: number;
    avgSale: number;
  } | null>(null);
  const [saleToday, setSaleToday] = useState<number>(0);
  const [ordersCount, setOrdersCount] = useState<number>(0);
  const [productsCount, setProductsCount] = useState<number>(0);
  const [categoriesCount, setCategoriesCount] = useState<number>(0);
  const [brandsCount, setBrandsCount] = useState<number>(0);
  const [colorsCount, setColorsCount] = useState<number>(0);
  const [couponsCount, setCouponsCount] = useState<number>(0);
  const [customersCount, setCustomersCount] = useState<number>(0);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch sales summary stats
      const statsRes = await apiClient.get("/api/v1/orders/sales/stats");
      if (statsRes.data?.orders?.length > 0) {
        /*
        2. The MongoDB Database Response
Because we group all documents using _id: null (meaning aggregate everything into a single group), MongoDB returns the result as an array containing exactly one object:

json
[
  {
    "_id": null,
    "minimumSale": 15.00,
    "totalSales": 12450.50,
    "maxSale": 899.99,
    "avgSale": 249.00
  }
]
(If there are no orders at all in the database, it returns an empty array []).
        */
        setStats(statsRes.data.orders[0]);
      } else {
        setStats(null);
      }
      if (statsRes.data?.saleToday?.length > 0) {
        setSaleToday(statsRes.data.saleToday[0].totalSales || 0);
      } else {
        setSaleToday(0);
      }

      // 2. Fetch lists counts
      const [ordersRes, productsRes, categoriesRes, brandsRes, colorsRes, couponsRes] = await Promise.all([
        apiClient.get("/api/v1/orders"),
        apiClient.get("/api/v1/products"),
        apiClient.get("/api/v1/categories"),
        apiClient.get("/api/v1/brands"),
        apiClient.get("/api/v1/colors"),
        apiClient.get("/api/v1/coupons"),
      ]);

      setOrdersCount(ordersRes.data?.total || ordersRes.data?.orders?.length || 0);
      setProductsCount(productsRes.data?.total || productsRes.data?.products?.length || 0);
      setCategoriesCount(categoriesRes.data?.total || categoriesRes.data?.categories?.length || 0);
      setBrandsCount(brandsRes.data?.total || brandsRes.data?.brands?.length || 0);
      setColorsCount(colorsRes.data?.total || colorsRes.data?.colors?.length || 0);
      setCouponsCount(couponsRes.data?.total || couponsRes.data?.coupons?.length || 0);

      // Unique customers based on orders list
      const ordersList = ordersRes.data?.orders || [];
      const customerUsers = ordersList.map((order: any) => order.user).filter(Boolean);
      const uniqueEmails = new Set(customerUsers.map((c: any) => c.email));
      setCustomersCount(uniqueEmails.size);

    } catch (err) {
      console.log("Failed to load dashboard statistics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  return (
    <View style={[styles.mainContainer, { backgroundColor: colors.background }]}>
      {/* Header bar */}
      <View style={[styles.viewHeader, { borderBottomColor: colors.border, backgroundColor: colors.surface }]}>
        <Text variant="lg" weight="bold" style={styles.headerTitle}>
          Admin Dashboard
        </Text>
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
        {loading && !refreshing && (
          <View style={styles.inlineLoader}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        )}

        {/* Statistics Cards */}
        <View style={styles.statsGrid}>
          <Card style={[styles.statsCard, { flex: 1.1, borderColor: colors.border }]}>
            <View style={[styles.iconWrapper, { backgroundColor: colors.primary + "15" }]}>
              <Ionicons name="trending-up" size={18} color={colors.primary} />
            </View>
            <Text variant="xxs" color={colors.textMuted} style={{ marginTop: 8 }} weight="bold">
              TOTAL SALES
            </Text>
            <Text variant="lg" weight="bold" color={colors.primary} style={{ marginTop: 2 }}>
              ${stats ? stats.totalSales.toFixed(2) : "0.00"}
            </Text>
          </Card>

          <Card style={[styles.statsCard, { flex: 0.9, borderColor: colors.border }]}>
            <View style={[styles.iconWrapper, { backgroundColor: colors.success + "15" }]}>
              <Ionicons name="today" size={18} color={colors.success} />
            </View>
            <Text variant="xxs" color={colors.textMuted} style={{ marginTop: 8 }} weight="bold">
              SALES TODAY
            </Text>
            <Text variant="lg" weight="bold" color={colors.success} style={{ marginTop: 2 }}>
              ${saleToday ? saleToday.toFixed(2) : "0.00"}
            </Text>
          </Card>
        </View>

        <View style={styles.statsGrid}>
          <Card style={[styles.statsCard, { borderColor: colors.border }]}>
            <Text variant="xxs" color={colors.textMuted} weight="bold">AVG. SALE</Text>
            <Text variant="sm" weight="semibold" color={colors.text} style={{ marginTop: 2 }}>
              ${stats ? stats.avgSale.toFixed(1) : "0.00"}
            </Text>
          </Card>

          <Card style={[styles.statsCard, { borderColor: colors.border }]}>
            <Text variant="xxs" color={colors.textMuted} weight="bold">MAX. SALE</Text>
            <Text variant="sm" weight="semibold" color={colors.text} style={{ marginTop: 2 }}>
              ${stats ? stats.maxSale.toFixed(1) : "0.00"}
            </Text>
          </Card>

          <Card style={[styles.statsCard, { borderColor: colors.border }]}>
            <Text variant="xxs" color={colors.textMuted} weight="bold">ORDERS</Text>
            <Text variant="sm" weight="semibold" color={colors.text} style={{ marginTop: 2 }}>
              {ordersCount}
            </Text>
          </Card>
        </View>

        <Text variant="sm" weight="bold" color={colors.textMuted} style={styles.sectionTitle}>
          OPERATIONS CONTROL
        </Text>

        {/* Menu Options Grid */}
        <View style={styles.menuGrid}>
          <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => router.push("/admin/orders")}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconCircle, { backgroundColor: colors.primary + "15" }]}>
              <Ionicons name="receipt" size={20} color={colors.primary} />
            </View>
            <Text variant="sm" weight="bold" style={{ marginTop: SPACING.sm }}>
              Orders
            </Text>
            <Text variant="xxs" color={colors.textMuted} style={{ marginTop: 2 }}>
              {ordersCount} orders log
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => router.push("/admin/products")}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconCircle, { backgroundColor: colors.primary + "15" }]}>
              <Ionicons name="shirt" size={20} color={colors.primary} />
            </View>
            <Text variant="sm" weight="bold" style={{ marginTop: SPACING.sm }}>
              Products
            </Text>
            <Text variant="xxs" color={colors.textMuted} style={{ marginTop: 2 }}>
              {productsCount} catalog items
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.menuGrid}>
          <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => router.push("/admin/categories")}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconCircle, { backgroundColor: colors.primary + "15" }]}>
              <Ionicons name="grid" size={20} color={colors.primary} />
            </View>
            <Text variant="sm" weight="bold" style={{ marginTop: SPACING.sm }}>
              Categories
            </Text>
            <Text variant="xxs" color={colors.textMuted} style={{ marginTop: 2 }}>
              {categoriesCount} segments
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => router.push("/admin/coupons")}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconCircle, { backgroundColor: colors.primary + "15" }]}>
              <Ionicons name="pricetag" size={20} color={colors.primary} />
            </View>
            <Text variant="sm" weight="bold" style={{ marginTop: SPACING.sm }}>
              Coupons
            </Text>
            <Text variant="xxs" color={colors.textMuted} style={{ marginTop: 2 }}>
              {couponsCount} active promos
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.menuGrid}>
          <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => router.push("/admin/brands")}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconCircle, { backgroundColor: colors.primary + "15" }]}>
              <Ionicons name="ribbon-outline" size={20} color={colors.primary} />
            </View>
            <Text variant="sm" weight="bold" style={{ marginTop: SPACING.sm }}>
              Brands
            </Text>
            <Text variant="xxs" color={colors.textMuted} style={{ marginTop: 2 }}>
              {brandsCount} partners
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => router.push("/admin/colors")}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconCircle, { backgroundColor: colors.primary + "15" }]}>
              <Ionicons name="color-palette" size={20} color={colors.primary} />
            </View>
            <Text variant="sm" weight="bold" style={{ marginTop: SPACING.sm }}>
              Colors
            </Text>
            <Text variant="xxs" color={colors.textMuted} style={{ marginTop: 2 }}>
              {colorsCount} swatches
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.fullWidthMenuItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => router.push("/admin/customers")}
          activeOpacity={0.7}
        >
          <View style={[styles.menuIconCircle, { backgroundColor: colors.primary + "15" }]}>
            <Ionicons name="people" size={20} color={colors.primary} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text variant="sm" weight="bold">
              Customers Ledger
            </Text>
            <Text variant="xxs" color={colors.textMuted} style={{ marginTop: 2 }}>
              {customersCount} unique buyers tracking
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>
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
  statsGrid: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  statsCard: {
    padding: SPACING.md,
    alignItems: "flex-start",
    flex: 1,
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
    letterSpacing: 0.8,
  },
  menuGrid: {
    flexDirection: "row",
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  menuItem: {
    flex: 1,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  fullWidthMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    marginTop: SPACING.xs,
  },
  menuIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});
