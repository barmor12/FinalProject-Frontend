import React, { useState } from 'react';
import { TouchableOpacity, ViewStyle, StyleProp } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NotificationHistoryModal from './NotificationHistoryModal';

interface Props {
  style?: StyleProp<ViewStyle>;
}

export default function NotificationButton({ style }: Props) {
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  return (
    <>
      <TouchableOpacity
        onPress={() => setShowNotificationModal(true)}
        style={[
          {
            backgroundColor: '#f4c430', // גוון צהוב חמים
            width: 36,
            height: 36,
            borderRadius: 18,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 8,
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
      </TouchableOpacity>

      <NotificationHistoryModal
        visible={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
      />
    </>
  );
}