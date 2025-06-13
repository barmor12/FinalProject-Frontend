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
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import config from "../../config";
import { fetchUserData } from "../utils/fetchUserData";
import AsyncStorage from "@react-native-async-storage/async-storage";
import styles from "../styles/DashboardScreenStyles";

interface Product {
  _id: string;
  name: string;
  image: string;
  description: string;
  ingredients: string[]; // Can contain "contains nuts", "gluten-free", etc.
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
  // Sort order state for price sorting
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const handleSearch = (text: string) => {
    setSearchText(text);
    let searched = products;

    if (text.trim() !== "") {
      const lowerText = text.toLowerCase();
      searched = searched.filter(
        (product) =>
          product.name.toLowerCase().includes(lowerText) ||
          product.ingredients.some((ing) => ing.toLowerCase().includes(lowerText))
      );
    }

    setFilteredProducts(
      showOnlyLiked
        ? searched.filter((product) => likedProducts.has(product._id))
        : searched
    );
  };

  // Toggle the search input visibility
  const toggleSearch = () => {
    setSearchVisible((prev) => {
      if (!prev) {
        setSearchText(""); // Reset search text when search is opened
      } else {
        setSearchText(""); // Reset search text when search is closed
        setFilteredProducts(products); // Reset filtered products to show all products
      }
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
      const userId = await AsyncStorage.getItem("userId");

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

  // No need to refetch products on focus to preserve filters
  useFocusEffect(
    React.useCallback(() => {
      // No need to refetch products on focus to preserve filters
      return () => { };
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
    const userId = await AsyncStorage.getItem("userId"); // Assumes userId is stored in AsyncStorage

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

        if (showOnlyLiked) {
          setFilteredProducts(
            (currentProducts) =>
              Array.from(updatedLiked)
                .map((id) => products.find((p) => p._id === id))
                .filter(Boolean) as Product[]
          );
        }

        return updatedLiked;
      });
    } catch (error) {
      console.error("Error updating favorites:", error);
      Alert.alert("Error", "Could not update favorites.");
    }
  };

  // Render horizontal product card as a wide row with favorite button and navigation on press
  const renderProductCardHorizontal = ({ item }: { item: Product }) => {
    const isFavorite = likedProducts.has(item._id);
    return (
      <TouchableOpacity
        onPress={() => {
          if (item.stock > 0) {
            navigateToProduct(item);
          }
        }}
        style={styles.horizontalProductCard}
      >
        <Image source={{ uri: item.image }} style={styles.wideProductImage} />
        <View style={styles.wideProductInfo}>
          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            <Text style={styles.productName}>{item.name}</Text>
            <TouchableOpacity
              onPress={() => handleLike(item._id)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name={isFavorite ? "heart" : "heart-outline"}
                size={24}
                color={isFavorite ? "#d9534f" : "#ccc"}
              />
            </TouchableOpacity>
          </View>
          {item.stock <= 0 ? (
            <Text style={styles.outOfStockText}>Out of Stock</Text>
          ) : (
            <Text style={styles.priceTextRight}>${item.price.toFixed(2)}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };
  // Render vertical product card with like button (modern, favorite highlight)
  const renderProductCardVertical = ({ item }: { item: Product }) => {
    const isFavorite = likedProducts.has(item._id);
    return (
      <View
        style={[
          styles.verticalCardContainer,
          isFavorite && {
            backgroundColor: "#fff4f4",
            borderColor: "#d9534f",
            borderWidth: 1,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.verticalCardTouchable}
          onPress={() => {
            if (item.stock > 0) {
              navigateToProduct(item);
            }
          }}
        >
          <Image source={{ uri: item.image }} style={styles.productImage} />
          <View style={styles.productInfo}>
            <Text style={styles.productName}>{item.name}</Text>
            {item.stock <= 0 ? (
              <Text style={styles.outOfStockLabel}>Out of Stock</Text>
            ) : (
              <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
            )}
            {isFavorite && <Text style={styles.favoriteLabel}>❤️ Favorite</Text>}
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleLike(item._id)}
          style={styles.favoriteButtonTop}
        >
          <Ionicons
            name={isFavorite ? "heart" : "heart-outline"}
            size={22}
            color={isFavorite ? "#d9534f" : "#ccc"}
          />
        </TouchableOpacity>
      </View>
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
        <View style={styles.centerHeader} />
        <View style={styles.rightHeader}>
          <TouchableOpacity onPress={toggleSearch} style={styles.SearchBtn}>
            <Ionicons
              name={searchVisible ? "close" : "search"}
              size={24}
              color="#fff"
            />
          </TouchableOpacity>
        </View>
      </View>
      <View style={{ backgroundColor: "#fff3e6", padding: 20, borderRadius: 10, marginBottom: 10 }}>
        <Text style={{ fontSize: 26, fontWeight: "bold", color: "#6b4226", textAlign: "center" }}>
          Discover Delicious Cakes!
        </Text>
        <Text style={{ fontSize: 14, color: "#6b4226", textAlign: "center", marginTop: 6 }}>
          Browse our collection, mark your favorites and order now 🍰
        </Text>
      </View>

      {searchVisible && (
        <View style={styles.searchBlock}>
          <TextInput
            style={styles.searchInputFull}
            placeholder="Search by name, ingredient, or allergen..."
            value={searchText}
            onChangeText={handleSearch}
            autoFocus
            textAlign="left"
          />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 }}>
            <Text style={{ marginRight: 8, color: "#6b4226" }}>🔍 Try typing:</Text>
            <Text style={{ marginRight: 8, color: "#d49a6a" }}>Chocolate</Text>
            <Text style={{ marginRight: 8, color: "#d49a6a" }}>Gluten</Text>
            <Text style={{ marginRight: 8, color: "#d49a6a" }}>Nuts</Text>
          </View>
        </View>
      )}

      <Text style={styles.title}> Bakey Cakes 🍰</Text>
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={styles.filterChip}
            onPress={toggleShowFavorites}
          >
            <Text style={styles.filterText}>❤️ Favorites</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.filterChip}
            onPress={() => {
              const newOrder = sortOrder === "asc" ? "desc" : "asc";
              setSortOrder(newOrder);
              const sorted = [...filteredProducts].sort((a, b) =>
                newOrder === "asc" ? a.price - b.price : b.price - a.price
              );
              setFilteredProducts(sorted);
            }}
          >
            <Text style={styles.filterText}>
              {sortOrder === "asc" ? "⬆️ Price Low" : "⬇️ Price High"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.filterChip}
            onPress={() => {
              const sortedInStock = [...products]
                .filter((p) => p.stock > 0)
                .sort((a, b) => {
                  const direction = sortOrder === "asc" ? 1 : -1;
                  return direction * (b.stock - a.stock);
                });
              setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
              setFilteredProducts(sortedInStock);
            }}
          >
            <Text style={styles.filterText}>✅ In Stock</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
      <Text style={{ fontSize: 18, fontWeight: "600", marginVertical: 10, color: "#6b4226" }}>
        Explore Cakes
      </Text>
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item._id}
        renderItem={renderProductCardVertical}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: "space-between" }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </SafeAreaView>
  );
}
