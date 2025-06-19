import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f9f3ea",
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 20,
        backgroundColor: "#f9f3ea",
        borderBottomWidth: 1,
        borderBottomColor: "#e0e0e0",
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#6b4226",
    },
    addButton: {
        backgroundColor: "#6b4226",
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
    },
    scrollView: {
        flex: 1,
        padding: 10,
    },
    recipeGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
    },
    recipeCard: {
        width: "48%",
        backgroundColor: "#fff",
        borderRadius: 15,
        marginBottom: 15,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    recipeImage: {
        width: "100%",
        height: 150,
    },
    recipeInfo: {
        padding: 12,
    },
    recipeTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#6b4226",
        marginBottom: 4,
    },
    recipeDescription: {
        fontSize: 12,
        color: "#666",
        marginBottom: 8,
    },
    recipeMeta: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    metaItem: {
        flexDirection: "row",
        alignItems: "center",
    },
    metaText: {
        fontSize: 12,
        color: "#6b4226",
        marginLeft: 4,
    },
    deleteButton: {
        position: "absolute",
        top: 10,
        right: 10,
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: "center",
        alignItems: "center",
    },
}); 

export default styles;