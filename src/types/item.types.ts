export interface Item {
    _id: string;
    name: string;
    price: number;
    stock: number;
    category: string;
    supplier: string;
    image: string;
    description: string;
}

export type CreateItemInput = Omit<Item, "_id">;
