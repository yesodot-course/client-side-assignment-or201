import axios from "axios";
import type { CreateItemInput, Item } from "../types/item.types";
import type { CreateOrderInput, Order } from "../types/order.types";
import type { CreateSupplierInput, Supplier } from "../types/supplier.types";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:3000/api";

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

export interface PaginatedItems {
    items: Item[];
    totalItems: number;
}

export const itemService = {
    getAll: async (page?: number, limit?: number): Promise<PaginatedItems> => {
        const params = new URLSearchParams();
        if (page !== undefined) params.append("page", String(page));
        if (limit !== undefined) params.append("limit", String(limit));
        const query = params.toString() ? `?${params.toString()}` : "";
        const response = await apiClient.get<PaginatedItems>(`/items${query}`);
        return response.data;
    },
    getById: async (id: string) => {
        const response = await apiClient.get<Item>(`/items/${id}`);
        return response.data;
    },
    create: async (item: CreateItemInput) => {
        const response = await apiClient.post<Item>("/items", item);
        return response.data;
    },
    update: async (id: string, item: Partial<Item>) => {
        const response = await apiClient.put<Item>(`/items/${id}`, item);
        return response.data;
    },
    delete: async (id: string) => {
        const response = await apiClient.delete<Item>(`/items/${id}`);
        return response.data;
    },
};

export const supplierService = {
    getAll: async () => {
        const response = await apiClient.get<Supplier[]>("/suppliers");
        return response.data;
    },
    create: async (supplier: CreateSupplierInput) => {
        const response = await apiClient.post<Supplier>("/suppliers", supplier);
        return response.data;
    },
    update: async (id: string, supplier: Partial<Supplier>) => {
        const response = await apiClient.patch<Supplier>(`/suppliers/${id}`, supplier);
        return response.data;
    },
    delete: async (id: string) => {
        const response = await apiClient.delete<Supplier>(`/suppliers/${id}`);
        return response.data;
    },
};

export const orderService = {
    placeOrder: async (order: CreateOrderInput) => {
        const response = await apiClient.post<Order>("/orders", order);
        return response.data;
    },
};

export const analyticsService = {
    getRevenue: async () => {
        const response = await apiClient.get<unknown>("/analytics/revenue");
        return response.data;
    },
    getTopCategory: async () => {
        const response = await apiClient.get<unknown>("/analytics/top-category");
        return response.data;
    },
    getTopItemDaily: async () => {
        const response = await apiClient.get<unknown>("/analytics/top-item-daily");
        return response.data;
    },
    getProfitMargins: async () => {
        const response = await apiClient.get<unknown>("/analytics/profit-margins");
        return response.data;
    },
    getTopSuppliers: async () => {
        const response = await apiClient.get<unknown>("/analytics/top-suppliers");
        return response.data;
    },
    getSupplierSpending: async () => {
        const response = await apiClient.get<unknown>("/analytics/supplier-spending");
        return response.data;
    },
};

export default apiClient;