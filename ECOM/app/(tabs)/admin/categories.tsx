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
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";

import { useTheme } from "@/src/shared/providers/ThemeProvider";
import { Text } from "@/src/shared/ui/Text";
import { Card } from "@/src/shared/ui/Card";
import { Input } from "@/src/shared/ui/Input";
import { Button } from "@/src/shared/ui/Button";
import { SPACING, BORDER_RADIUS } from "@/src/shared/constants/spacing";
import { apiClient } from "@/src/services/api/apiClient";
import { Category } from "@/src/features/categories/types/category.types";
import { CATEGORY_PAGINATION } from "@/src/features/categories/config/pagination";

export default function AdminCategories() {
  const { colors, isDark } = useTheme();
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Modal / Form states
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalType, setModalType] = useState<
    "addCategory" | "editCategory" | null
  >(null);
  const [singleNameInput, setSingleNameInput] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [categoryImageUri, setCategoryImageUri] = useState<string | null>(null);

  const loadCategories = async (
    pageNum: number,
    searchVal: string,
    isAppend = false,
  ) => {
    setLoading(true);
    try {
      const res = await apiClient.get("/api/v1/categories", {
        params: {
          page: pageNum,
          limit: CATEGORY_PAGINATION.ALL_CATEGOTY_ADMIN,
          name: searchVal || undefined,
        },
      });
      const fetchedCategories = res.data?.categories || [];
      if (isAppend) {
        setCategories((prev) => {
          const existingIds = new Set(prev.map((c) => c._id));
          const uniqueNew = fetchedCategories.filter(
            (c: any) => !existingIds.has(c._id),
          );
          return [...prev, ...uniqueNew];
        });
      } else {
        setCategories(fetchedCategories);
      }

      if (fetchedCategories.length < CATEGORY_PAGINATION.ALL_CATEGOTY_ADMIN) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }
    } catch (err) {
      console.log("Failed to load categories:", err);
      Alert.alert("Error", "Could not fetch categories from backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setPage(1);
      setHasMore(true);
      loadCategories(1, searchQuery, false);
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setPage(1);
    setHasMore(true);
    await loadCategories(1, searchQuery, false);
    setRefreshing(false);
  };

  const handleLoadMore = async () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      await loadCategories(nextPage, searchQuery, true);
    }
  };

  const openAddModal = () => {
    setSingleNameInput("");
    setCategoryImageUri(null);
    setModalType("addCategory");
    setIsModalVisible(true);
  };

  const openEditModal = (cat: Category) => {
    setSelectedId(cat._id);
    setSingleNameInput(cat.name);
    setCategoryImageUri((cat as any).image || null);
    setModalType("editCategory");
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setModalType(null);
    setSelectedId(null);
    setCategoryImageUri(null);
  };

  const pickCategoryImage = async () => {
    Alert.alert(
      "Select Image Source",
      "Would you like to take a photo or select from your gallery?",
      [
        {
          text: "Take Photo",
          onPress: async () => {
            const permission =
              await ImagePicker.requestCameraPermissionsAsync();
            if (!permission.granted) {
              Alert.alert(
                "Permission Required",
                "Please allow access to your camera to take a photo.",
              );
              return;
            }
            const result = await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [4, 3],
              quality: 0.8,
            });
            if (!result.canceled && result.assets.length > 0) {
              setCategoryImageUri(result.assets[0].uri);
            }
          },
        },
        {
          text: "Choose from Gallery",
          onPress: async () => {
            const permission =
              await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!permission.granted) {
              Alert.alert(
                "Permission Required",
                "Please allow access to your photo library to upload images.",
              );
              return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [4, 3],
              quality: 0.8,
            });
            if (!result.canceled && result.assets.length > 0) {
              setCategoryImageUri(result.assets[0].uri);
            }
          },
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ],
    );
  };

  const handleSaveCategory = async () => {
    if (!singleNameInput.trim()) {
      Alert.alert("Input Required", "Please fill in the category name.");
      return;
    }

    try {
      setLoading(true);
      const name = singleNameInput.trim();

      if (modalType === "addCategory") {
        const formData = new FormData();
        formData.append("name", name);
        if (categoryImageUri) {
          const filename =
            categoryImageUri.split("/").pop() || "category_image.jpg";
          const ext = filename.split(".").pop()?.toLowerCase() || "jpg";
          const mimeType = ext === "png" ? "image/png" : "image/jpeg";
          formData.append("file", {
            uri: categoryImageUri,
            name: filename,
            type: mimeType,
          } as any);
        }
        await apiClient.post("/api/v1/categories", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else if (modalType === "editCategory" && selectedId) {
        if (categoryImageUri && !categoryImageUri.startsWith("http")) {
          const formData = new FormData();
          formData.append("name", name);
          const filename =
            categoryImageUri.split("/").pop() || "category_image.jpg";
          const ext = filename.split(".").pop()?.toLowerCase() || "jpg";
          formData.append("file", {
            uri: categoryImageUri,
            name: filename,
            type: ext === "png" ? "image/png" : "image/jpeg",
          } as any);
          await apiClient.put(`/api/v1/categories/${selectedId}`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        } else {
          await apiClient.put(`/api/v1/categories/${selectedId}`, { name });
        }
      }

      Alert.alert("Success", "Category saved successfully.");
      closeModal();
      loadCategories(1, searchQuery, false);
    } catch (err: any) {
      console.log("Category save error:", err);
      Alert.alert("Save Failed", err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = (id: string) => {
    Alert.alert("Confirm Delete", "Delete this category permanently?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            setLoading(true);
            await apiClient.delete(`/api/v1/categories/${id}`);
            Alert.alert("Success", "Category deleted.");
            loadCategories(1, searchQuery, false);
          } catch (err: any) {
            Alert.alert(
              "Delete Failed",
              err.response?.data?.message || err.message,
            );
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  // Server filtered categories list

  return (
    <View
      style={[styles.mainContainer, { backgroundColor: colors.background }]}
    >
      {/* Header bar */}
      <View
        style={[
          styles.viewHeader,
          { borderBottomColor: colors.border, backgroundColor: colors.surface },
        ]}
      >
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back-outline" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text variant="lg" weight="bold" style={styles.headerTitle}>
          Manage Categories
        </Text>
        <TouchableOpacity
          style={[
            styles.addFloatingBtn,
            { backgroundColor: colors.primaryLight },
          ]}
          onPress={openAddModal}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Search Input Bar */}
      <View
        style={[
          styles.searchContainer,
          { backgroundColor: colors.surface, borderBottomColor: colors.border },
        ]}
      >
        <Input
          placeholder="Search categories by name..."
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

        {categories.length === 0 ? (
          <Text
            variant="sm"
            color={colors.textMuted}
            align="center"
            style={{ marginTop: SPACING.xxl }}
          >
            {searchQuery
              ? "No matching categories found."
              : "No categories saved."}
          </Text>
        ) : (
          <>
            {categories.map((cat) => (
              <Card
                key={cat._id}
                style={[
                  styles.listCard,
                  { alignItems: "center", borderColor: colors.border },
                ]}
              >
                {/* Category thumbnail */}
                {(cat as any).image ? (
                  <Image
                    source={{ uri: (cat as any).image }}
                    style={styles.categoryThumb}
                    resizeMode="cover"
                  />
                ) : (
                  <View
                    style={[
                      styles.categoryThumbPlaceholder,
                      { backgroundColor: colors.inputBg },
                    ]}
                  >
                    <Ionicons
                      name="image-outline"
                      size={20}
                      color={colors.textMuted}
                    />
                  </View>
                )}
                <Text
                  variant="sm"
                  weight="bold"
                  style={{ flex: 1, marginLeft: SPACING.sm }}
                >
                  {cat.name.toUpperCase()}
                </Text>
                <View style={styles.listCardActions}>
                  <TouchableOpacity
                    style={styles.listActionIcon}
                    onPress={() => openEditModal(cat)}
                  >
                    <Ionicons
                      name="create-outline"
                      size={18}
                      color={colors.primary}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.listActionIcon}
                    onPress={() => handleDeleteCategory(cat._id)}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={18}
                      color={colors.error}
                    />
                  </TouchableOpacity>
                </View>
              </Card>
            ))}
            {hasMore && (
              <Button
                title="Load More"
                onPress={handleLoadMore}
                loading={loading}
                disabled={loading}
                variant="outline"
                style={{ marginTop: SPACING.md, height: 44, borderRadius: 22 }}
              />
            )}
          </>
        )}
      </ScrollView>

      {/* CATEGORY MODAL SHEET */}
      <Modal visible={isModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalContent, { backgroundColor: colors.surface }]}
          >
            <View style={styles.modalHeader}>
              <Text variant="md" weight="bold">
                {modalType === "addCategory" ? "Add Category" : "Edit Category"}
              </Text>
              <TouchableOpacity onPress={closeModal}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll}>
              <View>
                <Input
                  label="Category Name"
                  placeholder="e.g. Electronics, Footwear"
                  value={singleNameInput}
                  onChangeText={setSingleNameInput}
                />

                {/* Image picker */}
                <View style={{ marginTop: SPACING.md }}>
                  <Text
                    variant="xs"
                    weight="bold"
                    color={colors.textMuted}
                    style={{ marginBottom: SPACING.sm }}
                  >
                    Category Image (Optional)
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.imagePickerBtn,
                      {
                        borderColor: colors.border,
                        backgroundColor: colors.inputBg,
                      },
                    ]}
                    onPress={pickCategoryImage}
                    activeOpacity={0.7}
                  >
                    {categoryImageUri ? (
                      <Image
                        source={{ uri: categoryImageUri }}
                        style={styles.imagePickerPreview}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.imagePickerEmpty}>
                        <Ionicons
                          name="cloud-upload-outline"
                          size={28}
                          color={colors.textMuted}
                        />
                        <Text
                          variant="xs"
                          color={colors.textMuted}
                          style={{ marginTop: 6 }}
                        >
                          Tap to select image
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                  {categoryImageUri && (
                    <TouchableOpacity
                      onPress={() => setCategoryImageUri(null)}
                      style={{ alignSelf: "flex-end", marginTop: 6 }}
                    >
                      <Text variant="xs" color={colors.error}>
                        Remove Image
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              <Button
                title="Save Changes"
                onPress={handleSaveCategory}
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
  categoryThumb: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.xs,
  },
  categoryThumbPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.xs,
    alignItems: "center",
    justifyContent: "center",
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
  imagePickerBtn: {
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderRadius: BORDER_RADIUS.md,
    minHeight: 120,
    overflow: "hidden",
    justifyContent: "center",
  },
  imagePickerEmpty: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.lg,
  },
  imagePickerPreview: {
    width: "100%",
    height: 140,
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
