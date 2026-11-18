import { Writable } from 'stream';
import { streamInvoicePdf } from '../src/pdf';

test('streams a PDF invoice directly to a writable destination', async () => {
  const chunks: Buffer[] = [];
  const destination = new Writable({
    write(chunk, _encoding, callback) {
      chunks.push(Buffer.from(chunk));
      callback();
    },
  });

  streamInvoicePdf({
    invoiceNumber: 'INV-2026-0001',
    status: 'DRAFT',
    customerName: 'Acme',
    subtotalPaise: 10000n,
    taxPaise: 1800n,
    totalPaise: 11800n,
  }, destination);

  await new Promise<void>((resolve, reject) => {
    destination.on('finish', resolve);
    destination.on('error', reject);
  });
  expect(Buffer.concat(chunks).subarray(0, 4).toString()).toBe('%PDF');
});
