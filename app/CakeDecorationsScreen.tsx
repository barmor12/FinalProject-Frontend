import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

const decorations = [
  { id: "1", name: "Sprinkles" },
  { id: "2", name: "Choco Chips" },
  { id: "3", name: "Edible Flowers" },
  { id: "4", name: "Fondant Shapes" },
];

export default function CakeDecorationsScreen() {
  const [selectedDecorations, setSelectedDecorations] = useState<string[]>([]);

  const toggleDecoration = (id: string) => {
    setSelectedDecorations((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  const renderItem = ({ item }: { item: { id: string; name: string } }) => (
    <TouchableOpacity
      style={[
        styles.item,
        selectedDecorations.includes(item.id) && styles.selectedItem,
      ]}
      onPress={() => toggleDecoration(item.id)}
    >
      <Text style={styles.itemText}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose Decorations</Text>
      <FlatList
        data={decorations}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f9f3ea",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#6b4226",
    marginBottom: 20,
  },
  item: {
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
  },
  selectedItem: {
    borderColor: "#6b4226",
    backgroundColor: "#fdebd3",
  },
  itemText: {
    fontSize: 16,
    color: "#6b4226",
  },
});
