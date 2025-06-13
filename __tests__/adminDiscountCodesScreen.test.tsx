import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";

jest.mock("react-native", () => {
  const RN = jest.requireActual("react-native");
  RN.Platform.OS = "ios";
  return RN;
});

import AdminDiscountCodes from "@/app/adminScreens/adminDiscountCodesScreen";
import AsyncStorage from "@react-native-async-storage/async-storage";

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
}));

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
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders discount codes list", async () => {
    let getByText!: (text: string) => any;
    await act(async () => {
      ({ getByText } = render(<AdminDiscountCodes />));
    });
    await waitFor(() => {
      expect(getByText("Code: TESTCODE")).toBeTruthy();
      expect(getByText("Discount: 20%")).toBeTruthy();
      expect(getByText("Status: Active")).toBeTruthy();
    });
  });

  it("does not allow creating a code with missing fields", async () => {
    let getByText!: (text: string) => any;
    await act(async () => {
      ({ getByText } = render(<AdminDiscountCodes />));
    });
    fireEvent.press(getByText("Create Code"));
    expect(fetch).toHaveBeenCalledTimes(1); // initial fetch only
  });

  it("allows creating a new discount code", async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce("mocked_token");

    let getByPlaceholderText: (text: string) => any = () => null as any;
    let getByText: (text: string) => any = () => null as any;

    await act(async () => {
      ({ getByPlaceholderText, getByText } = render(<AdminDiscountCodes />));
    });

    fireEvent.changeText(getByPlaceholderText("Code"), "NEWCODE");
    fireEvent.changeText(getByPlaceholderText("Discount %"), "15");

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

    await waitFor(() => fireEvent.press(getByText("Create Code")));

    expect(fetch).toHaveBeenCalledTimes(3); // initial fetch, POST, fetchCodes
  });
});