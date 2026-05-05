export interface OrderItem {
    item: string;
}

export interface CreateOrderInput {
    items: OrderItem[];
    address: string;
}

export interface Order {
    _id: string;
    items: {
        item: {
            _id: string;
            name: string;
            category: string;
            image?: string;
        };
        quantity: number;
    }[];
    address: string;
    orderDate: string;
    totalAmount: number;
    shopProfit: number;
    createdAt: string;
    updatedAt: string;
}
