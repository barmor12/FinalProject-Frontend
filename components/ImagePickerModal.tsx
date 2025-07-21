import React from "react";
import { View, Text, Image, TouchableOpacity, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import styles from "../app/styles/ProfileScreenStyles";

interface ImagePickerModalProps {
    visible: boolean;
    imageUri: string | null;
    onConfirm: () => void;
    onCancel: () => void;
}

const ImagePickerModal: React.FC<ImagePickerModalProps> = ({ visible, imageUri, onConfirm, onCancel }) => {
    if (!imageUri) return null;
    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.imagePreviewModalOverlay}>
                <View style={styles.imagePreviewModalContent}>
                    <TouchableOpacity
                        style={styles.imagePreviewCloseButton}
                        onPress={onCancel}
                    >
                        <Ionicons name="close-circle" size={28} color="#d49a6a" />
                    </TouchableOpacity>
                    <Image
                        source={{ uri: imageUri }}
                        style={styles.imagePreview}
                    />
                    <Text style={styles.imagePreviewHelperText}>JPG/PNG up to 5MB</Text>
                    <Text style={{ marginBottom: 10, fontSize: 16, color: '#6b4226', fontWeight: '600' }}>Use this image?</Text>
                    <View style={styles.imagePreviewButtonsRow}>
                        <TouchableOpacity onPress={onConfirm} style={styles.imagePreviewButton}>
                            <Text style={styles.imagePreviewButtonText}>Yes</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={onCancel} style={[styles.imagePreviewButton, styles.imagePreviewButtonCancel]}>
                            <Text style={styles.imagePreviewButtonText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

export default ImagePickerModal; 