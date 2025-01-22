import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import styles from './styles/IndexStyle'; // יש לוודא שהסגנון נמצא בקובץ FirstPageStyles
import { router } from 'expo-router';

export default function FirstPage() {
    return (
        <View style={styles.container}>
            {/* כותרת למעלה באמצע */}
            <Text style={styles.title}>Welcome to our CakeManager App</Text>

            {/* תמונה מתחת לכותרת */}
            <View style={styles.imageContainer}>
                <Image
                    source={require('../assets/images/your-image.png')} // השתמש בקובץ המקומי בתיקיית assets/images
                    style={styles.image}
                />
            </View>

            {/* כפתורים להתחברות או הרשמה */}
            <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.button} onPress={() => router.push("/LogInScreen")}>
                    <Text style={styles.buttonText}>Login</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.button} onPress={() => router.push("/SignUpScreen")}>
                    <Text style={styles.buttonText}>Sign Up</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
