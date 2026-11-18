import PDFDocument from 'pdfkit';
import type { Writable } from 'stream';
import type { InvoiceStatus } from '../billing/stateMachine';

export interface PdfInvoice {
  invoiceNumber: string;
  status: InvoiceStatus;
  customerName: string;
  subtotalPaise: bigint;
  taxPaise: bigint;
  totalPaise: bigint;
  dueAt?: Date;
}

export function formatPaise(paise: bigint): string {
  const abs = paise < 0n ? -paise : paise;
  return `${paise < 0n ? '-' : ''}${abs / 100n}.${(abs % 100n).toString().padStart(2, '0')}`;
}

export function streamInvoicePdf(invoice: PdfInvoice, destination: Writable): void {
  const pdf = new PDFDocument({ size: 'A4', margin: 50 });
  pdf.pipe(destination);
  pdf.fontSize(24).text('PayPulse Invoice', { align: 'left'});
  pdf.moveDown();
  pdf.fontSize(12)
    .text(`Invoice: ${invoice.invoiceNumber}`)
    .text(`Status: ${invoice.status}`)
    .text(`Bill to: ${invoice.customerName}`);
  if (invoice.dueAt) pdf.text(`Due: ${invoice.dueAt.toISOString()}`);
  pdf.moveDown();
  pdf.text(`Subtotal: INR ${formatPaise(invoice.subtotalPaise)}`)
    .text(`Tax: INR ${formatPaise(invoice.taxPaise)}`)
    .moveDown()
    .fontSize(14)
    .text(`Total: INR ${formatPaise(invoice.totalPaise)}`);
  pdf.end();
}
