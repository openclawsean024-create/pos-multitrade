import type { Product } from '@/types';
import type { IndustryId } from '@/types/industry';
import { INDUSTRIES, type IndustryTemplate } from '@/types/industry';
// keep INDUSTRIES ref so dead-code check stays happy if consumer uses it
void INDUSTRIES;

// 36 件預載商品（PRD §3.1 F-002）
// 餐飲：12 件 / 零售：12 件 / 服務：12 件

interface TemplateSeed {
  name: string;
  category: string;
  price: number;
  cost?: number;
  stock?: number;
  technician?: string;
  commissionRate?: number;
}

const FNB_SEEDS: TemplateSeed[] = [
  { name: '美式咖啡', category: '飲料', price: 60, cost: 15 },
  { name: '拿鐵', category: '飲料', price: 80, cost: 20 },
  { name: '奶茶', category: '飲料', price: 50, cost: 12 },
  { name: '蛋餅', category: '餐點', price: 30, cost: 10 },
  { name: '便當', category: '餐點', price: 80, cost: 35 },
  { name: '雞排', category: '餐點', price: 70, cost: 25 },
  { name: '三明治', category: '餐點', price: 45, cost: 15 },
  { name: '蛋糕', category: '甜點', price: 60, cost: 18 },
  { name: '果汁', category: '飲料', price: 55, cost: 18 },
  { name: '啤酒', category: '酒精', price: 80, cost: 30 },
  { name: '紅豆餅', category: '甜點', price: 25, cost: 8 },
  { name: '炸雞', category: '餐點', price: 60, cost: 22 },
];

const RETAIL_SEEDS: TemplateSeed[] = [
  { name: '礦泉水', category: '飲料', price: 20, cost: 8, stock: 100 },
  { name: '零食', category: '食品', price: 35, cost: 12, stock: 80 },
  { name: '3C 配件', category: '電子', price: 199, cost: 80, stock: 30 },
  { name: '文具', category: '日用', price: 25, cost: 8, stock: 120 },
  { name: '美妝', category: '美妝', price: 150, cost: 50, stock: 40 },
  { name: '飲料', category: '飲料', price: 30, cost: 12, stock: 100 },
  { name: '餅乾', category: '食品', price: 45, cost: 18, stock: 60 },
  { name: '茶包', category: '食品', price: 80, cost: 30, stock: 50 },
  { name: '咖啡豆', category: '飲料', price: 250, cost: 100, stock: 20 },
  { name: '雜貨', category: '日用', price: 40, cost: 15, stock: 200 },
  { name: '報紙', category: '刊物', price: 15, cost: 8, stock: 30 },
  { name: '雜誌', category: '刊物', price: 80, cost: 35, stock: 25 },
];

const SERVICE_SEEDS: TemplateSeed[] = [
  { name: '洗髮', category: '美髮', price: 200, cost: 30, technician: '技師 A', commissionRate: 0.4 },
  { name: '美甲', category: '美甲', price: 500, cost: 50, technician: '技師 A', commissionRate: 0.5 },
  { name: '染髮', category: '美髮', price: 1500, cost: 200, technician: '技師 A', commissionRate: 0.4 },
  { name: '剪髮', category: '美髮', price: 300, cost: 30, technician: '技師 A', commissionRate: 0.4 },
  { name: '按摩 60 分', category: '按摩', price: 800, cost: 50, technician: '技師 B', commissionRate: 0.5 },
  { name: 'SPA 療程', category: 'SPA', price: 1500, cost: 100, technician: '技師 B', commissionRate: 0.5 },
  { name: '基礎維修', category: '維修', price: 500, cost: 50, technician: '技師 C', commissionRate: 0.5 },
  { name: '居家清潔', category: '清潔', price: 600, cost: 30, technician: '技師 C', commissionRate: 0.5 },
  { name: '諮詢 30 分', category: '諮詢', price: 800, cost: 0, technician: '技師 D', commissionRate: 0.7 },
  { name: '教練課程', category: '健身', price: 1200, cost: 0, technician: '技師 D', commissionRate: 0.6 },
  { name: '設計服務', category: '設計', price: 2000, cost: 0, technician: '技師 E', commissionRate: 0.5 },
  { name: '教學課程', category: '教育', price: 600, cost: 0, technician: '技師 E', commissionRate: 0.6 },
];

const SEEDS_BY_INDUSTRY: Record<IndustryId, TemplateSeed[]> = {
  fnb: FNB_SEEDS,
  retail: RETAIL_SEEDS,
  service: SERVICE_SEEDS,
};

/**
 * Generate 12 preloaded products for a given industry.
 * PRD §3.1 AC-001
 */
export function getTemplateProducts(industryId: IndustryId, baseTimestamp?: number): Product[] {
  const seeds = SEEDS_BY_INDUSTRY[industryId];
  const ts = baseTimestamp ?? Date.now();
  return seeds.map((seed, idx) => ({
    id: `${industryId}-template-${idx + 1}`,
    industryId,
    name: seed.name,
    category: seed.category,
    price: seed.price,
    cost: seed.cost ?? null,
    stock: seed.stock ?? null,
    isActive: true,
    isTemplate: true,
    sku: null,
    technician: seed.technician ?? null,
    commissionRate: seed.commissionRate ?? null,
    createdAt: ts + idx,
  }));
}

/**
 * Get count of preloaded products per industry.
 */
export function getTemplateCount(industryId: IndustryId): number {
  return SEEDS_BY_INDUSTRY[industryId].length;
}

/**
 * Get all industries with their counts (helper for UI).
 */
export function getIndustrySummaries(): Array<{ industry: IndustryTemplate; productCount: number }> {
  return Object.values(INDUSTRIES).map((industry) => ({
    industry,
    productCount: SEEDS_BY_INDUSTRY[industry.id].length,
  }));
}
