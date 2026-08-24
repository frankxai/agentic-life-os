import { describe, it, expect } from 'vitest';
import { BusinessOSManager, type BusinessEntity } from '../src/operations.js';

describe('Business OS Operations', () => {
  const mockEntity: BusinessEntity = {
    name: 'Example Cooperative',
    kvkNumber: '00000000',
    vatNumber: 'NL000000000B00',
    jurisdiction: 'NL',
    taxReservesRatio: 0.20,
  };

  it('should calculate realized income and outstanding receivables correctly', () => {
    const manager = new BusinessOSManager(mockEntity);
    
    manager.addInvoice({
      id: 'INV-001',
      clientName: 'Client 1',
      amount: 2000,
      vatRate: 0.21,
      status: 'paid',
      issueDate: '2026-06-01',
      dueDate: '2026-06-15',
    });

    manager.addInvoice({
      id: 'INV-002',
      clientName: 'Client 2',
      amount: 3000,
      vatRate: 0.21,
      status: 'sent',
      issueDate: '2026-06-02',
      dueDate: '2026-06-16',
    });

    expect(manager.getRealizedIncome()).toBe(2000);
    expect(manager.getOutstandingReceivables()).toBe(3000);
  });

  it('should run a compliance audit to verify tax reserves are met', () => {
    const manager = new BusinessOSManager(mockEntity);
    
    manager.addInvoice({
      id: 'INV-001',
      clientName: 'Client 1',
      amount: 10000,
      vatRate: 0.21,
      status: 'paid',
      issueDate: '2026-06-01',
      dueDate: '2026-06-15',
    });

    // 10000 realized * 0.20 ratio = 2000 corporate tax reserve required.
    const auditPass = manager.runComplianceAudit(2500);
    expect(auditPass.kvkActive).toBe(true);
    expect(auditPass.minimumTaxReserveMet).toBe(true);
    expect(auditPass.corporateTaxReserveEUR).toBe(2000);

    const auditFail = manager.runComplianceAudit(1500);
    expect(auditFail.minimumTaxReserveMet).toBe(false);
  });
});
