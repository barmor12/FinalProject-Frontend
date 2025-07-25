import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#fdf6f0",
    },
    header: {
      padding: 20,
      backgroundColor: "#fdf6f0",
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingBottom: 6,
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      color: "#4e2c17",
      textShadowColor: 'rgba(0, 0, 0, 0.15)',
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 4,
    },
    statsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      padding: 10,
    },
    statCard: {
      backgroundColor: "#fff",
      borderRadius: 16,
      padding: 12,
      alignItems: "center",
      width: "31%",
      marginBottom: 15,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
      borderWidth: 1,
      borderColor: "#f0f0f0",
    },
    statTitle: {
      fontSize: 12,
      color: "#666",
      marginBottom: 4,
      fontWeight: "500",
      textAlign: "center",
    },
    statValue: {
      fontSize: 16,
      fontWeight: "bold",
      color: "#333",
      marginBottom: 4,
      textAlign: "center",
    },
    revenueValue: {
      fontSize: 18,
    },
    statLink: {
      fontSize: 12,
      color: "#6d4226",
      marginTop: 5,
      fontWeight: "500",
      backgroundColor: "#f9f3ea",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    chartContainer: {
      marginHorizontal: 16,
      marginVertical: 10,
      backgroundColor: "#fffdf9",
      borderRadius: 14,
      padding: 18,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 4,
      borderWidth: 1,
      borderColor: "#f1e7dc",
    },
    finalChartContainer: {
      marginHorizontal: 16,
      marginVertical: 10,
      marginBottom: 40, // מוסיף רווח בסוף
      backgroundColor: "#fffdf9",
      borderRadius: 14,
      padding: 18,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 4,
      borderWidth: 1,
      borderColor: "#f1e7dc",
    },
    chartTitle: {
      fontSize: 17,
      fontWeight: "bold",
      color: "#4e2c17",
      marginBottom: 12,
      textAlign: "center",
    },
    chart: {
      marginVertical: 8,
      borderRadius: 16,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
      minHeight: 200,
    },
    loadingText: {
      marginTop: 10,
      fontSize: 16,
      color: "#6d4226",
    },
    cakeItem: {
      backgroundColor: "#fff",
      padding: 14,
      borderRadius: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: "#f0e6da",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    cakeName: {
      fontSize: 17,
      fontWeight: "bold",
      color: "#6d4226",
      marginBottom: 6,
      width: "100%",
      flexShrink: 1,
      flexWrap: "wrap",
      textAlign: "left",
    },
    cakeStats: {
      flexDirection: "row",
      justifyContent: "space-between",
      flexWrap : "wrap",
    },
    cakeStat: {
      fontSize: 14,
      color: "#555",
    },
    reportButton: {
      backgroundColor: "#d35400",
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderRadius: 12,
      elevation: 3,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
    },
    reportButtonText: {
      color: "#fff",
      fontSize: 14,
      fontWeight: "bold",
    },
  });

  export default styles;