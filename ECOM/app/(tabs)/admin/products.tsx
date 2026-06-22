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
import { Product } from "@/src/features/products/types/product.types";
import { Category } from "@/src/features/categories/types/category.types";
import { PRODUCT_PAGINATION } from "@/src/features/products/config/pagination";
import { BRAND_PAGINATION } from "@/src/features/brands/config/pagination";
import { CATEGORY_PAGINATION } from "@/src/features/categories/config/pagination";
import { COLOR_PAGINATION } from "@/src/features/colors/config/pagination";
import { AdminProductSkeleton } from "@/src/shared/ui/Skeleton";

interface BrandOrColor {
  _id: string;
  name: string;
  user: string;
  createdAt: string;
}

export default function AdminProducts() {
  const { colors, isDark } = useTheme();
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [brands, setBrands] = useState<BrandOrColor[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [colorsList, setColorsList] = useState<BrandOrColor[]>([]);

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Forms / Modals visible
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalType, setModalType] = useState<"addProduct" | "editProduct" | null>(null);

  // Product Form states
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    price: "",
    totalQty: "",
    brand: "",
    category: "",
    colors: [] as string[],
    sizes: [] as string[],
  });

  // Image picker state for products (array of URIs)
  const [productImageUris, setProductImageUris] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [deletedImages, setDeletedImages] = useState<string[]>([]);

  // Brands pagination
  const [brandsPage, setBrandsPage] = useState(1);
  const [hasMoreBrands, setHasMoreBrands] = useState(true);
  const [loadingBrands, setLoadingBrands] = useState(false);

  // Categories pagination
  const [categoriesPage, setCategoriesPage] = useState(1);
  const [hasMoreCategories, setHasMoreCategories] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(false);

  // Colors pagination
  const [colorsPage, setColorsPage] = useState(1);
  const [hasMoreColors, setHasMoreColors] = useState(true);
  const [loadingColors, setLoadingColors] = useState(false);

  const loadBrandsData = async (pageNum: number, isAppend = false) => {
    setLoadingBrands(true);
    try {
      const res = await apiClient.get("/api/v1/brands", {
        params: {
          page: pageNum,
          limit: BRAND_PAGINATION.WHILE_ADD_PRODUCT_SHOW_LIMIT,
        },
      });
      const fetched = res.data?.brands || [];
      if (isAppend) {
        setBrands((prev) => {
          const existingIds = new Set(prev.map((b) => b._id));
          const uniqueNew = fetched.filter((b: any) => !existingIds.has(b._id));
          return [...prev, ...uniqueNew];
        });
      } else {
        setBrands(fetched);
      }
      setHasMoreBrands(res.data?.pagination?.hasNextPage ?? false);
    } catch (err) {
      console.log("Failed to load brands context:", err);
    } finally {
      setLoadingBrands(false);
    }
  };

  const loadCategoriesData = async (pageNum: number, isAppend = false) => {
    setLoadingCategories(true);
    try {
      const res = await apiClient.get("/api/v1/categories", {
        params: {
          page: pageNum,
          limit: CATEGORY_PAGINATION.WHILE_ADD_PRODUCT_SHOW_LIMIT,
        },
      });
      const fetched = res.data?.categories || [];
      if (isAppend) {
        setCategories((prev) => {
          const existingIds = new Set(prev.map((c) => c._id));
          const uniqueNew = fetched.filter((c: any) => !existingIds.has(c._id));
          return [...prev, ...uniqueNew];
        });
      } else {
        setCategories(fetched);
      }
      setHasMoreCategories(res.data?.pagination?.hasNextPage ?? false);
    } catch (err) {
      console.log("Failed to load categories context:", err);
    } finally {
      setLoadingCategories(false);
    }
  };

  const loadColorsData = async (pageNum: number, isAppend = false) => {
    setLoadingColors(true);
    try {
      const res = await apiClient.get("/api/v1/colors", {
        params: {
          page: pageNum,
          limit: COLOR_PAGINATION.WHILE_ADD_PRODUCT_SHOW_LIMIT,
        },
      });
      const fetched = res.data?.colors || [];
      if (isAppend) {
        setColorsList((prev) => {
          const existingIds = new Set(prev.map((c) => c._id));
          const uniqueNew = fetched.filter((c: any) => !existingIds.has(c._id));
          return [...prev, ...uniqueNew];
        });
      } else {
        setColorsList(fetched);
      }
      setHasMoreColors(res.data?.pagination?.hasNextPage ?? false);
    } catch (err) {
      console.log("Failed to load colors context:", err);
    } finally {
      setLoadingColors(false);
    }
  };

  const loadStaticData = async () => {
    setBrandsPage(1);
    setCategoriesPage(1);
    setColorsPage(1);
    await Promise.all([
      loadBrandsData(1, false),
      loadCategoriesData(1, false),
      loadColorsData(1, false),
    ]);
  };

  const loadProducts = async (pageNum: number, searchVal: string, isAppend = false) => {
    setLoading(true);
    try {
      const res = await apiClient.get("/api/v1/products", {
        params: {
          page: pageNum,
          limit: PRODUCT_PAGINATION.ADMIN_PRODUCT_LIMIT,
          name: searchVal || undefined,
        },
      });
      const fetchedProducts = res.data?.products || [];
      if (isAppend) {
        setProducts((prev) => {
          const existingIds = new Set(prev.map((p) => p._id));
          const uniqueNew = fetchedProducts.filter((p: any) => !existingIds.has(p._id));
          return [...prev, ...uniqueNew];
        });
      } else {
        setProducts(fetchedProducts);
      }

      setHasMore(res.data?.pagination?.hasNextPage ?? false);
    } catch (err) {
      console.log("Failed to load products list:", err);
      Alert.alert("Error", "Could not fetch products list from backend database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaticData();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setPage(1);
      setHasMore(true);
      loadProducts(1, searchQuery, false);
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setPage(1);
    setHasMore(true);
    await Promise.all([
      loadStaticData(),
      loadProducts(1, searchQuery, false),
    ]);
    setRefreshing(false);
  };

  const handleLoadMore = async () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      await loadProducts(nextPage, searchQuery, true);
    }
  };

  const openAddModal = () => {
    setProductForm({
      name: "",
      description: "",
      price: "",
      totalQty: "",
      brand: brands[0]?.name || "",
      category: categories[0]?.name || "",
      colors: [],
      sizes: [],
    });
    setProductImageUris([]);
    setExistingImages([]);
    setDeletedImages([]);
    setModalType("addProduct");
    setIsModalVisible(true);
  };

  const openEditModal = (prod: Product) => {
    setSelectedProduct(prod);
    setProductForm({
      name: prod.name,
      description: prod.description,
      price: prod.price.toString(),
      totalQty: prod.totalQty.toString(),
      brand: prod.brand,
      category: prod.category,
      colors: prod.colors || [],
      sizes: prod.sizes || [],
    });
    setProductImageUris([]);
    setExistingImages(prod.images || []);
    setDeletedImages([]);
    setModalType("editProduct");
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setModalType(null);
    setSelectedProduct(null);
    setProductImageUris([]);
    setExistingImages([]);
    setDeletedImages([]);
  };

  const pickProductImages = async () => {
    Alert.alert(
      "Select Image Source",
      "Would you like to take a photo or select from your gallery?",
      [
        {
          text: "Take Photo",
          onPress: async () => {
            const permission = await ImagePicker.requestCameraPermissionsAsync();
            if (!permission.granted) {
              Alert.alert("Permission Required", "Please allow access to your camera to take a photo.");
              return;
            }
            const result = await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              quality: 0.8,
            });
            if (!result.canceled && result.assets.length > 0) {
              setProductImageUris((prev) => [...prev, result.assets[0].uri]);
            }
          },
        },
        {
          text: "Choose from Gallery",
          onPress: async () => {
            const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!permission.granted) {
              Alert.alert("Permission Required", "Please allow access to your photo library to upload images.");
              return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsMultipleSelection: true,
              quality: 0.8,
            });
            if (!result.canceled && result.assets.length > 0) {
              setProductImageUris((prev) => [...prev, ...result.assets.map((a) => a.uri)]);
            }
          },
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ]
    );
  };

  const handleSaveProduct = async () => {
    const { name, description, price, totalQty, brand, category, colors: pColors, sizes } = productForm;
    if (!name || !description || !price || !totalQty || !brand || !category) {
      Alert.alert("Missing Fields", "Please complete all mandatory product properties.");
      return;
    }

    try {
      setLoading(true);
      if (modalType === "addProduct") {
        const formData = new FormData();
        formData.append("name", name);
        formData.append("description", description);
        formData.append("price", price);
        formData.append("totalQty", totalQty);
        formData.append("brand", brand);
        formData.append("category", category);
        pColors.forEach((c) => formData.append("colors", c));
        sizes.forEach((s) => formData.append("sizes", s));

        productImageUris.forEach((uri, index) => {
          const filename = uri.split("/").pop() || `product_image_${index}.jpg`;
          const ext = filename.split(".").pop()?.toLowerCase() || "jpg";
          const mimeType = ext === "png" ? "image/png" : "image/jpeg";
          formData.append("files", {
            uri,
            name: filename,
            type: mimeType,
          } as any);
        });

        await apiClient.post("/api/v1/products", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        Alert.alert("Success", "Product added successfully!");
      } else if (modalType === "editProduct" && selectedProduct) {
        const formData = new FormData();
        formData.append("name", name);
        formData.append("description", description);
        formData.append("price", price);
        formData.append("totalQty", totalQty);
        formData.append("brand", brand);
        formData.append("category", category);
        pColors.forEach((c) => formData.append("colors", c));
        sizes.forEach((s) => formData.append("sizes", s));

        // Keep remaining existing images
        const activeExisting = existingImages.filter((img) => !deletedImages.includes(img));
        activeExisting.forEach((img) => formData.append("images", img));

        // Track deleted images so backend can clean Cloudinary storage
        deletedImages.forEach((img) => formData.append("deletedImages", img));

        // New files added
        productImageUris.forEach((uri, index) => {
          const filename = uri.split("/").pop() || `product_image_${index}.jpg`;
          const ext = filename.split(".").pop()?.toLowerCase() || "jpg";
          const mimeType = ext === "png" ? "image/png" : "image/jpeg";
          formData.append("files", {
            uri,
            name: filename,
            type: mimeType,
          } as any);
        });

        await apiClient.put(`/api/v1/products/${selectedProduct._id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        Alert.alert("Success", "Product updated successfully!");
      }
      closeModal();
      loadProducts(1, searchQuery, false);
    } catch (err: any) {
      console.log("Product save error:", err);
      Alert.alert("Save Failed", err.response?.data?.message || err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = (productId: string) => {
    Alert.alert("Delete Product", "Are you sure you want to permanently delete this product?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            setLoading(true);
            await apiClient.delete(`/api/v1/products/${productId}/delete`);
            Alert.alert("Success", "Product deleted successfully.");
            loadProducts(1, searchQuery, false);
          } catch (err: any) {
            console.log("Delete product error:", err);
            Alert.alert("Delete Failed", err.response?.data?.message || err.message);
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const toggleSize = (size: string) => {
    setProductForm((prev) => {
      const isSelected = prev.sizes.includes(size);
      const nextSizes = isSelected
        ? prev.sizes.filter((s) => s !== size)
        : [...prev.sizes, size];
      return { ...prev, sizes: nextSizes };
    });
  };

  const toggleColorSel = (color: string) => {
    setProductForm((prev) => {
      const isSelected = prev.colors.includes(color);
      const nextColors = isSelected
        ? prev.colors.filter((c) => c !== color)
        : [...prev.colors, color];
      return { ...prev, colors: nextColors };
    });
  };

  // Server filtered products list

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
          Manage Products
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
          placeholder="Search products by name..."
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
        {loading && !refreshing && products.length > 0 && (
          <View style={styles.inlineLoader}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        )}

        {loading && !refreshing && products.length === 0 ? (
          <View style={{ gap: SPACING.md }}>
            {Array.from({ length: PRODUCT_PAGINATION.ADMIN_PRODUCT_LIMIT }).map((_, i) => (
              <AdminProductSkeleton key={`admin-product-initial-skeleton-${i}`} />
            ))}
          </View>
        ) : products.length === 0 ? (
          <Text variant="sm" color={colors.textMuted} align="center" style={{ marginTop: SPACING.xxl }}>
            {searchQuery ? "No matching products found." : "No products found. Add some using the \"+\" button in the header."}
          </Text>
        ) : (
          <>
            {products.map((prod) => (
              <Card key={prod._id} style={[styles.productCard, { borderColor: colors.border }]}>
                <View style={styles.productHeader}>
                  <View style={{ flex: 1 }}>
                    <Text variant="sm" weight="bold">
                      {prod.name}
                    </Text>
                    <Text variant="xs" color={colors.textMuted} style={{ marginTop: 2 }}>
                      Brand: {prod.brand} | Category: {prod.category}
                    </Text>
                    <Text variant="xs" color={colors.textMuted} style={{ marginTop: 2 }}>
                      Stock: {prod.totalQty} items | Colors: {prod.colors?.join(", ") || "None"}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text variant="sm" weight="bold" color={colors.primary}>
                      ${prod.price.toFixed(2)}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={[styles.actionBtn, { borderColor: colors.border }]}
                    onPress={() => openEditModal(prod)}
                  >
                    <Ionicons name="create-outline" size={16} color={colors.primary} />
                    <Text variant="xs" color={colors.primary} style={{ marginLeft: 4 }}>
                      Edit Stock/Price
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, { borderColor: colors.border }]}
                    onPress={() => handleDeleteProduct(prod._id)}
                  >
                    <Ionicons name="trash-outline" size={16} color={colors.error} />
                    <Text variant="xs" color={colors.error} style={{ marginLeft: 4 }}>
                      Delete
                    </Text>
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
            {loading && products.length > 0 && (
              <View style={{ marginTop: SPACING.md, gap: SPACING.md }}>
                {Array.from({ length: PRODUCT_PAGINATION.ADMIN_PRODUCT_LIMIT }).map((_, i) => (
                  <AdminProductSkeleton key={`admin-product-loadmore-skeleton-${i}`} />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* EDIT & ADD MODALS SHEET */}
      <Modal visible={isModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text variant="md" weight="bold">
                {modalType === "addProduct" ? "Add Product" : "Edit Product"}
              </Text>
              <TouchableOpacity onPress={closeModal}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll}>
              <View>
                <Input
                  label="Product Name"
                  placeholder="Premium Leather Shoes"
                  value={productForm.name}
                  onChangeText={(val) => setProductForm((p) => ({ ...p, name: val }))}
                />
                <Input
                  label="Description"
                  placeholder="Enter description details..."
                  value={productForm.description}
                  onChangeText={(val) => setProductForm((p) => ({ ...p, description: val }))}
                  multiline
                />
                <View style={styles.rowFormInputs}>
                  <Input
                    label="Price ($)"
                    placeholder="99.99"
                    keyboardType="numeric"
                    value={productForm.price}
                    onChangeText={(val) => setProductForm((p) => ({ ...p, price: val }))}
                    containerStyle={{ flex: 1, marginRight: SPACING.xs }}
                  />
                  <Input
                    label="Stock Qty"
                    placeholder="100"
                    keyboardType="numeric"
                    value={productForm.totalQty}
                    onChangeText={(val) => setProductForm((p) => ({ ...p, totalQty: val }))}
                    containerStyle={{ flex: 1, marginLeft: SPACING.xs }}
                  />
                </View>

                {/* Selector: Brands */}
                <Text variant="xs" weight="bold" color={colors.textMuted} style={{ marginBottom: 4 }}>
                  Select Brand
                </Text>
                <View style={styles.selectorWrapper}>
                  {brands.map((b) => (
                    <TouchableOpacity
                      key={b._id}
                      style={[
                        styles.selectionItem,
                        productForm.brand === b.name && [styles.selectionItemActive, { borderColor: colors.primary }],
                      ]}
                      onPress={() => setProductForm((p) => ({ ...p, brand: b.name }))}
                    >
                      <Text variant="xs" color={productForm.brand === b.name ? colors.primary : colors.text}>
                        {b.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                  {hasMoreBrands && (
                    <TouchableOpacity
                      style={[styles.selectionItem, { borderColor: colors.primary, borderStyle: "dashed" }]}
                      onPress={() => {
                        const next = brandsPage + 1;
                        setBrandsPage(next);
                        loadBrandsData(next, true);
                      }}
                      disabled={loadingBrands}
                    >
                      {loadingBrands ? (
                        <ActivityIndicator size="small" color={colors.primary} />
                      ) : (
                        <Text variant="xs" color={colors.primary} weight="bold">
                          + Load More
                        </Text>
                      )}
                    </TouchableOpacity>
                  )}
                </View>

                {/* Selector: Categories */}
                <Text variant="xs" weight="bold" color={colors.textMuted} style={{ marginVertical: 8 }}>
                  Select Category
                </Text>
                <View style={styles.selectorWrapper}>
                  {categories.map((c) => (
                    <TouchableOpacity
                      key={c._id}
                      style={[
                        styles.selectionItem,
                        productForm.category === c.name && [styles.selectionItemActive, { borderColor: colors.primary }],
                      ]}
                      onPress={() => setProductForm((p) => ({ ...p, category: c.name }))}
                    >
                      <Text variant="xs" color={productForm.category === c.name ? colors.primary : colors.text}>
                        {c.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                  {hasMoreCategories && (
                    <TouchableOpacity
                      style={[styles.selectionItem, { borderColor: colors.primary, borderStyle: "dashed" }]}
                      onPress={() => {
                        const next = categoriesPage + 1;
                        setCategoriesPage(next);
                        loadCategoriesData(next, true);
                      }}
                      disabled={loadingCategories}
                    >
                      {loadingCategories ? (
                        <ActivityIndicator size="small" color={colors.primary} />
                      ) : (
                        <Text variant="xs" color={colors.primary} weight="bold">
                          + Load More
                        </Text>
                      )}
                    </TouchableOpacity>
                  )}
                </View>

                {/* Selector: Sizes */}
                <Text variant="xs" weight="bold" color={colors.textMuted} style={{ marginVertical: 8 }}>
                  Select Sizes
                </Text>
                <View style={styles.selectorWrapper}>
                  {["S", "M", "L", "XL", "XXL"].map((sz) => {
                    const active = productForm.sizes.includes(sz);
                    return (
                      <TouchableOpacity
                        key={sz}
                        style={[
                          styles.selectionItem,
                          active && [styles.selectionItemActive, { borderColor: colors.primary }],
                        ]}
                        onPress={() => toggleSize(sz)}
                      >
                        <Text variant="xs" color={active ? colors.primary : colors.text}>
                          {sz}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Selector: Colors */}
                <Text variant="xs" weight="bold" color={colors.textMuted} style={{ marginVertical: 8 }}>
                  Select Colors
                </Text>
                <View style={styles.selectorWrapper}>
                  {colorsList.map((col) => {
                    const active = productForm.colors.includes(col.name);
                    return (
                      <TouchableOpacity
                        key={col._id}
                        style={[
                          styles.selectionItem,
                          active && [styles.selectionItemActive, { borderColor: colors.primary }],
                        ]}
                        onPress={() => toggleColorSel(col.name)}
                      >
                        <Text variant="xs" color={active ? colors.primary : colors.text}>
                          {col.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                  {hasMoreColors && (
                    <TouchableOpacity
                      style={[styles.selectionItem, { borderColor: colors.primary, borderStyle: "dashed" }]}
                      onPress={() => {
                        const next = colorsPage + 1;
                        setColorsPage(next);
                        loadColorsData(next, true);
                      }}
                      disabled={loadingColors}
                    >
                      {loadingColors ? (
                        <ActivityIndicator size="small" color={colors.primary} />
                      ) : (
                        <Text variant="xs" color={colors.primary} weight="bold">
                          + Load More
                        </Text>
                      )}
                    </TouchableOpacity>
                  )}
                </View>

                {/* Product image picker — shown for both Add and Edit modes */}
                {(modalType === "addProduct" || modalType === "editProduct") && (
                  <View style={{ marginTop: SPACING.md }}>
                    <Text variant="xs" weight="bold" color={colors.textMuted} style={{ marginBottom: SPACING.sm }}>
                      Product Images
                    </Text>
                    {existingImages.length > 0 || productImageUris.length > 0 ? (
                      <View style={[styles.imagePickerBtn, { borderColor: colors.border, backgroundColor: colors.inputBg }]}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ padding: SPACING.xs, alignItems: 'center' }}>
                          {existingImages.map((uri, idx) => {
                            const isDeleted = deletedImages.includes(uri);
                            return (
                              <View key={`existing-${idx}`} style={{ position: "relative", marginRight: SPACING.sm, opacity: isDeleted ? 0.5 : 1 }}>
                                <Image
                                  source={{ uri }}
                                  style={styles.productThumbInPicker}
                                  resizeMode="cover"
                                />
                                {isDeleted && (
                                  <View style={[StyleSheet.absoluteFillObject, { backgroundColor: "rgba(0, 0, 0, 0.4)", borderRadius: BORDER_RADIUS.xs, alignItems: 'center', justifyContent: 'center' }]}>
                                    <Ionicons name="trash" size={20} color="#fff" />
                                  </View>
                                )}
                                {isDeleted ? (
                                  <TouchableOpacity
                                    style={styles.removeImageBtn}
                                    onPress={() => setDeletedImages((prev) => prev.filter((img) => img !== uri))}
                                  >
                                    <Ionicons name="arrow-undo-circle" size={20} color={colors.primary} />
                                  </TouchableOpacity>
                                ) : (
                                  <TouchableOpacity
                                    style={styles.removeImageBtn}
                                    onPress={() => setDeletedImages((prev) => [...prev, uri])}
                                  >
                                    <Ionicons name="close-circle" size={18} color={colors.error} />
                                  </TouchableOpacity>
                                )}
                              </View>
                            );
                          })}
                          {productImageUris.map((uri, idx) => (
                            <View key={`new-${idx}`} style={{ position: "relative", marginRight: SPACING.sm }}>
                              <Image
                                source={{ uri }}
                                style={styles.productThumbInPicker}
                                resizeMode="cover"
                              />
                              <TouchableOpacity
                                style={styles.removeImageBtn}
                                onPress={() => setProductImageUris((prev) => prev.filter((_, i) => i !== idx))}
                              >
                                <Ionicons name="close-circle" size={18} color={colors.error} />
                              </TouchableOpacity>
                            </View>
                          ))}
                          <TouchableOpacity
                            style={[styles.addMoreImageBtn, { borderColor: colors.border }]}
                            onPress={pickProductImages}
                          >
                            <Ionicons name="add" size={24} color={colors.primary} />
                          </TouchableOpacity>
                        </ScrollView>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={[styles.imagePickerBtn, { borderColor: colors.border, backgroundColor: colors.inputBg }]}
                        onPress={pickProductImages}
                        activeOpacity={0.7}
                      >
                        <View style={styles.imagePickerEmpty}>
                          <Ionicons name="images-outline" size={28} color={colors.textMuted} />
                          <Text variant="xs" color={colors.textMuted} style={{ marginTop: 6 }}>
                            Tap to add product photos
                          </Text>
                        </View>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>

              <Button
                title="Save Changes"
                onPress={handleSaveProduct}
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
  productCard: {
    marginBottom: SPACING.md,
    padding: SPACING.md,
    borderWidth: 1,
  },
  productHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cardActions: {
    flexDirection: "row",
    marginTop: SPACING.sm,
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
    maxHeight: "85%",
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
  rowFormInputs: {
    flexDirection: "row",
  },
  selectorWrapper: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  selectionItem: {
    paddingVertical: 6,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.xs,
    borderWidth: 1,
    borderColor: "#cbd5e1",
  },
  selectionItemActive: {
    borderWidth: 1.5,
    backgroundColor: "#f1f5f9",
  },
  imagePickerBtn: {
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderRadius: BORDER_RADIUS.md,
    minHeight: 100,
    overflow: "hidden",
    justifyContent: "center",
  },
  imagePickerEmpty: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.lg,
  },
  productThumbInPicker: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.xs,
  },
  removeImageBtn: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "white",
    borderRadius: 10,
  },
  addMoreImageBtn: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.xs,
    borderWidth: 1.5,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
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
