import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#F8F0E6",
    },
    scrollContent: {
      padding: 20,
    },
    title: {
      fontSize: 28,
      fontWeight: "700",
      color: "#3e2723",
      textAlign: "center",
      marginBottom: 12,
    },
    headerContainer: {
      paddingTop: 20,
      paddingBottom: 10,
      backgroundColor: "transparent", // שימוש ברקע מה-SafeAreaView
      zIndex: 10,
    },
    image: {
      width: "100%",
      height: 240,
      borderRadius: 12,
      marginVertical: 12,
    },
    description: {
      fontSize: 16,
      color: "#5d4037",
      marginVertical: 12,
      lineHeight: 22,
      textAlign: "left",
    },
    ingredients: {
      fontSize: 16,
      color: "#5d4037",
      marginBottom: 20,
      lineHeight: 22,
      textAlign: "left",
    },
    price: {
      fontSize: 22,
      fontWeight: "600",
      color: "#bf360c",
      textAlign: "center",
      marginBottom: 20,
    },
    quantityContainer: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      marginVertical: 16,
    },
    button: {
      backgroundColor: "#6b4226",
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 8,
      marginHorizontal: 12,
    },
    buttonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
    quantityText: {
      fontSize: 20,
      fontWeight: "500",
      color: "#6b4226",
    },
    addButton: {
      backgroundColor: "#4e342e",
      paddingVertical: 14,
      borderRadius: 10,
      alignItems: "center",
      marginHorizontal: 20,
      marginBottom: 30,
    },
    addButtonText: {
      color: "#fff",
      fontSize: 18,
      fontWeight: "700",
      letterSpacing: 0.5,
    },
    stock: {
      fontSize: 16,
      color: "#5d4037",
      textAlign: "center",
      marginBottom: 10,
    },
    error: {
      fontSize: 18,
      color: "red",
      textAlign: "center",
      marginTop: 40,
    },
  });
  
  export default styles;