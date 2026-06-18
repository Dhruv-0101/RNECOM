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
  Platform,
  LayoutAnimation,
  UIManager,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";

import { useTheme } from "@/src/shared/providers/ThemeProvider";
import { Text } from "@/src/shared/ui/Text";
import { Button } from "@/src/shared/ui/Button";
import { Card } from "@/src/shared/ui/Card";
import { Input } from "@/src/shared/ui/Input";
import { SPACING, BORDER_RADIUS } from "@/src/shared/constants/spacing";

import { useCurrentUser } from "@/src/features/auth/hooks/useCurrentUser";
import { apiClient } from "@/src/services/api/apiClient";
import { PopulatedOrder } from "@/src/features/auth/types/auth.types";
import { Product } from "@/src/features/products/types/product.types";
import { Category } from "@/src/features/categories/types/category.types";
import { Coupon } from "@/src/features/coupons/types/coupon.types";

// Enable LayoutAnimation for Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Sub-view types
type AdminView =
  | "dashboard"
  | "orders"
  | "products"
  | "categories"
  | "brands"
  | "colors"
  | "coupons"
  | "customers";

interface BrandOrColor {
  _id: string;
  name: string;
  user: string;
  createdAt: string;
}

export default function AdminScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { user, isAuthenticated } = useCurrentUser();

  // Guard routing
  useEffect(() => {
    if (!isAuthenticated || !user || (!user.isAdmin && user.email !== "admin@gmail.com")) {
      router.replace("/");
    }
  }, [isAuthenticated, user]);

  // General state
  const [activeView, setActiveView] = useState<AdminView>("dashboard");
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

  // Data lists
  const [orders, setOrders] = useState<PopulatedOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<BrandOrColor[]>([]);
  const [colorsList, setColorsList] = useState<BrandOrColor[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);

  // Expanded card tracking
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // Forms / Modals visible
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalType, setModalType] = useState<"addProduct" | "editProduct" | "addCoupon" | "editCoupon" | "addCategory" | "addBrand" | "addColor" | "editCategory" | "editBrand" | "editColor" | "editOrderStatus" | null>(null);

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

  // Simple string inputs for category, brand, color
  const [singleNameInput, setSingleNameInput] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Image picker state
  // For categories: single image URI
  const [categoryImageUri, setCategoryImageUri] = useState<string | null>(null);
  // For products: array of image URIs
  const [productImageUris, setProductImageUris] = useState<string[]>([]);

  // Coupon Form state
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [couponForm, setCouponForm] = useState({
    code: "",
    discount: "",
    startDate: "",
    endDate: "",
  });

  // Order status update state
  const [selectedOrder, setSelectedOrder] = useState<PopulatedOrder | null>(null);
  const [orderStatusForm, setOrderStatusForm] = useState<"pending" | "processing" | "shipped" | "delivered">("pending");

  // Load stats and essential details
  const loadStats = async () => {
    try {
      const res = await apiClient.get("/api/v1/orders/sales/stats");
      if (res.data?.orders?.length > 0) {
        setStats(res.data.orders[0]);
      }
      if (res.data?.saleToday?.length > 0) {
        setSaleToday(res.data.saleToday[0].totalSales || 0);
      }
    } catch (err) {
      console.log("Failed to load admin stats:", err);
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      await loadStats();
      // Load other basic lookups
      const [prodRes, catRes, brandRes, colorRes, couponRes, orderRes] = await Promise.all([
        apiClient.get("/api/v1/products"),
        apiClient.get("/api/v1/categories"),
        apiClient.get("/api/v1/brands"),
        apiClient.get("/api/v1/colors"),
        apiClient.get("/api/v1/coupons"),
        apiClient.get("/api/v1/orders"),
      ]);
      setProducts(prodRes.data?.products || []);
      setCategories(catRes.data?.categories || []);
      setBrands(brandRes.data?.brands || []);
      setColorsList(colorRes.data?.colors || []);
      setCoupons(couponRes.data?.coupons || []);
      setOrders(orderRes.data?.orders || []);
    } catch (err) {
      console.log("Failed to load admin lists data:", err);
      Alert.alert("Data Load Error", "Could not fetch lists from backend database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user && (user.isAdmin || user.email === "admin@gmail.com")) {
      loadAllData();
    }
  }, [isAuthenticated, user]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
  };

  // Helper: toggle Order Card expansion
  const toggleOrderExpand = (orderId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  // Open modals
  const openModal = (
    type: typeof modalType,
    context?: any
  ) => {
    setModalType(type);
    setIsModalVisible(true);

    if (type === "addProduct") {
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
    } else if (type === "editProduct" && context) {
      const prod = context as Product;
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
    } else if (type === "addCoupon") {
      const today = new Date().toISOString().split("T")[0];
      const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      setCouponForm({
        code: "",
        discount: "",
        startDate: today,
        endDate: nextMonth,
      });
    } else if (type === "editCoupon" && context) {
      const coup = context as Coupon;
      setSelectedCoupon(coup);
      setCouponForm({
        code: coup.code,
        discount: coup.discount.toString(),
        startDate: coup.startDate.split("T")[0],
        endDate: coup.endDate.split("T")[0],
      });
    } else if ((type === "addCategory" || type === "addBrand" || type === "addColor")) {
      setSingleNameInput("");
      setCategoryImageUri(null);
    } else if ((type === "editCategory" || type === "editBrand" || type === "editColor") && context) {
      setSelectedId(context._id);
      setSingleNameInput(context.name);
      setCategoryImageUri(context.image || null);
    } else if (type === "editOrderStatus" && context) {
      const ord = context as PopulatedOrder;
      setSelectedOrder(ord);
      setOrderStatusForm(ord.status);
    }
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setModalType(null);
    setSelectedProduct(null);
    setSelectedCoupon(null);
    setSelectedOrder(null);
    setSelectedId(null);
    setCategoryImageUri(null);
    setProductImageUris([]);
  };

  // Image Picker helpers
  const pickCategoryImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission Required", "Please allow access to your photo library to upload images.");
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
  };

  const pickProductImages = async () => {
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
  };

  // CREATE / UPDATE PRODUCT
  const handleSaveProduct = async () => {
    const { name, description, price, totalQty, brand, category, colors: pColors, sizes } = productForm;
    if (!name || !description || !price || !totalQty || !brand || !category) {
      Alert.alert("Missing Fields", "Please complete all mandatory product properties.");
      return;
    }

    try {
      setLoading(true);
      if (modalType === "addProduct") {
        // Build FormData matching backend multer upload.array("files")
        const formData = new FormData();
        formData.append("name", name);
        formData.append("description", description);
        formData.append("price", price);
        formData.append("totalQty", totalQty);
        formData.append("brand", brand);
        formData.append("category", category);
        pColors.forEach((c) => formData.append("colors", c));
        sizes.forEach((s) => formData.append("sizes", s));

        // Attach picked images as "files" (multer field name)
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
        await apiClient.put(`/api/v1/products/${selectedProduct._id}`, {
          name,
          description,
          price: parseFloat(price),
          totalQty: parseInt(totalQty),
          brand,
          category,
          colors: pColors,
          sizes,
        });
        Alert.alert("Success", "Product updated successfully!");
      }
      closeModal();
      loadAllData();
    } catch (err: any) {
      console.log("Product save error:", err);
      Alert.alert("Save Failed", err.response?.data?.message || err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  // DELETE PRODUCT
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
            loadAllData();
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

  // ADD / EDIT COUPON
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
      loadAllData();
    } catch (err: any) {
      console.log("Coupon save error:", err);
      Alert.alert("Save Failed", err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  // DELETE COUPON
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
            loadAllData();
          } catch (err: any) {
            Alert.alert("Error", err.response?.data?.message || err.message);
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  // ADD / EDIT RESOURCE (Category, Brand, Color)
  const handleSaveResource = async () => {
    if (!singleNameInput.trim()) {
      Alert.alert("Input Required", "Please fill in the name field.");
      return;
    }

    try {
      setLoading(true);
      const name = singleNameInput.trim();

      if (modalType === "addCategory") {
        // Category requires FormData with optional image via multer single("file")
        const formData = new FormData();
        formData.append("name", name);
        if (categoryImageUri) {
          const filename = categoryImageUri.split("/").pop() || "category_image.jpg";
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
        // For edit, update name (image update via separate call if provided)
        if (categoryImageUri && !categoryImageUri.startsWith("http")) {
          // New image selected - send as FormData
          const formData = new FormData();
          formData.append("name", name);
          const filename = categoryImageUri.split("/").pop() || "category_image.jpg";
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
      } else if (modalType === "addBrand") {
        await apiClient.post("/api/v1/brands", { name });
      } else if (modalType === "editBrand" && selectedId) {
        await apiClient.put(`/api/v1/brands/${selectedId}`, { name });
      } else if (modalType === "addColor") {
        await apiClient.post("/api/v1/colors", { name });
      } else if (modalType === "editColor" && selectedId) {
        await apiClient.put(`/api/v1/colors/${selectedId}`, { name });
      }

      Alert.alert("Success", "Resource saved successfully.");
      closeModal();
      loadAllData();
    } catch (err: any) {
      console.log("Resource save error:", err);
      Alert.alert("Save Failed", err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  // DELETE RESOURCE
  const handleDeleteResource = (type: "category" | "brand" | "color", id: string) => {
    Alert.alert("Confirm Delete", `Delete this ${type} permanently?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            setLoading(true);
            if (type === "category") {
              await apiClient.delete(`/api/v1/categories/${id}`);
            } else if (type === "brand") {
              await apiClient.delete(`/api/v1/brands/${id}`);
            } else if (type === "color") {
              await apiClient.delete(`/api/v1/colors/${id}`);
            }
            Alert.alert("Success", `${type} deleted.`);
            loadAllData();
          } catch (err: any) {
            Alert.alert("Delete Failed", err.response?.data?.message || err.message);
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  // UPDATE ORDER STATUS
  const handleUpdateOrderStatus = async () => {
    if (!selectedOrder) return;
    try {
      setLoading(true);
      await apiClient.put(`/api/v1/orders/update/${selectedOrder._id}`, {
        status: orderStatusForm,
      });
      Alert.alert("Success", "Order shipment status updated.");
      closeModal();
      loadAllData();
    } catch (err: any) {
      console.log("Order status update error:", err);
      Alert.alert("Failed", err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  // Derived customers
  const customerUsers = orders.map((order) => order.user as any).filter(Boolean);
  const uniqueCustomers = Array.from(
    new Map(customerUsers.map((cust) => [cust.email, cust])).values()
  ) as any[];

  const getStatusColor = (status?: string) => {
    const s = (status || "").toLowerCase();
    if (s === "paid" || s === "delivered") return colors.success;
    if (s === "pending" || s === "processing") return colors.warning;
    if (s === "shipped") return colors.primary;
    return colors.error;
  };

  // Switch size selection
  const toggleSize = (size: string) => {
    setProductForm((prev) => {
      const isSelected = prev.sizes.includes(size);
      const nextSizes = isSelected
        ? prev.sizes.filter((s) => s !== size)
        : [...prev.sizes, size];
      return { ...prev, sizes: nextSizes };
    });
  };

  // Switch color selection
  const toggleColorSel = (color: string) => {
    setProductForm((prev) => {
      const isSelected = prev.colors.includes(color);
      const nextColors = isSelected
        ? prev.colors.filter((c) => c !== color)
        : [...prev.colors, color];
      return { ...prev, colors: nextColors };
    });
  };

  return (
    <View style={[styles.mainContainer, { backgroundColor: colors.background }]}>
      {/* View Header with back button */}
      <View style={[styles.viewHeader, { borderBottomColor: colors.border }]}>
        {activeView !== "dashboard" && (
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => setActiveView("dashboard")}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back-outline" size={24} color={colors.text} />
          </TouchableOpacity>
        )}
        <Text variant="lg" weight="bold" style={styles.headerTitle}>
          {activeView === "dashboard"
            ? "Admin Control Panel"
            : activeView === "orders"
            ? "Manage Orders"
            : activeView === "products"
            ? "Manage Products"
            : activeView === "categories"
            ? "Manage Categories"
            : activeView === "brands"
            ? "Manage Brands"
            : activeView === "colors"
            ? "Manage Colors"
            : activeView === "coupons"
            ? "Manage Coupons"
            : "Customers Ledger"}
        </Text>
        {activeView !== "dashboard" && activeView !== "customers" && (
          <TouchableOpacity
            style={[styles.addFloatingBtn, { backgroundColor: colors.primaryLight }]}
            onPress={() => {
              if (activeView === "products") openModal("addProduct");
              else if (activeView === "coupons") openModal("addCoupon");
              else if (activeView === "categories") openModal("addCategory");
              else if (activeView === "brands") openModal("addBrand");
              else if (activeView === "colors") openModal("addColor");
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={20} color={colors.primary} />
          </TouchableOpacity>
        )}
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

        {/* ==================== 1. DASHBOARD VIEW ==================== */}
        {activeView === "dashboard" && (
          <View>
            {/* Statistics Cards */}
            <View style={styles.statsGrid}>
              <Card style={[styles.statsCard, { flex: 1.1 }]}>
                <Ionicons name="trending-up" size={20} color={colors.primary} />
                <Text variant="xs" color={colors.textMuted} style={{ marginTop: 4 }}>
                  Total Sales
                </Text>
                <Text variant="md" weight="bold" color={colors.primary} style={{ marginTop: 2 }}>
                  ${stats ? stats.totalSales.toFixed(2) : "0.00"}
                </Text>
              </Card>

              <Card style={[styles.statsCard, { flex: 0.9 }]}>
                <Ionicons name="today" size={20} color={colors.success} />
                <Text variant="xs" color={colors.textMuted} style={{ marginTop: 4 }}>
                  Sales Today
                </Text>
                <Text variant="md" weight="bold" color={colors.success} style={{ marginTop: 2 }}>
                  ${saleToday ? saleToday.toFixed(2) : "0.00"}
                </Text>
              </Card>
            </View>

            <View style={styles.statsGrid}>
              <Card style={styles.statsCard}>
                <Ionicons name="bar-chart-outline" size={18} color={colors.textMuted} />
                <Text variant="xs" color={colors.textMuted} style={{ marginTop: 4 }}>
                  Avg. Sale
                </Text>
                <Text variant="sm" weight="semibold" style={{ marginTop: 2 }}>
                  ${stats ? stats.avgSale.toFixed(1) : "0.00"}
                </Text>
              </Card>

              <Card style={styles.statsCard}>
                <Ionicons name="arrow-up-circle-outline" size={18} color={colors.textMuted} />
                <Text variant="xs" color={colors.textMuted} style={{ marginTop: 4 }}>
                  Max Sale
                </Text>
                <Text variant="sm" weight="semibold" style={{ marginTop: 2 }}>
                  ${stats ? stats.maxSale.toFixed(1) : "0.00"}
                </Text>
              </Card>

              <Card style={styles.statsCard}>
                <Ionicons name="receipt-outline" size={18} color={colors.textMuted} />
                <Text variant="xs" color={colors.textMuted} style={{ marginTop: 4 }}>
                  Orders Count
                </Text>
                <Text variant="sm" weight="semibold" style={{ marginTop: 2 }}>
                  {orders.length}
                </Text>
              </Card>
            </View>

            {/* Menu options grid */}
            <Text variant="md" weight="bold" style={styles.sectionTitle}>
              Operations Control
            </Text>

            <View style={styles.menuGrid}>
              <TouchableOpacity
                style={[styles.menuItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => setActiveView("orders")}
                activeOpacity={0.7}
              >
                <View style={[styles.menuIconCircle, { backgroundColor: colors.primaryLight }]}>
                  <Ionicons name="receipt" size={24} color={colors.primary} />
                </View>
                <Text variant="sm" weight="semibold" style={{ marginTop: SPACING.sm }}>
                  Orders
                </Text>
                <Text variant="xs" color={colors.textMuted} style={{ marginTop: 2 }}>
                  {orders.length} orders log
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.menuItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => setActiveView("products")}
                activeOpacity={0.7}
              >
                <View style={[styles.menuIconCircle, { backgroundColor: colors.primaryLight }]}>
                  <Ionicons name="shirt" size={24} color={colors.primary} />
                </View>
                <Text variant="sm" weight="semibold" style={{ marginTop: SPACING.sm }}>
                  Products
                </Text>
                <Text variant="xs" color={colors.textMuted} style={{ marginTop: 2 }}>
                  {products.length} catalog items
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.menuGrid}>
              <TouchableOpacity
                style={[styles.menuItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => setActiveView("categories")}
                activeOpacity={0.7}
              >
                <View style={[styles.menuIconCircle, { backgroundColor: colors.primaryLight }]}>
                  <Ionicons name="grid" size={24} color={colors.primary} />
                </View>
                <Text variant="sm" weight="semibold" style={{ marginTop: SPACING.sm }}>
                  Categories
                </Text>
                <Text variant="xs" color={colors.textMuted} style={{ marginTop: 2 }}>
                  {categories.length} segments
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.menuItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => setActiveView("coupons")}
                activeOpacity={0.7}
              >
                <View style={[styles.menuIconCircle, { backgroundColor: colors.primaryLight }]}>
                  <Ionicons name="pricetag" size={24} color={colors.primary} />
                </View>
                <Text variant="sm" weight="semibold" style={{ marginTop: SPACING.sm }}>
                  Coupons
                </Text>
                <Text variant="xs" color={colors.textMuted} style={{ marginTop: 2 }}>
                  {coupons.length} discounts
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.menuGrid}>
              <TouchableOpacity
                style={[styles.menuItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => setActiveView("brands")}
                activeOpacity={0.7}
              >
                <View style={[styles.menuIconCircle, { backgroundColor: colors.primaryLight }]}>
                  <Ionicons name="ribbon-outline" size={24} color={colors.primary} />
                </View>
                <Text variant="sm" weight="semibold" style={{ marginTop: SPACING.sm }}>
                  Brands
                </Text>
                <Text variant="xs" color={colors.textMuted} style={{ marginTop: 2 }}>
                  {brands.length} partners
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.menuItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => setActiveView("colors")}
                activeOpacity={0.7}
              >
                <View style={[styles.menuIconCircle, { backgroundColor: colors.primaryLight }]}>
                  <Ionicons name="color-palette" size={24} color={colors.primary} />
                </View>
                <Text variant="sm" weight="semibold" style={{ marginTop: SPACING.sm }}>
                  Colors
                </Text>
                <Text variant="xs" color={colors.textMuted} style={{ marginTop: 2 }}>
                  {colorsList.length} swatches
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.menuGrid}>
              <TouchableOpacity
                style={[styles.menuItem, { backgroundColor: colors.surface, borderColor: colors.border, width: "100%" }]}
                onPress={() => setActiveView("customers")}
                activeOpacity={0.7}
              >
                <View style={[styles.menuIconCircle, { backgroundColor: colors.primaryLight }]}>
                  <Ionicons name="people" size={24} color={colors.primary} />
                </View>
                <Text variant="sm" weight="semibold" style={{ marginTop: SPACING.sm }}>
                  Customers Ledger
                </Text>
                <Text variant="xs" color={colors.textMuted} style={{ marginTop: 2 }}>
                  {uniqueCustomers.length} unique buyers
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ==================== 2. ORDERS VIEW ==================== */}
        {activeView === "orders" && (
          <View>
            {orders.length === 0 ? (
              <Text variant="sm" color={colors.textMuted} align="center" style={{ marginTop: SPACING.xxl }}>
                No orders registered on server yet.
              </Text>
            ) : (
              orders.map((order) => {
                const isExpanded = expandedOrderId === order._id;
                const buyer = order.user as any;
                const statusCol = getStatusColor(order.status);
                const payCol = getStatusColor(order.paymentStatus);

                return (
                  <Card key={order._id} style={styles.orderCard}>
                    <TouchableOpacity
                      style={styles.orderHeaderRow}
                      onPress={() => toggleOrderExpand(order._id)}
                      activeOpacity={0.9}
                    >
                      <View style={{ flex: 1 }}>
                        <Text variant="sm" weight="bold">
                          Order #{order.orderNumber}
                        </Text>
                        <Text variant="xs" color={colors.textMuted} style={{ marginTop: 2 }}>
                          Buyer: {buyer?.fullname || "Unknown"} ({buyer?.email || "N/A"})
                        </Text>
                      </View>
                      <View style={{ alignItems: "flex-end" }}>
                        <Text variant="sm" weight="bold" color={colors.primary}>
                          ${order.totalPrice.toFixed(2)}
                        </Text>
                        <Ionicons
                          name={isExpanded ? "chevron-up" : "chevron-down"}
                          size={18}
                          color={colors.textMuted}
                        />
                      </View>
                    </TouchableOpacity>

                    {/* Quick status badges */}
                    <View style={styles.badgeRow}>
                      <View style={[styles.badgeContainer, { backgroundColor: payCol + "15" }]}>
                        <Text variant="xs" weight="semibold" color={payCol}>
                          Payment: {order.paymentStatus}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={[styles.badgeContainer, { backgroundColor: statusCol + "15" }]}
                        onPress={() => openModal("editOrderStatus", order)}
                        activeOpacity={0.7}
                      >
                        <Text variant="xs" weight="semibold" color={statusCol}>
                          Shipment: {order.status} ✏️
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* Expandable info details */}
                    {isExpanded && (
                      <View style={styles.expandedOrderView}>
                        <View style={[styles.hDivider, { backgroundColor: colors.border }]} />
                        <Text variant="xs" weight="semibold" style={{ marginBottom: SPACING.xs }}>
                          Purchased Items:
                        </Text>
                        {order.orderItems?.map((item, index) => (
                          <View key={item._id || index} style={styles.orderItemRow}>
                            <Text variant="xs" style={{ flex: 1 }}>
                              {item.name} x {item.qty}
                            </Text>
                            <Text variant="xs" color={colors.textMuted}>
                              ${(item.price * item.qty).toFixed(2)}
                            </Text>
                          </View>
                        ))}

                        <View style={[styles.hDivider, { backgroundColor: colors.border }]} />
                        <Text variant="xs" weight="semibold" style={{ marginBottom: SPACING.xs }}>
                          Shipping Address:
                        </Text>
                        <Text variant="xs" color={colors.textMuted}>
                          {order.shippingAddress?.firstName} {order.shippingAddress?.lastName}
                        </Text>
                        <Text variant="xs" color={colors.textMuted}>
                          {order.shippingAddress?.address}, {order.shippingAddress?.city}
                        </Text>
                        <Text variant="xs" color={colors.textMuted}>
                          {order.shippingAddress?.province}, {order.shippingAddress?.country}
                        </Text>
                        <Text variant="xs" color={colors.textMuted}>
                          Phone: {order.shippingAddress?.phone}
                        </Text>
                      </View>
                    )}
                  </Card>
                );
              })
            )}
          </View>
        )}

        {/* ==================== 3. PRODUCTS VIEW ==================== */}
        {activeView === "products" && (
          <View>
            {products.length === 0 ? (
              <Text variant="sm" color={colors.textMuted} align="center" style={{ marginTop: SPACING.xxl }}>
                No products found. Add some using the "+" button in the header.
              </Text>
            ) : (
              products.map((prod) => (
                <Card key={prod._id} style={styles.productCard}>
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
                      onPress={() => openModal("editProduct", prod)}
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
              ))
            )}
          </View>
        )}

        {/* ==================== 4. CATEGORIES VIEW ==================== */}
        {activeView === "categories" && (
          <View>
            {categories.length === 0 ? (
              <Text variant="sm" color={colors.textMuted} align="center" style={{ marginTop: SPACING.xxl }}>
                No categories saved.
              </Text>
            ) : (
              categories.map((cat) => (
                <Card key={cat._id} style={[styles.listCard, { alignItems: "center" }]}>
                  {/* Category thumbnail */}
                  {(cat as any).image ? (
                    <Image
                      source={{ uri: (cat as any).image }}
                      style={styles.categoryThumb}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[styles.categoryThumbPlaceholder, { backgroundColor: colors.inputBg }]}>
                      <Ionicons name="image-outline" size={20} color={colors.textMuted} />
                    </View>
                  )}
                  <Text variant="sm" weight="semibold" style={{ flex: 1, marginLeft: SPACING.sm }}>
                    {cat.name.toUpperCase()}
                  </Text>
                  <View style={styles.listCardActions}>
                    <TouchableOpacity
                      style={styles.listActionIcon}
                      onPress={() => openModal("editCategory", cat)}
                    >
                      <Ionicons name="create-outline" size={18} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.listActionIcon}
                      onPress={() => handleDeleteResource("category", cat._id)}
                    >
                      <Ionicons name="trash-outline" size={18} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                </Card>
              ))
            )}
          </View>
        )}

        {/* ==================== 5. BRANDS VIEW ==================== */}
        {activeView === "brands" && (
          <View>
            {brands.length === 0 ? (
              <Text variant="sm" color={colors.textMuted} align="center" style={{ marginTop: SPACING.xxl }}>
                No brands saved.
              </Text>
            ) : (
              brands.map((br) => (
                <Card key={br._id} style={styles.listCard}>
                  <Text variant="sm" weight="semibold" style={{ flex: 1 }}>
                    {br.name.toUpperCase()}
                  </Text>
                  <View style={styles.listCardActions}>
                    <TouchableOpacity
                      style={styles.listActionIcon}
                      onPress={() => openModal("editBrand", br)}
                    >
                      <Ionicons name="create-outline" size={18} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.listActionIcon}
                      onPress={() => handleDeleteResource("brand", br._id)}
                    >
                      <Ionicons name="trash-outline" size={18} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                </Card>
              ))
            )}
          </View>
        )}

        {/* ==================== 6. COLORS VIEW ==================== */}
        {activeView === "colors" && (
          <View>
            {colorsList.length === 0 ? (
              <Text variant="sm" color={colors.textMuted} align="center" style={{ marginTop: SPACING.xxl }}>
                No colors saved.
              </Text>
            ) : (
              colorsList.map((col) => (
                <Card key={col._id} style={styles.listCard}>
                  <View style={styles.colorRowContent}>
                    <View style={[styles.colorColorIndicator, { backgroundColor: col.name.toLowerCase() }]} />
                    <Text variant="sm" weight="semibold" style={{ marginLeft: 8 }}>
                      {col.name.toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.listCardActions}>
                    <TouchableOpacity
                      style={styles.listActionIcon}
                      onPress={() => openModal("editColor", col)}
                    >
                      <Ionicons name="create-outline" size={18} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.listActionIcon}
                      onPress={() => handleDeleteResource("color", col._id)}
                    >
                      <Ionicons name="trash-outline" size={18} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                </Card>
              ))
            )}
          </View>
        )}

        {/* ==================== 7. COUPONS VIEW ==================== */}
        {activeView === "coupons" && (
          <View>
            {coupons.length === 0 ? (
              <Text variant="sm" color={colors.textMuted} align="center" style={{ marginTop: SPACING.xxl }}>
                No active coupons on server.
              </Text>
            ) : (
              coupons.map((cop) => {
                const startD = new Date(cop.startDate).toLocaleDateString();
                const endD = new Date(cop.endDate).toLocaleDateString();

                return (
                  <Card key={cop._id} style={styles.couponCard}>
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
                        onPress={() => openModal("editCoupon", cop)}
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
          </View>
        )}

        {/* ==================== 8. CUSTOMERS VIEW ==================== */}
        {activeView === "customers" && (
          <View>
            {uniqueCustomers.length === 0 ? (
              <Text variant="sm" color={colors.textMuted} align="center" style={{ marginTop: SPACING.xxl }}>
                No customer transactions recorded in system yet.
              </Text>
            ) : (
              uniqueCustomers.map((cust, index) => (
                <Card key={cust._id || index} style={styles.customerCard}>
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
                        Address: {cust.shippingAddress.address}, {cust.shippingAddress.city}
                      </Text>
                      <Text variant="xs" color={colors.textMuted} style={{ marginTop: 2 }}>
                        Region: {cust.shippingAddress.province}, {cust.shippingAddress.country}
                      </Text>
                      <Text variant="xs" color={colors.textMuted} style={{ marginTop: 2 }}>
                        Phone: {cust.shippingAddress.phone}
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
          </View>
        )}
      </ScrollView>

      {/* ==================== EDIT & ADD MODALS SHEET ==================== */}
      <Modal visible={isModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text variant="md" weight="bold">
                {modalType === "addProduct"
                  ? "Add Product"
                  : modalType === "editProduct"
                  ? "Edit Product"
                  : modalType === "addCoupon"
                  ? "Add Coupon"
                  : modalType === "editCoupon"
                  ? "Edit Coupon"
                  : modalType === "editOrderStatus"
                  ? "Update Status"
                  : "Add Details"}
              </Text>
              <TouchableOpacity onPress={closeModal}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll}>
              {/* Product Form */}
              {(modalType === "addProduct" || modalType === "editProduct") && (
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
                  </View>

                  {/* Product image picker — only for Add mode */}
                  {modalType === "addProduct" && (
                    <View style={{ marginTop: SPACING.md }}>
                      <Text variant="xs" weight="bold" color={colors.textMuted} style={{ marginBottom: SPACING.sm }}>
                        Product Images
                      </Text>
                      <TouchableOpacity
                        style={[styles.imagePickerBtn, { borderColor: colors.border, backgroundColor: colors.inputBg }]}
                        onPress={pickProductImages}
                        activeOpacity={0.7}
                      >
                        {productImageUris.length > 0 ? (
                          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ padding: SPACING.xs }}>
                            {productImageUris.map((uri, idx) => (
                              <View key={idx} style={{ position: "relative", marginRight: SPACING.sm }}>
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
                        ) : (
                          <View style={styles.imagePickerEmpty}>
                            <Ionicons name="images-outline" size={28} color={colors.textMuted} />
                            <Text variant="xs" color={colors.textMuted} style={{ marginTop: 6 }}>
                              Tap to add product photos
                            </Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}

              {/* Resource Form (Category, Brand, Color) */}
              {(modalType === "addCategory" ||
                modalType === "editCategory" ||
                modalType === "addBrand" ||
                modalType === "editBrand" ||
                modalType === "addColor" ||
                modalType === "editColor") && (
                <View>
                  <Input
                    label={modalType?.includes("Category") ? "Category Name" : modalType?.includes("Brand") ? "Brand Name" : "Color Name"}
                    placeholder={modalType?.includes("Category") ? "e.g. Electronics, Footwear" : modalType?.includes("Brand") ? "e.g. Adidas, Nike" : "e.g. Red, Navy Blue"}
                    value={singleNameInput}
                    onChangeText={setSingleNameInput}
                  />

                  {/* Image picker — only for Categories */}
                  {(modalType === "addCategory" || modalType === "editCategory") && (
                    <View style={{ marginTop: SPACING.md }}>
                      <Text variant="xs" weight="bold" color={colors.textMuted} style={{ marginBottom: SPACING.sm }}>
                        Category Image (Optional)
                      </Text>
                      <TouchableOpacity
                        style={[styles.imagePickerBtn, { borderColor: colors.border, backgroundColor: colors.inputBg }]}
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
                            <Ionicons name="cloud-upload-outline" size={28} color={colors.textMuted} />
                            <Text variant="xs" color={colors.textMuted} style={{ marginTop: 6 }}>
                              Tap to select image
                            </Text>
                          </View>
                        )}
                      </TouchableOpacity>
                      {categoryImageUri && (
                        <TouchableOpacity
                          onPress={() => setCategoryImageUri(null)}
                          style={{ alignSelf: "flex-end", marginTop: 4 }}
                        >
                          <Text variant="xs" color={colors.error}>Remove Image</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>
              )}

              {/* Coupon Form */}
              {(modalType === "addCoupon" || modalType === "editCoupon") && (
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
              )}

              {/* Order Status Form */}
              {modalType === "editOrderStatus" && selectedOrder && (
                <View>
                  <Text variant="sm" weight="semibold" style={{ marginBottom: SPACING.md }}>
                    Choose Shipment Status for #{selectedOrder.orderNumber}:
                  </Text>
                  {["pending", "processing", "shipped", "delivered"].map((st) => (
                    <TouchableOpacity
                      key={st}
                      style={[
                        styles.statusSelectRow,
                        { borderColor: colors.border },
                        orderStatusForm === st && { backgroundColor: colors.inputBg },
                      ]}
                      onPress={() => setOrderStatusForm(st as any)}
                    >
                      <Ionicons
                        name={orderStatusForm === st ? "radio-button-on" : "radio-button-off"}
                        size={20}
                        color={colors.primary}
                      />
                      <Text variant="sm" weight="medium" style={{ marginLeft: 8 }}>
                        {st.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Modal Save action */}
              <Button
                title="Save Changes"
                onPress={() => {
                  if (modalType === "addProduct" || modalType === "editProduct") handleSaveProduct();
                  else if (modalType === "addCoupon" || modalType === "editCoupon") handleSaveCoupon();
                  else if (modalType === "editOrderStatus") handleUpdateOrderStatus();
                  else handleSaveResource();
                }}
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
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
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
  statsGrid: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  statsCard: {
    padding: SPACING.md,
    alignItems: "flex-start",
  },
  sectionTitle: {
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
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
  menuIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  orderCard: {
    marginBottom: SPACING.md,
    padding: SPACING.md,
  },
  orderHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  badgeRow: {
    flexDirection: "row",
    marginTop: SPACING.md,
    gap: SPACING.xs,
  },
  badgeContainer: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.xs,
  },
  expandedOrderView: {
    marginTop: SPACING.sm,
  },
  hDivider: {
    height: 1,
    marginVertical: SPACING.sm,
  },
  orderItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 2,
  },
  productCard: {
    marginBottom: SPACING.md,
    padding: SPACING.md,
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
  listCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  listCardActions: {
    flexDirection: "row",
    gap: SPACING.md,
  },
  listActionIcon: {
    padding: 4,
  },
  colorRowContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  colorColorIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  couponCard: {
    padding: SPACING.md,
    marginBottom: SPACING.sm,
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
  customerCard: {
    padding: SPACING.md,
    marginBottom: SPACING.sm,
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
  statusSelectRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.md,
    borderWidth: 1.5,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
  },
  // Image picker
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
  imagePickerPreview: {
    width: "100%",
    height: 140,
  },
  // Category thumbnails in list
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
  // Product images in picker
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
});
