import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: "#f9f3ea",
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
    },
    container: {
      flex: 1,
      alignItems: "center",
      backgroundColor: "#f9f3ea",
      paddingVertical: 40,
      paddingHorizontal: 20,
    },
    loadingContainer: {
      justifyContent: "center",
    },
    profileImagePlaceholder: {
      width: 150,
      height: 150,
      borderRadius: 80,
      backgroundColor: "#e0e0e0",
      marginBottom: 40,
    },
    userNamePlaceholder: {
      width: 150,
      height: 24,
      backgroundColor: "#e0e0e0",
      borderRadius: 4,
      marginBottom: 10,
    },
    titlePlaceholder: {
      width: 80,
      height: 18,
      backgroundColor: "#e0e0e0",
      borderRadius: 4,
      marginBottom: 20,
    },
    loader: {
      marginVertical: 20,
    },
    loadingText: {
      fontSize: 16,
      color: "#6b4226",
      marginTop: 10,
    },
    profileImage: {
      width: 150,
      height: 150,
      borderRadius: 80,
      marginBottom: 40,
    },
    userName: {
      fontSize: 22,
      fontWeight: "bold",
      color: "#6b4226",
    },
    title: {
      fontSize: 18,
      color: "#6b4226",
      marginBottom: 20,
    },
    button: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#d49a6a",
      padding: 15,
      borderRadius: 10,
      width: "80%",
      justifyContent: "center",
      marginBottom: 10,
    },
    logoutButton: {
      backgroundColor: "#e63946",
    },
    buttonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "bold",
      marginLeft: 10,
    },
    contactLabel: {
      fontSize: 16,
      fontWeight: "bold",
      marginTop: 30,
      marginBottom: 10,
      textAlign: "center",
      color: "#333",
    },
    contactButtonsContainer: {
      flexDirection: "row",
      justifyContent: "center",
      gap: 15,
    },
    iconButton: {
      backgroundColor: "#d49a6a",
      padding: 10,
      borderRadius: 30,
    },
  });

  export default styles;