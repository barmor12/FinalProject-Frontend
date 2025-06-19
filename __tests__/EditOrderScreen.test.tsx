import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import EditOrderScreen from '@/app/EditOrderScreen';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '../config';

jest.mock('expo-router', () => ({
    useLocalSearchParams: () => ({ orderId: 'ORDER123' }),
    router: { back: jest.fn() },
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
    getItem: jest.fn(),
}));

describe('EditOrderScreen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        Alert.alert = jest.fn();
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue('token123');
    });

    it('renders loading then shows order data and saves changes', async () => {
        const orderData = {
            shippingMethod: 'Standard Delivery (2-3 days)',
            deliveryDate: '2025-06-20T00:00:00Z',
            address: { _id: 'A1', fullName: 'Bob', street: 'St', city: 'City' },
        };
        const addresses = [
            { _id: 'A1', fullName: 'Bob', street: 'St', city: 'City' },
            { _id: 'A2', fullName: 'Ann', street: 'Rd', city: 'Town' },
        ];

        (global.fetch as jest.Mock)
            // 1) fetch order details
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(orderData),
            })
            // 2) fetch addresses list
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(addresses),
            })
            // 3) save changes
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({}),
            });

        const { getByTestId, queryByTestId, getByText } = render(<EditOrderScreen />);

        // initial loading spinner
        expect(getByTestId('loading-indicator')).toBeTruthy();

        // wait until loading disappears
        await waitFor(() => {
            expect(queryByTestId('loading-indicator')).toBeNull();
        });

        // now UI shows
        expect(getByText('Edit Order')).toBeTruthy();
        expect(getByText('Standard Delivery (2-3 days)')).toBeTruthy();
        expect(getByText('2025-06-20')).toBeTruthy();
        expect(getByText('Bob, St, City')).toBeTruthy();

        // press Save Changes
        fireEvent.press(getByTestId('save-button'));

        // wait for save to complete
        await waitFor(() => {
            // PUT called with correct args
            expect(fetch).toHaveBeenCalledWith(
                `${config.BASE_URL}/order/ORDER123/status`,
                expect.objectContaining({
                    method: 'PUT',
                    headers: expect.objectContaining({
                        'Content-Type': 'application/json',
                        Authorization: 'Bearer token123',
                    }),
                    body: JSON.stringify({
                        shippingMethod: 'Standard Delivery (2-3 days)',
                        deliveryDate: '2025-06-20',
                        address: 'A1',
                    }),
                })
            );
            // success alert
            expect(Alert.alert).toHaveBeenCalledWith(
                'Success',
                'Order updated successfully'
            );
            // navigate back
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            expect(require('expo-router').router.back).toHaveBeenCalled();
        });
    });
});
