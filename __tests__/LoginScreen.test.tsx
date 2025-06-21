import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import LoginScreen from "../app/index";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";

beforeAll(() => {
    jest.spyOn(console, "log").mockImplementation(() => { });
    jest.spyOn(console, "warn").mockImplementation(() => { });
});

// mock icons
jest.mock("@expo/vector-icons", () => ({
    FontAwesome: () => null,
}));

// mock Google Auth
jest.mock("expo-auth-session/providers/google", () => ({
    useAuthRequest: () => [null, null, jest.fn()],
}));

// mock router
jest.mock("expo-router", () => ({
    useRouter: () => ({
        replace: jest.fn(),
        push: jest.fn(),
    }),
}));

// mock async storage
jest.mock("@react-native-async-storage/async-storage", () => ({
    setItem: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn(),
}));

// default mock for successful login
global.fetch = jest.fn(() =>
    Promise.resolve({
        ok: true,
        json: () =>
            Promise.resolve({
                tokens: {
                    accessToken: "mockAccessToken",
                    refreshToken: "mockRefreshToken",
                },
                userId: "123456",
                role: "user",
            }),
    })
) as jest.Mock;

describe("LoginScreen", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should show alert if email or password is empty", async () => {
        const alertSpy = jest.spyOn(Alert, "alert");
        const { getByText, getByTestId } = render(<LoginScreen />);

        // wait until login content is rendered
        await waitFor(() => expect(getByTestId("loginButton")).toBeTruthy());

        fireEvent.press(getByText("Log In"));
        expect(alertSpy).toHaveBeenCalledWith("Error", "Please enter email and password.");
    });

    it("should log in successfully and store tokens", async () => {
        const { getByText, getByTestId } = render(<LoginScreen />);
        await waitFor(() => getByTestId("emailInput"));

        fireEvent.changeText(getByTestId("emailInput"), "test@example.com");
        fireEvent.changeText(getByTestId("passwordInput"), "Aa12345!");
        fireEvent.press(getByText("Log In"));

        await waitFor(() => {
            expect(AsyncStorage.setItem).toHaveBeenCalledWith("accessToken", "mockAccessToken");
            expect(AsyncStorage.setItem).toHaveBeenCalledWith("refreshToken", "mockRefreshToken");
            expect(AsyncStorage.setItem).toHaveBeenCalledWith("userId", "123456");
            expect(AsyncStorage.setItem).toHaveBeenCalledWith("role", "user");
        });
    });

    it("should show error alert on failed login", async () => {
        // mock failed login
        (fetch as jest.Mock).mockImplementationOnce(() =>
            Promise.resolve({
                ok: false,
                json: () => Promise.resolve({ error: "Invalid credentials" }),
            })
        );

        const alertSpy = jest.spyOn(Alert, "alert");
        const { getByText, getByTestId } = render(<LoginScreen />);
        await waitFor(() => getByTestId("emailInput"));

        fireEvent.changeText(getByTestId("emailInput"), "fail@example.com");
        fireEvent.changeText(getByTestId("passwordInput"), "wrongpass");
        fireEvent.press(getByText("Log In"));

        await waitFor(() => {
            expect(alertSpy).toHaveBeenCalledWith("Error", "Invalid credentials");
        });
    });
});