// __tests__/DeliveryDateScreen.test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import DeliveryDateScreen from '@/app/DeliveryDateScreen';
import { Alert } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '../config';

// Stub out the native date-picker so it doesn't try to create a real NativeEventEmitter
jest.mock('react-native-date-picker', () => {
    const React = require('react');
    // simple stub component
    return (props: any) => <React.Fragment />;
});

jest.mock('axios');
jest.mock('@react-native-async-storage/async-storage', () => ({
    getItem: jest.fn(),
}));

describe('DeliveryDateScreen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue('token123');
        jest.spyOn(Alert, 'alert');
    });

    it('renders title, date-picker stub, button and initial loading flag off', () => {
        const { getByText, queryByTestId } = render(<DeliveryDateScreen />);
        expect(getByText('Select Delivery Date')).toBeTruthy();
        expect(getByText('Check Availability')).toBeTruthy();
        // no spinner until we press
        expect(queryByTestId('loading-indicator')).toBeNull();
    });

    it('shows success alert when date available', async () => {
        (axios.post as jest.Mock).mockResolvedValue({ data: { available: true } });

        const { getByText, getByTestId, queryByTestId } = render(<DeliveryDateScreen />);
        fireEvent.press(getByText('Check Availability'));

        // spinner appears
        expect(getByTestId('loading-indicator')).toBeTruthy();

        await waitFor(() => {
            expect(axios.post).toHaveBeenCalledWith(
                `${config.BASE_URL}/order/check-date`,
                expect.objectContaining({ date: expect.any(Date) }),
                { headers: { Authorization: 'Bearer token123' } }
            );
            expect(Alert.alert).toHaveBeenCalledWith(
                '✅ Success',
                'The selected date is available for delivery.'
            );
            // spinner hidden
            expect(queryByTestId('loading-indicator')).toBeNull();
        });
    });

    it('shows unavailable alert when date not available', async () => {
        (axios.post as jest.Mock).mockResolvedValue({ data: { available: false } });

        const { getByText, getByTestId, queryByTestId } = render(<DeliveryDateScreen />);
        fireEvent.press(getByText('Check Availability'));

        expect(getByTestId('loading-indicator')).toBeTruthy();

        await waitFor(() => {
            expect(Alert.alert).toHaveBeenCalledWith(
                '❌ Unavailable',
                'The selected date is not available.'
            );
            expect(queryByTestId('loading-indicator')).toBeNull();
        });
    });

    it('shows error alert on request failure', async () => {
        (axios.post as jest.Mock).mockRejectedValue(new Error('Network fail'));

        const { getByText, getByTestId, queryByTestId } = render(<DeliveryDateScreen />);
        fireEvent.press(getByText('Check Availability'));

        expect(getByTestId('loading-indicator')).toBeTruthy();

        await waitFor(() => {
            expect(Alert.alert).toHaveBeenCalledWith(
                'Error',
                'Failed to check date availability.'
            );
            expect(queryByTestId('loading-indicator')).toBeNull();
        });
    });
});
