// __tests__/ForgotPasswordScreen.test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ForgotPasswordScreen from '@/app/ForgotPasswordScreen';
import { Alert } from 'react-native';
import config from '../config';
beforeAll(() => {
    jest.spyOn(console, "log").mockImplementation(() => { });
    jest.spyOn(console, "warn").mockImplementation(() => { });
    jest.spyOn(console, "error").mockImplementation(() => { });
});
// mock useRouter from expo-router
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
    useRouter: () => ({ push: mockPush }),
}));

describe('ForgotPasswordScreen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        Alert.alert = jest.fn();
    });

    it('shows error if email is empty', async () => {
        const { getByText } = render(<ForgotPasswordScreen />);
        fireEvent.press(getByText('Send Reset Code'));

        await waitFor(() => {
            expect(Alert.alert).toHaveBeenCalledWith(
                'Error',
                'Please enter your email address.'
            );
        });
    });

    it('submits when email is valid and navigates on success', async () => {
        const fakeEmail = 'USER@Example.com  ';
        (global.fetch as jest.Mock) = jest.fn(() =>
            Promise.resolve({
                ok: true,
                text: () => Promise.resolve('{"message":"ok"}'),
            })
        );

        const { getByText, getByDisplayValue } = render(<ForgotPasswordScreen />);
        // התיבה מתחילה עם ערך ""
        const emailInput = getByDisplayValue('');
        fireEvent.changeText(emailInput, fakeEmail);

        fireEvent.press(getByText('Send Reset Code'));

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                `${config.BASE_URL}/auth/forgot-password`,
                expect.objectContaining({
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: fakeEmail.toLowerCase().trim() }),
                })
            );
            expect(Alert.alert).toHaveBeenCalledWith(
                'Success',
                'A reset code has been sent to your email.',
                expect.any(Array)
            );
            // מדמים לחיצה על OK
            const buttons = (Alert.alert as jest.Mock).mock.calls[0][2] as any[];
            buttons[0].onPress();
            expect(mockPush).toHaveBeenCalledWith({
                pathname: '/ResetPasswordScreen',
                params: { email: fakeEmail.toLowerCase().trim() },
            });
        });
    });

    it('shows unexpected response error on invalid JSON', async () => {
        (global.fetch as jest.Mock) = jest.fn(() =>
            Promise.resolve({ ok: true, text: () => Promise.resolve('not a json') })
        );

        const { getByText, getByDisplayValue } = render(<ForgotPasswordScreen />);
        const emailInput = getByDisplayValue('');
        fireEvent.changeText(emailInput, 'a@b.com');
        fireEvent.press(getByText('Send Reset Code'));

        await waitFor(() => {
            expect(Alert.alert).toHaveBeenCalledWith(
                'Error',
                'Unexpected response from server.'
            );
        });
        expect(mockPush).not.toHaveBeenCalled();
    });

    it('shows server error message on non-ok response', async () => {
        (global.fetch as jest.Mock) = jest.fn(() =>
            Promise.resolve({
                ok: false,
                text: () => Promise.resolve('{"error":"Failed!"}'),
            })
        );

        const { getByText, getByDisplayValue } = render(<ForgotPasswordScreen />);
        const emailInput = getByDisplayValue('');
        fireEvent.changeText(emailInput, 'test@example.com');
        fireEvent.press(getByText('Send Reset Code'));

        await waitFor(() => {
            expect(Alert.alert).toHaveBeenCalledWith(
                'Error',
                'Failed!'
            );
        });
        expect(mockPush).not.toHaveBeenCalled();
    });
});
