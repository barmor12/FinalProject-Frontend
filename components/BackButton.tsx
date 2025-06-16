import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function BackButton({ onPress }: { onPress?: () => void }) {
  const router = useRouter();

  return (
    <TouchableOpacity
      onPress={onPress || (() => router.back())}
      style={styles.backButton}
    >
      <Ionicons name="arrow-back" size={20} color="#fff" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  backButton: {
    backgroundColor: '#d49a6a',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    position: 'absolute',
    left: 16,
    zIndex: 10,
  },
});