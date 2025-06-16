import { StyleSheet } from "react-native";

export const placeholderColor = "#999";

export default StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f9f3ea" },
  flexContainer: { flex: 1 },
  scrollContainer: { flexGrow: 1, paddingBottom: 20 },
  container: { flex: 1, padding: 20 },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 20,
    backgroundColor: "#f9f3ea",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
    textAlign: "center",
    flex: 1,
    marginRight: 32, // ensures it's centered even with back button
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  input: {
    width: "100%",
    padding: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: "#fff",
    color: "#000",
  },
  button: {
    backgroundColor: "#d49a6a",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 10,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  label: { fontSize: 16, fontWeight: "bold" },
  backButton: {
    backgroundColor: "#d49a6a",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  backButtonText: { fontSize: 16, fontWeight: "bold", color: "#fff" },
  deleteButton: {
    backgroundColor: "red",
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    width: "80%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
    color: "#333",
  },
  modalSubtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
    color: "#666",
  },
  cancelButton: {
    backgroundColor: "#666",
  },
  verificationInput: {
    width: "100%",
    padding: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: "#fff",
    color: "#000",
  },
});
