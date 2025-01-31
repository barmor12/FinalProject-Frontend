import React, { useState } from "react";
import { View, Text, FlatList, TouchableOpacity } from "react-native";
import styles from "./styles/CakeDecorationsStyles"; // Importing styles

// List of available cake decorations
const decorations = [
  { id: "1", name: "Sprinkles" },
  { id: "2", name: "Choco Chips" },
  { id: "3", name: "Edible Flowers" },
  { id: "4", name: "Fondant Shapes" },
];

export default function CakeDecorationsScreen() {
  const [selectedDecorations, setSelectedDecorations] = useState<string[]>([]);

  // Toggle selection of decoration
  const toggleDecoration = (id: string) => {
    console.log(`🔄 Toggling decoration: ${id}`);
    setSelectedDecorations((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  // Render decoration item
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
