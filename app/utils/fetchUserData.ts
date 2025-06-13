import AsyncStorage from "@react-native-async-storage/async-storage";
import config from "../../config";

export const fetchUserData = async () => {
  try {
    // Fetch the token from AsyncStorage
    const token = await AsyncStorage.getItem("accessToken");
    if (!token) {
      console.warn("No access token found.");
      return null;
    }

    // Send request to backend to retrieve user profile
    const response = await fetch(`${config.BASE_URL}/user/profile`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, // Add token to Authorization header
      },
    });

    // Check the response status
    if (!response.ok) {
      console.error("Failed to fetch user data:", response.status);

      // If user not found (e.g., deleted from system), remove tokens and logout
      if (response.status === 404) {
        console.warn("User not found. Clearing stored tokens...");
        await AsyncStorage.removeItem("accessToken");
        await AsyncStorage.removeItem("refreshToken");
        return null;
      }

      return null;
    }

    // Parse response as JSON
    const data = await response.json();

    // Validate that user data is valid
    if (!data || !data._id) {
      console.warn("Invalid user data received. Clearing stored tokens...");
      await AsyncStorage.removeItem("accessToken");
      await AsyncStorage.removeItem("refreshToken");
      return null;
    }

    return data; // Return user data
  } catch (error) {
    // Handle fetch errors
    console.error("Error fetching user data:", error);
    return null;
  }
};

export default fetchUserData;
