import type { IndustryId } from './industry';

export type PaymentMethod = 'cash' | 'credit' | 'line_pay' | 'jk_pay';

export const PAYMENT_METHODS: Array<{ id: PaymentMethod; label: string; icon: string }> = [
  { id: 'cash', label: '現金', icon: '💵' },
  { id: 'credit', label: '信用卡', icon: '💳' },
  { id: 'line_pay', label: 'LINE Pay', icon: '💚' },
  { id: 'jk_pay', label: '街口支付', icon: '🟠' },
];

export interface Product {
  id: string;
  industryId: IndustryId;
  name: string;
  category: string;
  price: number;
  cost?: number | null;
  stock?: number | null;
  isActive: boolean;
  isTemplate: boolean;
  sku?: string | null;
  technician?: string | null;
  commissionRate?: number | null;
  createdAt: number;
}

export interface CartItem {
  productId: string;
  product: Product;
  quantity: number;
  subtotal: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  industryId: IndustryId;
  items: OrderItem[];
  totalAmount: number;
  paymentMethod: PaymentMethod;
  customerNote?: string | null;
  technician?: string | null;
  createdAt: number;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  commissionAmount?: number;
}

export interface Technician {
  id: string;
  name: string;
  industryId: IndustryId;
  defaultCommissionRate: number;
  totalEarnings: number;
  createdAt: number;
}

export interface MonthlyReport {
  yearMonth: string;
  totalRevenue: number;
  totalOrders: number;
  topProductName: string | null;
  topProductRevenue: number;
  topProductQuantity: number;
  technicianEarnings: Array<{
    technician: string;
    earnings: number;
  }>;
}

export interface AppSnapshot {
  version: 1;
  exportedAt: number;
  industries: IndustryId[];
  activeIndustry: IndustryId;
  products: Product[];
  orders: Order[];
  technicians: Technician[];
}
