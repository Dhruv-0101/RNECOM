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
import { COLOR_PAGINATION } from "@/src/features/colors/config/pagination";
import { AdminItemSkeleton } from "@/src/shared/ui/Skeleton";

interface Color {
  _id: string;
  name: string;
  user: string;
  createdAt: string;
}

export default function AdminColors() {
  const { colors } = useTheme();
  const router = useRouter();

  const [colorsList, setColorsList] = useState<Color[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Modal / Form states
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalType, setModalType] = useState<"addColor" | "editColor" | null>(null);
  const [singleNameInput, setSingleNameInput] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const loadColors = async (pageNum: number, searchVal: string, isAppend = false) => {
    setLoading(true);
    try {
      const res = await apiClient.get("/api/v1/colors", {
        params: {
          page: pageNum,
          limit: COLOR_PAGINATION.ADMIN_LIMIT,
          name: searchVal || undefined,
        },
      });
      const fetchedColors = res.data?.colors || [];
      if (isAppend) {
        setColorsList((prev) => {
          const existingIds = new Set(prev.map((c) => c._id));
          const uniqueNew = fetchedColors.filter((c: any) => !existingIds.has(c._id));
          return [...prev, ...uniqueNew];
        });
      } else {
        setColorsList(fetchedColors);
      }

      if (fetchedColors.length < COLOR_PAGINATION.ADMIN_LIMIT) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }
    } catch (err) {
      console.log("Failed to load colors:", err);
      Alert.alert("Error", "Could not fetch colors from backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setPage(1);
      setHasMore(true);
      loadColors(1, searchQuery, false);
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setPage(1);
    setHasMore(true);
    await loadColors(1, searchQuery, false);
    setRefreshing(false);
  };

  const handleLoadMore = async () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      await loadColors(nextPage, searchQuery, true);
    }
  };

  const openAddModal = () => {
    setSingleNameInput("");
    setModalType("addColor");
    setIsModalVisible(true);
  };

  const openEditModal = (col: Color) => {
    setSelectedId(col._id);
    setSingleNameInput(col.name);
    setModalType("editColor");
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setModalType(null);
    setSelectedId(null);
  };

  const handleSaveColor = async () => {
    if (!singleNameInput.trim()) {
      Alert.alert("Input Required", "Please fill in the color name.");
      return;
    }

    try {
      setLoading(true);
      const name = singleNameInput.trim();

      if (modalType === "addColor") {
        await apiClient.post("/api/v1/colors", { name });
      } else if (modalType === "editColor" && selectedId) {
        await apiClient.put(`/api/v1/colors/${selectedId}`, { name });
      }

      Alert.alert("Success", "Color saved successfully.");
      closeModal();
      loadColors(1, searchQuery, false);
    } catch (err: any) {
      console.log("Color save error:", err);
      Alert.alert("Save Failed", err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteColor = (id: string) => {
    Alert.alert("Confirm Delete", "Delete this color permanently?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            setLoading(true);
            await apiClient.delete(`/api/v1/colors/${id}`);
            Alert.alert("Success", "Color deleted.");
            loadColors(1, searchQuery, false);
          } catch (err: any) {
            Alert.alert("Delete Failed", err.response?.data?.message || err.message);
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  // Server filtered colors list

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
          Manage Colors
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
          placeholder="Search colors by name..."
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
        {loading && !refreshing && colorsList.length > 0 && (
          <View style={styles.inlineLoader}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        )}

        {loading && !refreshing && colorsList.length === 0 ? (
          <View style={{ gap: SPACING.md }}>
            {Array.from({ length: COLOR_PAGINATION.ADMIN_LIMIT }).map((_, i) => (
              <AdminItemSkeleton key={`admin-color-initial-skeleton-${i}`} hasColorIndicator={true} />
            ))}
          </View>
        ) : colorsList.length === 0 ? (
          <Text variant="sm" color={colors.textMuted} align="center" style={{ marginTop: SPACING.xxl }}>
            {searchQuery ? "No matching colors found." : "No colors saved."}
          </Text>
        ) : (
          <>
            {colorsList.map((col) => (
              <Card key={col._id} style={[styles.listCard, { borderColor: colors.border }]}>
                <View style={styles.colorRowContent}>
                  <View style={[styles.colorColorIndicator, { backgroundColor: col.name.toLowerCase() }]} />
                  <Text variant="sm" weight="bold" style={{ marginLeft: 12 }}>
                    {col.name.toUpperCase()}
                  </Text>
                </View>
                <View style={styles.listCardActions}>
                  <TouchableOpacity
                    style={styles.listActionIcon}
                    onPress={() => openEditModal(col)}
                  >
                    <Ionicons name="create-outline" size={18} color={colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.listActionIcon}
                    onPress={() => handleDeleteColor(col._id)}
                  >
                    <Ionicons name="trash-outline" size={18} color={colors.error} />
                  </TouchableOpacity>
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
            {loading && colorsList.length > 0 && (
              <View style={{ marginTop: SPACING.md, gap: SPACING.md }}>
                {Array.from({ length: COLOR_PAGINATION.ADMIN_LIMIT }).map((_, i) => (
                  <AdminItemSkeleton key={`admin-color-loadmore-skeleton-${i}`} hasColorIndicator={true} />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* COLOR MODAL SHEET */}
      <Modal visible={isModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text variant="md" weight="bold">
                {modalType === "addColor" ? "Add Color" : "Edit Color"}
              </Text>
              <TouchableOpacity onPress={closeModal}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll}>
              <View>
                <Input
                  label="Color Name"
                  placeholder="e.g. Red, Blue, Navy, Emerald"
                  value={singleNameInput}
                  onChangeText={setSingleNameInput}
                />
              </View>

              <Button
                title="Save Changes"
                onPress={handleSaveColor}
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
  colorRowContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  colorColorIndicator: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "#e2e8f0",
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
