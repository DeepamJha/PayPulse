import crypto from 'crypto';
import type { PoolClient } from 'pg';

export function verifyRazorpaySignature(
  rawBody: Buffer,
  signature: string | undefined,
  secret: string,
): boolean {
  if (!signature) return false;
  const digest = crypto.createHmac('sha256', secret).update(rawBody).digest();
  const supplied = Buffer.from(signature, 'hex');
  return supplied.length === digest.length && crypto.timingSafeEqual(digest, supplied);
}

export interface RazorpayPaymentEvent {
  event?: string;
  payload?: {
    payment?: {
      entity?: {
        id?: string;
        notes?: Record<string, unknown>;
        invoice_id?: string;
        amount?: number;
      };
    };
  };
}

export async function processRazorpayWebhook(
  client: PoolClient,
  eventId: string,
  eventType: string,
  payload: RazorpayPaymentEvent,
): Promise<'processed' | 'duplicate'> {
  await client.query('BEGIN');
  try {
    const ledger = await client.query(
      `INSERT INTO webhook_events (event_id, event_type, payload)
       VALUES ($1, $2, $3)
       ON CONFLICT (event_id) DO NOTHING
       RETURNING event_id`,
      [eventId, eventType, JSON.stringify(payload)],
    );
    if (ledger.rowCount !== 1) {
      await client.query('COMMIT');
      return 'duplicate';
    }

    const entity = payload.payload?.payment?.entity;
    const invoiceId = entity?.invoice_id ||
      (typeof entity?.notes?.invoiceId === 'string' ? entity.notes.invoiceId : undefined);
    if (invoiceId) {
      const invoice = await client.query(
        `SELECT id, status, total_paise
           FROM invoices
          WHERE id = $1
          FOR UPDATE`,
        [invoiceId],
      );
      if (invoice.rowCount === 1) {
        await client.query(
          `UPDATE invoices
              SET status = 'PAID', paid_at = NOW(), updated_at = NOW()
            WHERE id = $1`,
          [invoiceId],
        );
        await client.query(
          `UPDATE webhook_events
              SET invoice_id = $1
            WHERE event_id = $2`,
          [invoiceId, eventId],
        );
      }
    }
    await client.query('COMMIT');
    return 'processed';
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}
