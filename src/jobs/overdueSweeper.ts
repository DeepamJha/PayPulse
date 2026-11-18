import type { Pool } from 'pg';

export async function sweepOverdueInvoices(pool: Pool, now = new Date()): Promise<number> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      `SELECT id
         FROM invoices
        WHERE status = 'SENT'
          AND due_at IS NOT NULL
          AND due_at < $1
        FOR UPDATE SKIP LOCKED
        LIMIT 100`,
      [now],
    );
    if (result.rowCount) {
      await client.query(
        `UPDATE invoices
            SET status = 'OVERDUE', updated_at = NOW()
          WHERE id = ANY($1::uuid[])
            AND status = 'SENT'
            AND due_at < $2`,
        [result.rows.map((row) => row.id), now],
      );
    }
    await client.query('COMMIT');
    return result.rowCount ?? 0;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
