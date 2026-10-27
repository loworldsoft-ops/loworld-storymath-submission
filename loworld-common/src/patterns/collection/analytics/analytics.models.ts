export interface LwMetricSummary {
  readonly id: string;
  readonly label: string;
  readonly value: string | number;
  /** 증감률(%) */
  readonly changeRate?: number;
  readonly trend?: 'up' | 'down' | 'neutral';
  readonly sparkline?: readonly number[];
  readonly unit?: string;
  readonly status?: 'good' | 'warning' | 'danger';
}
