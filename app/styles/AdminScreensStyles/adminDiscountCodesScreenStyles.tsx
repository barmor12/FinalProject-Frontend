import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  screenDescription: {
    fontSize: 16,
    color: "#6b4226",
    textAlign: "center",
  },
  summaryContainer: {
    backgroundColor: "#fff",
    padding: 10,
    marginBottom: 15,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
    alignItems: "center",
  },
  summaryText: {
    fontSize: 16,
    color: "#6b4226",
    fontWeight: "600",
  },
    container: {
      flex: 1,
      padding: 16,
      backgroundColor: "#f9f3ea",
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      color: "#6b4226",
      marginBottom: 20,
      textAlign: "center",
    },
    input: {
      backgroundColor: "#fff",
      padding: 10,
      marginBottom: 10,
      borderRadius: 8,
      borderColor: "#ccc",
      borderWidth: 1,
    },
    button: {
      backgroundColor: "#6b4226",
      padding: 15,
      borderRadius: 10,
      alignItems: "center",
      marginBottom: 20,
    },
    buttonText: {
      color: "#fff",
      fontWeight: "bold",
    },
    codeCard: {
      backgroundColor: "#fff",
      padding: 12,
      borderRadius: 10,
      marginBottom: 10,
      shadowColor: "#000",
      shadowOpacity: 0.1,
      shadowRadius: 5,
      elevation: 2,
      flexDirection: "row", // מאפשר את הצגת האלמנטים בשורה
      justifyContent: "space-between", // משאיר רווח בין האלמנטים
      alignItems: "center", // יישור האלמנטים במרכז בגובה
    },
    codeDetails: {
      flex: 1, // מאפשר להרחיב את הטקסט למלא את השטח הפנוי
    },
    codeText: {
      fontSize: 16,
      color: "#333",
    },
    datePickerContainer: {
      marginTop: 10,
      alignItems: "center",
      marginBottom: 10,
    },
    datePickerText: {
      fontSize: 16,
      color: "#6b4226",
      marginBottom: 10,
      textAlign: "center",
    },
    trashButton: {
      padding: 5,
      alignSelf: "flex-end", // ממקם את הכפתור בצד ימין
      marginBottom: 25,
    },
    dateButton: {
      backgroundColor: "#fff",
      padding: 10,
      borderRadius: 8,
      borderColor: "#ccc",
      borderWidth: 1,
      width: "100%",
      alignItems: "center",
    },
    dateButtonText: {
      color: "#6b4226",
      fontSize: 16,
    },
    inputRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#fff",
      paddingHorizontal: 10,
      paddingVertical: 8,
      marginBottom: 10,
      borderRadius: 8,
      borderColor: "#ccc",
      borderWidth: 1,
    },
  });

  export default styles;