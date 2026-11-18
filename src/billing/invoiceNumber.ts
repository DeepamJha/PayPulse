import type { Pool, PoolClient } from 'pg';

export function invoiceNumber(year: number, sequence: bigint): string {
  if (!Number.isInteger(year) || year < 1000 || year > 9999) {
    throw new RangeError('Year must contain four digits');
  }
  if (sequence < 1n) throw new RangeError('Invoice sequence must start at 1');
  if (sequence > 9999n) throw new RangeError('Invoice sequence exceeds four digits');
  return `INV-${year}-${sequence.toString().padStart(4, '0')}`;
}

export async function allocateInvoiceNumber(
  client: PoolClient,
  tenantId: string,
  now = new Date(),
): Promise<string> {
  const year = now.getUTCFullYear();
  const counter = await client.query(
    `INSERT INTO invoice_sequence_counters (tenant_id, year, last_number)
     VALUES ($1, $2, 0)
     ON CONFLICT (tenant_id) DO UPDATE
       SET updated_at = NOW()
     RETURNING year, last_number`,
    [tenantId, year],
  );

  const locked = await client.query(
    `SELECT year, last_number
       FROM invoice_sequence_counters
      WHERE tenant_id = $1
      FOR UPDATE`,
    [tenantId],
  );
  if (locked.rowCount !== 1) throw new Error('Invoice sequence counter not found');

  const currentYear = Number(locked.rows[0].year);
  let sequence: bigint;
  if (currentYear === year) {
    sequence = BigInt(locked.rows[0].last_number) + 1n;
  } else {
    sequence = 1n;
  }

  await client.query(
    `UPDATE invoice_sequence_counters
        SET year = $2, last_number = $3, updated_at = NOW()
      WHERE tenant_id = $1`,
    [tenantId, year, sequence.toString()],
  );
  return invoiceNumber(year, sequence);
}
