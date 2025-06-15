import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
      backgroundColor: "#f9f3ea",
      marginHorizontal: 10,
    },
    title: {
      fontSize: 22,
      fontWeight: "bold",
      color: "#6b4226",
      textAlign: "center",
      marginBottom: 20,
    },
    inputWrapper: {
      position: "relative",
      marginBottom: 24,
      paddingTop: 12, // מוסיף רווח בין ה-label לטקסט הראשוני
    },
    floatingLabel: {
      position: "absolute",
      left: 12,
      top: 16,
      fontSize: 14,
      color: "#aaa",
      zIndex: 1,
    },
    floatingLabelActive: {
      top: -8,
      fontSize: 12,
      color: "#6b4226",
      backgroundColor: "#f9f3ea",
      paddingHorizontal: 4,
      alignSelf: "flex-start",
      marginLeft: 8,
      zIndex: 2,
    },
    input: {
      borderWidth: 1,
      borderColor: "#6b4226",
      padding: 10,
      paddingTop: 24,
      borderRadius: 10,
      backgroundColor: "#fff",
      color: "#6b4226",
      fontSize: 14,
      minHeight: 48,
      textAlignVertical: "center",
    },
    imagePicker: {
      backgroundColor: "#fff",
      padding: 16,
      borderRadius: 10,
      alignItems: "center",
      borderWidth: 1,
      borderColor: "#6b4226",
      marginBottom: 10,
    },
    imagePickerText: {
      color: "#6b4226",
      fontSize: 16,
      fontWeight: "600",
    },
    imagePreview: {
      width: "100%",
      height: 410,
      borderRadius: 8,
      marginBottom: 10,
    },
    submitButton: {
      backgroundColor: "#6b4226",
      padding: 10,
      borderRadius: 8,
      alignItems: "center",
      marginTop: 10,
    },
    submitButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "bold",
    },
    formItem: {
      marginBottom: 20,
    },
    profitInfo: {
      backgroundColor: "#f9f3ea",
      padding: 10,
      borderRadius: 8,
      marginBottom: 10,
    },
    profitText: {
      fontSize: 14,
      color: "#6b4226",
      marginVertical: 2,
    },
  });

export default styles;