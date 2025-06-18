import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  Alert,
  ScrollView,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import config from "../../config";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../_layout";
import BackButton from "../../components/BackButton";
import { useRouter, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import styles from "../styles/AdminScreensStyles/manageUsersScreenStyles";

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  twoFactorEnabled?: boolean;
}

export default function AdminUsersScreen() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [emailModalVisible, setEmailModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editedUser, setEditedUser] = useState<Partial<User>>({});
  const [newPassword, setNewPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  type manageUsersScreenRouteProp = RouteProp<
    { manageUsersScreen: { shouldRefresh?: boolean } },
    "manageUsersScreen"
  >;
  const route = useRoute<manageUsersScreenRouteProp>();
  const { shouldRefresh } = route.params || {};

  useFocusEffect(
    useCallback(() => {
      if (shouldRefresh) {
        fetchUsers();
        navigation.setParams({ shouldRefresh: false });
      }
    }, [shouldRefresh])
  );

  useEffect(() => {
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      fetchUsers();
    }
  }, [currentUserId]);

  useEffect(() => {
    if (searchQuery) {
      setFilteredUsers(
        users.filter(
          (user) =>
            user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.lastName.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    } else {
      setFilteredUsers(users);
    }
  }, [searchQuery, users]);

  const getCurrentUser = async () => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      if (!token) {
        console.warn("No access token found.");
        return;
      }

      const response = await fetch(`${config.BASE_URL}/user/profile`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.error("Failed to fetch user data:", response.status);
        return;
      }

      const userData = await response.json();

      if (!userData || !userData._id) {
        console.warn("Invalid user data received.");
        return;
      }

      console.log("Current user ID:", userData._id);
      setCurrentUserId(userData._id);
    } catch (error) {
      console.error("Error getting current user:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("accessToken");
      if (!token) {
        alert("You need to be logged in.");
        return;
      }

      const response = await fetch(`${config.BASE_URL}/admin/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const data = await response.json();

      // Make sure we definitely have currentUserId before filtering
      if (!currentUserId) {
        console.warn("Current user ID not available for filtering");
        setUsers(data);
        setFilteredUsers(data);
        return;
      }

      // Filter out the current admin user from the list
      console.log("Filtering out current user:", currentUserId);
      const filteredData = data.filter(
        (user: User) => user._id !== currentUserId
      );

      // Log the difference to verify filtering worked
      console.log(`Filtered out ${data.length - filteredData.length} users`);
      setUsers(filteredData);
      setFilteredUsers(filteredData);
    } catch (error) {
      console.error("Error fetching users:", error);
      alert("Failed to fetch users.");
    } finally {
      setLoading(false);
    }
  };
  const handleDeleteUser = async () => {
    if (!selectedUserId) return;

    const selectedUser = users.find((u) => u._id === selectedUserId);
    if (!selectedUser) {
      Alert.alert("Error", "User not found");
      return;
    }

    Alert.alert(
      "Delete User",
      `Are you sure you want to delete ${selectedUser.firstName} ${selectedUser.lastName}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem("accessToken");
              if (!token) {
                Alert.alert("Error", "Authorization token is required");
                return;
              }

              const response = await fetch(
                `${config.BASE_URL}/sendEmail/delete/${selectedUserId}`,
                {
                  method: "DELETE",
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );

              const data = await response.json();

              if (!response.ok) {
                throw new Error(data.error || "Failed to delete user");
              }

              Alert.alert("Success", "User deleted and email sent.");
              setMenuVisible(false);
              fetchUsers(); // ריענון הרשימה
            } catch (error: any) {
              console.error("❌ Error deleting user:", error);
              Alert.alert("Error", error.message || "Failed to delete user.");
            }
          },
        },
      ]
    );
  };

  const handleUserPress = (userId: string) => {
    router.push({ pathname: "/userDetailsScreen", params: { userId } });
  };
  const sendOrderEmail = async (managerMessage: string, hasMsg: boolean) => {
    const selectedUser = users.find((u) => u._id === selectedUserId);

    if (!selectedUser || !selectedUser.email) {
      Alert.alert("Error", "User email not found");
      return;
    }

    if (hasMsg && !managerMessage.trim()) {
      Alert.alert("Error", "Please enter a message.");
      return;
    }

    const token = await AsyncStorage.getItem("accessToken");
    if (!token) {
      Alert.alert("Error", "Authorization token is required");
      return;
    }

    try {
      const response = await fetch(
        `${config.BASE_URL}/sendEmail/${selectedUser._id}/message`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            customerEmail: selectedUser.email,
            managerMessage,
            isManagerMessage: hasMsg,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send email");
      }

      Alert.alert("Success", "Email sent successfully to the customer!");
      setEmailModalVisible(false);
      setMessageText("");
    } catch (error: any) {
      console.error("❌ Error sending email:", error);
      Alert.alert(
        "Error",
        error.message || "Failed to send email. Please try again."
      );
    }
  };
  const toggleMenu = (userId: string) => {
    if (selectedUserId === userId) {
      setMenuVisible(!menuVisible);
    } else {
      setSelectedUserId(userId);
      setMenuVisible(true);
    }
  };

  const handleEditUser = (userId: string) => {
    const userToEdit = users.find((user) => user._id === userId);
    if (!userToEdit) {
      Alert.alert("Error", "User not found");
      return;
    }

    setEditedUser({
      _id: userToEdit._id,
      firstName: userToEdit.firstName,
      lastName: userToEdit.lastName,
      email: userToEdit.email,
      role: userToEdit.role,
      twoFactorEnabled: userToEdit.twoFactorEnabled,
    });

    setMenuVisible(false);
    setEditModalVisible(true);
  };

  const saveUserChanges = async () => {
    if (!editedUser._id) return;

    try {
      const token = await AsyncStorage.getItem("accessToken");
      if (!token) {
        Alert.alert("Error", "Authorization token is required");
        return;
      }

      // Validate required fields
      if (!editedUser.firstName || !editedUser.lastName || !editedUser.email) {
        Alert.alert("Error", "First name, last name, and email are required");
        return;
      }

      // Create payload with optional password
      const payload: any = {
        firstName: editedUser.firstName,
        lastName: editedUser.lastName,
        email: editedUser.email,
        role: editedUser.role,
        twoFactorEnabled: editedUser.twoFactorEnabled,
      };

      // Only include password in payload if it's provided
      if (newPassword.trim().length > 0) {
        payload.password = newPassword;
      }

      const response = await fetch(
        `${config.BASE_URL}/admin/users/${editedUser._id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update user");
      }

      Alert.alert("Success", "User updated successfully");
      setEditModalVisible(false);
      setNewPassword(""); // Reset password field
      setShowPassword(false); // Reset password visibility
      fetchUsers(); // Refresh the list after update
    } catch (error: any) {
      console.error("Error updating user:", error);
      Alert.alert(
        "Error",
        error.message || "Failed to update user. Please try again."
      );
    }
  };

  const renderItem = ({ item }: { item: User }) => (
    <View style={styles.userCard}>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>
          {item.firstName} {item.lastName}
        </Text>
        <Text style={styles.userEmail}>{item.email}</Text>
        <Text style={styles.userRole}>Role: {item.role}</Text>
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.detailsButton}
          onPress={() => handleUserPress(item._id)}
        >
          <MaterialIcons name="info" size={20} color="#fff" />
          <Text style={styles.detailsText}>Details</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => toggleMenu(item._id)}
        >
          <MaterialIcons name="more-vert" size={24} color="#6b4226" />
        </TouchableOpacity>
      </View>

      {menuVisible && selectedUserId === item._id && (
        <Modal
          transparent
          visible={menuVisible}
          animationType="fade"
          onRequestClose={() => setMenuVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => handleEditUser(item._id)}
              >
                <Text style={styles.modalButtonText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => {
                  setMenuVisible(false);
                  setEmailModalVisible(true);
                }}
              >
                <Text style={styles.modalButtonText}>Send Message</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.deleteBtn]}
                onPress={handleDeleteUser}
              >
                <Text style={styles.modalButtonText}>Delete User</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.cancelBtn]}
                onPress={() => setMenuVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );

  // Add a NoResults component to display when search has no matches
  const NoResults = () => (
    <View style={styles.noResultsContainer}>
      <MaterialIcons name="search-off" size={48} color="#d2b48c" />
      <Text style={styles.noResultsText}>No users found</Text>
      <Text style={styles.noResultsSubText}>
        Try a different search term or check spelling
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <BackButton onPress={() => router.push("/(admintabs)/AdminPanelScreen")} />
      <Text style={styles.title}>Admin User Management</Text>

      <View style={styles.searchWrapper}>
        <MaterialIcons
          name="search"
          size={20}
          color="#a58c6f"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name"
          placeholderTextColor="#a58c6f"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => setSearchQuery("")}
          >
            <MaterialIcons name="close" size={18} color="#a58c6f" />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#6b4226" />
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={{
            paddingBottom: 40,
            ...(filteredUsers.length === 0 && { flex: 1 }),
          }}
          ListEmptyComponent={<NoResults />}
        />
      )}
      <Modal
        transparent={true}
        visible={emailModalVisible}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Send Email to Customer</Text>
            <Text style={styles.modalSubTitle}>
              Customer Email:{" "}
              {users.find((u) => u._id === selectedUserId)?.email}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Enter your message..."
              multiline
              value={messageText}
              onChangeText={setMessageText}
            />
            <TouchableOpacity
              style={styles.sendButton}
              onPress={() => sendOrderEmail(messageText, true)}
            >
              <Text style={styles.sendButtonText}>Send Email</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setEmailModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Modal
        transparent={true}
        visible={editModalVisible}
        animationType="slide"
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
          keyboardVerticalOffset={-150}
        >
          <View style={styles.modalOverlay} pointerEvents="box-none">
            <View style={styles.editModalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Edit User</Text>
                <TouchableOpacity
                  style={styles.closeModalIcon}
                  onPress={() => setEditModalVisible(false)}
                >
                  <MaterialIcons name="close" size={24} color="#6b4226" />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.modalScrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
              >
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>First Name</Text>
                  <TextInput
                    style={styles.editInput}
                    value={editedUser.firstName}
                    onChangeText={(text) =>
                      setEditedUser({ ...editedUser, firstName: text })
                    }
                    placeholder="First Name"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Last Name</Text>
                  <TextInput
                    style={styles.editInput}
                    value={editedUser.lastName}
                    onChangeText={(text) =>
                      setEditedUser({ ...editedUser, lastName: text })
                    }
                    placeholder="Last Name"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Email</Text>
                  <TextInput
                    style={styles.editInput}
                    value={editedUser.email}
                    onChangeText={(text) =>
                      setEditedUser({ ...editedUser, email: text })
                    }
                    placeholder="Email"
                    keyboardType="email-address"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Role</Text>
                  <View style={styles.roleSelector}>
                    <TouchableOpacity
                      style={[
                        styles.roleButton,
                        editedUser.role === "user" && styles.selectedRoleButton,
                      ]}
                      onPress={() =>
                        setEditedUser({ ...editedUser, role: "user" })
                      }
                    >
                      <Text
                        style={[
                          styles.roleButtonText,
                          editedUser.role === "user" && styles.selectedRoleText,
                        ]}
                      >
                        User
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.roleButton,
                        editedUser.role === "admin" &&
                        styles.selectedRoleButton,
                      ]}
                      onPress={() =>
                        setEditedUser({ ...editedUser, role: "admin" })
                      }
                    >
                      <Text
                        style={[
                          styles.roleButtonText,
                          editedUser.role === "admin" &&
                          styles.selectedRoleText,
                        ]}
                      >
                        Admin
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>
                    New Password (leave blank to keep unchanged)
                  </Text>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={styles.passwordInput}
                      value={newPassword}
                      onChangeText={setNewPassword}
                      placeholder="New Password"
                      secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity
                      style={styles.eyeIcon}
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <MaterialIcons
                        name={showPassword ? "visibility" : "visibility-off"}
                        size={22}
                        color="#a58c6f"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>2FA</Text>
                  <View style={styles.roleSelector}>
                    <TouchableOpacity
                      style={[
                        styles.roleButton,
                        editedUser.twoFactorEnabled === true &&
                        styles.selectedRoleButton,
                      ]}
                      onPress={() =>
                        setEditedUser({ ...editedUser, twoFactorEnabled: true })
                      }
                    >
                      <Text
                        style={[
                          styles.roleButtonText,
                          editedUser.twoFactorEnabled === true &&
                          styles.selectedRoleText,
                        ]}
                      >
                        Enabled
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.roleButton,
                        editedUser.twoFactorEnabled === false &&
                        styles.selectedRoleButton,
                      ]}
                      onPress={() =>
                        setEditedUser({
                          ...editedUser,
                          twoFactorEnabled: false,
                        })
                      }
                    >
                      <Text
                        style={[
                          styles.roleButtonText,
                          editedUser.twoFactorEnabled === false &&
                          styles.selectedRoleText,
                        ]}
                      >
                        Disabled
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={{ height: 20 }} />
              </ScrollView>

              <View style={styles.editButtonsContainer}>
                <TouchableOpacity
                  style={[styles.editActionButton, styles.saveButton]}
                  onPress={saveUserChanges}
                >
                  <Text style={styles.actionButtonText}>Save</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.editActionButton, styles.cancelButton]}
                  onPress={() => setEditModalVisible(false)}
                >
                  <Text style={styles.actionButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

