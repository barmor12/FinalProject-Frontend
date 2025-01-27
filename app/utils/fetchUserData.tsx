import AsyncStorage from "@react-native-async-storage/async-storage";
import config from "../../config";

export const fetchUserData = async () => {
    try {
        // שליפת הטוקן מתוך AsyncStorage
        const token = await AsyncStorage.getItem("accessToken");
        if (!token) {
            console.warn("No access token found.");
            return null;
        }

        // שליחת בקשה ל-Backend כדי להביא את פרטי המשתמש
        const response = await fetch(`${config.BASE_URL}/user/profile`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`, // הוספת הטוקן לכותרת Authorization
            },
        });

        // בדיקת הסטטוס של התגובה
        if (!response.ok) {
            console.error("Failed to fetch user data:", response.status);
            return null;
        }

        // המרת התגובה ל-JSON
        const data = await response.json();
        return data; // החזרת פרטי המשתמש
    } catch (error) {
        console.error("Error fetching user data:", error);
        return null;
    }
};
