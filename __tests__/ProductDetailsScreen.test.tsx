// __tests__/ProductDetailsScreen.test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ProductDetailsScreen from '@/app/ProductDetailsScreen';
import { Alert, Text, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '@/config';
beforeAll(() => {
    jest.spyOn(console, "log").mockImplementation(() => { });
    jest.spyOn(console, "warn").mockImplementation(() => { });
});
const mockBack = jest.fn();
jest.mock('expo-router', () => ({
    __esModule: true,
    useRouter: () => ({ back: mockBack }),
    useLocalSearchParams: () => ({
        product: JSON.stringify({
            _id: '1',
            name: 'Cheesecake',
            image: 'cakes/cheesecake.jpg',
            description: 'Delicious creamy cheesecake',
            ingredients: ['cream cheese', 'sugar', 'eggs'],
            price: 15.5,
            stock: 2,
        }),
    }),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
    getItem: jest.fn(),
}));

describe('ProductDetailsScreen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // mock fetch
        (global.fetch as jest.Mock) = jest.fn(() =>
            Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
        );
        // mock AsyncStorage token
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue('token');
        // mock Alert
        Alert.alert = jest.fn();
    });

    it('renders product details and handles quantity controls', () => {
        const { getByText, getAllByText } = render(<ProductDetailsScreen />);
        // details
        expect(getByText('Delicious creamy cheesecake')).toBeTruthy();
        expect(getByText('Ingredients: cream cheese, sugar, eggs')).toBeTruthy();
        expect(getByText('Price: $15.50')).toBeTruthy();
        expect(getByText('In Stock: 2')).toBeTruthy();

        // quantity starts at 1
        expect(getByText('1')).toBeTruthy();

        // increment to 2
        fireEvent.press(getAllByText('+')[0]);
        expect(getByText('2')).toBeTruthy();

        // increment beyond stock -> alert
        fireEvent.press(getAllByText('+')[0]);
        expect(Alert.alert).toHaveBeenCalledWith('Stock Limit', 'Only 2 in stock');

        // decrement back to 1
        fireEvent.press(getAllByText('-')[0]);
        expect(getByText('1')).toBeTruthy();

        // cannot go below 1
        fireEvent.press(getAllByText('-')[0]);
        expect(getByText('1')).toBeTruthy();
    });

    it('adds to cart and navigates back on success', async () => {
        const { getByText } = render(<ProductDetailsScreen />);
        // press Add to Cart
        fireEvent.press(getByText('Add to Cart'));

        await waitFor(() => {
            // fetch called with correct args
            expect(fetch).toHaveBeenCalledWith(
                `${config.BASE_URL}/cart/add`,
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.objectContaining({
                        Authorization: 'Bearer token',
                        'Content-Type': 'application/json',
                    }),
                    body: JSON.stringify({ cakeId: '1', quantity: 1 }),
                })
            );
            // success alert
            expect(Alert.alert).toHaveBeenCalledWith(
                'Success',
                '🎉 Cake added to cart successfully!',
                expect.any(Array)
            );
        });

        // simulate pressing OK button in Alert
        const buttons = (Alert.alert as jest.Mock).mock.calls[0][2] as any[];
        buttons[0].onPress();
        expect(mockBack).toHaveBeenCalled();
    });
});
