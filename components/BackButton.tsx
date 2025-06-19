import React from 'react';
import { TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function BackButton({ onPress }: { onPress?: () => void }) {
  const router = useRouter();

  return (
    <TouchableOpacity
      onPress={onPress || (() => router.back())}
      style={styles.backButton}
    >
      <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  backButton: {
    width: 48,
    height: 48,
    backgroundColor: "#D49A6A",
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 1,
    borderColor: "#B87D50",
  },
  backButtonWrapper: {
    position: "absolute",
    top: 80,
    alignSelf: "center",
    zIndex: 10,
  },
  headerWrapper: {
    backgroundColor: "#F8F0E6",
    paddingTop: 40,
    paddingBottom: 16,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
});