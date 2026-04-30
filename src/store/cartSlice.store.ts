import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { orderService } from '../services/api.service';
import type { CreateOrderInput } from '../types/order.types';
import type { Item } from '../types/item.types';

interface CartItem extends Item {
  quantity: number;
}

interface CartState {
  items: CartItem[];
  totalAmount: number;
}

const initialState: CartState = {
  items: [],
  totalAmount: 0,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<{ item: Item; quantity: number }>) => {
      const { item, quantity } = action.payload;
      
      const existingItem = state.items.find(i => i._id === item._id);
      
      if (!existingItem && state.items.length >= 10) {
        alert("מקסימום 10 סוגי מוצרים שונים בעגלה!");
        return;
      }

      const totalQuantity = state.items.reduce((sum, i) => sum + i.quantity, 0);
      if (totalQuantity + quantity > 50) {
        alert("לא ניתן להזמין יותר מ-50 פריטים בסך הכל");
        return;
      }

      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        state.items.push({ ...item, quantity });
      }
    },
    removeFromCart: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(item => item._id !== action.payload);
    },
    updateQuantity: (state, action: PayloadAction<{ id: string; quantity: number }>) => {
      const item = state.items.find(i => i._id === action.payload.id);
      if (item) {
        item.quantity = action.payload.quantity;
      }
    },
    clearCart: (state) => {
      state.items = [];
    }
  },
  extraReducers: (builder) => {
    builder.addCase(placeOrder.fulfilled, (state) => {
      state.items = [];
    });
  }
});

export const placeOrder = createAsyncThunk(
  'cart/placeOrder',
  async (orderData: CreateOrderInput) => {
    const response = await orderService.placeOrder(orderData);
    return response;
  }
);

export const { addToCart, removeFromCart, updateQuantity, clearCart } = cartSlice.actions;
export default cartSlice.reducer;