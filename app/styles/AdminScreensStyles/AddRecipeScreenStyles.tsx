import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#f9f3ea",
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 20,
      backgroundColor: "#fff",
      borderBottomWidth: 1,
      borderBottomColor: "#e0e0e0",
    },
    backButton: {
      width: 40,
      height: 40,
      justifyContent: "center",
      alignItems: "center",
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      color: "#6b4226",
    },
    scrollView: {
      flex: 1,
    },
    form: {
      padding: 20,
    },
    inputGroup: {
      marginBottom: 15,
    },
    label: {
      fontSize: 16,
      fontWeight: "600",
      color: "#6b4226",
      marginBottom: 5,
    },
    input: {
      backgroundColor: "#fff",
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: "#6b4226",
      borderWidth: 1,
      borderColor: "#e0e0e0",
    },
    textArea: {
      height: 100,
      textAlignVertical: "top",
    },
    imagePicker: {
      width: "100%",
      height: 200,
      backgroundColor: "#fff",
      borderRadius: 8,
      borderWidth: 1,
      borderColor: "#e0e0e0",
      overflow: "hidden",
    },
    imagePreview: {
      width: "100%",
      height: "100%",
    },
    imagePlaceholder: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    imagePlaceholderText: {
      marginTop: 10,
      color: "#6b4226",
      fontSize: 16,
    },
    difficultyButtons: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 5,
    },
    difficultyButton: {
      flex: 1,
      padding: 10,
      borderRadius: 8,
      backgroundColor: "#f9f3ea",
      marginHorizontal: 5,
      alignItems: "center",
    },
    selectedDifficulty: {
      backgroundColor: "#6b4226",
    },
    difficultyText: {
      color: "#6b4226",
      fontWeight: "600",
    },
    selectedDifficultyText: {
      color: "#fff",
    },
    saveButton: {
      backgroundColor: "#6b4226",
      padding: 15,
      borderRadius: 8,
      alignItems: "center",
      marginTop: 20,
    },
    saveButtonDisabled: {
      backgroundColor: "#a58c6f",
    },
    saveButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "600",
    },
  });

  
  export default styles;