export type LwModalVariant =
  | 'custom'
  | 'confirm'
  | 'form'
  | 'selection'
  | 'wizard'
  | 'settings';

export type LwModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full' | 'fullscreen';

export type LwModalTone = 'default' | 'danger' | 'warning' | 'primary' | 'info' | 'success';

export type LwModalWindowStyle = 'os-desktop' | 'standard' | 'frameless';

export interface LwModalFormField {
  id: string;
  label: string;
  type: 'text' | 'password' | 'datetime-local' | 'date' | 'time' | 'email' | 'select' | 'textarea' | 'number';
  placeholder?: string;
  value?: string;
  options?: Array<{ label: string; value: string }>;
  required?: boolean;
}

export interface LwModalSelectionItem {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  disabled?: boolean;
}

export interface LwModalWizardStep {
  id: string;
  title: string;
  description?: string;
  completed?: boolean;
}

export interface LwModalSettingsTab {
  id: string;
  label: string;
  icon?: string;
  description?: string;
}
