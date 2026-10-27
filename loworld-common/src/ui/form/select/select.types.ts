export type LwSelectSize = 'sm' | 'md' | 'lg';
export type LwSelectVariant = 'default' | 'filled' | 'outline';

export interface LwSelectOption<T = any> {
  value: T;
  label: string;
  disabled?: boolean;
}
