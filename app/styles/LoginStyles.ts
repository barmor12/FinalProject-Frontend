import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9f3ea", // Unified background color
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#6b4226", // Soft brown color
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
    color: "black",
  },
  button: {
    backgroundColor: "#d49a6a", // Gold shade
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
    borderColor: "#ccc", // Soft gray border
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
    color: "#555", // Black-gray text color
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
  backButton: {
    marginTop: 20,

    padding: 10,

    borderRadius: 5,

    alignItems: "center",
  },
  forgotPasswordButton: {
    marginTop: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 10,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  cancelButton: {
    backgroundColor: '#ff4444',
    marginTop: 10,
  },
});

export default styles;
