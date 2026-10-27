import type { Provider } from '@angular/core';
import { MEMBER_AUTH_GATEWAY, MEMBER_AUTH_NAVIGATOR, MEMBER_PROFILE_AUTH_REPOSITORY } from '../services/auth/member-auth/member-auth.tokens';
import { provideMemberLoginBridge } from '../services/auth/member-auth/provide-member-login-bridge';
import { ShowcaseMemberProfileRepository } from '../firebase/member-profile/showcase-member-profile.repository';
import { ShowcaseMemberNavigator } from '../firebase/auth/showcase-member.navigator';
import { ShowcaseFirebaseAuthGateway } from '../firebase/auth/showcase-firebase-auth.gateway';

/** Firebase Auth + Firestore 기반 멤버 로그인 브릿지 프로바이더 */
export function provideShowcaseMemberLoginBridge(): Provider[] {
  return [
    {
      provide: MEMBER_AUTH_GATEWAY,
      useExisting: ShowcaseFirebaseAuthGateway,
    },
    {
      provide: MEMBER_PROFILE_AUTH_REPOSITORY,
      useExisting: ShowcaseMemberProfileRepository,
    },
    {
      provide: MEMBER_AUTH_NAVIGATOR,
      useExisting: ShowcaseMemberNavigator,
    },
    provideMemberLoginBridge(),
  ];
}
