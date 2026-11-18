import cron from 'node-cron';
import type { Pool } from 'pg';
import { pool } from '../db';
import { sweepOverdueInvoices } from './overdueSweeper';

export function startOverdueWorker(database: Pool = pool): void {
  cron.schedule(process.env.OVERDUE_CRON || '*/5 * * * *', async () => {
    await sweepOverdueInvoices(database);
  });
}
