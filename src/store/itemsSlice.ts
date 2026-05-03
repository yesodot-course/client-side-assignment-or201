import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { itemService } from "../services/api.service";
import type { PaginatedItems } from "../services/api.service";
import type { CreateItemInput, Item } from "../types/item.types";

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

export const fetchItems = createAsyncThunk<PaginatedItems, { page: number; limit: number }>(
    "items/fetchItems",
    async ({ page, limit }) => {
        const data = await itemService.getAll(page, limit);
        return data;
    }
);

export const addItem = createAsyncThunk("items/addItem", async (newItem: CreateItemInput) => {
    const data = await itemService.create(newItem);
    return data;
});

export const updateItem = createAsyncThunk(
    "items/updateItem",
    async ({ id, data }: { id: string; data: Partial<Item> }) => {
        const response = await itemService.update(id, data);
        return response;
    }
);

export const deleteItem = createAsyncThunk("items/deleteItem", async (id: string) => {
    await itemService.delete(id);
    return id;
});

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
                state.error = action.error.message ?? "Failed to fetch items";
            })

            .addCase(addItem.fulfilled, (state, action: PayloadAction<Item>) => {
                state.items.push(action.payload);
                state.totalItems += 1;
            })
            .addCase(updateItem.fulfilled, (state, action: PayloadAction<Item>) => {
                const index = state.items.findIndex((item) => item._id === action.payload._id);
                if (index !== -1) {
                    state.items[index] = action.payload;
                }
            })
            .addCase(deleteItem.fulfilled, (state, action: PayloadAction<string>) => {
                state.items = state.items.filter((item) => item._id !== action.payload);
                state.totalItems -= 1;
            });
    },
});

export default itemsSlice.reducer;