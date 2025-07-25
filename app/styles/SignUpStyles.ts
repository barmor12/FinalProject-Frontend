import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.4)",
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 30,
  },

  imageCircle: {
    width: 120,
    height: 120,
    borderRadius: 70,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    overflow: "hidden",
  },

  imagePickerText: {
    fontSize: 14,
    color: "#6b4226",
    textAlign: "center",
    marginBottom: 15,
    fontStyle: "italic",
  },

  title: {
    fontSize: 28,

    fontWeight: "bold",
    color: "#6b4226", // צבע חום עדין
    marginBottom: 10,
    textAlign: "center",
    marginTop: -60,
    textShadowColor: "rgba(0, 0, 0, 0.20)",
    textShadowOffset: { width: 1, height: 3 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    color: "#6b4226",
    marginBottom: 20,
    textAlign: "center",
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
    marginTop: 8,
    marginBottom: 4,
  },
  input: {
    width: "100%", // במקום 90%
    padding: 16, // שיהיה יותר מרווח
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    marginBottom: 15,
    backgroundColor: "#fff",
    fontSize: 16,
  },

  button: {
    width: "100%", // במקום 90%
    paddingVertical: 16,
    borderRadius: 10,
    backgroundColor: "#d49a6a",
    alignItems: "center",
    marginTop: 10,
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
    borderColor: "#ccc",
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
    color: "#555",
    fontWeight: "bold",
  },
  loginText: {
    fontSize: 14,
    color: "#6b4226",
    textAlign: "center",
  },
  loginLink: {
    color: "#6b4226",
    fontWeight: "bold",
  },
  instructionsContainer: {
    marginBottom: 20,
    padding: 10,
    backgroundColor: "#f8f8f8",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  instructionsTitle: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 5,
    color: "#333",
  },
  instructionsText: {
    fontSize: 14,
    color: "#555",
    marginBottom: 3,
  },
  passwordContainer: {
    width: "90%",
    minHeight: 90,
    justifyContent: "space-around",
    marginBottom: 10,
  },

  requirementItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 2,
  },
  requirementIcon: {
    fontSize: 14, // היה 16
    width: 20,
    textAlign: "center",
    marginRight: 6,
    color: "#555",
  },

  requirementText: {
    fontSize: 14,
    flexShrink: 1,
  },
});

export default styles;
