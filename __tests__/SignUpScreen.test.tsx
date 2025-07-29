import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import SignUpScreen from '@/app/SignUpScreen';
import { Alert } from 'react-native';

global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({}) })) as jest.Mock;

describe('SignUpScreen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (global.fetch as jest.Mock).mockClear();
        Alert.alert = jest.fn();
    });

    it('should not submit if fields are missing', async () => {
        const { getByTestId, getByText } = render(<SignUpScreen />);
        fireEvent.press(getByText(/I have read and agree/));
        fireEvent.press(getByTestId('signup-button'));
        await waitFor(() => {
            expect(fetch).not.toHaveBeenCalled();
            expect(Alert.alert).toHaveBeenCalledWith('Error', expect.any(String));
        });
    });

    it('should submit when all fields are filled and policy accepted', async () => {
        const { getByTestId, getByText } = render(<SignUpScreen />);
        fireEvent.changeText(getByTestId('firstName-input'), 'John');
        fireEvent.changeText(getByTestId('lastName-input'), 'Doe');
        fireEvent.changeText(getByTestId('phone-input'), '0501234567');
        fireEvent.changeText(getByTestId('email-input'), 'john@example.com');
        fireEvent.changeText(getByTestId('password-input'), 'Password1!');
        fireEvent.changeText(getByTestId('confirmPassword-input'), 'Password1!');
        fireEvent.press(getByText(/I have read and agree/));
        fireEvent.press(getByTestId('signup-button'));
        await waitFor(() => {
            expect(fetch).toHaveBeenCalled();
        });
    });

    it('should show error if passwords do not match', async () => {
        const { getByTestId, getByText } = render(<SignUpScreen />);
        fireEvent.changeText(getByTestId('firstName-input'), 'John');
        fireEvent.changeText(getByTestId('lastName-input'), 'Doe');
        fireEvent.changeText(getByTestId('phone-input'), '0501234567');
        fireEvent.changeText(getByTestId('email-input'), 'john@example.com');
        fireEvent.changeText(getByTestId('password-input'), 'Password1!');
        fireEvent.changeText(getByTestId('confirmPassword-input'), 'Password2!');
        fireEvent.press(getByText(/I have read and agree/));
        fireEvent.press(getByTestId('signup-button'));
        await waitFor(() => {
            expect(fetch).not.toHaveBeenCalled();
            expect(Alert.alert).toHaveBeenCalledWith('Error', 'Passwords do not match');
        });
    });
}); 