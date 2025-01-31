import { StyleSheet } from "react-native";

export default StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f9f3ea",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#6b4226",
    marginBottom: 20,
    textAlign: "center",
  },
  item: {
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
  },
  selectedItem: {
    borderColor: "#6b4226",
    backgroundColor: "#fdebd3",
  },
  itemText: {
    fontSize: 16,
    color: "#6b4226",
  },
});
