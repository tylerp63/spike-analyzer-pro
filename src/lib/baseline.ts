export type BaselineRange = [number, number];
export type Baselines = Record<string, BaselineRange>;
export type BaselineStatus = 'within' | 'close' | 'needs work';

export function getBaselineStatus(value: number, range: BaselineRange): BaselineStatus {
  const [min, max] = range;
  if (value >= min && value <= max) return 'within';
  const margin = (max - min) * 0.1; // allow 10% margin
  if (value >= min - margin && value <= max + margin) return 'close';
  return 'needs work';
}

export function evaluateMetrics(
  metrics: Record<string, number | undefined>,
  baseline: Baselines
): Record<string, BaselineStatus> {
  const result: Record<string, BaselineStatus> = {};
  for (const [key, range] of Object.entries(baseline)) {
    const value = metrics[key];
    if (typeof value === 'number') {
      result[key] = getBaselineStatus(value, range);
    }
  }
  return result;
}
