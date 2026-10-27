export interface LwActionEvent<T = any, TAction extends string = string> {
  actionId: TAction;    // 액션의 성격 ('CARD_CLICK', 'TOGGLE_MENU', 등)
  payload: T;          // 액션에 수반되는 데이터
  source?: string;     // 이벤트를 발생시킨 UI 요소의 식별자
  timestamp?: number;
}

/**
 * 📜 LwActionContract (LSP: Liskov Substitution Principle)
 * 하위 클래스가 표준 액션 이벤트의 계약을 엄격히 대체할 수 있도록 지원하는 타입 별칭.
 */
export type LwActionContract<TAction extends string = string, TPayload = unknown> = LwActionEvent<TPayload, TAction>;

