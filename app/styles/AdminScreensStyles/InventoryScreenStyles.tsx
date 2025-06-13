
import { StyleSheet } from "react-native";

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
      marginBottom: 15,
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
    lowStockProduct: {
      borderColor: "#d9534f",
      borderWidth: 2,
    },
    lowStockIndicator: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#fff3f3",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
      marginTop: 4,
    },
    lowStockText: {
      color: "#d9534f",
      fontSize: 12,
      fontWeight: "600",
      marginLeft: 4,
    },
  });

export default styles;