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
import config from "@/config";
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
  // משתנה state חדש שמציין האם להציג רק מוצרים אהובים
  const [showOnlyLiked, setShowOnlyLiked] = useState(false);

  const handleSearch = (text: string) => {
    setSearchText(text);
    if (text.trim() === "") {
      // במצב חיפוש סגור, אם גם מצב אהובים מופעל – עדכן לפי likedProducts
      if (showOnlyLiked) {
        setFilteredProducts(products.filter((product) => likedProducts.has(product._id)));
      } else {
        setFilteredProducts(products);
      }
    } else {
      const searched = products.filter((product) =>
        product.name.toLowerCase().includes(text.toLowerCase())
      );
      // אם מופעל מצב "אהובים", מסננים גם לפי זאת
      if (showOnlyLiked) {
        setFilteredProducts(searched.filter((product) => likedProducts.has(product._id)));
      } else {
        setFilteredProducts(searched);
      }
    }
  };

  const toggleSearch = () => {
    setSearchVisible((prev) => {
      if (!prev) setSearchText(""); // איפוס החיפוש כשהוא נסגר
      return !prev;
    });
    setShowHorizontalScroll((prev) => !prev);
  };

  const toggleShowFavorites = () => {
    setShowOnlyLiked((prev) => {
      const newVal = !prev;
      if (newVal) {
        // מסנן מוצרים שאהובים בלבד
        setFilteredProducts(products.filter((p) => likedProducts.has(p._id)));
      } else {
        // מציג את כל המוצרים
        setFilteredProducts(products);
      }
      return newVal;
    });
  };

  const fetchUserDataAndSetState = async () => {
    try {
      const userData = await fetchUserData();
      setUser({
        name: `Hi ${userData.firstName}` || "Guest",
        profilePic:
          userData.profilePic.url || require("../../assets/images/userIcon.png"),
      });
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const fetchProducts = async () => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      const userId = await AsyncStorage.getItem("userID");

      const productsResponse = await fetch(`${config.BASE_URL}/cakes`, { method: "GET" });
      if (!productsResponse.ok) throw new Error(`Failed to fetch products: ${productsResponse.statusText}`);
      const productsData = await productsResponse.json();

      const updatedProducts = productsData.map((product: any) => ({
        ...product,
        image: product.image?.url?.startsWith("http") ? product.image.url : "https://via.placeholder.com/150",
      }));

      setProducts(updatedProducts);
      // אם מופעל מצב "אהובים", מסנן לפי likedProducts, אחרת מציג את כל המוצרים
      setFilteredProducts(showOnlyLiked
        ? updatedProducts.filter((p: Product) => likedProducts.has(p._id))
        : updatedProducts);

      if (token && userId) {
        const likesResponse = await fetch(`${config.BASE_URL}/cakes/favorites/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!likesResponse.ok) throw new Error("Failed to fetch liked products");
        const likedData = await likesResponse.json();

        // ממפה למערך של IDs בלבד
        setLikedProducts(new Set(likedData.favorites.map((product: { _id: string }) => product._id)));
      }
    } catch (error) {
      console.error("Error fetching products or likes:", error);
      Alert.alert("Error", "Failed to fetch products or likes. Please try again later.");
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

  useEffect(() => {
    // מעדכן את המוצרים המסוננים כאשר רשימת המוצרים משתנה
    setFilteredProducts(showOnlyLiked
      ? products.filter((p) => likedProducts.has(p._id))
      : products);
  }, [products, likedProducts, showOnlyLiked]);

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

  const handleLike = async (cakeId: string) => {
    const token = await AsyncStorage.getItem("accessToken");
    const userId = await AsyncStorage.getItem("userID"); // מניח ש-userId שמור ב-AsyncStorage

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
        body: JSON.stringify({ userId, cakeId }), // שולח userId ו-cakeId כמו שמוגדר בבקאנד
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
        <TouchableOpacity onPress={() => handleLike(item._id)} style={styles.favoriteButton}>
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
        {/* צד שמאל: פרופיל */}
        <View style={styles.leftHeader}>
          <TouchableOpacity
            onPress={() => router.push("/ProfileScreen")}
            style={styles.profileContainer}
          >
            <Image source={{ uri: user.profilePic }} style={styles.profileImage} />
            <Text style={styles.userName}>{user.name}</Text>
          </TouchableOpacity>
        </View>

        {/* מרכז: כפתור קטן עם אייקון לב */}
        <View style={styles.centerHeader}>
          <TouchableOpacity onPress={toggleShowFavorites} style={styles.favoritesHeaderButton}>
            <Ionicons name="heart" size={20} color="#d9534f" />
          </TouchableOpacity>
        </View>

        {/* צד ימין: חיפוש */}
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
            <Ionicons name={searchVisible ? "close" : "search"} size={24} color="#fff" />
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
  container: { flex: 1, padding: 15, backgroundColor: "#f9f3ea", marginBottom: 30 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  leftHeader: {
    flex: 1,
    alignItems: "flex-start"
  },
  centerHeader: {
    flex: 1,
    alignItems: "center"
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
    marginRight: 10
  },
  favoritesHeaderButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#fff",
    marginEnd: 90

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
