// Industry types for pos-multitrade (PRD §3.1 F-001)

export type IndustryId = 'fnb' | 'retail' | 'service';

export interface IndustryTemplate {
  id: IndustryId;
  name: string;
  nameEn: string;
  icon: string;
  description: string;
}

export const INDUSTRIES: Record<IndustryId, IndustryTemplate> = {
  fnb: {
    id: 'fnb',
    name: '餐飲業',
    nameEn: 'Food & Beverage',
    icon: '🍜',
    description: '小吃店、咖啡廳、餐廳',
  },
  retail: {
    id: 'retail',
    name: '零售業',
    nameEn: 'Retail',
    icon: '🛍️',
    description: '雜貨、文創、3C',
  },
  service: {
    id: 'service',
    name: '服務業',
    nameEn: 'Service',
    icon: '💆',
    description: '美髮、SPA、維修',
  },
};

export const INDUSTRY_LIST: IndustryTemplate[] = Object.values(INDUSTRIES);
