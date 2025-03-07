import React, { useState } from "react";
import { View, Button, Image, Alert, ActivityIndicator } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../firebaseConfig";

const UploadImage = () => {
    const [image, setImage] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    const pickImage = async () => {
        // בקשת הרשאות גישה לגלריה
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
            Alert.alert("יש צורך בהרשאות גישה לגלריה!");
            return;
        }

        // פתיחת גלריה לבחירת תמונה
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri);
        }
    };

    const uploadImage = async () => {
        if (!image) return;

        setUploading(true);
        const response = await fetch(image);
        const blob = await response.blob();
        const filename = image.substring(image.lastIndexOf("/") + 1);
        const storageRef = ref(storage, `images/${filename}`);
        const metadata = {
            contentType: "image/jpeg",
        };

        try {
            await uploadBytes(storageRef, blob, metadata);
            const downloadURL = await getDownloadURL(storageRef);
            Alert.alert("העלאה הושלמה!", `התמונה זמינה בכתובת: ${downloadURL}`);
            setImage(null);
        } catch (error) {
            //   Alert.alert("התרחשה שגיאה במהלך ההעלאה:", error);
        } finally {
            setUploading(false);
        }
    };

    return (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <Button title="בחר תמונה" onPress={pickImage} />
            {image && (
                <>
                    <Image source={{ uri: image }} style={{ width: 200, height: 200 }} />
                    {uploading ? (
                        <ActivityIndicator size="large" color="#0000ff" />
                    ) : (
                        <Button title="העלה תמונה" onPress={uploadImage} />
                    )}
                </>
            )}
        </View>
    );
};

export default UploadImage;
