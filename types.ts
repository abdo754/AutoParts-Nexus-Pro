export type UserRole = 'retailer' | 'supplier' | 'admin';

export interface User {
  id: string;
  name: string;
  phone: string;
  email: string;
  password: string; // Stored client-side for simulation; would be hashed/salted in a real backend
  role: UserRole;
}

export interface Product {
  id: string;
  partNumber: string; // New: From Excel "Part Number"
  name: string;      // From Excel "Part Name"
  description: string; // From Excel "Description"
  price: number;     // From Excel "Price"
  imageUrl: string;  // Not from Excel, will use default/placeholder
  category: string;  // Not from Excel, will use default/placeholder
  make: string;      // New: From Excel "Make"
  model: string;     // New: From Excel "Model"
  year: number;      // New: From Excel "Year"
  vehicleType: string; // Still used for broader classification, can be derived/defaulted
  shopId: string; // ID of the supplier who listed this product
  shopName: string; // Name of the shop for display
  quantityAvailable: number; // From Excel "Stock"
}

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  shopId: string;
  shopName: string;
  quantity: number;
  imageUrl: string; // To display in cart
  maxQuantity: number; // To enforce stock limits in cart
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  shopId: string;
  shopName: string;
  quantity: number;
  imageUrl: string; // For receipt/sales history
}

export interface Transaction {
  id: string;
  retailerId: string;
  retailerName: string;
  shopId: string;
  shopName: string;
  items: OrderItem[];
  totalAmount: number;
  transactionDate: string; // ISO string
}

export interface AssistantMessage {
  id: string;
  text: string;
  isUser: boolean;
}