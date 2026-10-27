export type SaveFeedbackKind = 'saving' | 'saved' | 'error' | 'auth_required' | 'info';

export interface SaveFeedbackToast {
  kind: SaveFeedbackKind;
  message: string;
  sourceId?: string;
}

export interface SaveFeedbackPayload {
  kind: SaveFeedbackKind;
  message: string;
  sourceId?: string;
  /** 0 = no auto dismiss */
  durationMs?: number;
}

export interface SaveFeedbackMessages {
  saving: string;
  saved: string;
  error: string;
  authRequired: string;
}

export const DEFAULT_SAVE_FEEDBACK_MESSAGES: SaveFeedbackMessages = {
  saving: '저장 중…',
  saved: '저장되었습니다',
  error: '저장에 실패했습니다',
  authRequired: '로그인이 필요합니다. 진행 데이터가 서버에 저장되지 않습니다.',
};
