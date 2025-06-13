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
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: "#6b4226",
    },
    errorText: {
        fontSize: 16,
        color: "#ff4444",
        marginBottom: 20,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 20,
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderBottomColor: "#e0e0e0",
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: "center",
        alignItems: "center",
    },
    backButtonText: {
        color: "#6b4226",
        fontWeight: "bold",
        fontSize: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#6b4226",
    },
    scrollView: {
        flex: 1,
    },
    form: {
        padding: 20,
    },
    // Recipe details styles
    recipeImage: {
        width: "100%",
        height: 250,
        borderRadius: 12,
        marginBottom: 20,
    },
    recipeName: {
        fontSize: 28,
        fontWeight: "bold",
        color: "#6b4226",
        marginBottom: 10,
    },
    recipeDescription: {
        fontSize: 16,
        color: "#666",
        marginBottom: 20,
        lineHeight: 24,
    },
    recipeMetaContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 25,
        backgroundColor: "#fff",
        borderRadius: 10,
        padding: 15,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    recipeMetaItem: {
        flexDirection: "row",
        alignItems: "center",
    },
    recipeMetaText: {
        fontSize: 14,
        color: "#6b4226",
        marginLeft: 5,
        fontWeight: "600",
    },
    recipeSection: {
        marginBottom: 25,
    },
    recipeSectionTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#6b4226",
        marginBottom: 15,
    },
    recipeList: {
        backgroundColor: "#fff",
        borderRadius: 10,
        padding: 15,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    recipeListItem: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginBottom: 10,
    },
    recipeListItemDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: "#6b4226",
        marginTop: 6,
        marginRight: 10,
    },
    recipeListItemNumber: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: "#6b4226",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 10,
    },
    recipeListItemNumberText: {
        fontSize: 12,
        fontWeight: "bold",
        color: "#fff",
    },
    recipeListItemText: {
        fontSize: 16,
        color: "#333",
        flex: 1,
        lineHeight: 22,
    },
    editButton: {
        backgroundColor: "#6b4226",
        borderRadius: 10,
        padding: 15,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginTop: 20,
    },
    editButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
        marginLeft: 10,
    },
    // Edit form styles
    inputGroup: {
        marginBottom: 15,
    },
    label: {
        fontSize: 16,
        fontWeight: "600",
        color: "#6b4226",
        marginBottom: 5,
    },
    input: {
        backgroundColor: "#fff",
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: "#6b4226",
        borderWidth: 1,
        borderColor: "#e0e0e0",
    },
    textArea: {
        height: 100,
        textAlignVertical: "top",
    },
    imagePicker: {
        width: "100%",
        height: 200,
        backgroundColor: "#fff",
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#e0e0e0",
        overflow: "hidden",
    },
    imagePreview: {
        width: "100%",
        height: "100%",
    },
    imagePlaceholder: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    imagePlaceholderText: {
        marginTop: 10,
        color: "#6b4226",
        fontSize: 16,
    },
    difficultyButtons: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 5,
    },
    difficultyButton: {
        flex: 1,
        padding: 10,
        borderRadius: 8,
        backgroundColor: "#f9f3ea",
        marginHorizontal: 5,
        alignItems: "center",
    },
    selectedDifficulty: {
        backgroundColor: "#6b4226",
    },
    difficultyText: {
        color: "#6b4226",
        fontWeight: "600",
    },
    selectedDifficultyText: {
        color: "#fff",
    },
    saveButton: {
        backgroundColor: "#6b4226",
        padding: 15,
        borderRadius: 8,
        alignItems: "center",
        marginTop: 20,
    },
    saveButtonDisabled: {
        backgroundColor: "#a58c6f",
    },
    saveButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },
    cancelButton: {
        backgroundColor: "#fff",
        padding: 15,
        borderRadius: 8,
        alignItems: "center",
        marginTop: 10,
        borderWidth: 1,
        borderColor: "#6b4226",
    },
    cancelButtonText: {
        color: "#6b4226",
        fontSize: 16,
        fontWeight: "600",
    },
    noDataText: {
        color: "#666",
        fontStyle: "italic",
        padding: 10,
        textAlign: "center",
    },
}); 

export default styles;