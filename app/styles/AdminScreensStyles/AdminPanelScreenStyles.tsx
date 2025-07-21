import { StyleSheet, Platform } from "react-native";

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f9f3ea",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#f9f3ea",
    paddingTop: Platform.OS === "ios" ? 20 : 40,
    paddingBottom: Platform.OS === "ios" ? 20 : 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9f3ea",
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#e0e0e0",
    marginBottom: 10,
  },
  userNamePlaceholder: {
    width: 150,
    height: 22,
    backgroundColor: "#e0e0e0",
    borderRadius: 4,
    marginBottom: 5,
  },
  titlePlaceholder: {
    width: 120,
    height: 18,
    backgroundColor: "#e0e0e0",
    borderRadius: 4,
    marginBottom: 20,
  },
  loader: {
    marginVertical: 20,
  },
  userName: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 5,
  },
  title: {
    fontSize: 18,
    color: "#6b4226",
    marginBottom: 20,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#d49a6a",
    padding: 15,
    borderRadius: 30,
    width: "80%",
    justifyContent: "center",
    marginBottom: 10,
    marginTop: 6,
  },
  buttonGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    width: "90%",
    marginBottom: 20,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 10,
  },
  logoutButton: {
    backgroundColor: "#e63946",
    marginTop: 50,
  },
  logoutText: {
    color: "#fff",
    fontWeight: "bold",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#6b4226",
  },
  adminIcon: {
    width: 150,
    height: 150,
    borderRadius: 90,
    borderColor: "#6b4226",
    borderWidth: 1,
    marginBottom: 30,
  },
});

export default styles;