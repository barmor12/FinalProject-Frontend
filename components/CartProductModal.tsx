import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface Product {
  _id: string;
  name: string;
  image: string;
  price: number;
  description: string;
  ingredients?: string[];
  allergens?: string[];
}

interface CartProductModalProps {
  visible: boolean;
  onClose: () => void;
  product: Product | null;
}

const CartProductModal: React.FC<CartProductModalProps> = ({
  visible,
  onClose,
  product,
}) => {
  if (!product) return null; // אם אין מוצר, אל תציג כלום

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close-circle" size={32} color="#6b4226" />
          </TouchableOpacity>

          <Image source={{ uri: product.image }} style={styles.productImage} />
          <Text style={styles.productName}>{product.name}</Text>
          <Text style={styles.productPrice}>${product.price.toFixed(2)}</Text>
          <Text style={styles.productDescription}>{product.description}</Text>

          {product.ingredients && product.ingredients.length > 0 && (
            <Text style={styles.productDetails}>
              🥄 Ingredients: {product.ingredients.join(", ")}
            </Text>
          )}

          {product.allergens && product.allergens.length > 0 && (
            <Text style={styles.productDetails}>
              ⚠️ Allergens: {product.allergens.join(", ")}
            </Text>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "#fff",
    width: "85%",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  closeButton: {
    position: "absolute",
    top: 10,
    right: 10,
  },
  productImage: {
    width: 150,
    height: 150,
    borderRadius: 10,
    marginBottom: 10,
  },
  productName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#6b4226",
    textAlign: "center",
  },
  productPrice: {
    fontSize: 18,
    color: "#6b4226",
    marginBottom: 5,
  },
  productDescription: {
    fontSize: 14,
    textAlign: "center",
    color: "#333",
    marginBottom: 10,
  },
  productDetails: {
    fontSize: 14,
    color: "#6b4226",
    textAlign: "center",
    marginTop: 5,
  },
});

export default CartProductModal;
