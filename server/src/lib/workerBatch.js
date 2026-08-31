export function normalizeWorkerBatchSize(value) {
  if (value == null || value === '') return 100;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) return 100;
  return Math.min(parsed, 500);
}
