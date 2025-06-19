import React from "react";
import { View, Text, StyleSheet } from "react-native";
import BackButton from "./BackButton";

export default function Header({
  title,
  showBack = true,
}: {
  title: string;
  showBack?: boolean;
}) {
  return (
    <View style={styles.headerWrapper}>
      {showBack && <BackButton />}
      <Text style={styles.headerText}>{title}</Text>
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
    fontSize: 24,
    fontWeight: "bold",
    color: "#7C4A2D",
    textAlign: "center",
    marginRight: 40, // לפצות על כפתור החזור בצד שמאל
  },
});