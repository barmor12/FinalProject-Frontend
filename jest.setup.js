// Mock the expo-router
jest.mock('expo-router', () => ({
    useRouter: () => ({
        push: jest.fn(),
        replace: jest.fn(),
    }),
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
    setItem: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
}));

// Mock the useColorScheme hook
jest.mock('@/hooks/useColorScheme', () => ({
    useColorScheme: () => 'light',
}));

// Mock the Platform API
jest.mock('react-native/Libraries/Utilities/Platform', () => ({
    OS: 'ios',
    select: jest.fn((obj) => obj.ios),
}));
jest.mock('@expo/vector-icons', () => ({
    Ionicons: () => null,
}));

jest.mock('expo-modules-core', () => ({
    Platform: {
        OS: 'ios',
        select: (options) => options.ios,
    },
}));
jest.mock('expo-font', () => ({
    loadAsync: jest.fn(),
}));
