import config from '../../config';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const getNotificationHistory = async () => {
  const token = await AsyncStorage.getItem('accessToken');

  const res = await fetch(`${config.BASE_URL}/notifications/history`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) throw new Error('Failed to fetch notification history');
  return res.json();
};