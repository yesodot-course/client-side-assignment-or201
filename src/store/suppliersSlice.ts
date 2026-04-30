import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import type { Supplier, CreateSupplierInput } from '../types/supplier.types';
import { supplierService } from '../services/api.service';

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

export const fetchSuppliers = createAsyncThunk('suppliers/fetchSuppliers', async () => {
  const data = await supplierService.getAll();
  return data;
});

export const addSupplier = createAsyncThunk('suppliers/addSupplier', async (newSupplier: CreateSupplierInput) => {
  const data = await supplierService.create(newSupplier);
  return data;
});

export const updateSupplier = createAsyncThunk(
  'suppliers/updateSupplier',
  async ({ id, data }: { id: string; data: Partial<Supplier> }) => {
    const response = await supplierService.update(id, data);
    return response;
  }
);

export const deleteSupplier = createAsyncThunk('suppliers/deleteSupplier', async (id: string) => {
  await supplierService.delete(id);
  return id;
});

const suppliersSlice = createSlice({
  name: 'suppliers',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSuppliers.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchSuppliers.fulfilled, (state, action: PayloadAction<Supplier[]>) => {
        state.loading = false;
        state.suppliers = action.payload;
      })
      .addCase(addSupplier.fulfilled, (state, action: PayloadAction<Supplier>) => {
        state.suppliers.push(action.payload);
      })
      .addCase(updateSupplier.fulfilled, (state, action: PayloadAction<Supplier>) => {
        const index = state.suppliers.findIndex((s) => s._id === action.payload._id);
        if (index !== -1) {
          state.suppliers[index] = action.payload;
        }
      })
      .addCase(deleteSupplier.fulfilled, (state, action: PayloadAction<string>) => {
        state.suppliers = state.suppliers.filter((s) => s._id !== action.payload);
      });
  },
});

export default suppliersSlice.reducer;
