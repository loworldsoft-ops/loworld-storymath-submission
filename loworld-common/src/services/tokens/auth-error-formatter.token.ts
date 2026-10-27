import { InjectionToken } from '@angular/core';

export interface LwAuthStatusMessage {
  readonly tone: 'neutral' | 'danger' | 'warning' | 'success';
  readonly title: string | null;
  readonly description: string | null;
}

export interface LwAuthErrorFormatter {
  format(error: unknown, context: 'login' | 'signup'): LwAuthStatusMessage;
}

export class DefaultAuthErrorFormatter implements LwAuthErrorFormatter {
  format(error: unknown, _context: 'login' | 'signup'): LwAuthStatusMessage {
    const rawMessage = error instanceof Error ? error.message : String(error ?? '');

    if (rawMessage === 'FIREBASE_AUTH_NOT_ENABLED') {
      return {
        tone: 'warning',
        title: '인증 설정이 아직 완료되지 않았습니다',
        description: 'Firebase Authentication의 Email/Password 로그인이 아직 활성화되지 않았습니다.',
      };
    }

    if (rawMessage === 'FIRESTORE_PERMISSION_DENIED') {
      return {
        tone: 'warning',
        title: '접근 권한이 부족합니다',
        description: 'Firestore 보안 규칙 또는 권한 설정 때문에 멤버 프로필을 읽거나 저장하지 못했습니다.',
      };
    }

    if (rawMessage === 'MEMBER_APP_UNAVAILABLE') {
      return {
        tone: 'warning',
        title: '멤버 서비스에 연결할 수 없습니다',
        description: 'Loworld Member 앱에 연결할 수 없습니다. 서비스가 실행 중인지 확인하세요.',
      };
    }

    if (rawMessage === 'DUPLICATE_MEMBER') {
      return {
        tone: 'warning',
        title: '이미 등록된 계정입니다',
        description: '이미 같은 아이디 또는 이메일의 멤버가 존재합니다.',
      };
    }

    if (
      rawMessage.includes('아이디/이메일') ||
      rawMessage.includes('비밀번호') ||
      rawMessage.includes('auth/invalid-credential') ||
      rawMessage.includes('auth/wrong-password') ||
      rawMessage.includes('auth/user-not-found') ||
      rawMessage === 'INVALID_CREDENTIALS'
    ) {
      return {
        tone: 'danger',
        title: '로그인에 실패했습니다',
        description: '아이디 또는 이메일, 비밀번호를 다시 확인하세요.',
      };
    }

    if (rawMessage.includes('이미') || rawMessage.includes('email-already-in-use')) {
      return {
        tone: 'warning',
        title: '이미 등록된 계정입니다',
        description: '해당 아이디 또는 이메일을 가진 멤버가 이미 존재합니다.',
      };
    }

    if (rawMessage) {
      return {
        tone: 'warning',
        title: '작업을 완료하지 못했습니다',
        description: rawMessage,
      };
    }

    return {
      tone: 'danger',
      title: '인증 처리에 실패했습니다',
      description: '요청을 처리하는 중 예기치 않은 오류가 발생했습니다. 잠시 후 다시 시도하세요.',
    };
  }
}

export const AUTH_ERROR_FORMATTER = new InjectionToken<LwAuthErrorFormatter>('AUTH_ERROR_FORMATTER', {
  providedIn: 'root',
  factory: () => new DefaultAuthErrorFormatter(),
});
