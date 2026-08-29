export interface PrivateBusinessReviewPlan {
  operation: 'review-private-business-ledger';
  opaqueLedgerRef: string;
  target: 'private-external-business-adapter';
  financialDataIncluded: false;
  executionPermitted: false;
  authorityStatus: 'unverified-public-plan';
  requiredControls: readonly [
    'private-adapter-issued-reference',
    'private-encrypted-financial-store',
    'purpose-limitation',
    'human-authorization',
    'audit-receipt',
    'accounting-and-legal-review',
  ];
}

const OPAQUE_LEDGER_REF = /^business_[a-f0-9]{32}$/;
const BUSINESS_REQUIRED_CONTROLS = Object.freeze([
  'private-adapter-issued-reference',
  'private-encrypted-financial-store',
  'purpose-limitation',
  'human-authorization',
  'audit-receipt',
  'accounting-and-legal-review',
] as const);

/** Public descriptor-only boundary; it stores no entities, clients, invoices, or amounts. */
export class BusinessOSManager {
  planPrivateLedgerReview(opaqueLedgerRef: string): PrivateBusinessReviewPlan {
    if (typeof opaqueLedgerRef !== 'string' || !OPAQUE_LEDGER_REF.test(opaqueLedgerRef)) {
      throw new Error('Business ledger reference must use the reserved opaque reference syntax.');
    }

    return Object.freeze({
      operation: 'review-private-business-ledger',
      opaqueLedgerRef,
      target: 'private-external-business-adapter',
      financialDataIncluded: false,
      executionPermitted: false,
      authorityStatus: 'unverified-public-plan',
      requiredControls: BUSINESS_REQUIRED_CONTROLS,
    });
  }

  getFinancialRecordsCount(): 0 {
    return 0;
  }
}
