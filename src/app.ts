import express, { type Request, type Response } from 'express';
import { randomUUID } from 'crypto';
import type { Pool } from 'pg';
import { pool as defaultPool } from './db';
import { verifyRazorpaySignature, processRazorpayWebhook } from './webhooks/razorpay';
import { streamInvoicePdf, type PdfInvoice } from './pdf/generateInvoicePdf';

export function createApp(database: Pool = defaultPool) {
  const app = express();

  app.post(
    '/webhooks/razorpay',
    express.raw({ type: 'application/json', limit: '1mb' }),
    async (req: Request, res: Response): Promise<void> => {
      const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
      if (!secret) {
        res.status(500).json({ error: 'Webhook secret is not configured' });
        return;
      }
      const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from('');
      if (!verifyRazorpaySignature(
        rawBody,
        req.header('x-razorpay-signature'),
        secret,
      )) {
        res.status(400).json({ error: 'Invalid Razorpay signature' });
        return;
      }

      let event: any;
      try {
        event = JSON.parse(rawBody.toString('utf8'));
      } catch {
        res.status(400).json({ error: 'Invalid JSON payload' });
        return;
      }
      const eventId = event?.id ||
        req.header('x-razorpay-event-id') ||
        randomUUID();
      const client = await database.connect();
      try {
        await processRazorpayWebhook(client, eventId, event?.event || 'unknown', event);
        res.status(200).json({ received: true });
      } catch {
        res.status(500).json({ error: 'Webhook processing failed' });
      } finally {
        client.release();
      }
    },
  );

  app.use(express.json());

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));

  app.get('/invoices/:id/pdf', (req, res) => {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${String(req.params.id)}.pdf"`,
    );
    const invoice: PdfInvoice = {
      invoiceNumber: String(req.params.id),
      status: 'DRAFT',
      customerName: 'Customer',
      subtotalPaise: 0n,
      taxPaise: 0n,
      totalPaise: 0n,
    };
    streamInvoicePdf(invoice, res);
  });

  return app;
}
