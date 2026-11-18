import {
  formatMinorUnits,
  invoiceNumber,
  requireDraft,
  taxFromBasisPoints,
  transitionInvoice,
  InvoiceConflictError,
} from '../src/billing';

describe('integer minor-unit billing', () => {
  test('performs basis-point tax with half-up integer rounding', () => {
    expect(taxFromBasisPoints(101n, 1800)).toBe(18n);
    expect(taxFromBasisPoints(100n, 1800)).toBe(18n);
    expect(taxFromBasisPoints(1n, 5000)).toBe(1n);
  });

  test('formats paise without floating point arithmetic', () => {
    expect(formatMinorUnits(123456n)).toBe('1234.56');
  });

  test('formats gapless invoice numbers', () => {
    expect(invoiceNumber(2026, 1n)).toBe('INV-2026-0001');
  });

  test('blocks mutations outside DRAFT', () => {
    expect(() => requireDraft('PAID')).toThrow(InvoiceConflictError);
  });

  test('allows only valid state transitions', () => {
    expect(transitionInvoice('DRAFT', 'SENT')).toBe('SENT');
    expect(transitionInvoice('SENT', 'PAID')).toBe('PAID');
    expect(() => transitionInvoice('PAID', 'VOID')).toThrow(InvoiceConflictError);
  });
});
