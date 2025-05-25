import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import LoginScreen from "../app/index";
import { Alert } from "react-native";

// צריך למנוע שגיאות של AsyncStorage וכו'
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

jest.mock("react-native/Libraries/Animated/NativeAnimatedHelper"); // כדי למנוע אזהרות באנימציות

describe("LoginScreen", () => {
    it("renders email and password inputs", () => {
        const { getByLabelText } = render(<LoginScreen />);
        expect(getByLabelText("Email")).toBeTruthy();
        expect(getByLabelText("Password")).toBeTruthy();
    });

    it("shows alert if email or password is empty", async () => {
        const alertSpy = jest.spyOn(Alert, "alert");
        const { getByText } = render(<LoginScreen />);

        const loginButton = getByText("Log In");
        fireEvent.press(loginButton);

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
            expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("/auth/login"), expect.any(Object));
        });
    });
});
