import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
      backgroundColor: "#f9f3ea",
    },
    title: {
      fontSize: 26,
      fontWeight: "bold",
      textAlign: "center",
      marginBottom: 10,
      color: "#6b4226",
    },
    sectionTitle: {
      fontSize: 22,
      fontWeight: "bold",
      marginBottom: 10,
      color: "#6b4226",
      marginLeft: 5,
    },
    card: {
      backgroundColor: "#fff",
      padding: 20,
      borderRadius: 10,
      marginBottom: 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 3,
      elevation: 3,
    },
    label: {
      fontSize: 16,
      color: "#6b4226",
      marginTop: 10,
    },
    value: {
      fontSize: 18,
      fontWeight: "500",
      color: "#6b4226",
    },
    orderCard: {
      backgroundColor: "#fff",
      padding: 15,
      borderRadius: 8,
      marginBottom: 15,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 3,
      elevation: 3,
    },
    orderText: {
      fontSize: 16,
      marginBottom: 4,
      color: "#6b4226",
    },
    status: {
      fontWeight: "bold",
      textTransform: "capitalize",
    },
    pending: { color: "#FFA500" },
    confirmed: { color: "#007bff" },
    delivered: { color: "#28a745" },
    cancelled: { color: "#d9534f" },
    updateStatusButton: {
      backgroundColor: "#6b4226",
      padding: 12,
      borderRadius: 8,
      alignItems: "center",
      marginTop: 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 3,
      elevation: 3,
    },
    updateStatusText: {
      color: "#fff",
      fontWeight: "bold",
      fontSize: 16,
    },
    noOrders: {
      fontStyle: "italic",
      color: "#888",
      textAlign: "center",
    },
    errorText: {
      fontSize: 18,
      color: "red",
      textAlign: "center",
      marginTop: 20,
    },
  });

  export default styles;