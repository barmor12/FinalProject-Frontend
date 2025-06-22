/* eslint-disable no-undef */
global.fetch = jest.fn(() =>
    Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
);

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

// Mock the Platform API to support the full react-native Platform module
jest.mock('react-native', () => {
    const RN = jest.requireActual('react-native');
    RN.Platform = {
        OS: 'ios',
        select: (options) => options.ios,
    };
    return RN;
});
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

jest.mock('expo-blur', () => ({
    BlurView: ({ children }) => children,
  }));
