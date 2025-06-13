import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f9f3ea",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#6b4226",
    textAlign: "center",
    marginBottom: 20,
  },
  label: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#6b4226",
    marginTop: 10,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#6b4226",
    borderRadius: 8,
    backgroundColor: "#fff",
    marginTop: 5,
    padding: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: "#6b4226",
    borderRadius: 8,
    padding: 10,
    fontSize: 18,
    backgroundColor: "#fff",
    marginTop: 5,
  },
  totalPrice: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#6b4226",
    textAlign: "center",
    marginVertical: 20,
  },
  orderButton: {
    backgroundColor: "#28a745",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  orderButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default styles;
