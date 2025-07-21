import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import AdminDiscountCodes from "../app/adminScreens/adminDiscountCodesScreen";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Mock DateTimePicker BEFORE describe
jest.mock("react-native-modal-datetime-picker", () => {
  return () => null;
});

jest.mock("react-native", () => {
  const RN = jest.requireActual("react-native");
  RN.Platform.OS = "ios";
  return RN;
});


jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
}));

// Mock fetch with a default implementation
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () =>
      Promise.resolve([
        {
          _id: "1",
          code: "TESTCODE",
          discountPercentage: 20,
          isActive: true,
          expiryDate: new Date().toISOString(),
        },
      ]),
  })
) as jest.Mock;

describe("AdminDiscountCodes Screen", () => {
  let rendered: ReturnType<typeof render>;

  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock implementations
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue("mocked_token");
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve([
          {
            _id: "1",
            code: "TESTCODE",
            discountPercentage: 20,
            isActive: true,
            expiryDate: futureDate.toISOString(), // 👈 זה מה שחשוב
          },
        ]),
    });
  });

  afterEach(() => {
    rendered?.unmount();
  });

  it("renders discount codes list", async () => {
    rendered = render(<AdminDiscountCodes />);
    const { getByText } = rendered;

    await waitFor(() => {
      expect(getByText("Code: TESTCODE")).toBeTruthy();
      expect(getByText("Discount: 20%")).toBeTruthy();
      expect(getByText("Status: Active")).toBeTruthy();
    });
  });

  it("does not allow creating a code with missing fields", async () => {
    rendered = render(<AdminDiscountCodes />);
    const { getByText } = rendered;

    await act(async () => {
      fireEvent.press(getByText("Create Code"));
    });

    expect(fetch).toHaveBeenCalledTimes(1); // initial fetch only
  });

  it("allows creating a new discount code", async () => {
    rendered = render(<AdminDiscountCodes />);
    const { getByPlaceholderText, getByText } = rendered;

    // Fill in the form
    await act(async () => {
      fireEvent.changeText(getByPlaceholderText("Code"), "NEWCODE");
      fireEvent.changeText(getByPlaceholderText("Discount %"), "15");
    });

    // Mock the POST and subsequent fetch responses
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      }) // POST response
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve([
            {
              _id: "1",
              code: "NEWCODE",
              discountPercentage: 15,
              isActive: true,
              expiryDate: new Date().toISOString(),
            },
          ]),
      }); // fetchCodes response

    // Submit the form
    await act(async () => {
      fireEvent.press(getByText("Create Code"));
    });

    // Wait for all promises to resolve
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(3); // initial fetch, POST, fetchCodes
    });
  });
});