import type { NextFunction, Request, Response } from 'express';
import { requireDraft, InvoiceConflictError, type InvoiceStatus } from './stateMachine';

export function invoiceMutationGuard(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const status = req.body?.status as InvoiceStatus | undefined;
  if (!status) {
    next();
    return;
  }
  try {
    requireDraft(status);
    next();
  } catch (error) {
    if (error instanceof InvoiceConflictError) {
      res.status(409).json({ error: error.message });
      return;
    }
    next(error);
  }
}
