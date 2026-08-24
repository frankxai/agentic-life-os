import { describe, expect, it } from 'vitest';
import { InvestorOSManager } from '../src/wealth.js';

describe('public Investor OS boundary', () => {
  it('returns a non-executable descriptor without financial values or advice', () => {
    const manager = new InvestorOSManager();
    const plan = manager.planPrivatePortfolioReview('wealth_0123456789abcdef0123456789abcdef');

    expect(plan).toMatchObject({
      target: 'private-external-wealth-adapter',
      financialDataIncluded: false,
      executionPermitted: false,
      authorityStatus: 'unverified-public-plan',
      adviceProvided: false,
    });
    expect(JSON.stringify(plan)).not.toMatch(/valuation|cash|equity|realEstate|deal/i);
  });

  it('rejects portfolio values, deal names, and paths', () => {
    const manager = new InvestorOSManager();
    for (const unsafeValue of ['EUR 135000', 'Acme Corp', '../portfolio', 'C:\\wealth', 'wealth_0123']) {
      expect(() => manager.planPrivatePortfolioReview(unsafeValue)).toThrow(/reserved opaque reference syntax/i);
    }
    const coercionObject = {
      secret: 'private holdings',
      toString: () => 'wealth_0123456789abcdef0123456789abcdef',
    };
    expect(() => manager.planPrivatePortfolioReview(coercionObject as unknown as string)).toThrow(/reserved opaque reference syntax/i);
  });

  it('exposes no valuation or deal-calculation helpers', () => {
    const manager = new InvestorOSManager();
    expect('calculateNetWorth' in manager).toBe(false);
    expect('getClosedDealsValue' in manager).toBe(false);
  });
});
