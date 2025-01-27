import AsyncStorage from "@react-native-async-storage/async-storage";

const REFRESH_TOKEN_KEY = "refreshToken";

/**
 * Save the refresh token to AsyncStorage.
 * @param {string} token - The refresh token to save.
 */
export const saveRefreshToken = async (token) => {
  try {
    if (!token) {
      throw new Error("Token is undefined or null");
    }
    await AsyncStorage.setItem(REFRESH_TOKEN_KEY, token);
    console.log("Refresh token saved successfully");
  } catch (error) {
    console.error("Error saving refresh token:", error.message);
  }
};

/**
 * Retrieve the refresh token from AsyncStorage.
 * @returns {Promise<string|null>} - The refresh token, or null if not found.
 */
export const getRefreshToken = async () => {
  try {
    const token = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
    if (!token) {
      console.warn("No refresh token found in AsyncStorage");
    }
    return token;
  } catch (error) {
    console.error("Error retrieving refresh token:", error.message);
    return null;
  }
};

/**
 * Remove the refresh token from AsyncStorage.
 */
export const removeRefreshToken = async () => {
  try {
    await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
    console.log("Refresh token removed successfully");
  } catch (error) {
    console.error("Error removing refresh token:", error.message);
  }
};

export default {
  getRefreshToken,
  saveRefreshToken,
  removeRefreshToken,
};
