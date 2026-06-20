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
import { SPACING, BORDER_RADIUS } from "@/src/shared/constants/spacing";
import { apiClient } from "@/src/services/api/apiClient";

export default function AdminCustomers() {
  const { colors } = useTheme();
  const router = useRouter();

  const [customers, setCustomers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/api/v1/orders?limit=1000");
      const ordersList = res.data?.orders || [];
      // Extract unique buyers based on email
      const customerUsers = ordersList.map((order: any) => order.user).filter(Boolean);
      const uniqueCustomers = Array.from(
        new Map(customerUsers.map((cust: any) => [cust.email, cust])).values()
      ) as any[];

      setCustomers(uniqueCustomers);
    } catch (err) {
      console.log("Failed to load customers list:", err);
      Alert.alert("Error", "Could not fetch customers list from orders log.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadCustomers();
    setRefreshing(false);
  };

  const filteredCustomers = customers.filter((cust) => {
    const name = (cust.fullname || "").toLowerCase();
    const email = (cust.email || "").toLowerCase();
    const query = searchQuery.toLowerCase().trim();
    return name.includes(query) || email.includes(query);
  });

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
        {loading && !refreshing && (
          <View style={styles.inlineLoader}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        )}

        {filteredCustomers.length === 0 ? (
          <Text variant="sm" color={colors.textMuted} align="center" style={{ marginTop: SPACING.xxl }}>
            {searchQuery ? "No matching customers found." : "No customer transactions recorded in system yet."}
          </Text>
        ) : (
          filteredCustomers.map((cust, index) => (
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
                    Address: {cust.shippingAddress.address || cust.shippingAddress.streetAddress}, {cust.shippingAddress.city}
                  </Text>
                  <Text variant="xs" color={colors.textMuted} style={{ marginTop: 2 }}>
                    Region: {cust.shippingAddress.province || cust.shippingAddress.state}, {cust.shippingAddress.country}
                  </Text>
                  <Text variant="xs" color={colors.textMuted} style={{ marginTop: 2 }}>
                    Phone: {cust.shippingAddress.phone || cust.shippingAddress.recipientPhone}
                  </Text>
                </View>
              ) : (
                <Text variant="xs" color={colors.textMuted} style={{ marginTop: 8 }}>
                  No shipping address saved.
                </Text>
              )}
            </Card>
          ))
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
});
