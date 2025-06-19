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
    const { getByTestId } = render(<AddProductScreenAdmin />);
    fireEvent.press(getByTestId('submit-button'));
    expect(fetch).not.toHaveBeenCalled();
  });

  it('should submit when all fields are filled', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('mocked_token');

    const { getByTestId, getByText } = render(<AddProductScreenAdmin />);

    fireEvent.changeText(getByTestId('name-input'), 'עוגת גבינה');
    fireEvent.changeText(getByTestId('description-input'), 'טעימה מאוד');
    fireEvent.changeText(getByTestId('cost-input'), '10');
    fireEvent.changeText(getByTestId('price-input'), '20');
    fireEvent.changeText(getByTestId('ingredients-input'), 'גבינה, סוכר');
    fireEvent.changeText(getByTestId('stock-input'), '5');

    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file://mocked-image.jpg' }],
    });

    await waitFor(() => fireEvent.press(getByText('Choose Cake Image')));
    await waitFor(() => fireEvent.press(getByTestId('submit-button')));

    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('should not submit if token is missing', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

    const { getByTestId, getByText } = render(<AddProductScreenAdmin />);

    fireEvent.changeText(getByTestId('name-input'), 'עוגת שוקולד');
    fireEvent.changeText(getByTestId('description-input'), 'טעים מאוד');
    fireEvent.changeText(getByTestId('cost-input'), '10');
    fireEvent.changeText(getByTestId('price-input'), '20');
    fireEvent.changeText(getByTestId('ingredients-input'), 'קקאו, סוכר');
    fireEvent.changeText(getByTestId('stock-input'), '4');

    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file://mocked-image.jpg' }],
    });

    await waitFor(() => fireEvent.press(getByText('Choose Cake Image')));
    await waitFor(() => fireEvent.press(getByTestId('submit-button')));

    expect(fetch).not.toHaveBeenCalled();
  });

  it('should show error if cost or price are invalid numbers', async () => {
    const { getByTestId, getByText } = render(<AddProductScreenAdmin />);

    fireEvent.changeText(getByTestId('name-input'), 'בדיקה');
    fireEvent.changeText(getByTestId('description-input'), 'שגיאה');
    fireEvent.changeText(getByTestId('cost-input'), 'abc');
    fireEvent.changeText(getByTestId('price-input'), '20');
    fireEvent.changeText(getByTestId('ingredients-input'), 'מים, סוכר');
    fireEvent.changeText(getByTestId('stock-input'), '5');

    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file://mocked-image.jpg' }],
    });

    await waitFor(() => fireEvent.press(getByText('Choose Cake Image')));
    await waitFor(() => fireEvent.press(getByTestId('submit-button')));

    expect(fetch).not.toHaveBeenCalled();
  });

  it('should show error if price is lower than cost', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('mocked_token');

    const { getByTestId, getByText } = render(<AddProductScreenAdmin />);

    fireEvent.changeText(getByTestId('name-input'), 'בדיקה');
    fireEvent.changeText(getByTestId('description-input'), 'בדיקה');
    fireEvent.changeText(getByTestId('cost-input'), '30');
    fireEvent.changeText(getByTestId('price-input'), '20');
    fireEvent.changeText(getByTestId('ingredients-input'), 'חמאה');
    fireEvent.changeText(getByTestId('stock-input'), '4');

    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file://mocked-image.jpg' }],
    });

    await waitFor(() => fireEvent.press(getByText('Choose Cake Image')));
    await waitFor(() => fireEvent.press(getByTestId('submit-button')));

    expect(fetch).not.toHaveBeenCalled();
  });

  it('should show profit information when cost and price are valid', () => {
    const { getByTestId, getByText } = render(<AddProductScreenAdmin />);

    fireEvent.changeText(getByTestId('cost-input'), '10');
    fireEvent.changeText(getByTestId('price-input'), '20');

    expect(getByText('Profit per unit: $10.00')).toBeTruthy();
    expect(getByText('Profit margin: 50.0%')).toBeTruthy();
  });
});
