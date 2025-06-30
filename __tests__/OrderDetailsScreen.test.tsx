// __tests__/OrderDetailsScreen.test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import OrderDetailsScreen from '../app/adminScreens/OrderDetailsScreen';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '../config';
beforeAll(() => {
    jest.spyOn(console, "log").mockImplementation(() => { });
    jest.spyOn(console, "warn").mockImplementation(() => { });
});
// mock navigation + route
const mockGoBack = jest.fn();
jest.mock('@react-navigation/native', () => ({
    useRoute: () => ({ params: { orderId: 'ORDER123' } }),
    useNavigation: () => ({ goBack: mockGoBack }),
}));

// mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
    getItem: jest.fn(),
}));

describe('OrderDetailsScreen', () => {
    const fakeOrder = {
        _id: 'ORDER123',
        status: 'pending',
        user: { firstName: 'Avi', lastName: 'Levi', email: 'a@b.com' },
        address: {
            fullName: 'Avi Levi',
            phone: '0501234567',
            street: 'Main St',
            city: 'Tel Aviv',
            zipCode: '12345',
            country: 'Israel',
        },
        items: [
            {
                cake: { _id: 'c1', name: 'Cheesecake', image: { public_id: '', url: '' } },
                quantity: 2,
            },
        ],
        totalPrice: 31,
        createdAt: '2025-06-19T00:00:00Z',
        shippingMethod: 'Standard',
        deliveryDate: '2025-06-20T00:00:00Z',
    };

    beforeEach(() => {
        jest.clearAllMocks();
        Alert.alert = jest.fn();
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue('token123');
    });

    it('מראה loading ואז את פרטי ההזמנה', async () => {
        (global.fetch as jest.Mock) = jest.fn()
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(fakeOrder) });

        const { getByTestId, getByText } = render(<OrderDetailsScreen />);

        // לפני שה-fetch מסתיים
        expect(getByTestId('loading-indicator')).toBeTruthy();

        // אחרי שה-fetch עבר
        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                `${config.BASE_URL}/order/ORDER123`,
                expect.any(Object)
            );
        });

        expect(getByText(`Order #${fakeOrder._id.slice(-6)}`)).toBeTruthy();
        expect(getByTestId('customer-text')).toHaveTextContent('Customer: Avi Levi');
        expect(getByTestId('status-text')).toHaveTextContent('Status: pending');
        expect(getByTestId('total-text')).toHaveTextContent('Total Price: $31');
    });

    it('פותח וסוגר את מודל פרטי הקשר', async () => {
        (global.fetch as jest.Mock) = jest.fn()
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(fakeOrder) });

        const { getByTestId, queryByText } = render(<OrderDetailsScreen />);
        await waitFor(() => expect(fetch).toHaveBeenCalled());

        expect(queryByText('Customer Contact Details')).toBeNull();

        fireEvent.press(getByTestId('view-contact-button'));
        expect(queryByText('Customer Contact Details')).toBeTruthy();

        fireEvent.press(getByTestId('close-contact-button'));
        await waitFor(() => {
            expect(queryByText('Customer Contact Details')).toBeNull();
        });
    });

    it('פותח מודל הודעה ושולח manager message', async () => {
        (global.fetch as jest.Mock) = jest.fn()
            // קריאת GET ראשונה
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(fakeOrder) })
            // קריאת POST שנייה
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) });

        const { getByTestId } = render(<OrderDetailsScreen />);
        await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));

        fireEvent.press(getByTestId('send-message-button'));
        fireEvent.changeText(getByTestId('manager-message-input'), 'Hello customer');
        fireEvent.press(getByTestId('send-manager-message-button'));

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                `${config.BASE_URL}/sendEmail/${fakeOrder.user!.email}/message`,
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.objectContaining({
                        Authorization: 'Bearer token123',
                    }),
                    body: JSON.stringify({
                        customerEmail: fakeOrder.user!.email,
                        managerMessage: 'Hello customer',
                        isManagerMsg: true,
                    }),
                })
            );
            expect(Alert.alert).toHaveBeenCalledWith(
                'Success',
                'Message sent successfully to the customer!'
            );
        });
    });
});
