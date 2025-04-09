import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    backgroundColor: "#fdf6f0",
    padding: 20,
    paddingTop: "40%",
  },
  inputContainer: {
    width: "100%",
    alignItems: "center",
    marginTop: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#6b4226",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 18,
    color: "#6b4226",
    marginBottom: 14,
    textAlign: "center",
  },
  input: {
    width: "90%",
    padding: 15,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: "#fff",
    fontSize: 16,
    color: "black",
  },
  button: {
    backgroundColor: "#d49a6a",
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
    borderColor: "#dadce0",
    padding: 12,
    borderRadius: 12,
    width: "90%",
    marginBottom: 15,
    gap: 10,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  googleIcon: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
  googleButtonText: {
    fontSize: 16,
    color: "#3c4043",
    fontWeight: "500",
    letterSpacing: 0.25,
  },
  forgotPasswordButton: {
    marginTop: 10,
    marginBottom: 10,
    width: "100%",
    alignItems: "center",
  },
  forgotPasswordText: {
    fontSize: 15,
    color: "#d49a6a",
    fontWeight: "500",
  },
  signupText: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
  },
  signupLink: {
    color: "#d49a6a",
    fontWeight: "500",
  },
  backButton: {
    marginTop: 20,

    padding: 10,

    borderRadius: 5,

    alignItems: "center",
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
    width: '90%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  cancelButton: {
    backgroundColor: '#ff4444',
    marginTop: 10,
  },
});

export default styles;
