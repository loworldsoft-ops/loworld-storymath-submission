/** 홈 화면 격자에 놓이는 앱 하나. */
export interface OsAppTile {
  readonly id: string;
  readonly label: string;
  readonly iconSrc: string | null;
  /** 그림이 없을 때 쓰는 아이콘 이름. */
  readonly icon: string;
  /** 지금은 열 수 없다(로그인 필요 등). 누르면 이유를 처리하는 쪽으로 넘어간다. */
  readonly locked: boolean;
  readonly tooltip: string;
}

export interface OsAppPage {
  readonly id: string;
  readonly title: string;
  readonly apps: readonly OsAppTile[];
  /** 앱이 없을 때 보여 줄 안내. 없으면 빈 채로 둔다. */
  readonly empty?: { readonly title: string; readonly hint: string; readonly actionLabel?: string };
}

/** 독에 놓이는 항목 하나. */
export interface OsDockItem {
  readonly id: string;
  readonly label: string;
  readonly iconSrc: string | null;
  readonly icon: string;
  readonly running: boolean;
  readonly active: boolean;
}
