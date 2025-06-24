import React, { useEffect, useState } from 'react';
import { Modal, View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { getNotificationHistory } from '../app/services/notificationService';
import { useNavigation } from '@react-navigation/native';
import { router } from 'expo-router';

interface NotificationItem {
  _id: string;
  title: string;
  body: string;
  sentAt?: string;
  createdAt: string;
  orderId?: string;
  navigateTo?: string;
  type?: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
}

const NotificationHistoryModal: React.FC<Props> = ({ visible, onClose }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const navigation = useNavigation();

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
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.title}>🔔 Notification History</Text>
          <FlatList
            data={notifications}
            keyExtractor={(item) => item._id}
            contentContainerStyle={{ paddingBottom: 10 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.notification}
                onPress={() => {
                  if (item.type === 'new_order') {
                    onClose();
                    setTimeout(() => {
                      router.push({
                        pathname: '/adminScreens/ProductDetailsScreenAdmin',
                        params: { productId: item.body.split(': ')[1] },
                      });
                    }, 200);
                    return;
                  }

                  if ((item as any)?.navigateTo === 'order_details' && (item as any)?.orderId) {
                    onClose();
                    setTimeout(() => {
                      router.push({
                        pathname: '/adminScreens/ProductDetailsScreenAdmin',
                        params: { orderId: (item as any).orderId },
                      });
                    }, 200);
                    return;
                  }

                  if (item.title.toLowerCase().includes('status')) {
                    onClose();
                    setTimeout(() => {
                      router.push('/OrdersScreen');
                    }, 200);
                    return;
                  }
                }}
              >
                <Text style={styles.text}>{item.title}</Text>
                <Text style={styles.body}>{item.body}</Text>
                <Text style={styles.date}>
                  {new Date(item.sentAt || item.createdAt).toLocaleString()}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 60,
    paddingRight: 16,
  },
  modalContent: {
    width: 360,
    maxHeight: 500,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    paddingVertical: 24,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
    position: 'relative',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e1e1e',
    marginBottom: 20,
    textAlign: 'center',
  },
  notification: {
    marginBottom: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
    borderLeftWidth: 5,
    borderLeftColor: '#ffd700',
  },
  text: { fontSize: 17, fontWeight: '600', color: '#222' },
  body: { fontSize: 15, color: '#555', marginTop: 6 },
  date: { fontSize: 12, color: '#999', marginTop: 6 },
  closeButton: {
    position: 'absolute',
    top: 14,
    right: 16,
    padding: 6,
    zIndex: 10,
  },
  closeText: {
    fontSize: 20,
    color: '#333',
    fontWeight: 'bold',
  },
});

export default NotificationHistoryModal;
