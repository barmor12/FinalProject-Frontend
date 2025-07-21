import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useState, useEffect } from 'react';
import { TouchableOpacity, ViewStyle, StyleProp, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NotificationHistoryModal from './NotificationHistoryModal';
import { useFocusEffect } from 'expo-router';
import { getNotificationHistory } from '../app/services/notificationService';
import * as Notifications from 'expo-notifications';

interface Props {
  style?: StyleProp<ViewStyle>;
}

async function updateAppIconBadge(count: number) {
  await Notifications.setBadgeCountAsync(count);
}

export default function NotificationButton({ style }: Props) {
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = async () => {
    const notifications = await getNotificationHistory();

    const readIdsString = await AsyncStorage.getItem("readNotifications");
    const readIds = readIdsString ? JSON.parse(readIdsString) : [];

    const unread = notifications.filter((n: { _id: string, type?: string }) => !readIds.includes(n._id) && n.type === 'new_order');
    setUnreadCount(unread.length);
    updateAppIconBadge(unread.length);
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchUnreadCount();
    }, [])
  );

  useEffect(() => {
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 15000); // Every 15 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <TouchableOpacity
        onPress={() => setShowNotificationModal(true)}
        style={[
          {
            backgroundColor: '#f4c430',
            width: 36,
            height: 36,
            borderRadius: 18,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 1,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 3,
            elevation: 3,
          },
          style,
        ]}
      >
        <Ionicons name="notifications-outline" size={20} color="#fff" />
        {unreadCount > 0 && (
          <View style={{
            position: 'absolute',
            top: -4,
            right: -4,
            backgroundColor: 'red',
            borderRadius: 10,
            paddingHorizontal: 5,
            minWidth: 18,
            height: 18,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <Text style={{ color: 'white', fontSize: 11, fontWeight: 'bold' }}>{unreadCount}</Text>
          </View>
        )}
      </TouchableOpacity>

      <NotificationHistoryModal
        visible={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
        onNotificationRead={fetchUnreadCount}
        markAllAsReadText={
          <Text style={{ color: '#007AFF', fontWeight: 'bold', textAlign: 'center' }}>
            Mark all as read
          </Text>
        }
      />
    </>
  );
}