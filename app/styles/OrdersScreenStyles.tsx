import { StyleSheet } from "react-native";

const styles: { [key: string]: any } = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: "#f9f3ea" },
    filterContainer: {
      flexDirection: "row",
      justifyContent: "space-around",
      marginBottom: 10,
    },
    filterScroll: {
      marginBottom: 10,
      paddingLeft: 12,
    },
    filterButton: {
      height: 45,
      paddingHorizontal: 20,
      borderRadius: 20,
      backgroundColor: "#ddd",
      marginRight: 10,
      flexShrink: 0,
      minWidth: 90,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 10,
    },
    filterText: {
      color: "#fff",
      fontWeight: "bold",
      fontSize: 15,
      lineHeight: 45,
      textAlign: "center",
      textAlignVertical: "center",
      includeFontPadding: false,
    },
    activeFilter: {
      backgroundColor: "#6b4226",
    },
    scrollViewContent: {
      paddingBottom: 120,
    },
    orderCard: {
      backgroundColor: "#fff",
      padding: 15,
      borderRadius: 8,
      marginBottom: 10,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 1.41,
      elevation: 2,
    },
    orderText: { fontSize: 16, color: "#6b4226" },
    orderHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 10,
    },
    orderDetails: {
      marginTop: 10,
    },
    statusText: {
      fontSize: 16,
      fontWeight: "bold",
      textTransform: "capitalize",
    },
    pending: { color: "#FFA500" },
    confirmed: { color: "#0066cc" },
    completed: { color: "#28a745" },
    delivered: { color: "#28a745" },
    cancelled: { color: "#d9534f" },
    emptyMessage: {
      fontSize: 18,
      color: "#6b4226",
      textAlign: "center",
      marginTop: 20,
    },
    totalPrice: {
      fontSize: 18,
      fontWeight: "bold",
      color: "#6b4226",
      marginTop: 10,
    },
    itemContainer: {
      marginBottom: 5,
    },
    // --- NEW/UPDATED STYLES FOR PROFESSIONAL ORDER DETAILS ---
    itemRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 10,
    },
    itemImage: { width: 50, height: 50, borderRadius: 8, marginRight: 12 },
    itemName: {
      fontSize: 16,
      fontWeight: "600",
      color: "#6b4226",
    },
    itemQuantity: {
      fontSize: 14,
      color: "#555",
    },
    infoBlock: {
      marginTop: 10,
    },
    infoLabel: {
      fontSize: 14,
      fontWeight: "bold",
      color: "#6b4226",
    },
    infoValue: {
      fontSize: 14,
      color: "#333",
    },
    reorderButton: {
      backgroundColor: "#6b4226",
      paddingVertical: 10,
      borderRadius: 5,
      marginTop: 10,
      alignItems: "center",
    },
    reorderButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "bold",
    },
    headerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 20,
      paddingBottom: 20,
      backgroundColor: '#f9f3ea',
      position: 'relative',
      // position relative is required for absolute BackButton
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: "800",
      color: "#6b4226",
      letterSpacing: 0.5,
      textShadowColor: 'rgba(0, 0, 0, 0.15)',
      textShadowOffset: { width: 1, height: 2 },
      textShadowRadius: 3,
    },
  });

  
  export default styles;