export interface Supplier {
  _id: string;
  name: string;
  email: string;
  phoneNumber: string;
}

export type CreateSupplierInput = Omit<Supplier, '_id'>;
