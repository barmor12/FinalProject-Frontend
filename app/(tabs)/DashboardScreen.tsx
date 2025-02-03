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
import { fetchUserData } from "../utils/fetchUserData";

interface Product {
  _id: string;
  name: string;
  image: string;
  description: string;
  ingredients: string[];
  price: number;
}

export default function DashboardScreen() {
  const [user, setUser] = useState<{ name: string; profilePic: string }>({
    name: "",
    profilePic: "",
  });
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
    setSearchVisible((prev) => !prev);
    setShowHorizontalScroll((prev) => !prev);
  };

  const fetchUserDataAndSetState = async () => {
    try {
      const userData = await fetchUserData();
      setUser({
        name: `Hi ${userData.firstName}` || "Guest",
        profilePic:
          userData.profilePic || require("../../assets/images/userIcon.png"),
      });
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
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
    fetchUserDataAndSetState();
    fetchProducts();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchProducts();
      fetchUserDataAndSetState();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProducts();
    await fetchUserDataAndSetState();
    setRefreshing(false);
  };

  const navigateToProduct = (product: Product) => {
    router.push({
      pathname: "/ProductDetailsScreen",
      params: { product: JSON.stringify(product) },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.push("/ProfileScreen")}
          style={styles.profileContainer}
        >
          <Image
            source={{ uri: user.profilePic }}
            style={styles.profileImage}
          />
          <Text style={styles.userName}>{user.name}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={toggleSearch} style={styles.SearchBtn}>
          <Ionicons name="search" size={24} color="#fff" />
        </TouchableOpacity>
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
  profileContainer: { flexDirection: "row", alignItems: "center" },
  profileImage: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  userName: { fontSize: 16, fontWeight: "bold", color: "#6b4226" },
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
  },
  hotCakeList: { paddingHorizontal: 8 },
  horizontalScrollContainer: { marginBottom: 8 },
  horizontalProductCard: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 8,
    marginHorizontal: 8,
    alignItems: "center",
    width: 140,
    height: 180,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  productCard: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: "center",
    width: "48%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
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
