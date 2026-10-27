import { inject, type Provider } from '@angular/core';
import { LW_ACCOUNT_LOGIN_BRIDGE, type LwAccountLoginBridge } from '../../tokens/member-login-bridge.token';
import { LoworldMemberLoginBridgeAdapter } from './loworld-member-login-bridge.adapter';

export function provideMemberLoginBridge(): Provider {
  return {
    provide: LW_ACCOUNT_LOGIN_BRIDGE,
    useFactory: (): LwAccountLoginBridge => inject(LoworldMemberLoginBridgeAdapter),
  };
}