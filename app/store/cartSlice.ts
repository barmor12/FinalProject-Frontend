import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type CartItem = {
  _id: string;
  name: string;
  price: number;
  quantity: number;
  stock: number;
};

type CartState = {
  items: CartItem[];
};

const initialState: CartState = {
  items: [],
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state: CartState, action: PayloadAction<CartItem>) => {
      const existingItem = state.items.find((item: CartItem) => item._id === action.payload._id);
      if (existingItem) {
        if (existingItem.quantity + action.payload.quantity <= existingItem.stock) {
          existingItem.quantity += action.payload.quantity;
        }
      } else {
        if (action.payload.quantity <= action.payload.stock) {
          state.items.push(action.payload);
        }
      }
    },
    clearCart: (state: CartState) => {
      state.items = [];
    },
  },
});

export const { addToCart, clearCart } = cartSlice.actions;
export default cartSlice.reducer;