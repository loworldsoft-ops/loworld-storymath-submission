import { InjectionToken } from '@angular/core';
import type { MemberAuthGateway, MemberAuthNavigator, MemberProfileAuthRepository } from './member-auth.types';

export const MEMBER_AUTH_GATEWAY = new InjectionToken<MemberAuthGateway>('MEMBER_AUTH_GATEWAY');

export const MEMBER_PROFILE_AUTH_REPOSITORY = new InjectionToken<MemberProfileAuthRepository>(
  'MEMBER_PROFILE_AUTH_REPOSITORY'
);

export const MEMBER_AUTH_NAVIGATOR = new InjectionToken<MemberAuthNavigator>('MEMBER_AUTH_NAVIGATOR');