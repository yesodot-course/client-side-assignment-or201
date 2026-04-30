import type { Item } from './types/item.types';

export const DUMMY_PRODUCTS: Item[] = [
  {
    _id: '1',
    name: 'מקלדת חכמה',
    price: 150,
    stock: 10,
    category: 'Home',
    supplier: 'Supplier A',
    image: '/1.jpg',
    description: 'תיאור קצר של המוצר'
  },
  {
    _id: '2',
    name: 'אוזניות אלחוטיות',
    price: 300,
    stock: 15,
    category: 'Electronics',
    supplier: 'Supplier B',
    image: '/2.jpg',
    description: 'סאונד איכותי במיוחד'
  }
];