import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AddProductScreenAdmin from '@/app/adminScreens/AddProductScreenAdmin';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('expo-image-picker');
jest.mock('@react-native-async-storage/async-storage', () => ({
    getItem: jest.fn(),
}));

global.fetch = jest.fn(() =>
    Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
) as jest.Mock;

describe('AddProductScreenAdmin', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should not submit if fields are missing', () => {
        const { getByText } = render(<AddProductScreenAdmin />);
        fireEvent.press(getByText('Add Product'));
        expect(fetch).not.toHaveBeenCalled();
    });

    it('should submit when all fields are filled', async () => {
        (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('mocked_token');

        const { getByText, getByPlaceholderText } = render(<AddProductScreenAdmin />);

        fireEvent.changeText(getByPlaceholderText('Name'), 'עוגת גבינה');
        fireEvent.changeText(getByPlaceholderText('Description'), 'טעימה מאוד');
        fireEvent.changeText(getByPlaceholderText('Cost'), '10');
        fireEvent.changeText(getByPlaceholderText('Price'), '20');
        fireEvent.changeText(getByPlaceholderText('Ingredients'), 'גבינה, סוכר');
        fireEvent.changeText(getByPlaceholderText('Stock'), '5');

        (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValueOnce({
            canceled: false,
            assets: [{ uri: 'file://mocked-image.jpg' }],
        });

        await waitFor(() => fireEvent.press(getByText('Pick an image')));
        await waitFor(() => fireEvent.press(getByText('Add Product')));

        expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('should not submit if token is missing', async () => {
        (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

        const { getByText, getByPlaceholderText } = render(<AddProductScreenAdmin />);

        fireEvent.changeText(getByPlaceholderText('Name'), 'עוגת שוקולד');
        fireEvent.changeText(getByPlaceholderText('Description'), 'טעים מאוד');
        fireEvent.changeText(getByPlaceholderText('Cost'), '10');
        fireEvent.changeText(getByPlaceholderText('Price'), '20');
        fireEvent.changeText(getByPlaceholderText('Ingredients'), 'קקאו, סוכר');
        fireEvent.changeText(getByPlaceholderText('Stock'), '4');

        (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValueOnce({
            canceled: false,
            assets: [{ uri: 'file://mocked-image.jpg' }],
        });

        await waitFor(() => fireEvent.press(getByText('Pick an image')));
        await waitFor(() => fireEvent.press(getByText('Add Product')));

        expect(fetch).not.toHaveBeenCalled();
    });
});
