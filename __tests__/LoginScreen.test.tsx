import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import LoginScreen from "../app/index";
import { Alert } from "react-native";

jest.mock("@react-native-async-storage/async-storage", () => ({
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
}));

jest.mock("expo-router", () => ({
    useRouter: () => ({
        replace: jest.fn(),
        push: jest.fn(),
    }),
}));

jest.mock("expo-auth-session/providers/google", () => ({
    useAuthRequest: () => [null, null, jest.fn()],
}));

jest.mock("react-native-reanimated", () => require("react-native-reanimated/mock"));

afterEach(() => {
    jest.clearAllMocks();
});

describe("LoginScreen", () => {
    it("renders email and password inputs", () => {
        const { getByPlaceholderText } = render(<LoginScreen />);
        expect(getByPlaceholderText("Email")).toBeTruthy();
        expect(getByPlaceholderText("Password")).toBeTruthy();
    });

    it("shows alert if email or password is empty", async () => {
        const alertSpy = jest.spyOn(Alert, "alert");
        const { getByText } = render(<LoginScreen />);
        fireEvent.press(getByText("Log In"));

        await waitFor(() => {
            expect(alertSpy).toHaveBeenCalledWith("Error", "Please enter email and password.");
        });
    });

    it("sends login request when email and password are filled", async () => {
        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: true,
                json: () =>
                    Promise.resolve({
                        tokens: {
                            accessToken: "fakeAccess",
                            refreshToken: "fakeRefresh",
                        },
                        userId: "123",
                        role: "user",
                    }),
            })
        ) as jest.Mock;

        const { getByText, getByPlaceholderText } = render(<LoginScreen />);
        fireEvent.changeText(getByPlaceholderText("Email"), "test@example.com");
        fireEvent.changeText(getByPlaceholderText("Password"), "password123");
        fireEvent.press(getByText("Log In"));

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining("/auth/login"),
                expect.any(Object)
            );
        });
    });
});
