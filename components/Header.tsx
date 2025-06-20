import React from "react";
import { View, Text, StyleSheet } from "react-native";
import BackButton from "./BackButton";

export default function Header({
  title,
  showBack = true,
  style,
  onBackPress,
}: {
  title?: string;
  showBack?: boolean;
  style?: object;
  onBackPress?: () => void;
}) {
  return (
    <View style={[styles.headerWrapper, style]}>
      {showBack && <BackButton onPress={onBackPress} />}
      {title && <Text style={styles.headerText}>{title}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  headerWrapper: {
    backgroundColor: "#f9f3ea",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
    gap: 16,
  },
  headerText: {
    flex: 1,
    fontSize: 26,
    fontWeight: "bold",
    color: "#7C4A2D",
    textAlign: "center",
    marginRight: 40,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 4,
  },
});