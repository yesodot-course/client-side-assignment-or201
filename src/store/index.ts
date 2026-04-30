import { configureStore } from '@reduxjs/toolkit';
import cartReducer from './cartSlice.store'; // מוודא שהשם תואם לקובץ שלך

export const store = configureStore({
  reducer: {
    cart: cartReducer, // כאן אנחנו אומרים ל-Redux שיש לנו מחלקה בשם cart
  },
});

// הגדרות טיפוסים (Types) - זה יעזור לנו מאוד בהמשך כנרצה למשוך נתונים מהעגלה
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
