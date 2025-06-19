// __tests__/SetPasswordScreen.test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import SetPasswordScreen from '@/app/SetPasswordScreen';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '../config';

// Mock של useRouter עם משתנה שמתחיל ב-mock
const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
    __esModule: true,
    useRouter: () => ({ replace: mockReplace }),
}));

// Mock ל־AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
    getItem: jest.fn(),
}));

describe('SetPasswordScreen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Mock ל־Alert.alert
        Alert.alert = jest.fn();
        // Mock ל־fetch
        (global.fetch as jest.Mock) = jest.fn(() =>
            Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
        );
    });

    it('should not submit if fields are missing', async () => {
        const { getByText } = render(<SetPasswordScreen />);
        fireEvent.press(getByText('Set Password'));
        await waitFor(() => {
            expect(fetch).not.toHaveBeenCalled();
            expect(Alert.alert).toHaveBeenCalledWith('Error', 'Please fill in all fields.');
        });
    });

    it('should show error if passwords do not match', async () => {
        const { getByPlaceholderText, getByText } = render(<SetPasswordScreen />);
        fireEvent.changeText(getByPlaceholderText('New Password'), 'Password1!');
        fireEvent.changeText(getByPlaceholderText('Confirm Password'), 'Password2!');
        fireEvent.press(getByText('Set Password'));
        await waitFor(() => {
            expect(fetch).not.toHaveBeenCalled();
            expect(Alert.alert).toHaveBeenCalledWith('Error', 'Passwords do not match.');
        });
    });

    it('should show error if password does not meet requirements', async () => {
        const { getByPlaceholderText, getByText } = render(<SetPasswordScreen />);
        // סיסמה ארוכה אבל אין מספר או סימול
        fireEvent.changeText(getByPlaceholderText('New Password'), 'Password');
        fireEvent.changeText(getByPlaceholderText('Confirm Password'), 'Password');
        fireEvent.press(getByText('Set Password'));
        await waitFor(() => {
            expect(fetch).not.toHaveBeenCalled();
            expect(Alert.alert).toHaveBeenCalledWith(
                'Error',
                'Password does not meet security requirements.'
            );
        });
    });

    it('should set password and navigate on success (user)', async () => {
        // מגדירים מה יחזיר AsyncStorage.getItem
        (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
            if (key === 'userId') return Promise.resolve('123');
            if (key === 'accessToken') return Promise.resolve('token');
            if (key === 'role') return Promise.resolve('user');
            return Promise.resolve(null);
        });

        const { getByPlaceholderText, getByText } = render(<SetPasswordScreen />);
        fireEvent.changeText(getByPlaceholderText('New Password'), 'Password1!');
        fireEvent.changeText(getByPlaceholderText('Confirm Password'), 'Password1!');
        fireEvent.press(getByText('Set Password'));

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                `${config.BASE_URL}/auth/set-password`,
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.objectContaining({
                        Authorization: `Bearer token`,
                    }),
                })
            );
            expect(Alert.alert).toHaveBeenCalledWith('Success', 'Password set successfully!');
            expect(mockReplace).toHaveBeenCalledWith('/(tabs)/DashboardScreen');
        });
    });

    it('should set password and navigate on success (admin)', async () => {
        (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
            if (key === 'userId') return Promise.resolve('456');
            if (key === 'accessToken') return Promise.resolve('admintoken');
            if (key === 'role') return Promise.resolve('admin');
            return Promise.resolve(null);
        });

        const { getByPlaceholderText, getByText } = render(<SetPasswordScreen />);
        fireEvent.changeText(getByPlaceholderText('New Password'), 'AdminPass1!');
        fireEvent.changeText(getByPlaceholderText('Confirm Password'), 'AdminPass1!');
        fireEvent.press(getByText('Set Password'));

        await waitFor(() => {
            expect(Alert.alert).toHaveBeenCalledWith('Success', 'Password set successfully!');
            expect(mockReplace).toHaveBeenCalledWith('/(admintabs)/AdminDashboardScreen');
        });
    });
});
