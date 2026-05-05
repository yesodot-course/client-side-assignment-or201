import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { itemService } from "../services/api.service";
import type { PaginatedItems } from "../services/api.service";
import type { CreateItemInput, Item } from "../types/item.types";
import axios from "axios";

interface ItemsState {
    items: Item[];
    totalItems: number;
    loading: boolean;
    error: string | null;
}

const initialState: ItemsState = {
    items: [],
    totalItems: 0,
    loading: false,
    error: null,
};

// Helper: extract the real server message from an axios error
function extractServerMessage(err: unknown): string {
    if (axios.isAxiosError(err) && err.response?.data) {
        const data = err.response.data;
        if (typeof data.message === "string") return data.message;
        if (Array.isArray(data.errors)) return data.errors.map((e: any) => e.message).join(", ");
    }
    if (err instanceof Error) return err.message;
    return "An unknown error occurred";
}

export const fetchItems = createAsyncThunk<PaginatedItems, { page: number; limit: number }>(
    "items/fetchItems",
    async ({ page, limit }, { rejectWithValue }) => {
        try {
            return await itemService.getAll(page, limit);
        } catch (err) {
            return rejectWithValue(extractServerMessage(err));
        }
    }
);

export const addItem = createAsyncThunk(
    "items/addItem",
    async (newItem: CreateItemInput, { rejectWithValue }) => {
        try {
            return await itemService.create(newItem);
        } catch (err) {
            return rejectWithValue(extractServerMessage(err));
        }
    }
);

export const updateItem = createAsyncThunk(
    "items/updateItem",
    async ({ id, data }: { id: string; data: Partial<Item> }, { rejectWithValue }) => {
        try {
            return await itemService.update(id, data);
        } catch (err) {
            return rejectWithValue(extractServerMessage(err));
        }
    }
);

export const deleteItem = createAsyncThunk(
    "items/deleteItem",
    async (id: string, { rejectWithValue }) => {
        try {
            await itemService.delete(id);
            return id;
        } catch (err) {
            return rejectWithValue(extractServerMessage(err));
        }
    }
);

const itemsSlice = createSlice({
    name: "items",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchItems.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchItems.fulfilled, (state, action: PayloadAction<PaginatedItems>) => {
                state.loading = false;
                state.items = action.payload.items;
                state.totalItems = action.payload.totalItems;
            })
            .addCase(fetchItems.rejected, (state, action) => {
                state.loading = false;
                state.error = (action.payload as string) ?? action.error.message ?? "Failed to fetch items";
            })
            .addCase(addItem.fulfilled, (state, action: PayloadAction<Item>) => {
                state.items.push(action.payload);
                state.totalItems += 1;
            })
            .addCase(updateItem.fulfilled, (state, action: PayloadAction<Item>) => {
                const index = state.items.findIndex((item) => item._id === action.payload._id);
                if (index !== -1) state.items[index] = action.payload;
            })
            .addCase(deleteItem.fulfilled, (state, action: PayloadAction<string>) => {
                state.items = state.items.filter((item) => item._id !== action.payload);
                state.totalItems -= 1;
            });
    },
});

export default itemsSlice.reducer;