import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#f9f3ea",
    },
    header: {
      padding: 20,
      backgroundColor: "#6b4226",
      borderBottomLeftRadius: 20,
      borderBottomRightRadius: 20,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: "bold",
      color: "#fff",
      marginBottom: 10,
    },
    headerSubtitle: {
      fontSize: 14,
      color: "#f0e4d7",
      lineHeight: 20,
    },
    form: {
      padding: 20,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: "#6b4226",
      marginBottom: 15,
      marginTop: 10,
    },
    typeContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 20,
    },
    typeButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#f0e4d7",
      padding: 12,
      borderRadius: 8,
      marginHorizontal: 5,
    },
    selectedTypeButton: {
      backgroundColor: "#6b4226",
    },
    typeButtonText: {
      fontSize: 14,
      color: "#6b4226",
      marginLeft: 6,
      fontWeight: "500",
    },
    selectedTypeButtonText: {
      color: "#fff",
    },
    label: {
      fontSize: 16,
      fontWeight: "600",
      color: "#6b4226",
      marginBottom: 8,
    },
    input: {
      backgroundColor: "#fff",
      borderWidth: 1,
      borderColor: "#e2d6c5",
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: "#333",
    },
    textArea: {
      height: 100,
      textAlignVertical: "top",
    },
    charCounter: {
      fontSize: 12,
      color: "#999",
      textAlign: "right",
      marginTop: 4,
      marginBottom: 16,
    },
    sendButton: {
      backgroundColor: "#6b4226",
      borderRadius: 8,
      padding: 15,
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      marginTop: 10,
    },
    testButton: {
      backgroundColor: "#28a745",
      borderRadius: 8,
      padding: 15,
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      marginTop: 10,
    },
    sendButtonDisabled: {
      backgroundColor: "#a58c6f",
    },
    sendButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "bold",
      marginLeft: 8,
    },
    recentSection: {
      padding: 20,
      paddingTop: 0,
    },
    notificationCard: {
      backgroundColor: "#fff",
      borderRadius: 10,
      padding: 15,
      marginBottom: 15,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    notificationHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 8,
    },
    notificationTitle: {
      fontSize: 16,
      fontWeight: "bold",
      color: "#6b4226",
      flex: 1,
    },
    typeTag: {
      backgroundColor: "#f0e4d7",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
    },
    typeTagText: {
      fontSize: 12,
      color: "#6b4226",
    },
    notificationMessage: {
      fontSize: 14,
      color: "#555",
      marginBottom: 10,
      lineHeight: 20,
    },
    notificationFooter: {
      flexDirection: "row",
      justifyContent: "space-between",
      borderTopWidth: 1,
      borderTopColor: "#f0e4d7",
      paddingTop: 8,
    },
    notificationDate: {
      fontSize: 12,
      color: "#999",
    },
    notificationSentTo: {
      fontSize: 12,
      color: "#6b4226",
      fontWeight: "500",
    },
    emptyText: {
      textAlign: "center",
      color: "#999",
      fontStyle: "italic",
      padding: 20,
    },
  });

  
export default styles;