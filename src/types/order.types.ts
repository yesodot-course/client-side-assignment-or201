export interface OrderItem {
  itemId: string;
  quantity: number;
}

export interface Order {
  _id: string;
  items: OrderItem[];
  totalPrice: number;
  createdAt: string;
}

export interface CreateOrderInput {
  items: OrderItem[];
}
