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
      setFilteredProducts(updatedProducts);

      if (token && userId) {
        const likesResponse = await fetch(`${config.BASE_URL}/cakes/favorites/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!likesResponse.ok) throw new Error("Failed to fetch liked products");
        const likedData = await likesResponse.json();

        // התיקון כאן - ממפה למערך של IDs בלבד
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
    setFilteredProducts(products);
  }, [products]);

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
  container: { flex: 1, padding: 15, backgroundColor: "#f9f3ea" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  favoriteButton: { position: "absolute", bottom: 8, right: 8 },

  hotCakeList: { paddingHorizontal: 8 },
  horizontalScrollContainer: { marginBottom: 8 },
  productCardHorizon: {
    backgroundColor: "#fff",
    padding: 12, // הגדלה קלה של הריפוד כדי שיהיה יותר מרווח
    borderRadius: 10, // יותר מעוגל
    marginBottom: 12, // מרווח קטן יותר למניעת רווחים מיותרים
    alignItems: "center", // מיישר את כל התוכן במרכז
    justifyContent: "space-between", // אם אתה רוצה למקם את התוכן בצורה אחידה בתוך הכרטיס
    width: "48%", // נשאר כמו שזה כדי לשמור על 2 כרטיסים בשורה
    elevation: 5, // למראה צל יותר מודרני
    shadowColor: "#000", // צל מתחת לכרטיס
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 }, // הגדרת הצל כדי להיות אחיד
  },

  horizontalProductCard: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: "center",
    width: 150,
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
  itemPrice: {},
  outOfStockText: { fontSize: 14, color: "#d9534f", fontWeight: "bold" }, // צהוב לעידוד

});