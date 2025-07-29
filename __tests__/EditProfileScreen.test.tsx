import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import EditProfileScreen from '@/app/EditProfileScreen';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchUserData } from '@/app/utils/fetchUserData';

beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => { });
    jest.spyOn(console, 'warn').mockImplementation(() => { });
});


jest.mock('expo-image-manipulator', () => ({
    manipulateAsync: jest.fn().mockResolvedValue({ uri: 'mocked-image-uri' }),
    SaveFormat: { JPEG: 'jpeg' },
}));

jest.mock('expo-image-picker', () => ({
    requestMediaLibraryPermissionsAsync: jest.fn(),
    launchImageLibraryAsync: jest.fn().mockResolvedValue({ cancelled: true }),
    MediaTypeOptions: { Images: 'Images' },
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
    getItem: jest.fn(),
}));

jest.mock('@/app/utils/fetchUserData', () => ({
    fetchUserData: jest.fn(),
}));

const mockBack = jest.fn();
jest.mock('expo-router', () => ({
    useRouter: () => ({ back: mockBack }),
}));

describe('EditProfileScreen', () => {
    const mockUser = {
        firstName: 'Alice',
        lastName: 'Smith',
        profilePic: { url: 'https://example.com/alice.jpg' },
    };

    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'log').mockImplementation(() => { });
        Alert.alert = jest.fn();
        (fetchUserData as jest.Mock).mockResolvedValue(mockUser);
    });

    it('renders without crashing', async () => {
        const { getByText } = render(<EditProfileScreen />);
        await act(async () => {
            await waitFor(() => {
                expect(getByText('Loading Profile...')).toBeTruthy();
            });
        });
    });

    it('shows loading then user info', async () => {
        const { getByText, getByPlaceholderText, getByTestId, queryByText } = render(
            <EditProfileScreen />
        );

        // initial loading
        expect(getByText('Loading Profile...')).toBeTruthy();

        await act(async () => {
            // after fetch
            await waitFor(() => expect(fetchUserData).toHaveBeenCalled());
        });

        expect(queryByText('Loading Profile...')).toBeNull();
        expect(getByText('Change Photo')).toBeTruthy();

        // inputs pre-filled
        expect(getByPlaceholderText('Enter first name').props.value).toBe('Alice');
        expect(getByPlaceholderText('Enter last name').props.value).toBe('Smith');

        // image loaded
        const img = getByTestId('profile-image');
        expect(img.props.source).toEqual({ uri: mockUser.profilePic.url });
    });

    it('errors if name fields empty', async () => {
        (fetchUserData as jest.Mock).mockResolvedValue({ ...mockUser, firstName: '', lastName: '' });
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue('token123');

        const { getByText, getByPlaceholderText } = render(<EditProfileScreen />);
        await act(async () => {
            await waitFor(() => expect(fetchUserData).toHaveBeenCalled());
        });

        fireEvent.changeText(getByPlaceholderText('Enter first name'), '');
        fireEvent.changeText(getByPlaceholderText('Enter last name'), '');
        fireEvent.press(getByText('Update Profile'));

        await act(async () => {
            await waitFor(() => {
                expect(Alert.alert).toHaveBeenCalledWith('Error', 'Please fill in all fields.');
            });
        });
    });

    it('updates name and navigates back on success', async () => {
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue('token123');
        (global.fetch as jest.Mock) = jest.fn(() =>
            Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
        );

        const { getByText, getByPlaceholderText } = render(<EditProfileScreen />);

        await act(async () => {
            await waitFor(() => expect(fetchUserData).toHaveBeenCalled());
        });

        fireEvent.changeText(getByPlaceholderText('Enter first name'), 'bob');
        fireEvent.changeText(getByPlaceholderText('Enter last name'), 'johnson');
        fireEvent.changeText(getByPlaceholderText('Enter phone number'), '0501234567'); // ✅ חובה
        fireEvent.press(getByText('Update Profile'));

        await act(async () => {
            await waitFor(() => {
                expect(Alert.alert).toHaveBeenCalledWith(
                    'Success',
                    'Profile updated successfully!',
                    expect.any(Array)
                );
            });
        });
    });


    it('shows server error if update fails', async () => {
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue('token123');
        (global.fetch as jest.Mock) = jest.fn(() =>
            Promise.resolve({ ok: false, json: () => Promise.resolve({ message: 'Server error' }) })
        );

        const { getByText, getByPlaceholderText } = render(<EditProfileScreen />);

        await act(async () => {
            await waitFor(() => expect(fetchUserData).toHaveBeenCalled());
        });

        fireEvent.changeText(getByPlaceholderText('Enter first name'), 'Alice');
        fireEvent.changeText(getByPlaceholderText('Enter last name'), 'Smith');
        fireEvent.changeText(getByPlaceholderText('Enter phone number'), '0501234567'); // ✅ חובה
        fireEvent.press(getByText('Update Profile'));

        await act(async () => {
            await waitFor(() => {
                expect(Alert.alert).toHaveBeenCalledWith('Error', 'Server error');
            });
        });
    });

});
