import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import config from "@/config";

interface Product {
  _id: string;
  name: string;
  image: string;
  description: string;
  ingredients: string[];
  price: number;
}

export default function InventoryScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const handleSearch = (text: string) => {
    setSearchText(text);
    if (text.trim() === "") {
      setFilteredProducts(products);
    } else {
      setFilteredProducts(
        products.filter((product) =>
          product.name.toLowerCase().includes(text.toLowerCase())
        )
      );
    }
  };

  const toggleSearch = () => {
    setSearchVisible((prev) => {
      if (!prev) setSearchText("");
      return !prev;
    });
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${config.BASE_URL}/cakes`, {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.statusText}`);
      }

      const data = await response.json();
      if (!Array.isArray(data)) {
        throw new Error("Unexpected response format from server");
      }

      const updatedProducts = data.map((product) => ({
        ...product,
        image: product.image?.startsWith("http")
          ? product.image
          : "https://via.placeholder.com/150",
      }));

      setProducts(updatedProducts);
      setFilteredProducts(updatedProducts);
    } catch (error) {
      console.error("Error fetching products:", error);
      Alert.alert("Error", "Failed to fetch products. Please try again later.");
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchProducts();
    }, [])
  );

  useEffect(() => {
    setFilteredProducts(products);
  }, [products]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProducts();
    setRefreshing(false);
  };

  const navigateToProduct = (product: Product) => {
    if (isSelectionMode) {
      toggleSelectProduct(product._id);
    } else {
      router.push({
        pathname: "/ProductDetailsScreenAdmin",
        params: { product: JSON.stringify(product) },
      });
    }
  };

  const navigateToAddProduct = () => {
    router.push("/AddProductScreenAdmin");
  };

  const toggleSelectProduct = (productId: string) => {
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const deleteSelectedProducts = async () => {
    if (selectedProducts.length === 0) {
      Alert.alert("Error", "No products selected for deletion.");
      return;
    }

    Alert.alert(
      "Confirm Deletion",
      `Are you sure you want to delete ${selectedProducts.length} products?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await fetch(`${config.BASE_URL}/cakes/deletecake`, {
                method: "DELETE",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ productIds: selectedProducts }),
              });

              if (!response.ok) {
                throw new Error("Failed to delete products");
              }

              setProducts((prev) =>
                prev.filter((product) => !selectedProducts.includes(product._id))
              );
              setSelectedProducts([]);
              setIsSelectionMode(false);
              Alert.alert("Success", "Selected products have been deleted.");
            } catch (error) {
              console.error("Error deleting products:", error);
              Alert.alert("Error", "Failed to delete products.");
            }
          },
        },
      ]
    );
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode((prev) => {
      if (!prev) {
        setSelectedProducts([]); // אם נכנסים למצב בחירה - מאפסים בחירות
      }
      return !prev;
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.addButton} onPress={navigateToAddProduct}>
          <Ionicons name="add-circle-outline" size={28} color="#6b4226" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.selectButton} onPress={toggleSelectionMode}>
          <Ionicons
            name={isSelectionMode ? "close-circle-outline" : "checkbox-outline"}
            size={28}
            color={isSelectionMode ? "red" : "#6b4226"}
          />
        </TouchableOpacity>

        {isSelectionMode && selectedProducts.length > 0 && (
          <TouchableOpacity style={styles.deleteButton} onPress={deleteSelectedProducts}>
            <Ionicons name="trash-outline" size={28} color="red" />
          </TouchableOpacity>
        )}

        <View style={styles.rightHeader}>
          {searchVisible && (
            <TextInput
              style={styles.searchInput}
              placeholder="Search..."
              value={searchText}
              onChangeText={handleSearch}
              autoFocus
            />
          )}
          <TouchableOpacity onPress={toggleSearch} style={styles.SearchBtn}>
            <Ionicons
              name={searchVisible ? "close" : "search"}
              size={24}
              color="#fff"
            />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.title}>All Cakes</Text>
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.productCard,
              isSelectionMode && selectedProducts.includes(item._id) ? styles.selectedProduct : {},
            ]}
            onPress={() => navigateToProduct(item)}
          >
            <Image source={{ uri: item.image }} style={styles.productImage} />
            <Text style={styles.productName}>{item.name}</Text>
            {isSelectionMode && selectedProducts.includes(item._id) && (
              <Ionicons name="checkmark-circle" size={24} color="green" />
            )}
          </TouchableOpacity>
        )}
        numColumns={2}
        columnWrapperStyle={styles.row}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, backgroundColor: "#f9f3ea" },
  selectButton: { marginRight: 10 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  addButton: {
    marginRight: 10,
  },
  deleteButton: {
    marginRight: 10,
  },
  rightHeader: { flexDirection: "row", alignItems: "center" },
  searchInput: {
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: "#fff",
  },
  SearchBtn: { backgroundColor: "#d49a6a", padding: 10, borderRadius: 8 },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#6b4226",
    textAlign: "center",
    marginVertical: 10,
  },
  productCard: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: "center",
    width: "48%",
    elevation: 2,
  },
  selectedProduct: {
    borderColor: "green",
    borderWidth: 2,
  },
  productImage: { width: 120, height: 120, borderRadius: 8, marginBottom: 10 },
  productName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#6b4226",
    textAlign: "center",
  },
  row: { justifyContent: "space-between" },
});