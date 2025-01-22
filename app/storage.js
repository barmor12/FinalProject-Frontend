import AsyncStorage from "@react-native-async-storage/async-storage";

const REFRESH_TOKEN_KEY = "refreshToken";

// Save the refresh token
export const saveRefreshToken = async (token) => {
  try {
    await AsyncStorage.setItem(REFRESH_TOKEN_KEY, token);
  } catch (error) {
    console.error("Error saving refresh token:", error);
  }
};

// Get the refresh token
export const getRefreshToken = async () => {
  try {
    return await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.error("Error retrieving refresh token:", error);
    return null;
  }
};

// Remove the refresh token
export const removeRefreshToken = async () => {
  try {
    await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.error("Error removing refresh token:", error);
  }
};
