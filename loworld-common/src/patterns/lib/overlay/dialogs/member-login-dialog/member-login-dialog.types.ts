import type { AuthShellMode } from '../../../../../services/models/auth.model';
import type { LwModalWindowStyle } from '../../../../../ui/overlay/modal/modal.types';

export type LwAccountLoginDialogThemeMode = 'light' | 'dark';

export type LwAccountLoginDialogData =
  | {
      view: 'auth';
      initialMode?: AuthShellMode;
      mainActionLabel?: string;
      /** 회원가입 탭을 보일지 (기본 true). 가입을 받지 않는 앱은 false로 둔다. */
      allowSignup?: boolean;
      themeMode?: LwAccountLoginDialogThemeMode;
      windowControls?: boolean;
      windowStyle?: LwModalWindowStyle;
      draggable?: boolean;
      showHeader?: boolean;
    }
  | {
      view: 'summary';
      mainActionLabel?: string;
      /** 회원가입 탭을 보일지 (기본 true). 가입을 받지 않는 앱은 false로 둔다. */
      allowSignup?: boolean;
      themeMode?: LwAccountLoginDialogThemeMode;
      windowControls?: boolean;
      windowStyle?: LwModalWindowStyle;
      draggable?: boolean;
      showHeader?: boolean;
    };
