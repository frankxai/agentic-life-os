import { describe, expect, it } from 'vitest';
import { BusinessOSManager } from '../src/operations.js';

describe('public Business OS boundary', () => {
  it('returns only a non-executable private-adapter descriptor', () => {
    const manager = new BusinessOSManager();
    const plan = manager.planPrivateLedgerReview('business_0123456789abcdef0123456789abcdef');

    expect(plan).toMatchObject({
      target: 'private-external-business-adapter',
      financialDataIncluded: false,
      executionPermitted: false,
      authorityStatus: 'unverified-public-plan',
    });
    expect(manager.getFinancialRecordsCount()).toBe(0);
  });

  it('rejects client names, invoice identifiers, values, and paths', () => {
    const manager = new BusinessOSManager();
    for (const unsafeValue of ['Client A', 'INV-001', 'EUR 4200', '../ledger', 'C:\\finance', 'business_0123']) {
      expect(() => manager.planPrivateLedgerReview(unsafeValue)).toThrow(/reserved opaque reference syntax/i);
    }
    const coercionObject = {
      secret: 'private invoice values',
      toString: () => 'business_0123456789abcdef0123456789abcdef',
    };
    expect(() => manager.planPrivateLedgerReview(coercionObject as unknown as string)).toThrow(/reserved opaque reference syntax/i);
  });

  it('exposes no mutable invoice or calculation surface', () => {
    const manager = new BusinessOSManager();
    expect('addInvoice' in manager).toBe(false);
    expect('getInvoices' in manager).toBe(false);
    expect('getOutstandingReceivables' in manager).toBe(false);
    expect('getRealizedIncome' in manager).toBe(false);
  });
});
