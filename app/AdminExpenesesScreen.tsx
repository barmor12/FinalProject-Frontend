import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    StyleSheet,
    Alert,
    SafeAreaView,
    ActivityIndicator,
    Platform,
    Modal,
    Pressable,
    KeyboardAvoidingView,
    ScrollView
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import config from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Expense {
    _id: string;
    description: string;
    amount: number;
    category: string;
    date: string;
}

const EXPENSE_CATEGORIES = [
    'Food & Beverages',
    'Ingredients',
    'Equipment',
    'Utilities',
    'Maintenance',
    'Marketing',
    'Staff',
    'Other'
];

export default function AdminExpensesScreen() {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
    const [tempCategory, setTempCategory] = useState(EXPENSE_CATEGORIES[0]);
    const [date, setDate] = useState(new Date().toISOString().substring(0, 10));
    const [isLoading, setIsLoading] = useState(false);
    const [isPickerVisible, setIsPickerVisible] = useState(false);
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const [editDescription, setEditDescription] = useState('');
    const [editAmount, setEditAmount] = useState('');
    const [editCategory, setEditCategory] = useState(EXPENSE_CATEGORIES[0]);
    const [editDate, setEditDate] = useState('');
    const [pickerContext, setPickerContext] = useState<'add' | 'edit'>('add');

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear().toString().slice(-2);
        return `${day}/${month}/${year}`;
    };

    const fetchExpenses = async () => {
        try {
            setIsLoading(true);
            const token = await AsyncStorage.getItem('accessToken');
            if (!token) {
                Alert.alert('Error', 'No access token found');
                return;
            }

            const response = await axios.get(`${config.BASE_URL}/expenses`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setExpenses(response.data);
        } catch (error) {
            console.error('Error fetching expenses:', error);
            Alert.alert('Error', 'Failed to fetch expenses');
        } finally {
            setIsLoading(false);
        }
    };

    const addExpense = async () => {
        if (!description || !amount || !category) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        try {
            setIsLoading(true);
            const token = await AsyncStorage.getItem('accessToken');
            if (!token) {
                Alert.alert('Error', 'No access token found');
                return;
            }

            await axios.post(
                `${config.BASE_URL}/expenses`,
                {
                    description,
                    amount: parseFloat(amount),
                    category,
                    date
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            setDescription('');
            setAmount('');
            setCategory(EXPENSE_CATEGORIES[0]);
            await fetchExpenses();
            Alert.alert('Success', 'Expense added successfully');
        } catch (error) {
            console.error('Error adding expense:', error);
            Alert.alert('Error', 'Failed to add expense');
        } finally {
            setIsLoading(false);
        }
    };

    const deleteExpense = async (id: string) => {
        Alert.alert(
            'Confirm Delete',
            'Are you sure you want to delete this expense?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel'
                },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setIsLoading(true);
                            const token = await AsyncStorage.getItem('accessToken');
                            if (!token) {
                                Alert.alert('Error', 'No access token found');
                                return;
                            }

                            await axios.delete(`${config.BASE_URL}/expenses/${id}`, {
                                headers: { Authorization: `Bearer ${token}` }
                            });
                            await fetchExpenses();
                            Alert.alert('Success', 'Expense deleted successfully');
                        } catch (error) {
                            console.error('Error deleting expense:', error);
                            Alert.alert('Error', 'Failed to delete expense');
                        } finally {
                            setIsLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const handleCategorySelect = () => {
        if (pickerContext === 'add') {
            setCategory(tempCategory);
        } else {
            setEditCategory(tempCategory);
        }
        setIsPickerVisible(false);
    };

    const handleEdit = (expense: Expense) => {
        setEditingExpense(expense);
        setEditDescription(expense.description);
        setEditAmount(expense.amount.toString());
        setEditCategory(expense.category);
        setEditDate(expense.date);
        setIsEditModalVisible(true);
    };

    const handleUpdateExpense = async () => {
        if (!editingExpense) return;

        try {
            setIsLoading(true);
            const token = await AsyncStorage.getItem('accessToken');
            if (!token) {
                Alert.alert('Error', 'No access token found');
                return;
            }

            await axios.put(
                `${config.BASE_URL}/expenses/${editingExpense._id}`,
                {
                    description: editDescription,
                    amount: parseFloat(editAmount),
                    category: editCategory,
                    date: editDate
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            await fetchExpenses();
            setIsEditModalVisible(false);
            Alert.alert('Success', 'Expense updated successfully');
        } catch (error) {
            console.error('Error updating expense:', error);
            Alert.alert('Error', 'Failed to update expense');
        } finally {
            setIsLoading(false);
        }
    };

    const handleModalPress = (e: any) => {
        e.stopPropagation();
    };

    useEffect(() => {
        fetchExpenses();
    }, []);

    const renderExpenseItem = ({ item }: { item: Expense }) => (
        <View style={styles.expenseItem}>
            <View style={styles.expenseInfo}>
                <Text style={styles.expenseDescription}>{item.description}</Text>
                <Text style={styles.expenseDetails}>
                    ${item.amount.toFixed(2)} - {item.category}
                </Text>
                <Text style={styles.expenseDate}>
                    {formatDate(item.date)}
                </Text>
            </View>
            <View style={styles.actionButtons}>
                <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => handleEdit(item)}
                    disabled={isLoading}
                >
                    <MaterialIcons name="edit" size={24} color="#6b4226" />
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => deleteExpense(item._id)}
                    disabled={isLoading}
                >
                    <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <Text style={styles.title}>Manage Expenses</Text>

                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Description"
                        value={description}
                        onChangeText={setDescription}
                        placeholderTextColor="#999"
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Amount"
                        keyboardType="numeric"
                        value={amount}
                        onChangeText={setAmount}
                        placeholderTextColor="#999"
                    />

                    <TouchableOpacity
                        style={styles.categoryButton}
                        onPress={() => {
                            setTempCategory(category);
                            setPickerContext('add');
                            setIsPickerVisible(true);
                        }}
                    >
                        <Text style={styles.categoryButtonText}>{category}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.addButton, isLoading && styles.disabledButton]}
                        onPress={addExpense}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.addButtonText}>Add Expense</Text>
                        )}
                    </TouchableOpacity>
                </View>

                <FlatList
                    data={expenses}
                    keyExtractor={item => item._id}
                    renderItem={renderExpenseItem}
                    style={styles.list}
                    contentContainerStyle={styles.listContent}
                />

                <Modal
                    visible={isEditModalVisible}
                    transparent={true}
                    animationType="slide"
                >
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={{ flex: 1 }}
                        keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 20}
                    >
                        <View style={styles.modalOverlay}>
                            <Pressable
                                style={styles.modalContent}
                                onPress={handleModalPress}
                            >
                                <View style={styles.pickerHeader}>
                                    <Text style={styles.pickerTitle}>Edit Expense</Text>
                                    <TouchableOpacity
                                        onPress={() => setIsEditModalVisible(false)}
                                        style={styles.closeButton}
                                    >
                                        <Text style={styles.closeButtonText}>Cancel</Text>
                                    </TouchableOpacity>
                                </View>
                                <ScrollView contentContainerStyle={styles.editFormScrollContainer}>
                                    <View style={styles.editForm}>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Description"
                                            value={editDescription}
                                            onChangeText={setEditDescription}
                                            placeholderTextColor="#999"
                                        />
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Amount"
                                            keyboardType="numeric"
                                            value={editAmount}
                                            onChangeText={setEditAmount}
                                            placeholderTextColor="#999"
                                        />
                                        <TouchableOpacity
                                            style={styles.categoryButton}
                                            onPress={() => {
                                                setTempCategory(editCategory);
                                                setPickerContext('edit');
                                                setIsEditModalVisible(false);
                                                setTimeout(() => {
                                                    setIsPickerVisible(true);
                                                }, 300);
                                            }}
                                        >
                                            <Text style={styles.categoryButtonText}>{editCategory}</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.addButton, isLoading && styles.disabledButton]}
                                            onPress={handleUpdateExpense}
                                            disabled={isLoading}
                                        >
                                            {isLoading ? (
                                                <ActivityIndicator color="#fff" />
                                            ) : (
                                                <Text style={styles.addButtonText}>Update Expense</Text>
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                </ScrollView>
                            </Pressable>
                        </View>
                    </KeyboardAvoidingView>
                </Modal>

                <Modal
                    visible={isPickerVisible}
                    transparent={true}
                    animationType="slide"
                >
                    <View style={styles.modalOverlay}>
                        <Pressable
                            style={styles.modalContent}
                            onPress={handleModalPress}
                        >
                            <View style={styles.pickerHeader}>
                                <Text style={styles.pickerTitle}>Select Category</Text>
                                <TouchableOpacity
                                    onPress={() => {
                                        handleCategorySelect();
                                        if (pickerContext === 'edit') {
                                            setTimeout(() => {
                                                setIsEditModalVisible(true);
                                            }, 300);
                                        }
                                    }}
                                    style={styles.closeButton}
                                >
                                    <Text style={styles.closeButtonText}>Done</Text>
                                </TouchableOpacity>
                            </View>
                            <Picker
                                selectedValue={tempCategory}
                                onValueChange={(itemValue) => setTempCategory(itemValue)}
                                style={styles.modalPicker}
                            >
                                {EXPENSE_CATEGORIES.map((cat) => (
                                    <Picker.Item key={cat} label={cat} value={cat} />
                                ))}
                            </Picker>
                        </Pressable>
                    </View>
                </Modal>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f9f3ea'
    },
    container: {
        flex: 1,
        padding: 16,
    },
    title: {
        fontSize: 24,
        marginBottom: 20,
        color: '#6b4226',
        fontWeight: 'bold',
        textAlign: 'center'
    },
    inputContainer: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    input: {
        borderWidth: 1,
        borderColor: '#d49a6a',
        padding: 12,
        marginBottom: 12,
        borderRadius: 8,
        fontSize: 16,
        backgroundColor: '#fff'
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: '#d49a6a',
        borderRadius: 8,
        marginBottom: 12,
        backgroundColor: '#fff'
    },
    picker: {
        height: 50,
    },
    addButton: {
        backgroundColor: '#6b4226',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center'
    },
    disabledButton: {
        opacity: 0.7
    },
    addButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold'
    },
    list: {
        flex: 1
    },
    listContent: {
        paddingBottom: 16
    },
    expenseItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        marginBottom: 8,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    expenseInfo: {
        flex: 1,
        marginRight: 12
    },
    expenseDescription: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4
    },
    expenseDetails: {
        fontSize: 14,
        color: '#666',
        marginBottom: 2
    },
    expenseDate: {
        fontSize: 12,
        color: '#999'
    },
    deleteButton: {
        backgroundColor: '#ff4444',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 6
    },
    deleteButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600'
    },
    categoryButton: {
        borderWidth: 1,
        borderColor: '#d49a6a',
        padding: 12,
        marginBottom: 12,
        borderRadius: 8,
        backgroundColor: '#fff'
    },
    categoryButtonText: {
        fontSize: 16,
        color: '#333'
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end'
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: Platform.OS === 'ios' ? 20 : 0,
        maxHeight: '90%'
    },
    pickerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee'
    },
    pickerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333'
    },
    closeButton: {
        padding: 8
    },
    closeButtonText: {
        color: '#6b4226',
        fontSize: 16,
        fontWeight: '600'
    },
    modalPicker: {
        backgroundColor: '#fff'
    },
    actionButtons: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    editButton: {
        padding: 8,
        marginRight: 8,
    },
    editForm: {
        padding: 16,
    },
    editFormScrollContainer: {
        flexGrow: 1,
        paddingBottom: 20
    },
});
