//navigation/AdminUsersNavigator.tsx
import { createStackNavigator } from "@react-navigation/stack";
import AdminUsersScreen from "../manageUsersScreen";  // מסך ניהול המשתמשים
import UserDetailsScreen from "../userDetailsScreen";  // פרטי המשתמש

const Stack = createStackNavigator();

export default function AdminUsersNavigator() {
    return (
        <Stack.Navigator initialRouteName="AdminUsers">
            <Stack.Screen name="AdminUsers" component={AdminUsersScreen} />
            <Stack.Screen name="UserDetails" component={UserDetailsScreen} />
        </Stack.Navigator>
    );
}
