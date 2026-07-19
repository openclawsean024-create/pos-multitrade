// AC-001: 3 行業 × 12 件預載商品 (PRD §3.1 F-001 / F-002)

import { describe, it, expect } from 'vitest';
import {
  getTemplateProducts,
  getTemplateCount,
  getIndustrySummaries,
} from '@/lib/templates';
import { INDUSTRIES } from '@/types/industry';

describe('templates — AC-001 行業預載 12 件商品', () => {
  it('餐飲業預載 12 件商品（F-002）', () => {
    const products = getTemplateProducts('fnb');
    expect(products).toHaveLength(12);
  });

  it('零售業預載 12 件商品（F-002）', () => {
    const products = getTemplateProducts('retail');
    expect(products).toHaveLength(12);
  });

  it('服務業預載 12 件商品（F-002）', () => {
    const products = getTemplateProducts('service');
    expect(products).toHaveLength(12);
  });

  it('合計 36 件預載商品', () => {
    const fnb = getTemplateProducts('fnb');
    const retail = getTemplateProducts('retail');
    const service = getTemplateProducts('service');
    expect(fnb.length + retail.length + service.length).toBe(36);
  });

  it('餐飲預載包含美式咖啡 NT$60、拿鐵 NT$80、奶茶 NT$50、蛋餅 NT$30', () => {
    const products = getTemplateProducts('fnb');
    const names = products.map((p) => p.name);
    expect(names).toContain('美式咖啡');
    expect(names).toContain('拿鐵');
    expect(names).toContain('奶茶');
    expect(names).toContain('蛋餅');

    const americano = products.find((p) => p.name === '美式咖啡');
    expect(americano?.price).toBe(60);
    const latte = products.find((p) => p.name === '拿鐵');
    expect(latte?.price).toBe(80);
  });

  it('服務業預載含技師抽成設定（≥40%）', () => {
    const products = getTemplateProducts('service');
    const dyeing = products.find((p) => p.name === '染髮');
    expect(dyeing).toBeDefined();
    expect(dyeing?.commissionRate).toBeGreaterThanOrEqual(0.4);
    expect(dyeing?.technician).toBeTruthy();
  });

  it('預載商品標記 isTemplate = true（AC-001）', () => {
    const products = getTemplateProducts('fnb');
    expect(products.every((p) => p.isTemplate === true)).toBe(true);
  });

  it('預載商品標記 industryId 正確', () => {
    const products = getTemplateProducts('retail');
    expect(products.every((p) => p.industryId === 'retail')).toBe(true);
  });

  it('getTemplateCount 對應行業回傳 12', () => {
    expect(getTemplateCount('fnb')).toBe(12);
    expect(getTemplateCount('retail')).toBe(12);
    expect(getTemplateCount('service')).toBe(12);
  });

  it('getIndustrySummaries 回傳 3 行業', () => {
    const summaries = getIndustrySummaries();
    expect(summaries).toHaveLength(3);
    expect(summaries.map((s) => s.industry.id).sort()).toEqual(['fnb', 'retail', 'service']);
    expect(INDUSTRIES.fnb.name).toBe('餐飲業');
    expect(INDUSTRIES.retail.name).toBe('零售業');
    expect(INDUSTRIES.service.name).toBe('服務業');
  });
});
