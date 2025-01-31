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
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, usePathname } from "expo-router";
import config from "@/config";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons"; // ספרייה לאייקונים
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
  const [searchVisible, setSearchVisible] = useState(false); // האם שדה החיפוש גלוי
  const [searchText, setSearchText] = useState("");
  const [filteredProducts, setFilteredProducts] = useState(products);
  const [showHorizontalScroll, setShowHorizontalScroll] = useState(true); // מצב חדש עבור הגלילה האופקית

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
    setShowHorizontalScroll((prev) => !prev); // הפיכת מצב הגלילה האופקית
  };

  useEffect(() => {
    const fetchUserDataAndSetState = async () => {
      try {
        // קריאה ל-Backend כדי להביא נתוני משתמש
        const userData = await fetchUserData();
        console.log("Fetched user data:", userData); // הדפס את הנתונים המתקבלים

        // עדכון המשתמש במידע מהשרת
        setUser({
          name: `Hi ${userData.firstName}` || "Guest",
          profilePic:
            userData.profilePic || require("../../assets/images/userIcon.png"), // תמונת ברירת מחדל אם אין תמונת פרופיל
        });
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    const fetchProducts = async () => {
      try {
        console.log(`Fetching products from ${config.BASE_URL}/cakes`);

        const response = await fetch(`${config.BASE_URL}/cakes`, {
          method: "GET",
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("API Error:", errorText);
          throw new Error(`Failed to fetch products: ${response.statusText}`);
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
          throw new Error("Unexpected response format from server");
        }

        console.log("Fetched products:", data);

        // ודא שכל פריט מכיל תמונה, אם אין - הוסף תמונת ברירת מחדל
        const updatedProducts = data.map((product) => ({
          ...product,
          image:
            product.image && product.image.startsWith("http")
              ? product.image
              : "https://via.placeholder.com/150", // תמונת ברירת מחדל
        }));

        setProducts(updatedProducts);
        setFilteredProducts(updatedProducts); // עדכון הרשימה המסוננת בעת טעינה ראשונית
      } catch (error) {
        console.error("Error fetching products:", error);
        Alert.alert(
          "Error",
          "Failed to fetch products. Please try again later."
        );
      }
    };

    // קריאה לשתי הפונקציות
    fetchUserDataAndSetState();
    fetchProducts();
  }, []);

  const renderProduct = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() =>
        router.push({
          pathname: "/ProductDetailsScreen",
          params: { product: JSON.stringify(item) },
        })
      }
    >
      <Image
        source={{ uri: item.image }}
        style={styles.productImage}
        defaultSource={{ uri: "https://via.placeholder.com/150" }}
        onError={() => {
          console.error(
            `⚠️ Image failed to load for: ${item.name}, using default.`
          );
        }}
      />
      <Text style={styles.productName}>{item.name || "Unnamed Product"}</Text>
    </TouchableOpacity>
  );

  const horizontalRenderProduct = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={styles.horizontalProductCard}
      onPress={() =>
        router.push({
          pathname: "/ProductDetailsScreen",
          params: { product: JSON.stringify(item) },
        })
      }
    >
      <Image
        source={{ uri: item.image || "https://via.placeholder.com/100" }} // תמונת ברירת מחדל
        style={styles.productImage}
      />
      <Text style={styles.productName}>{item.name || "Unnamed Product"}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.leftHeader}>
          <TouchableOpacity
            onPress={() => router.push("/ProfileScreen")} // ניווט לעמוד הפרופיל
            style={styles.profileContainer} // עיצוב כולל למיכל
          >
            {user.profilePic ? (
              <Image
                source={
                  typeof user.profilePic === "string"
                    ? { uri: user.profilePic }
                    : user.profilePic
                }
                style={styles.profileImage}
              />
            ) : (
              <Ionicons name="person-circle" size={40} color="black" />
            )}
            <Text style={styles.userName}>{user.name}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.rightHeader}>
          {searchVisible && (
            <TextInput
              style={styles.searchInput}
              placeholder="Search..."
              value={searchText}
              onChangeText={handleSearch}
            />
          )}
          <TouchableOpacity onPress={toggleSearch} style={styles.SearchBtn}>
            <Ionicons name="search" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
      {showHorizontalScroll && ( // תצוגת הגלילה האופקית רק אם המצב מאופשר
        <View style={styles.horizontalScrollContainer}>
          <Text style={styles.title}>Hot Cakes</Text>
          <FlatList
            data={filteredProducts}
            keyExtractor={(item) => item._id}
            renderItem={horizontalRenderProduct}
            horizontal // גלילה אופקית
            showsHorizontalScrollIndicator={false} // הסרת מחוון גלילה אופקי
            contentContainerStyle={{
              alignItems: "center",
              paddingHorizontal: 8,
            }}
          />
        </View>
      )}
      <Text style={styles.title}>Our Cakes</Text>
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item._id || Math.random().toString()} // שימוש במזהה ייחודי
        renderItem={renderProduct}
        contentContainerStyle={styles.productList}
        ListEmptyComponent={
          <Text style={styles.emptyMessage}>No products available</Text>
        } // הודעה אם אין מוצרים
        numColumns={2} // הגדרת 2 עמודות
        columnWrapperStyle={styles.row} // עיצוב של שורה
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: "#f9f3ea",
  },
  header: {
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  profileContainer: {
    flexDirection: "row",
    alignItems: "center",
  },

  horizontalScrollContainer: {
    marginBottom: 8, // מרווח בין הגלילה האופקית לשאר האלמנטים
  },
  horizontalProductList: {
    paddingHorizontal: 8, // רווח פנימי קטן יותר
  },
  horizontalProductCard: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 8,
    marginHorizontal: 8, // רווח בין הכרטיסים בגלילה אופקית
    alignItems: "center",
    width: 140, // רוחב אחיד לכל כרטיס
    height: 180, // גובה אחיד לכל כרטיס
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  productImage: {
    width: 120, // התאמת רוחב
    height: 120, // התאמת גובה
    borderRadius: 8,
    marginBottom: 10,
  },
  leftHeader: {
    flexDirection: "row",
    alignSelf: "flex-start",
    alignItems: "center",
    marginBottom: 20,
  },
  searchInput: {
    height: 40,
    width: 120,
    borderColor: "#6b4226",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: "#fff",
  },
  rightHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  SearchBtn: {
    backgroundColor: "#d49a6a",
    padding: 10,
    borderRadius: 8,
    marginLeft: 8,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  userName: {
    fontSize: 16,
    color: "#6b4226",
    fontWeight: "bold",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#6b4226",
    textAlign: "center",
    marginBottom: 3,
  },
  productList: {
    paddingBottom: 16,
  },
  row: {
    justifyContent: "space-between",
  },
  productCard: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: "center",
    width: "48%", // מתאים לשתי עמודות
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  productName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#6b4226",
    textAlign: "center",
  },
  emptyMessage: {
    textAlign: "center",
    fontSize: 16,
    color: "#6b4226",
  },
});
