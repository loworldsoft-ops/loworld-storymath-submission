export interface ProgressChipVm {
  label: string;
  value?: string | number | null;
  icon?: string;
  progressPercent?: number | null;
  tone?: 'default' | 'accent' | 'success' | 'warning' | 'danger' | 'purple' | string;
}
