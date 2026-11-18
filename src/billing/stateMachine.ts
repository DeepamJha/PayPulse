export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'VOID';

export class InvoiceConflictError extends Error {
  readonly statusCode = 409;
  constructor(message = 'Invoice mutations are forbidden after it leaves DRAFT') {
    super(message);
    this.name = 'InvoiceConflictError';
  }
}

export function requireDraft(status: InvoiceStatus): void {
  if (status !== 'DRAFT') throw new InvoiceConflictError();
}

export function transitionInvoice(
  status: InvoiceStatus,
  nextStatus: InvoiceStatus,
): InvoiceStatus {
  const allowed: Record<InvoiceStatus, readonly InvoiceStatus[]> = {
    DRAFT: ['SENT', 'VOID'],
    SENT: ['PAID', 'OVERDUE', 'VOID'],
    PAID: [],
    OVERDUE: ['PAID', 'VOID'],
    VOID: [],
  };
  if (!allowed[status].includes(nextStatus)) {
    throw new InvoiceConflictError(`Invalid invoice transition: ${status} -> ${nextStatus}`);
  }
  return nextStatus;
}
