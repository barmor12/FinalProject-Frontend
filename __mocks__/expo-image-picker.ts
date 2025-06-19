export const requestMediaLibraryPermissionsAsync = jest.fn(() =>
    Promise.resolve({ status: "granted" })
);

export const launchImageLibraryAsync = jest.fn(() =>
    Promise.resolve({
        canceled: false,
        assets: [
            {
                uri: "mock-image.jpg",
            },
        ],
    })
);
