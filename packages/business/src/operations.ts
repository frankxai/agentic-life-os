export interface BusinessEntity {
  name: string;
  kvkNumber: string; // Dutch chamber of commerce ID
  vatNumber: string;
  jurisdiction: 'NL' | 'EU' | 'US' | 'Global';
  taxReservesRatio: number; // e.g. 0.25 (25% held back for corp/vat tax)
}

export interface Invoice {
  id: string;
  clientName: string;
  amount: number; // net amount in EUR
  vatRate: number; // e.g. 0.21 for 21%
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  issueDate: string;
  dueDate: string;
}

export interface BVComplianceCheck {
  kvkActive: boolean;
  quarterlyVatSubmitted: boolean;
  minimumTaxReserveMet: boolean;
  corporateTaxReserveEUR: number;
}

export class BusinessOSManager {
  private entity: BusinessEntity;
  private invoices: Invoice[] = [];

  constructor(entity: BusinessEntity) {
    this.entity = entity;
  }

  addInvoice(invoice: Invoice): void {
    this.invoices.push(invoice);
  }

  getInvoices(): Invoice[] {
    return [...this.invoices];
  }

  /**
   * Calculates total outstanding receivables (sent but unpaid/overdue)
   */
  getOutstandingReceivables(): number {
    return this.invoices
      .filter((inv) => inv.status === 'sent' || inv.status === 'overdue')
      .reduce((sum, inv) => sum + inv.amount, 0);
  }

  /**
   * Calculates total realized (paid) income
   */
  getRealizedIncome(): number {
    return this.invoices
      .filter((inv) => inv.status === 'paid')
      .reduce((sum, inv) => sum + inv.amount, 0);
  }

  /**
   * Run compliance health checks for Dutch BV
   */
  runComplianceAudit(cashBalanceEUR: number): BVComplianceCheck {
    const totalRevenue = this.getRealizedIncome();
    const expectedTaxReserve = totalRevenue * this.entity.taxReservesRatio;
    
    return {
      kvkActive: this.entity.kvkNumber.length > 0,
      quarterlyVatSubmitted: true, // Mocked status for gateway
      minimumTaxReserveMet: cashBalanceEUR >= expectedTaxReserve,
      corporateTaxReserveEUR: expectedTaxReserve,
    };
  }
}
