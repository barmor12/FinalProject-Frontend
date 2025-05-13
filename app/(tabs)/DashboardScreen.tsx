import React, { useState, useEffect, useCallback } from "react";
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
import config from "../../config";
import { fetchUserData } from "../utils/fetchUserData";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface Product {
  _id: string;
  name: string;
  image: string;
  description: string;
  ingredients: string[];
  price: number;
  stock: number;
}

// Filter products based on search input and liked status
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
  const [likedProducts, setLikedProducts] = useState<Set<string>>(new Set());
  // State variable to determine whether to display only liked products
  const [showOnlyLiked, setShowOnlyLiked] = useState(false);

  const handleSearch = (text: string) => {
    setSearchText(text);
    if (text.trim() === "") {
      // If search is cleared and "liked" mode is enabled, filter based on likedProducts
      if (showOnlyLiked) {
        setFilteredProducts(
          products.filter((product) => likedProducts.has(product._id))
        );
      } else {
        setFilteredProducts(products);
      }
    } else {
      const searched = products.filter((product) =>
        product.name.toLowerCase().includes(text.toLowerCase())
      );
      // If "liked" mode is enabled, further filter by likedProducts
      if (showOnlyLiked) {
        setFilteredProducts(
          searched.filter((product) => likedProducts.has(product._id))
        );
      } else {
        setFilteredProducts(searched);
      }
    }
  };

  // Toggle the search input visibility
  const toggleSearch = () => {
    setSearchVisible((prev) => {
      if (!prev) setSearchText(""); // Reset search text when search is closed
      return !prev;
    });
    setShowHorizontalScroll((prev) => !prev); // Toggle horizontal scroll visibility with search
  };

  // Toggle display of only liked products
  const toggleShowFavorites = () => {
    setShowOnlyLiked((prev) => {
      const newVal = !prev;
      if (newVal) {
        // Filter products to show only liked products
        setFilteredProducts(products.filter((p) => likedProducts.has(p._id)));
      } else {
        // Show all products
        setFilteredProducts(products);
      }
      return newVal;
    });
  };

  // Fetch user data and update UI
  const fetchUserDataAndSetState = async () => {
    try {
      const userData = await fetchUserData();
      setUser({
        name: `Hi ${userData.firstName}` || "Guest",
        profilePic:
          userData.profilePic.url ||
          require("../../assets/images/userIcon.png"),
      });
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  // Fetch product list and liked status, update filtered view
  const fetchProducts = async () => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      const userId = await AsyncStorage.getItem("userID");

      const productsResponse = await fetch(`${config.BASE_URL}/cakes`, {
        method: "GET",
      });
      if (!productsResponse.ok)
        throw new Error(
          `Failed to fetch products: ${productsResponse.statusText}`
        );
      const productsData = await productsResponse.json();

      const updatedProducts = productsData.map((product: any) => ({
        ...product,
        image: product.image?.url?.startsWith("http")
          ? product.image.url
          : "https://via.placeholder.com/150",
      }));

      setProducts(updatedProducts);
      // If "liked" mode is enabled, filter by likedProducts; otherwise, display all products
      setFilteredProducts(
        showOnlyLiked
          ? updatedProducts.filter((p: Product) => likedProducts.has(p._id))
          : updatedProducts
      );

      if (token && userId) {
        const likesResponse = await fetch(
          `${config.BASE_URL}/cakes/favorites/${userId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!likesResponse.ok)
          throw new Error("Failed to fetch liked products");
        const likedData = await likesResponse.json();

        // Map favorites to a set of product IDs only
        setLikedProducts(
          new Set(
            likedData.favorites.map((product: { _id: string }) => product._id)
          )
        );
      }
    } catch (error) {
      console.error("Error fetching products or likes:", error);
      Alert.alert(
        "Error",
        "Failed to fetch products or likes. Please try again later."
      );
    }
  };

  // Fetch user data and products when component mounts
  useEffect(() => {
    fetchUserDataAndSetState();
    fetchProducts();
  }, []);

  // Refetch user data and products when screen gains focus
  useFocusEffect(
    React.useCallback(() => {
      fetchProducts();
      fetchUserDataAndSetState();
    }, [])
  );

  useEffect(() => {
    // Update filteredProducts whenever the products list, likedProducts, or "liked" mode changes
    setFilteredProducts(
      showOnlyLiked
        ? products.filter((p) => likedProducts.has(p._id))
        : products
    );
  }, [products, likedProducts, showOnlyLiked]);

  // Refresh products and user data on pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProducts();
    await fetchUserDataAndSetState();
    setRefreshing(false);
  };

  // Navigate to product detail screen
  const navigateToProduct = (product: Product) => {
    router.push({
      pathname: "/ProductDetailsScreen",
      params: { product: JSON.stringify(product) },
    });
  };

  // Add or remove product from user's favorites
  const handleLike = async (cakeId: string) => {
    const token = await AsyncStorage.getItem("accessToken");
    const userId = await AsyncStorage.getItem("userID"); // Assumes userId is stored in AsyncStorage

    if (!token || !userId) {
      Alert.alert("Error", "Please login to save favorites.");
      return;
    }

    const isLiked = likedProducts.has(cakeId);
    const endpoint = `${config.BASE_URL}/cakes/favorites`;

    try {
      const response = await fetch(endpoint, {
        method: isLiked ? "DELETE" : "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, cakeId }), // Sends userId and cakeId as defined by backend
      });

      if (!response.ok) throw new Error("Failed to update favorites");

      setLikedProducts((prevLiked) => {
        const updatedLiked = new Set(prevLiked);
        if (isLiked) updatedLiked.delete(cakeId);
        else updatedLiked.add(cakeId);
        return updatedLiked;
      });
    } catch (error) {
      console.error("Error updating favorites:", error);
      Alert.alert("Error", "Could not update favorites.");
    }
  };

  // Render horizontal product card
  const renderProductCardHorizontal = ({ item }: { item: Product }) => {
    return (
      <TouchableOpacity
        style={styles.horizontalProductCard}
        onPress={() => {
          if (item.stock > 0) {
            navigateToProduct(item);
          }
        }}
      >
        <Image source={{ uri: item.image }} style={styles.productImage} />
        <Text style={styles.productName}>{item.name}</Text>
        {item.stock <= 0 ? (
          <Text style={styles.outOfStockText}>Out of Stock</Text>
        ) : (
          <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
        )}
      </TouchableOpacity>
    );
  };
  // Render vertical product card with like button
  const renderProductCardVertical = ({ item }: { item: Product }) => {
    return (
      <TouchableOpacity
        style={styles.productCardHorizon}
        onPress={() => {
          if (item.stock > 0) {
            navigateToProduct(item);
          }
        }}
      >
        <Image source={{ uri: item.image }} style={styles.productImage} />
        <Text style={styles.productName}>{item.name}</Text>
        {item.stock <= 0 ? (
          <Text style={styles.outOfStockText}>Out of Stock</Text>
        ) : (
          <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
        )}
        <TouchableOpacity
          onPress={() => handleLike(item._id)}
          style={styles.favoriteButton}
        >
          <Ionicons
            name={likedProducts.has(item._id) ? "heart" : "heart-outline"}
            size={24}
            color={likedProducts.has(item._id) ? "#d9534f" : "#ccc"}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.leftHeader}>
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
        </View>

        <View style={styles.centerHeader}>
          <TouchableOpacity
            onPress={toggleShowFavorites}
            style={styles.favoritesHeaderButton}
          >
            <Ionicons name="heart" size={20} color="#d9534f" />
          </TouchableOpacity>
        </View>

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
            renderItem={renderProductCardHorizontal}
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
        renderItem={renderProductCardVertical}
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
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: "#f9f3ea",
    marginBottom: 30,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  leftHeader: {
    flex: 1,
    alignItems: "flex-start",
  },
  centerHeader: {
    flex: 1,
    alignItems: "center",
  },

  profileContainer: { flexDirection: "row", alignItems: "center" },
  profileImage: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  userName: { fontSize: 16, fontWeight: "bold", color: "#6b4226" },
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
  },
  favoritesButton: {
    backgroundColor: "#6b4226",
    paddingVertical: 8,
    borderRadius: 8,
    marginVertical: 8,
    alignItems: "center",
  },
  favoritesButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  favoriteButton: { position: "absolute", bottom: 8, right: 8 },
  hotCakeList: { paddingHorizontal: 8 },
  horizontalScrollContainer: { marginBottom: 8 },
  productCardHorizon: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    alignItems: "center",
    justifyContent: "space-between",
    width: "48%",
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  horizontalProductCard: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: "center",
    width: 150,
    elevation: 2,
    marginRight: 10,
  },
  favoritesHeaderButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#fff",
    marginEnd: 90,
  },
  productImage: { width: 120, height: 120, borderRadius: 8, marginBottom: 10 },
  productName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#6b4226",
    textAlign: "center",
  },
  row: { justifyContent: "space-between" },
  itemPrice: {},
  outOfStockText: { fontSize: 14, color: "#d9534f", fontWeight: "bold" },
});
