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

interface Brand {
  _id: string;
  name: string;
  user: string;
  createdAt: string;
}

export default function AdminBrands() {
  const { colors } = useTheme();
  const router = useRouter();

  const [brands, setBrands] = useState<Brand[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Modal / Form states
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalType, setModalType] = useState<"addBrand" | "editBrand" | null>(null);
  const [singleNameInput, setSingleNameInput] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const loadBrands = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/api/v1/brands?limit=1000");
      setBrands(res.data?.brands || []);
    } catch (err) {
      console.log("Failed to load brands:", err);
      Alert.alert("Error", "Could not fetch brands from backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBrands();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadBrands();
    setRefreshing(false);
  };

  const openAddModal = () => {
    setSingleNameInput("");
    setModalType("addBrand");
    setIsModalVisible(true);
  };

  const openEditModal = (brand: Brand) => {
    setSelectedId(brand._id);
    setSingleNameInput(brand.name);
    setModalType("editBrand");
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setModalType(null);
    setSelectedId(null);
  };

  const handleSaveBrand = async () => {
    if (!singleNameInput.trim()) {
      Alert.alert("Input Required", "Please fill in the brand name.");
      return;
    }

    try {
      setLoading(true);
      const name = singleNameInput.trim();

      if (modalType === "addBrand") {
        await apiClient.post("/api/v1/brands", { name });
      } else if (modalType === "editBrand" && selectedId) {
        await apiClient.put(`/api/v1/brands/${selectedId}`, { name });
      }

      Alert.alert("Success", "Brand saved successfully.");
      closeModal();
      loadBrands();
    } catch (err: any) {
      console.log("Brand save error:", err);
      Alert.alert("Save Failed", err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBrand = (id: string) => {
    Alert.alert("Confirm Delete", "Delete this brand permanently?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            setLoading(true);
            await apiClient.delete(`/api/v1/brands/${id}`);
            Alert.alert("Success", "Brand deleted.");
            loadBrands();
          } catch (err: any) {
            Alert.alert("Delete Failed", err.response?.data?.message || err.message);
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const filteredBrands = brands.filter((br) => {
    return br.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
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
          Manage Brands
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
          placeholder="Search brands by name..."
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

        {filteredBrands.length === 0 ? (
          <Text variant="sm" color={colors.textMuted} align="center" style={{ marginTop: SPACING.xxl }}>
            {searchQuery ? "No matching brands found." : "No brands saved."}
          </Text>
        ) : (
          filteredBrands.map((br) => (
            <Card key={br._id} style={[styles.listCard, { borderColor: colors.border }]}>
              <Text variant="sm" weight="bold" style={{ flex: 1 }}>
                {br.name.toUpperCase()}
              </Text>
              <View style={styles.listCardActions}>
                <TouchableOpacity
                  style={styles.listActionIcon}
                  onPress={() => openEditModal(br)}
                >
                  <Ionicons name="create-outline" size={18} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.listActionIcon}
                  onPress={() => handleDeleteBrand(br._id)}
                >
                  <Ionicons name="trash-outline" size={18} color={colors.error} />
                </TouchableOpacity>
              </View>
            </Card>
          ))
        )}
      </ScrollView>

      {/* BRAND MODAL SHEET */}
      <Modal visible={isModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text variant="md" weight="bold">
                {modalType === "addBrand" ? "Add Brand" : "Edit Brand"}
              </Text>
              <TouchableOpacity onPress={closeModal}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll}>
              <View>
                <Input
                  label="Brand Name"
                  placeholder="e.g. Nike, Adidas, Gucci"
                  value={singleNameInput}
                  onChangeText={setSingleNameInput}
                />
              </View>

              <Button
                title="Save Changes"
                onPress={handleSaveBrand}
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
  listCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
  },
  listCardActions: {
    flexDirection: "row",
    gap: SPACING.md,
  },
  listActionIcon: {
    padding: 4,
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
