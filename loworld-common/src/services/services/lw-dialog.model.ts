export type LwDialogTone = 'default' | 'danger' | 'warning';

export interface LwConfirmDialogOptions {
  title: string;
  message: string;
  detail?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: LwDialogTone;
}

export interface LwAlertDialogOptions {
  title: string;
  message: string;
  detail?: string;
  confirmLabel?: string;
  tone?: LwDialogTone;
}

export type LwDialogKind = 'confirm' | 'alert';

export interface LwDialogState {
  id: string;
  kind: LwDialogKind;
  title: string;
  message: string;
  detail?: string;
  confirmLabel: string;
  cancelLabel?: string;
  tone: LwDialogTone;
}
