import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: "#f9f3ea",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  leftHeader: {
    flex: 1,
    alignItems: "flex-start",
  },
  centerHeader: {
    flex: 1,
    alignItems: "center",
  },

  profileContainer: { flexDirection: "row", alignItems: "center" },
  profileImage: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  userName: { fontSize: 16, fontWeight: "bold", color: "#6b4226" },
  rightHeader: { flexDirection: "row", alignItems: "center" },
  searchInput: {
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: "#fff",
  },
  SearchBtn: {
    backgroundColor: "#ffcc99",
    padding: 10,
    borderRadius: 8,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#6b4226",
    textAlign: "center",
  },
  favoritesButton: {
    backgroundColor: "#6b4226",
    paddingVertical: 8,
    borderRadius: 8,
    marginVertical: 8,
    alignItems: "center",
  },
  favoritesButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  favoriteButton: { position: "absolute", bottom: 8, right: 8 },
  hotCakeList: { paddingHorizontal: 8 },
  horizontalScrollContainer: { marginBottom: 8 },
  horizontalProductCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    alignItems: "center",
    position: "relative",
  },
  productImage: { width: 120, height: 120, borderRadius: 8, marginBottom: 10 },
  productName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#6b4226",
    textAlign: "left",
    marginBottom: 8,
    flexWrap: "wrap",
    maxWidth: "90%",
  },
  row: { justifyContent: "space-between" },
  itemPrice: {},
  outOfStockText: { fontSize: 14, color: "#d9534f", fontWeight: "bold" },

  verticalCardContainer: {
    width: "48%",
    marginBottom: 16,
    position: "relative",
  },
  verticalCardTouchable: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 10,
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  favoriteButtonTop: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#fff",
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    zIndex: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  productInfo: {
    alignItems: "center",
    marginTop: 8,
  },
  outOfStockLabel: {
    fontSize: 13,
    color: "#fff",
    backgroundColor: "#d9534f",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  lowStockLabel: {
    fontSize: 13,
    color: "#ff9900",
    backgroundColor: "#fff0e6",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
    fontWeight: "bold",
  },
  favoriteLabel: {
    marginTop: 6,
    fontSize: 12,
    color: "#d9534f",
    fontWeight: "bold",
  },
  filtersContainer: {
    flexDirection: "row",
    marginVertical: 10,
  },
  filterChip: {
    backgroundColor: "#fffaf2",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#d49a6a",
    elevation: 2,
  },
  filterText: {
    color: "#6b4226",
    fontWeight: "bold",
  },
  activeFilterChip: {
    backgroundColor: "#d49a6a",
    borderColor: "#6b4226",
  },
  activeFilterText: {
    color: "#fff",
  },
  wideProductImage: {
    width: 150,
    height: 150,
    borderRadius: 10,
    marginRight: 16,
  },
  wideProductInfo: {
    flex: 1,
    height: 150,
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingRight: 40,
  },
  priceTextRight: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#6b4226",
    textAlign: "right",
    marginTop: "auto",
  },
  searchBlock: {
    backgroundColor: "#f9f3ea",
    borderRadius: 10,
    padding: 10,
    marginVertical: 10,
    elevation: 2,
  },
  searchInputFull: {
    height: 40,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: "#fff",
    textAlign: "left",
  },
  banner: {
    backgroundColor: "#fff3e6",
    padding: 20,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginVertical: 10,
    color: "#6b4226",
  },
  graphContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
  },
});

export default styles;