import { describe, it, expect } from 'vitest';
import { calculateNetWorth, getClosedDealsValue, type WealthPortfolio, type PipelineDeal } from '../src/wealth.js';

describe('Investor OS Wealth calculations', () => {
  it('should calculate base net worth', () => {
    const portfolio: WealthPortfolio = {
      cash: 10000,
      equities: 20000,
      realEstate: 100000,
      sovereignAssets: 5000,
    };
    expect(calculateNetWorth(portfolio)).toBe(135000);
  });

  it('should compute closed deals target values', () => {
    const deals: PipelineDeal[] = [
      { dealName: 'Acme Corp', valuation: 1000000, targetEquity: 10, status: 'closed' },
      { dealName: 'Beta Inc', valuation: 500000, targetEquity: 20, status: 'scouting' },
    ];
    expect(getClosedDealsValue(deals)).toBe(100000); // 10% of 1M
  });
});
