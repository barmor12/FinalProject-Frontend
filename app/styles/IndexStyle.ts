import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f9f3ea', // צבע רקע אחיד
        padding: 16,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#6b4226', // צבע חום עדין
        marginBottom: 20,
        textAlign: 'center',
    },
    imageContainer: {
        marginBottom: 30, // רווח מתחת לתמונה
    },
    image: {
        width: 250, // רוחב התמונה
        height: 250, // גובה התמונה
        resizeMode: 'contain', // לשמור על פרופורציות התמונה
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between', // כדי לשים את הכפתורים אחד ליד השני
        width: '80%', // גודל הכפתורים
    },
    button: {
        backgroundColor: '#d49a6a', // צבע זהב
        padding: 15,
        borderRadius: 8,
        width: '48%', // כל כפתור יתפוס חצי מהרוחב
        alignItems: 'center',
        marginVertical: 10, // רווח אנכי בין הכפתורים
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
});

export default styles;
