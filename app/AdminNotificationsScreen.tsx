import React, { useState, useRef } from 'react';
import {
    SafeAreaView,
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Alert,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '../config';
import useNotifications from '../hooks/useNotifications';

export default function AdminNotificationsScreen() {
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [notificationType, setNotificationType] = useState<'all' | 'promotion' | 'newProduct'>('all');
    const [recentNotifications, setRecentNotifications] = useState<Array<{
        _id: string;
        title: string;
        message: string;
        type: string;
        sentAt: string;
        sentTo: number;
    }>>([]);

    // Get the notification functions
    const { sendTestNotification } = useNotifications();

    React.useEffect(() => {
        fetchRecentNotifications();
    }, []);

    const fetchRecentNotifications = async () => {
        try {
            const token = await AsyncStorage.getItem('accessToken');
            if (!token) {
                Alert.alert('Error', 'You must be logged in');
                return;
            }

            const response = await fetch(`${config.BASE_URL}/notifications/recent`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch recent notifications');
            }

            const data = await response.json();
            setRecentNotifications(data);
        } catch (error) {
            console.error('Error fetching recent notifications:', error);
            Alert.alert('Error', 'Failed to fetch recent notifications');
        }
    };

    const sendNotification = async () => {
        if (!title.trim()) {
            Alert.alert('Error', 'Please enter a notification title');
            return;
        }

        if (!message.trim()) {
            Alert.alert('Error', 'Please enter a notification message');
            return;
        }

        setLoading(true);

        try {
            const token = await AsyncStorage.getItem('accessToken');
            if (!token) {
                Alert.alert('Error', 'You must be logged in');
                setLoading(false);
                return;
            }

            const response = await fetch(`${config.BASE_URL}/notifications/send`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title,
                    message,
                    type: notificationType
                })
            });

            if (!response.ok) {
                throw new Error('Failed to send notification');
            }

            const result = await response.json();
            Alert.alert(
                'Success',
                `Notification sent to ${result.sentTo} customers`
            );

            // Clear form and refresh list
            setTitle('');
            setMessage('');
            fetchRecentNotifications();
        } catch (error) {
            console.error('Error sending notification:', error);
            Alert.alert('Error', 'Failed to send notification');
        } finally {
            setLoading(false);
        }
    };

    const renderNotificationType = (type: 'all' | 'promotion' | 'newProduct', label: string, icon: string) => (
        <TouchableOpacity
            style={[
                styles.typeButton,
                notificationType === type && styles.selectedTypeButton
            ]}
            onPress={() => setNotificationType(type)}
        >
            <Ionicons
                name={icon as any}
                size={20}
                color={notificationType === type ? '#fff' : '#6b4226'}
            />
            <Text style={[
                styles.typeButtonText,
                notificationType === type && styles.selectedTypeButtonText
            ]}>
                {label}
            </Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView>
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Send Notifications</Text>
                        <Text style={styles.headerSubtitle}>
                            Send notifications to all customers about promotions, new products, or important updates.
                        </Text>
                    </View>

                    <View style={styles.form}>
                        <Text style={styles.sectionTitle}>Notification Type</Text>
                        <View style={styles.typeContainer}>
                            {renderNotificationType('all', 'All Customers', 'people-outline')}
                            {renderNotificationType('promotion', 'Promotion', 'pricetag-outline')}
                            {renderNotificationType('newProduct', 'New Product', 'gift-outline')}
                        </View>

                        <Text style={styles.label}>Notification Title</Text>
                        <TextInput
                            style={styles.input}
                            value={title}
                            onChangeText={setTitle}
                            placeholder="Enter notification title"
                            maxLength={50}
                        />
                        <Text style={styles.charCounter}>{title.length}/50</Text>

                        <Text style={styles.label}>Notification Message</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={message}
                            onChangeText={setMessage}
                            placeholder="Enter notification message"
                            multiline
                            maxLength={200}
                        />
                        <Text style={styles.charCounter}>{message.length}/200</Text>

                        <TouchableOpacity
                            style={[styles.sendButton, loading && styles.sendButtonDisabled]}
                            onPress={sendNotification}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <Ionicons name="notifications-outline" size={20} color="#fff" />
                                    <Text style={styles.sendButtonText}>Send Notification</Text>
                                </>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.testButton}
                            onPress={() => {
                                sendTestNotification();
                                Alert.alert('Test Notification', 'A test notification has been sent to this device.');
                            }}
                        >
                            <Ionicons name="bug-outline" size={20} color="#fff" />
                            <Text style={styles.sendButtonText}>Test Notification on This Device</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.recentSection}>
                        <Text style={styles.sectionTitle}>Recent Notifications</Text>
                        {recentNotifications.length > 0 ? (
                            recentNotifications.map((notification) => (
                                <View key={notification._id} style={styles.notificationCard}>
                                    <View style={styles.notificationHeader}>
                                        <Text style={styles.notificationTitle}>{notification.title}</Text>
                                        <View style={styles.typeTag}>
                                            <Text style={styles.typeTagText}>{notification.type}</Text>
                                        </View>
                                    </View>
                                    <Text style={styles.notificationMessage}>{notification.message}</Text>
                                    <View style={styles.notificationFooter}>
                                        <Text style={styles.notificationDate}>
                                            {new Date(notification.sentAt).toLocaleDateString()} •
                                            {new Date(notification.sentAt).toLocaleTimeString()}
                                        </Text>
                                        <Text style={styles.notificationSentTo}>
                                            Sent to {notification.sentTo} customers
                                        </Text>
                                    </View>
                                </View>
                            ))
                        ) : (
                            <Text style={styles.emptyText}>No recent notifications</Text>
                        )}
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9f3ea',
    },
    header: {
        padding: 20,
        backgroundColor: '#6b4226',
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 10,
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#f0e4d7',
        lineHeight: 20,
    },
    form: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#6b4226',
        marginBottom: 15,
        marginTop: 10,
    },
    typeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    typeButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f0e4d7',
        padding: 12,
        borderRadius: 8,
        marginHorizontal: 5,
    },
    selectedTypeButton: {
        backgroundColor: '#6b4226',
    },
    typeButtonText: {
        fontSize: 14,
        color: '#6b4226',
        marginLeft: 6,
        fontWeight: '500',
    },
    selectedTypeButtonText: {
        color: '#fff',
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6b4226',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e2d6c5',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: '#333',
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    charCounter: {
        fontSize: 12,
        color: '#999',
        textAlign: 'right',
        marginTop: 4,
        marginBottom: 16,
    },
    sendButton: {
        backgroundColor: '#6b4226',
        borderRadius: 8,
        padding: 15,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
    },
    testButton: {
        backgroundColor: '#28a745',
        borderRadius: 8,
        padding: 15,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
    },
    sendButtonDisabled: {
        backgroundColor: '#a58c6f',
    },
    sendButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    recentSection: {
        padding: 20,
        paddingTop: 0,
    },
    notificationCard: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 15,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    notificationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    notificationTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#6b4226',
        flex: 1,
    },
    typeTag: {
        backgroundColor: '#f0e4d7',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    typeTagText: {
        fontSize: 12,
        color: '#6b4226',
    },
    notificationMessage: {
        fontSize: 14,
        color: '#555',
        marginBottom: 10,
        lineHeight: 20,
    },
    notificationFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: '#f0e4d7',
        paddingTop: 8,
    },
    notificationDate: {
        fontSize: 12,
        color: '#999',
    },
    notificationSentTo: {
        fontSize: 12,
        color: '#6b4226',
        fontWeight: '500',
    },
    emptyText: {
        textAlign: 'center',
        color: '#999',
        fontStyle: 'italic',
        padding: 20,
    },
}); 