import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from 'react';
import { Modal, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { getNotificationHistory } from '../app/services/notificationService';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';

interface NotificationItem {
  _id: string;
  title: string;
  body: string;
  sentAt?: string;
  createdAt: string;
  orderId?: string;
  navigateTo?: string;
  type?: string;
  isRead?: boolean;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onNotificationRead?: () => void;
  markAllAsReadText?: React.ReactNode;
}

const markAsRead = async (notificationId: string) => {
  const readIdsString = await AsyncStorage.getItem("readNotifications");
  const readIds = readIdsString ? JSON.parse(readIdsString) : [];
  if (!readIds.includes(notificationId)) {
    readIds.push(notificationId);
    await AsyncStorage.setItem("readNotifications", JSON.stringify(readIds));
  }
};

const NotificationHistoryModal: React.FC<Props> = ({ visible, onClose, onNotificationRead, markAllAsReadText }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    if (visible) {
      const fetchData = async () => {
        const data = await getNotificationHistory();
        const readIdsString = await AsyncStorage.getItem("readNotifications");
        const readIds = readIdsString ? JSON.parse(readIdsString) : [];
        // שומר רק התראות מסוג new_order
        const filtered = data.filter((n: NotificationItem) => n.type === 'new_order');
        const normalized = filtered.map((n: NotificationItem) => ({
          ...n,
          isRead: readIds.includes(n._id),
        }));
        setNotifications(normalized);
      };
      fetchData();
    }
  }, [visible]);

  // Add markAllAsRead function as described
  const markAllAsRead = async () => {
    const ids = notifications.map(n => n._id);
    await AsyncStorage.setItem("readNotifications", JSON.stringify(ids));
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    onNotificationRead?.();
    await Notifications.setBadgeCountAsync(0);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <TouchableOpacity activeOpacity={1} onPress={onClose} style={styles.modalOverlay}>
        <TouchableOpacity activeOpacity={1} onPress={() => { }} style={styles.modalContent}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.title}>🔔 Notification </Text>
          <TouchableOpacity onPress={markAllAsRead} style={{ marginBottom: 10 }}>
            {markAllAsReadText}
          </TouchableOpacity>
          <FlatList
            data={notifications.filter(n => n.type === 'new_order')}
            keyExtractor={(item) => item._id}
            contentContainerStyle={{ paddingBottom: 10 }}
            renderItem={({ item }) => {
              const isUnread = item.isRead === false;
              return (
                <TouchableOpacity
                  style={[
                    styles.notification,
                    isUnread && { backgroundColor: '#fff8dc', borderLeftColor: '#ff4444' },
                  ]}
                  onPress={async () => {
                    onClose();
                    // Immediately update notifications and call onNotificationRead before navigation
                    if (item._id) {
                      setNotifications(prev =>
                        prev.map(n => n._id === item._id ? { ...n, isRead: true } : n)
                      );
                      await markAsRead(item._id);
                      onNotificationRead?.();
                    }
                    setTimeout(async () => {
                      const role = await AsyncStorage.getItem("role");

                      try {
                        if (item.navigateTo) {
                          const validPath = item.navigateTo as
                            | '/adminScreens/OrderDetailsScreen'
                            | '/adminScreens/adminOrdersScreen'
                            | '/OrdersScreen';

                          // If navigating to OrderDetailsScreen, check if orderId exists
                          if (validPath === '/adminScreens/OrderDetailsScreen' && item.orderId) {
                            // Try to navigate to order details, but have fallback
                            router.push({ pathname: validPath, params: { orderId: item.orderId } });
                          } else {
                            router.push({ pathname: validPath, params: item.orderId ? { orderId: item.orderId } : undefined });
                          }
                        } else if (role === "admin" && item.type === "new_order" && item.orderId) {
                          // For admin new order notifications, try order details first
                          router.push({ pathname: "/adminScreens/OrderDetailsScreen", params: { orderId: item.orderId } });
                        } else if (role === "user" && item.type === "order_status_change") {
                          router.push("/OrdersScreen");
                        } else {
                          // Fallback to main screen
                          router.push("/");
                        }
                      } catch (error) {
                        console.error('Navigation error:', error);
                        // Fallback navigation based on role
                        if (role === "admin") {
                          router.push("/adminScreens/adminOrdersScreen");
                        } else {
                          router.push("/OrdersScreen");
                        }
                      }
                    }, 200);
                  }}
                >
                  <Text style={styles.text}>{item.title}</Text>
                  <Text style={styles.body}>{item.body}</Text>
                  <Text style={styles.date}>
                    {(() => {
                      const d = new Date(item.sentAt || item.createdAt);
                      const day = String(d.getDate()).padStart(2, '0');
                      const month = String(d.getMonth() + 1).padStart(2, '0');
                      const year = String(d.getFullYear()).slice(-2);
                      return `${day}/${month}/${year}`;
                    })()}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        </TouchableOpacity>
      </TouchableOpacity>
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
