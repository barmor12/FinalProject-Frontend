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
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [showHorizontalScroll, setShowHorizontalScroll] = useState(true);

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
      if (!prev) setSearchText(""); // איפוס החיפוש כשהוא נסגר
      return !prev;
    });
    setShowHorizontalScroll((prev) => !prev);
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
    router.push({
      pathname: "/ProductDetailsScreenAdmin",
      params: { product: JSON.stringify(product) },
    });
  };

  const navigateToAddProduct = () => {
    router.push("/AddProductScreenAdmin");
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={navigateToAddProduct} style={styles.addButton}>
          <Ionicons name="add-circle" size={28} color="#fff" />
        </TouchableOpacity>
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

      {showHorizontalScroll && (
        <View style={styles.horizontalScrollContainer}>
          <Text style={styles.title}>🔥 Hot Cakes</Text>
          <FlatList
            data={filteredProducts}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.horizontalProductCard}
                onPress={() => navigateToProduct(item)}
              >
                <Image
                  source={{ uri: item.image }}
                  style={styles.productImage}
                />
                <Text style={styles.productName}>{item.name}</Text>
              </TouchableOpacity>
            )}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.hotCakeList}
          />
        </View>
      )}

      <Text style={styles.title}>🍰 Our Cakes</Text>
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.productCard}
            onPress={() => navigateToProduct(item)}
          >
            <Image source={{ uri: item.image }} style={styles.productImage} />
            <Text style={styles.productName}>{item.name}</Text>
          </TouchableOpacity>
        )}
        numColumns={2}
        columnWrapperStyle={styles.row}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, backgroundColor: "#f9f3ea" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  addButton: { backgroundColor: "#6b4226", padding: 10, borderRadius: 8 },
  rightHeader: { flexDirection: "row", alignItems: "center" },
  searchInput: {
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: "#fff",
  },
  SearchBtn: { backgroundColor: "#d49a6a", padding: 10, borderRadius: 8 },
  title: { fontSize: 22, fontWeight: "bold", color: "#6b4226", textAlign: "center" },
  productCard: { backgroundColor: "#fff", padding: 10, borderRadius: 8, marginBottom: 16, alignItems: "center", width: "48%", elevation: 2 },
  productImage: { width: 120, height: 120, borderRadius: 8, marginBottom: 10 },
  productName: { fontSize: 14, fontWeight: "bold", color: "#6b4226", textAlign: "center" },
  row: { justifyContent: "space-between" },
  horizontalScrollContainer: { marginBottom: 8 },
  horizontalProductCard: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: "center",
    width: 150,
    elevation: 2,
  },
  hotCakeList: {
    paddingHorizontal: 8,
  },
});