// __tests__/ResetPasswordScreen.test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ResetPasswordScreen from '@/app/ResetPasswordScreen';
import { Alert } from 'react-native';
import config from '../config';

const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
    __esModule: true,
    useRouter: () => ({ replace: mockReplace }),
    useLocalSearchParams: () => ({}),
}));

describe('ResetPasswordScreen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        Alert.alert = jest.fn();
        (global.fetch as jest.Mock) = jest.fn(() =>
            Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
        );
    });

    it('should not submit if fields are missing', async () => {
        const { getByTestId } = render(<ResetPasswordScreen />);
        fireEvent.press(getByTestId('reset-password-button'));

        await waitFor(() => {
            expect(fetch).not.toHaveBeenCalled();
            expect(Alert.alert).toHaveBeenCalledWith('Error', 'Please fill in all fields.');
        });
    });

    it('should show error if passwords do not match', async () => {
        const { getByPlaceholderText, getByTestId } = render(<ResetPasswordScreen />);
        fireEvent.changeText(getByPlaceholderText('Email'), 'a@b.com');
        fireEvent.changeText(getByPlaceholderText('Reset Code'), '1234');
        fireEvent.changeText(getByPlaceholderText('New Password'), 'Pass1!');
        fireEvent.changeText(getByPlaceholderText('Confirm Password'), 'Pass2!');

        fireEvent.press(getByTestId('reset-password-button'));

        await waitFor(() => {
            expect(fetch).not.toHaveBeenCalled();
            expect(Alert.alert).toHaveBeenCalledWith('Error', 'Passwords do not match.');
        });
    });

    it('should show error if password is weak', async () => {
        const { getByPlaceholderText, getByTestId } = render(<ResetPasswordScreen />);
        fireEvent.changeText(getByPlaceholderText('Email'), 'a@b.com');
        fireEvent.changeText(getByPlaceholderText('Reset Code'), '1234');
        fireEvent.changeText(getByPlaceholderText('New Password'), 'weak');
        fireEvent.changeText(getByPlaceholderText('Confirm Password'), 'weak');

        fireEvent.press(getByTestId('reset-password-button'));

        await waitFor(() => {
            expect(fetch).not.toHaveBeenCalled();
            expect(Alert.alert).toHaveBeenCalledWith(
                'Weak Password',
                'Password must be at least 8 characters long and include lowercase, uppercase, number, and special character.'
            );
        });
    });

    it('should reset password and navigate on success', async () => {
        (global.fetch as jest.Mock) = jest.fn(() =>
            Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
        );

        const { getByPlaceholderText, getByTestId } = render(<ResetPasswordScreen />);
        fireEvent.changeText(getByPlaceholderText('Email'), 'user@example.com');
        fireEvent.changeText(getByPlaceholderText('Reset Code'), 'code123');
        fireEvent.changeText(getByPlaceholderText('New Password'), 'Password1!');
        fireEvent.changeText(getByPlaceholderText('Confirm Password'), 'Password1!');

        fireEvent.press(getByTestId('reset-password-button'));

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                `${config.BASE_URL}/auth/reset-password`,
                expect.objectContaining({
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: 'user@example.com',
                        code: 'code123',
                        newPassword: 'Password1!',
                    }),
                })
            );

            expect(Alert.alert).toHaveBeenCalledWith(
                'Success',
                'Your password has been reset successfully!',
                expect.any(Array)
            );

            // מדמים לחיצה על ה-OK של ה-Alert
            const buttons = (Alert.alert as jest.Mock).mock.calls[0][2] as any[];
            buttons[0].onPress();
            expect(mockReplace).toHaveBeenCalledWith('/');
        });
    });

    it('should show server error message', async () => {
        (global.fetch as jest.Mock) = jest.fn(() =>
            Promise.resolve({ ok: false, json: () => Promise.resolve({ error: 'Failed!' }) })
        );

        const { getByPlaceholderText, getByTestId } = render(<ResetPasswordScreen />);
        fireEvent.changeText(getByPlaceholderText('Email'), 'x@y.com');
        fireEvent.changeText(getByPlaceholderText('Reset Code'), '0000');
        fireEvent.changeText(getByPlaceholderText('New Password'), 'ValidPass1!');
        fireEvent.changeText(getByPlaceholderText('Confirm Password'), 'ValidPass1!');

        fireEvent.press(getByTestId('reset-password-button'));

        await waitFor(() => {
            expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed!');
        });
    });
});
