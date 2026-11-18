export type MinorUnits = bigint;

export function parseMinorUnits(value: string | number | bigint): MinorUnits {
  if (typeof value === 'number') {
    if (!Number.isSafeInteger(value)) {
      throw new RangeError('Monetary values must be safe integers in minor units');
    }
    return BigInt(value);
  }
  if (typeof value === 'bigint') return value;
  if (!/^-?(?:0|[1-9]\d*)$/.test(value)) {
    throw new TypeError('Minor units must be an integer string');
  }
  return BigInt(value);
}

export function assertNonNegative(value: MinorUnits): MinorUnits {
  if (value < 0n) throw new RangeError('Monetary amount cannot be negative');
  return value;
}

export function taxFromBasisPoints(basePaise: MinorUnits, taxBps: bigint | number): MinorUnits {
  const base = assertNonNegative(parseMinorUnits(basePaise));
  const bps = typeof taxBps === 'number' ? parseMinorUnits(taxBps) : taxBps;
  if (bps < 0n) throw new RangeError('Tax basis points cannot be negative');
  // Half-up: add floor(10000 / 2) before integer division.
  return (base * bps + 5000n) / 10000n;
}

export function formatMinorUnits(value: MinorUnits): string {
  const minor = parseMinorUnits(value);
  const negative = minor < 0n;
  const abs = negative ? -minor : minor;
  return `${negative ? '-' : ''}${abs / 100n}.${(abs % 100n).toString().padStart(2, '0')}`;
}
