import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9f3ea", // צבע רקע אחיד
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#6b4226", // צבע חום עדין
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#6b4226",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    width: "90%",
    padding: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: "#fff",
    fontSize: 16,
  },
  button: {
    backgroundColor: "#d49a6a", // גוון זהב
    padding: 15,
    borderRadius: 8,
    width: "90%",
    alignItems: "center",
    marginBottom: 15,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc", // קו גבול אפור עדין
    padding: 12,
    borderRadius: 8,
    width: "90%",
    marginBottom: 20,
  },
  googleIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  googleButtonText: {
    fontSize: 16,
    color: "#555", // צבע טקסט שחור-אפור
    fontWeight: "bold",
  },
  signupText: {
    fontSize: 14,
    color: "#555",
  },
  signupLink: {
    color: "#d49a6a",
    fontWeight: "bold",
  },
});

export default styles;
