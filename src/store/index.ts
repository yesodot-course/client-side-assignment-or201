import { configureStore } from '@reduxjs/toolkit';
import cartReducer from './cartSlice.store';
import itemsReducer from './itemsSlice';
import suppliersReducer from './suppliersSlice';

export const store = configureStore({
  reducer: {
    cart: cartReducer,
    items: itemsReducer,
    suppliers: suppliersReducer,
  },
});

type RootState = ReturnType<typeof store.getState>;
type AppDispatch = typeof store.dispatch;

export type { RootState, AppDispatch };
