import React, { useEffect, useState } from 'react';
interface NotificationItem {
  _id: string;
  title: string;
  body: string;
  sentAt?: string;
  createdAt: string;
}
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { getNotificationHistory } from './services/notificationService';

export const options = {
  headerShown: false,
  tabBarStyle: { display: 'none' },
};

export default function NotificationHistoryScreen() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const data = await getNotificationHistory();
      console.log("📡 Received notifications:", data);
      setNotifications(data);
    };
    fetchData();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔔 היסטוריית התראות</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  notification: { marginBottom: 16, padding: 12, borderBottomWidth: 1, borderColor: '#ccc' },
  text: { fontSize: 16, fontWeight: 'bold' },
  body: { fontSize: 14, color: '#555' },
  date: { fontSize: 12, color: '#999' },
});