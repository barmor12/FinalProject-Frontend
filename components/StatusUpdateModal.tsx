// components/modals/StatusUpdateModal.tsx
import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

interface Props {
  visible: boolean;
  onClose: () => void;
  selectedStatus: string;
  setSelectedStatus: (status: string) => void;
  onConfirm: () => void;
}

const StatusUpdateModal: React.FC<Props> = ({
  visible,
  onClose,
  selectedStatus,
  setSelectedStatus,
  onConfirm,
}) => {
  const statuses = ["pending", "confirmed", "delivered", "cancelled"];

  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Update Order Status</Text>
          {statuses.map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.statusButton,
                selectedStatus === status && styles.selectedStatus,
              ]}
              onPress={() => setSelectedStatus(status)}
            >
              <Text style={styles.statusText}>{status.toUpperCase()}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.confirmButton} onPress={onConfirm}>
            <Text style={styles.confirmText}>Confirm</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default StatusUpdateModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "#00000088",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 25,
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#6b4226",
    marginBottom: 20,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  statusButton: {
    paddingVertical: 12,
    paddingHorizontal: 25,
    backgroundColor: "#f3ebe2",
    borderRadius: 12,
    marginBottom: 12,
    width: "100%",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  selectedStatus: {
    backgroundColor: "#d49a6a",
    borderColor: "#b87d50",
  },
  statusText: {
    fontSize: 16,
    color: "#4a2e1f",
    fontWeight: "500",
  },
  confirmButton: {
    backgroundColor: "#6b4226",
    paddingVertical: 14,
    borderRadius: 12,
    width: "100%",
    marginTop: 15,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  confirmText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  closeButton: {
    marginTop: 10,
    padding: 10,
  },
  closeText: {
    color: "#6b4226",
    fontSize: 15,
    fontWeight: "500",
    marginTop: 10,
    textDecorationLine: "underline",
  },
});