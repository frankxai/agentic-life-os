export interface WealthPortfolio {
  cash: number;
  equities: number;
  realEstate: number;
  sovereignAssets: number;
}

export interface PipelineDeal {
  dealName: string;
  valuation: number;
  targetEquity: number;
  status: 'scouting' | 'due-diligence' | 'negotiation' | 'closed' | 'passed';
}

export function calculateNetWorth(portfolio: WealthPortfolio): number {
  return portfolio.cash + portfolio.equities + portfolio.realEstate + portfolio.sovereignAssets;
}

export function getClosedDealsValue(deals: PipelineDeal[]): number {
  return deals
    .filter((d) => d.status === 'closed')
    .reduce((sum, d) => sum + d.valuation * (d.targetEquity / 100), 0);
}
