import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Modal,
  Alert,
  ScrollView
} from "react-native";
import { ScrollView as RNScrollView } from "react-native"; // שנה שם לייבוא בשביל ה־ref
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import config from "@/config";
import styles from "../styles/DashboardScreenStyles";
import { fetchUserData } from "../utils/fetchUserData";

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
  const scrollRef = React.useRef<RNScrollView>(null);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const [user, setUser] = useState<{ name: string; profilePic: string }>({
    name: "",
    profilePic: "",
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchVisible, setSearchVisible] = useState(false);
  // New searchTerm state
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [, setShowHorizontalScroll] = useState(true);
  const [likedProducts, setLikedProducts] = useState<Set<string>>(new Set());
  // State variable to determine whether to display only liked products
  const [showOnlyLiked, setShowOnlyLiked] = useState(false);
  // Sort order state for price sorting
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [activeFilters, setActiveFilters] = useState({ favorites: false, inStock: false });
  // Add modal state for add-to-cart
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  // Cart state, for demonstration

  // Handle search input and update searchTerm state
  const handleSearch = (text: string) => {
    setSearchTerm(text);
  };

  // Toggle the search input visibility
  const toggleSearch = () => {
    setSearchVisible((prev) => {
      if (!prev) {
        setSearchTerm(""); // Reset search term when search is opened
      } else {
        setSearchTerm(""); // Reset search term when search is closed
      }
      return !prev;
    });
    setShowHorizontalScroll((prev) => !prev); // Toggle horizontal scroll visibility with search
  };

  // Toggle display of only liked products
  const toggleShowFavorites = () => {
    setShowOnlyLiked((prev) => {
      const newVal = !prev;
      setActiveFilters(prev => ({ ...prev, favorites: newVal }));
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
          : "https://res.cloudinary.com/dhhrsuudb/image/upload/v1749854544/cakes/z1mpm3pz667fnq7b7whj.png",
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

  // Function to get the name of the best seller
  const getBestSellerName = (): string => {
    const sorted = [...products].sort((a, b) => b.stock - a.stock);
    return sorted.length > 0 ? sorted[0].name : "N/A";
  };

  // Fetch user data and products when component mounts
  useEffect(() => {
    fetchUserDataAndSetState();
    fetchProducts();
  }, []);

  // No need to refetch products on focus to preserve filters
  useFocusEffect(
    React.useCallback(() => {
      // This will run when the screen comes into focus
      return () => {
        // This will run when the screen goes out of focus
        setSearchTerm("");
        setSearchVisible(false);
        setShowHorizontalScroll(true);
      };
    }, [])
  );

  // Helper: filter products by searchTerm
  const filterBySearchTerm = (productsList: Product[], term: string) => {
    if (!term.trim()) return productsList;
    const lowerText = term.toLowerCase();
    return productsList.filter(
      (product) =>
        product.name.toLowerCase().includes(lowerText) ||
        product.ingredients.some((ing) => ing.toLowerCase().includes(lowerText))
    );
  };

  // Helper: filter by favorites
  const filterByFavorites = (productsList: Product[]) => {
    return showOnlyLiked
      ? productsList.filter((product) => likedProducts.has(product._id))
      : productsList;
  };

  // Helper: filter by in-stock
  const filterByInStock = (productsList: Product[]) => {
    return activeFilters.inStock
      ? productsList.filter((p) => p.stock > 0)
      : productsList;
  };

  // Helper: sort by price
  const sortByPrice = (productsList: Product[]) => {
    return [...productsList].sort((a, b) =>
      sortOrder === "asc" ? a.price - b.price : b.price - a.price
    );
  };

  // Compose all filters
  useEffect(() => {
    let filtered = products;
    filtered = filterBySearchTerm(filtered, searchTerm);
    filtered = filterByFavorites(filtered);
    filtered = filterByInStock(filtered);
    filtered = sortByPrice(filtered);
    setFilteredProducts(filtered);
  }, [products, likedProducts, showOnlyLiked, searchTerm, activeFilters.inStock, sortOrder]);

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

  // Stock filter button handler: toggles inStock filter, preserves searchTerm, does not reset state
  const handleInStockFilter = () => {
    setActiveFilters(prev => {
      const newInStock = !prev.inStock;
      // Only update inStock property, don't touch other filters
      return { ...prev, inStock: newInStock };
    });
    // Do not reset filteredProducts here, let useEffect handle filtering and searchTerm
  };

  // Render vertical product card with like button (modern, favorite highlight)
  const renderProductCardVertical = ({ item }: { item: Product }) => {
    const isFavorite = likedProducts.has(item._id);
    return (
      <View style={[styles.verticalCardContainer, { height: 340 }]}>
        <TouchableOpacity
          style={[styles.verticalCardTouchable, { padding: 0, alignItems: "stretch" }]}
          onPress={() => {
            if (item.stock > 0) {
              navigateToProduct(item);
            }
          }}
        >
          <Image
            source={{ uri: item.image }}
            style={styles.productImage}
            resizeMode="cover"
          />
          <View style={styles.productInfo}>
            <Text style={styles.productName}>{item.name}</Text>
            <Text style={styles.priceText}>${item.price.toFixed(2)}</Text>
            {/* Low Stock label directly after price, before any spacers or containers */}
            {item.stock > 0 && item.stock < 3 && (
              <Text style={styles.lowStockLabel}>Low Stock: {item.stock} left</Text>
            )}
            {item.stock <= 0 && (
              <Text style={[styles.outOfStockLabel, { paddingHorizontal: 6 }]}>Out of Stock</Text>
            )}
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
        {/* Add to cart button, only if in stock */}
        {item.stock > 0 && (
          <TouchableOpacity
            onPress={() => {
              setSelectedProduct(item);
              setSelectedQuantity(1);
            }}
            style={[styles.addToCartButton, { right: 7, bottom: 5 }]}
          >
            <Ionicons name="cart" size={22} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
    );
  };



  // Add to cart logic using POST request (mirrors ProductDetailsScreen)
  const handleAddToCart = async () => {
    if (!selectedProduct) return;
    try {
      if (!selectedProduct._id) {
        Alert.alert("Error", "Cake ID is missing.");
        return;
      }
      if (selectedQuantity < 1) {
        Alert.alert("Error", "Quantity must be at least 1.");
        return;
      }
      const token = await AsyncStorage.getItem("accessToken");
      if (!token) {
        Alert.alert("Error", "You need to be logged in to add items to the cart.");
        return;
      }
      const response = await fetch(`${config.BASE_URL}/cart/add`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cakeId: selectedProduct._id, quantity: selectedQuantity }),
      });
      if (!response.ok) {
        const error = await response.json();
        Alert.alert("Error", error.message || "Failed to add cake to cart");
        return;
      }
      Alert.alert("Success", "🎉 Cake added to cart successfully!");
      setSelectedProduct(null);
      setSelectedQuantity(1);
    } catch (error: any) {
      Alert.alert("Error", "Something went wrong. Please try again.");
      console.error("❌ addToCart error:", error);
    }
  };
  return (
    <SafeAreaView style={styles.container}>
      <View style={{ flex: 1 }}>
        <RNScrollView
          ref={scrollRef}
          onScroll={(event) => {
            const scrollY = event.nativeEvent.contentOffset.y;
            setShowScrollToTop(scrollY > 700);
          }}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={{ paddingBottom: 80 }}
        >
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
          {searchVisible && (
            <View style={styles.searchBlock}>
              <TextInput
                style={styles.searchInputFull}
                placeholder="Search by name, ingredient, or allergen..."
                value={searchTerm}
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
          <View style={{ backgroundColor: "#f9f3ea", padding: 20, borderRadius: 10, marginBottom: 10 }}>
            <Text style={{
              fontSize: 26, fontWeight: "800", color: "#6b4226", textAlign: "center", letterSpacing: 0.5,
              textShadowColor: 'rgba(0, 0, 0, 0.15)', textShadowOffset: { width: 1, height: 2 },
              textShadowRadius: 3,
            }}>
              Discover Delicious Cakes!


            </Text>
          </View>
          <View style={{
            backgroundColor: "#fffbe9",
            borderWidth: 1.5,
            borderColor: "#d49a6a",
            padding: 16,
            borderRadius: 10,
            marginBottom: 10,
            elevation: 3,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 3,
          }}>
            <Text style={{ fontSize: 20, fontWeight: "bold", color: "#6b4226", marginBottom: 6 }}>📊 Store Overview</Text>
            <Text style={{ fontSize: 16, fontWeight: "bold", color: "#d9534f", marginBottom: 4 }}>
              🍰 Best Seller:
              <Text
                style={{ textDecorationLine: "underline", color: "#6b4226" }}
                onPress={() => {
                  const sorted = [...products].sort((a, b) => b.stock - a.stock);
                  if (sorted.length > 0) {
                    navigateToProduct(sorted[0]);
                  }
                }}
              >
                {getBestSellerName()}
              </Text>
            </Text>
            <Text style={{ fontSize: 14, color: "#6b4226" }}>📦 Total products: {products.length}</Text>
            <Text style={{ fontSize: 14, color: "#6b4226" }}>❤️ Favorites saved: {likedProducts.size}</Text>
          </View>

          {/* Promo Card for Buyers */}
          <View style={{ backgroundColor: "#f0f8ff", padding: 16, borderRadius: 10, marginBottom: 10, elevation: 3 }}>
            <Text style={{ fontSize: 20, fontWeight: "bold", color: "#0066cc", marginBottom: 4 }}>🎁 Special Offer</Text>
            <Text style={{ fontSize: 16, color: "#004080" }}>Get 10% off your first order!</Text>
            <Text style={{ fontSize: 14, color: "#004080" }}>Use code <Text style={{ fontWeight: "bold" }}>WELCOME10</Text> at checkout.</Text>
          </View>


          <View style={styles.filtersContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  activeFilters.favorites && styles.activeFilterChip
                ]}
                onPress={toggleShowFavorites}
              >
                <Text style={[
                  styles.filterText,
                  activeFilters.favorites && styles.activeFilterText
                ]}>❤️ Favorites</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.filterChip}
                onPress={() => {
                  const newOrder = sortOrder === "asc" ? "desc" : "asc";
                  setSortOrder(newOrder);
                }}
              >
                <Text style={styles.filterText}>
                  {sortOrder === "asc" ? "⬆️ Price Low" : "⬇️ Price High"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  activeFilters.inStock && styles.activeFilterChip
                ]}
                onPress={handleInStockFilter}
              >
                <Text style={[
                  styles.filterText,
                  activeFilters.inStock && styles.activeFilterText
                ]}>📦 Stock</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
          <Text style={{ fontSize: 18, fontWeight: "600", marginVertical: 10, color: "#6b4226" }}>
            Explore Cakes
          </Text>
          {/* Show "No results found" if no filtered products after search/filtering */}
          {filteredProducts.length === 0 ? (
            <Text style={{ textAlign: 'center', marginTop: 20, fontSize: 16 }}>
              No results found
            </Text>
          ) : (
            <FlatList
              data={filteredProducts}
              keyExtractor={(item) => item._id}
              renderItem={renderProductCardVertical}
              numColumns={2}
              columnWrapperStyle={{ justifyContent: "space-between" }}
              scrollEnabled={false}
            />
          )}
          {/* Quantity modal for add to cart */}
          {selectedProduct && (
            <Modal visible={!!selectedProduct} transparent animationType="fade">
              <View style={styles.modalOverlay}>
                <View style={{
                  backgroundColor: "#fff8f0",
                  padding: 24,
                  borderRadius: 16,
                  alignItems: "center",
                  width: "85%",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.2,
                  shadowRadius: 8,
                  elevation: 6
                }}>
                  <TouchableOpacity
                    style={{ position: "absolute", top: 12, right: 12 }}
                    onPress={() => setSelectedProduct(null)}
                  >
                    <Ionicons name="close" size={28} color="#a0522d" />
                  </TouchableOpacity>
                  <Text style={{ fontSize: 24, fontWeight: "bold", color: "#6b4226", marginBottom: 10 }}>Select Quantity</Text>
                  <Image source={{ uri: selectedProduct.image }} style={{ width: 100, height: 100, borderRadius: 12, marginBottom: 10 }} />
                  <Text style={{ fontSize: 18, fontWeight: "600", color: "#6b4226", marginBottom: 4 }}>{selectedProduct.name}</Text>
                  <Text style={{ fontSize: 16, color: "#d2691e", marginBottom: 12 }}>Price: ${selectedProduct.price.toFixed(2)}</Text>
                  <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}>
                    <TouchableOpacity
                      style={{ backgroundColor: "#f1c27d", padding: 12, borderRadius: 50 }}
                      onPress={() => {
                        const qty = Math.max(1, selectedQuantity - 1);
                        if (qty <= selectedProduct.stock) {
                          setSelectedQuantity(qty);
                        }
                      }}
                    >
                      <Ionicons name="remove" size={20} color="#fff" />
                    </TouchableOpacity>
                    <Text style={{ fontSize: 20, fontWeight: "bold", marginHorizontal: 16 }}>{selectedQuantity}</Text>
                    <TouchableOpacity
                      style={{ backgroundColor: "#f1c27d", padding: 12, borderRadius: 50 }}
                      onPress={() => {
                        const qty = selectedQuantity + 1;
                        if (qty <= selectedProduct.stock) {
                          setSelectedQuantity(qty);
                        }
                      }}
                    >
                      <Ionicons name="add" size={20} color="#fff" />
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity
                    style={{ backgroundColor: "#6b4226", paddingVertical: 12, paddingHorizontal: 24, borderRadius: 10 }}
                    onPress={handleAddToCart}
                  >
                    <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>Add to Cart</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          )}
        </RNScrollView>
        {showScrollToTop && (
          <TouchableOpacity
            style={{
              position: "absolute",
              bottom: 80,
              right: 20,
              backgroundColor: "rgba(107, 66, 38, 0.6)",
              padding: 12,
              borderRadius: 30,
              elevation: 5,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 4,
              zIndex: 10,
            }}
            onPress={() => {
              scrollRef.current?.scrollTo({ y: 0, animated: true });
            }}
          >
            <Ionicons name="arrow-up" size={24} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}