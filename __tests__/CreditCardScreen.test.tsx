// __tests__/CreditCardScreen.test.tsx
import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import CreditCardScreen from "@/app/CreditCardScreen";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";
import config from "@/config";

jest.mock("@react-native-async-storage/async-storage", () => ({
    getItem: jest.fn(),
}));
jest.spyOn(Alert, "alert");

describe("CreditCardScreen", () => {
    const fakeCards = [
        {
            id: "card1",
            cardNumber: "1234123412345678",
            cardHolderName: "John Doe",
            expiryDate: "12/25",
            cardType: "visa",
            isDefault: true,
        },
        {
            id: "card2",
            cardNumber: "8765432187654321",
            cardHolderName: "Jane Roe",
            expiryDate: "11/24",
            cardType: "mastercard",
            isDefault: false,
        },
    ];

    beforeEach(() => {
        jest.clearAllMocks();
        // כל קריאה ל-getItem תחזיר 'token123'
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue("token123");
        // מוקאנו את fetch: קריאות GET להחזיר את fakeCards, POST/PUT/DELETE להחזיר ok
        global.fetch = jest.fn((url, opts) => {
            if (opts?.method === "GET") {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({ cards: fakeCards }),
                });
            }
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ message: "ok" }),
            });
        }) as jest.Mock;
    });

    it("loads and displays credit cards", async () => {
        const { findByText } = render(<CreditCardScreen />);

        // מחכים למופע של הכרטיס הראשון
        expect(await findByText("**** **** **** 5678")).toBeTruthy();
        expect(await findByText("John Doe")).toBeTruthy();
        expect(await findByText("12/25")).toBeTruthy();

        // וגם לוודא שבוצעה קריאת GET נכונה
        await waitFor(() =>
            expect(global.fetch).toHaveBeenCalledWith(
                `${config.BASE_URL}/auth/credit-cards`,
                expect.objectContaining({
                    method: "GET",
                    headers: expect.objectContaining({
                        Authorization: "Bearer token123",
                    }),
                })
            )
        );
    });

    it("shows validation errors on invalid input in Add New Card modal", async () => {
        const { getByText, getByTestId } = render(
            <CreditCardScreen />
        );

        // מחכים שהכרטיסים ייטענו
        await waitFor(() => expect(global.fetch).toHaveBeenCalled());

        // פותחים את המודאל
        fireEvent.press(getByTestId("add-card-button"));

        // לוחצים שמירה בלי למלא
        fireEvent.press(getByTestId("save-button"));

        // שגיאות תקניות מוצגות
        expect(
            getByText("Please enter a valid 16-digit card number")
        ).toBeTruthy();
        expect(
            getByText("Please enter a valid expiry date (MM/YY)")
        ).toBeTruthy();
        expect(getByText("Please enter a valid 3-digit CVV")).toBeTruthy();
        expect(getByText("Please enter the cardholder name")).toBeTruthy();
    });

    it("submits valid new card and shows success alert", async () => {
        const {
            getByTestId,
            getByPlaceholderText,
        } = render(<CreditCardScreen />);

        await waitFor(() => expect(global.fetch).toHaveBeenCalled());

        // פותחים לייצור כרטיס חדש
        fireEvent.press(getByTestId("add-card-button"));

        fireEvent.changeText(
            getByPlaceholderText("1234 5678 9012 3456"),
            "4111 1111 1111 1111"
        );
        fireEvent.changeText(getByPlaceholderText("John Doe"), "Mary Jane");
        fireEvent.changeText(getByPlaceholderText("MM/YY"), "08/26");
        fireEvent.changeText(getByPlaceholderText("123"), "123");

        fireEvent.press(getByTestId("save-button"));

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                `${config.BASE_URL}/auth/add-credit-cards`,
                expect.objectContaining({
                    method: "POST",
                    headers: expect.objectContaining({
                        "Content-Type": "application/json",
                        Authorization: "Bearer token123",
                    }),
                    body: JSON.stringify({
                        cardNumber: "4111111111111111",
                        cardHolderName: "Mary Jane",
                        expiryDate: "08/26",
                        isDefault: false,
                    }),
                })
            );
            expect(Alert.alert).toHaveBeenCalledWith("Success", "ok");
        });
    });

    it("edits existing card and shows success alert", async () => {
        const { getByTestId } = render(<CreditCardScreen />);

        await waitFor(() => expect(global.fetch).toHaveBeenCalled());

        // פותחים את המודאל של עריכה על הכרטיס הראשון
        fireEvent.press(getByTestId("edit-card-card1"));

        // ולבסוף מעדכנים
        fireEvent.press(getByTestId("update-button"));

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                `${config.BASE_URL}/auth/credit-cards/card1`,
                expect.objectContaining({ method: "PUT" })
            );
            expect(Alert.alert).toHaveBeenCalledWith("Success", "ok");
        });
    });
});
