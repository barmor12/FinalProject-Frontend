import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    padding: 20,
    paddingTop: "80%",
  },
  inputContainer: {
    width: "100%",
    alignItems: "center",
    marginTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#3e2723",
    textAlign: "center",
    marginBottom: 6,
    fontFamily: "System",
    letterSpacing: 0.5,
  },
  title1: {
    fontSize: 42,
    fontWeight: "900",
    color: "#6b4226",
    textAlign: "center",
    marginBottom: 18,
    fontFamily: "System",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  subtitle: {
    fontSize: 16,
    color: "#5d4037",
    textAlign: "center",
    marginBottom: 28,
    fontWeight: "500",
    letterSpacing: 0.3,
  },
  input: {
    width: "90%",
    padding: 15,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 24,
    marginBottom: 15,
    backgroundColor: "#fff",
    fontSize: 16,
    color: "black",
  },
  button: {
    backgroundColor: "#d49a6a",
    padding: 15,
    borderRadius: 24,
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
    fontSize: 13,
    color: "#6b4226",
    fontWeight: "400",
    opacity: 0.8,
  },
  signupText: {
    fontSize: 15,
    color: "#3e2723", // חום כהה נוסף לקריאות
    textAlign: "center",
  },
  signupLink: {
    color: "#3e2723", // כתמתם בולט
    fontWeight: "600",
  },
  backButton: {
    marginTop: 20,

    padding: 10,

    borderRadius: 5,

    alignItems: "center",
  },
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
    width: "90%",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 10,
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
    textAlign: "center",
    paddingHorizontal: 10,
  },
  cancelButton: {
    backgroundColor: "#ff4444",
    marginTop: 10,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
    marginTop: 10,
    width: "90%",
    alignSelf: "center",
  },
  background: {
    flex: 1,
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },

  brandPrefix: {
    fontSize: 58,
    fontWeight: "900",
    color: "#f8b195", // גוון ורוד־קינוח
    textAlign: "center",
    marginTop: 12,
    lineHeight: 60,
    letterSpacing: 3,
    fontFamily: "System",
  },

  brandRest: {
    fontSize: 58,
    fontWeight: "900",
    color: "#6b4226", // חום־שוקולד עמוק
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 60,
    letterSpacing: 3,
    fontFamily: "System",
    marginTop: -10,
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
});

export default styles;
