import React, { useEffect, useState } from 'react';
import { Modal, View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { getNotificationHistory } from '../app/services/notificationService';

interface NotificationItem {
  _id: string;
  title: string;
  body: string;
  sentAt?: string;
  createdAt: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
}

const NotificationHistoryModal: React.FC<Props> = ({ visible, onClose }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    if (visible) {
      const fetchData = async () => {
        const data = await getNotificationHistory();
        setNotifications(data);
      };
      fetchData();
    }
  }, [visible]);

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>🔔 Notification History</Text>
          <FlatList
            data={notifications}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <View style={styles.notification}>
                <Text style={styles.text}>{item.title}</Text>
                <Text style={styles.body}>{item.body}</Text>
                <Text style={styles.date}>
                  {new Date(item.sentAt || item.createdAt).toLocaleString()}
                </Text>
              </View>
            )}
          />
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
  },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  notification: { marginBottom: 16, paddingBottom: 8, borderBottomWidth: 1, borderColor: '#ccc' },
  text: { fontSize: 16, fontWeight: 'bold' },
  body: { fontSize: 14, color: '#555' },
  date: { fontSize: 12, color: '#999' },
  closeButton: {
    marginTop: 10,
    padding: 10,
    alignItems: 'center',
    backgroundColor: '#007BFF',
    borderRadius: 6,
  },
  closeText: { color: '#fff', fontWeight: 'bold' },
});

export default NotificationHistoryModal;
