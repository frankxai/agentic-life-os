export interface PrivateWealthReviewPlan {
  operation: 'review-private-wealth-portfolio';
  opaquePortfolioRef: string;
  target: 'private-external-wealth-adapter';
  financialDataIncluded: false;
  executionPermitted: false;
  authorityStatus: 'unverified-public-plan';
  adviceProvided: false;
  requiredControls: readonly [
    'private-adapter-issued-reference',
    'private-encrypted-financial-store',
    'purpose-limitation',
    'human-authorization',
    'audit-receipt',
    'regulated-professional-review-when-required',
  ];
}

const OPAQUE_PORTFOLIO_REF = /^wealth_[a-f0-9]{32}$/;
const WEALTH_REQUIRED_CONTROLS = Object.freeze([
  'private-adapter-issued-reference',
  'private-encrypted-financial-store',
  'purpose-limitation',
  'human-authorization',
  'audit-receipt',
  'regulated-professional-review-when-required',
] as const);

/** Public descriptor-only boundary; it performs no valuation or financial advice. */
export class InvestorOSManager {
  planPrivatePortfolioReview(opaquePortfolioRef: string): PrivateWealthReviewPlan {
    if (typeof opaquePortfolioRef !== 'string' || !OPAQUE_PORTFOLIO_REF.test(opaquePortfolioRef)) {
      throw new Error('Wealth portfolio reference must use the reserved opaque reference syntax.');
    }

    return Object.freeze({
      operation: 'review-private-wealth-portfolio',
      opaquePortfolioRef,
      target: 'private-external-wealth-adapter',
      financialDataIncluded: false,
      executionPermitted: false,
      authorityStatus: 'unverified-public-plan',
      adviceProvided: false,
      requiredControls: WEALTH_REQUIRED_CONTROLS,
    });
  }
}
