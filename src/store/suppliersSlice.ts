import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import type { Supplier, CreateSupplierInput } from "../types/supplier.types";
import { supplierService } from "../services/api.service";
import axios from "axios";

interface SuppliersState {
    suppliers: Supplier[];
    loading: boolean;
    error: string | null;
}

const initialState: SuppliersState = {
    suppliers: [],
    loading: false,
    error: null,
};

function extractServerMessage(err: unknown): string {
    if (axios.isAxiosError(err) && err.response?.data) {
        const data = err.response.data;
        if (typeof data.message === "string") return data.message;
        if (Array.isArray(data.errors)) return data.errors.map((e: any) => e.message).join(", ");
    }
    if (err instanceof Error) return err.message;
    return "An unknown error occurred";
}

export const fetchSuppliers = createAsyncThunk(
    "suppliers/fetchSuppliers",
    async (_, { rejectWithValue }) => {
        try {
            return await supplierService.getAll();
        } catch (err) {
            return rejectWithValue(extractServerMessage(err));
        }
    }
);

export const addSupplier = createAsyncThunk(
    "suppliers/addSupplier",
    async (newSupplier: CreateSupplierInput, { rejectWithValue }) => {
        try {
            return await supplierService.create(newSupplier);
        } catch (err) {
            return rejectWithValue(extractServerMessage(err));
        }
    }
);

export const updateSupplier = createAsyncThunk(
    "suppliers/updateSupplier",
    async ({ id, data }: { id: string; data: Partial<Supplier> }, { rejectWithValue }) => {
        try {
            return await supplierService.update(id, data);
        } catch (err) {
            return rejectWithValue(extractServerMessage(err));
        }
    }
);

export const deleteSupplier = createAsyncThunk(
    "suppliers/deleteSupplier",
    async (id: string, { rejectWithValue }) => {
        try {
            await supplierService.delete(id);
            return id;
        } catch (err) {
            return rejectWithValue(extractServerMessage(err));
        }
    }
);

const suppliersSlice = createSlice({
    name: "suppliers",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchSuppliers.pending, (state) => { state.loading = true; })
            .addCase(fetchSuppliers.fulfilled, (state, action: PayloadAction<Supplier[]>) => {
                state.loading = false;
                state.suppliers = action.payload;
            })
            .addCase(fetchSuppliers.rejected, (state, action) => {
                state.loading = false;
                state.error = (action.payload as string) ?? "Failed to fetch suppliers";
            })
            .addCase(addSupplier.fulfilled, (state, action: PayloadAction<Supplier>) => {
                state.suppliers.push(action.payload);
            })
            .addCase(updateSupplier.fulfilled, (state, action: PayloadAction<Supplier>) => {
                const index = state.suppliers.findIndex((s) => s._id === action.payload._id);
                if (index !== -1) state.suppliers[index] = action.payload;
            })
            .addCase(deleteSupplier.fulfilled, (state, action: PayloadAction<string>) => {
                state.suppliers = state.suppliers.filter((s) => s._id !== action.payload);
            });
    },
});

export default suppliersSlice.reducer;