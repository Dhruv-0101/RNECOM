import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { useTheme } from "@/src/shared/providers/ThemeProvider";
import { Text } from "@/src/shared/ui/Text";
import { Card } from "@/src/shared/ui/Card";
import { Input } from "@/src/shared/ui/Input";
import { Button } from "@/src/shared/ui/Button";
import { SPACING, BORDER_RADIUS } from "@/src/shared/constants/spacing";
import { apiClient } from "@/src/services/api/apiClient";
import { Coupon } from "@/src/features/coupons/types/coupon.types";

export default function AdminCoupons() {
  const { colors } = useTheme();
  const router = useRouter();

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Modal / Form states
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalType, setModalType] = useState<"addCoupon" | "editCoupon" | null>(null);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [couponForm, setCouponForm] = useState({
    code: "",
    discount: "",
    startDate: "",
    endDate: "",
  });

  const loadCoupons = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/api/v1/coupons?limit=1000");
      setCoupons(res.data?.coupons || []);
    } catch (err) {
      console.log("Failed to load coupons:", err);
      Alert.alert("Error", "Could not fetch coupons from backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadCoupons();
    setRefreshing(false);
  };

  const openAddModal = () => {
    const today = new Date().toISOString().split("T")[0];
    const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    setCouponForm({
      code: "",
      discount: "",
      startDate: today,
      endDate: nextMonth,
    });
    setModalType("addCoupon");
    setIsModalVisible(true);
  };

  const openEditModal = (coup: Coupon) => {
    setSelectedCoupon(coup);
    setCouponForm({
      code: coup.code,
      discount: coup.discount.toString(),
      startDate: coup.startDate.split("T")[0],
      endDate: coup.endDate.split("T")[0],
    });
    setModalType("editCoupon");
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setModalType(null);
    setSelectedCoupon(null);
  };

  const handleSaveCoupon = async () => {
    const { code, discount, startDate, endDate } = couponForm;
    if (!code || !discount || !startDate || !endDate) {
      Alert.alert("Missing Fields", "Please complete all coupon fields.");
      return;
    }

    try {
      setLoading(true);
      if (modalType === "addCoupon") {
        await apiClient.post("/api/v1/coupons", {
          code: code.toUpperCase(),
          discount: parseFloat(discount),
          startDate,
          endDate,
        });
        Alert.alert("Success", "Coupon created successfully!");
      } else if (modalType === "editCoupon" && selectedCoupon) {
        await apiClient.put(`/api/v1/coupons/update/${selectedCoupon._id}`, {
          code: code.toUpperCase(),
          discount: parseFloat(discount),
          startDate,
          endDate,
        });
        Alert.alert("Success", "Coupon updated successfully!");
      }
      closeModal();
      loadCoupons();
    } catch (err: any) {
      console.log("Coupon save error:", err);
      Alert.alert("Save Failed", err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCoupon = (couponId: string) => {
    Alert.alert("Delete Coupon", "Are you sure you want to delete this coupon?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            setLoading(true);
            await apiClient.delete(`/api/v1/coupons/delete/${couponId}`);
            Alert.alert("Success", "Coupon deleted.");
            loadCoupons();
          } catch (err: any) {
            Alert.alert("Error", err.response?.data?.message || err.message);
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const filteredCoupons = coupons.filter((cop) => {
    return cop.code.toLowerCase().includes(searchQuery.toLowerCase().trim());
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
          Manage Coupons
        </Text>
        <TouchableOpacity
          style={[styles.addFloatingBtn, { backgroundColor: colors.primaryLight }]}
          onPress={openAddModal}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Search Input Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Input
          placeholder="Search coupons by code..."
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

        {filteredCoupons.length === 0 ? (
          <Text variant="sm" color={colors.textMuted} align="center" style={{ marginTop: SPACING.xxl }}>
            {searchQuery ? "No matching coupons found." : "No active coupons on server."}
          </Text>
        ) : (
          filteredCoupons.map((cop) => {
            const startD = new Date(cop.startDate).toLocaleDateString();
            const endD = new Date(cop.endDate).toLocaleDateString();

            return (
              <Card key={cop._id} style={[styles.couponCard, { borderColor: colors.border }]}>
                <View style={styles.couponHeader}>
                  <View style={[styles.couponBadge, { backgroundColor: colors.primaryLight }]}>
                    <Text variant="sm" weight="bold" color={colors.primary}>
                      {cop.code}
                    </Text>
                  </View>
                  <Text variant="md" weight="bold" color={colors.success}>
                    {cop.discount}% OFF
                  </Text>
                </View>
                <Text variant="xs" color={colors.textMuted} style={{ marginTop: 8 }}>
                  Validity: {startD} to {endD}
                </Text>

                <View style={[styles.cardActions, { marginTop: SPACING.md }]}>
                  <TouchableOpacity
                    style={[styles.actionBtn, { borderColor: colors.border }]}
                    onPress={() => openEditModal(cop)}
                  >
                    <Ionicons name="create-outline" size={16} color={colors.primary} />
                    <Text variant="xs" color={colors.primary} style={{ marginLeft: 4 }}>
                      Edit
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, { borderColor: colors.border }]}
                    onPress={() => handleDeleteCoupon(cop._id)}
                  >
                    <Ionicons name="trash-outline" size={16} color={colors.error} />
                    <Text variant="xs" color={colors.error} style={{ marginLeft: 4 }}>
                      Delete
                    </Text>
                  </TouchableOpacity>
                </View>
              </Card>
            );
          })
        )}
      </ScrollView>

      {/* COUPON MODAL SHEET */}
      <Modal visible={isModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text variant="md" weight="bold">
                {modalType === "addCoupon" ? "Add Coupon" : "Edit Coupon"}
              </Text>
              <TouchableOpacity onPress={closeModal}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll}>
              <View>
                <Input
                  label="Promo Code"
                  placeholder="SUMMER50"
                  value={couponForm.code}
                  onChangeText={(val) => setCouponForm((p) => ({ ...p, code: val }))}
                />
                <Input
                  label="Discount Percentage (%)"
                  placeholder="50"
                  keyboardType="numeric"
                  value={couponForm.discount}
                  onChangeText={(val) => setCouponForm((p) => ({ ...p, discount: val }))}
                />
                <Input
                  label="Start Date (YYYY-MM-DD)"
                  placeholder="2026-06-19"
                  value={couponForm.startDate}
                  onChangeText={(val) => setCouponForm((p) => ({ ...p, startDate: val }))}
                />
                <Input
                  label="End Date (YYYY-MM-DD)"
                  placeholder="2026-07-19"
                  value={couponForm.endDate}
                  onChangeText={(val) => setCouponForm((p) => ({ ...p, endDate: val }))}
                />
              </View>

              <Button
                title="Save Changes"
                onPress={handleSaveCoupon}
                loading={loading}
                disabled={loading}
                style={{ marginTop: SPACING.lg }}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  addFloatingBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  inlineLoader: {
    marginVertical: SPACING.xs,
    alignItems: "center",
  },
  couponCard: {
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
  },
  couponHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  couponBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: BORDER_RADIUS.xs,
  },
  cardActions: {
    flexDirection: "row",
    gap: SPACING.sm,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: BORDER_RADIUS.sm,
    paddingVertical: 6,
    paddingHorizontal: SPACING.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    maxHeight: "80%",
    borderTopLeftRadius: BORDER_RADIUS.lg,
    borderTopRightRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  modalScroll: {
    paddingBottom: SPACING.xxxl,
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
