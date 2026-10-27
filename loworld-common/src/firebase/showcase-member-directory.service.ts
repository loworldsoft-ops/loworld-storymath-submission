import { DestroyRef, Injectable, computed, effect, inject, signal, type Signal } from '@angular/core';
import { LW_ACCOUNT_LOGIN_BRIDGE } from '../services/tokens/member-login-bridge.token';
import type { LwMember, UpdateLwMemberDto } from '../services/models/member.model';
import type { MemberDirectoryPort, CreateDirectoryMemberDto } from '../services/ports/member-directory.port';
import { ShowcaseFirebaseAuthGateway } from './auth/showcase-firebase-auth.gateway';
import { MemberRolePolicy } from './member-directory/member-role.policy';
import { MemberDirectoryUiState } from './member-directory/member-directory-ui.state';
import { ShowcaseMemberDirectoryRepository, type ShowcaseDirectoryMember } from './member-directory/showcase-member-directory.repository';

@Injectable({ providedIn: 'root' })
export class ShowcaseMemberDirectoryService implements MemberDirectoryPort {
  private readonly destroyRef = inject(DestroyRef);
  private readonly authGateway = inject(ShowcaseFirebaseAuthGateway);
  private readonly repository = inject(ShowcaseMemberDirectoryRepository);
  private readonly rolePolicy = inject(MemberRolePolicy);
  private readonly uiState = inject(MemberDirectoryUiState);
  private readonly loginBridge = inject(LW_ACCOUNT_LOGIN_BRIDGE);

  private readonly _members = signal<ShowcaseDirectoryMember[]>([]);
  private readonly _loading = signal(true);
  private readonly _error = signal<string | null>(null);
  private readonly _currentUid = signal<string | null>(null);

  readonly members: Signal<LwMember[]> = this._members.asReadonly() as Signal<LwMember[]>;
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly selectedId = this.uiState.selectedId;
  readonly actionError = this.uiState.actionError;
  readonly currentUid = this._currentUid.asReadonly();
  readonly currentMember = computed((): LwMember | null => {
    const uid = this._currentUid();
    if (!uid) {
      return null;
    }
    const found = this._members().find(member => member.id === uid);
    if (found) {
      return found;
    }

    // Fallback if the members collection query failed (due to Firestore security rules)
    const account = this.loginBridge.accountView();
    if (account && account.userId === uid) {
      const fallbackMember: LwMember = {
        id: account.userId,
        loginId: account.email ? account.email.split('@')[0] : 'user',
        displayName: account.displayName ?? 'Workspace User',
        email: account.email,
        phone: undefined,
        role: account.role ?? 'VIEWER',
        status: 'active' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return fallbackMember;
    }

    return null;
  });
  readonly hasOwner = computed(() => this._members().some(member => member.role === 'OWNER'));
  readonly canBootstrapOwner = computed(() => !!this._currentUid() && !this.hasOwner());
  readonly canMutate = computed(() => {
    const role = this.currentMember()?.role;
    return role === 'OWNER' || role === 'ADMIN' || this.canBootstrapOwner();
  });

  private loginIndexSynced = false;

  /**
   * 관리자가 로그인하면 한 번, 모든 회원의 로그인 아이디 색인을 맞춘다.
   * 색인이 생기기 전에 등록된 회원도 아이디로 로그인할 수 있게 하려는 것이다. 관리자만 남의 색인을 쓸 수 있다.
   */
  private syncLoginIndexOnce(members: readonly ShowcaseDirectoryMember[]): void {
    if (this.loginIndexSynced) return;
    const role = members.find((member) => member.id === this._currentUid())?.role;
    if (role !== 'OWNER' && role !== 'ADMIN') return;
    this.loginIndexSynced = true;
    void this.repository.syncLoginIndex(members);
  }

  constructor() {
    // 회원 디렉터리는 로그인해야 읽을 수 있다(보안 규칙). 로그인이 바뀔 때마다 다시 붙는다.
    let unsubscribeMembers: () => void = () => {};
    const unsubscribeAuth = this.authGateway.onAuthStateChanged((user) => {
      this._currentUid.set(user?.uid ?? null);
      unsubscribeMembers();
      unsubscribeMembers = () => {};
      this.loginIndexSynced = false;
      if (!user) {
        this._members.set([]);
        this._loading.set(false);
        return;
      }
      unsubscribeMembers = this.repository.subscribeMembers(
        (next) => {
          this._members.set(next);
          this._loading.set(false);
          this._error.set(null);
          this.syncLoginIndexOnce(next);

          const selectedId = this.uiState.selectedId();
          if (!selectedId || !next.some(member => member.id === selectedId)) {
            this.uiState.selectMember(next[0]?.id ?? null);
          }
        },
        (error) => {
          const message = error instanceof Error ? error.message : String(error);
          const errorCode = typeof error === 'object' && error && 'code' in error
            ? (error as { code?: unknown }).code
            : undefined;
          this._loading.set(false);
          this._error.set(message || 'MEMBER_DIRECTORY_LOAD_FAILED');
          console.error('[ShowcaseMemberDirectory] subscribe:error', {
            message,
            code: errorCode,
            error,
          });
        },
      );
    });

    this.destroyRef.onDestroy(() => {
      unsubscribeAuth();
      unsubscribeMembers();
    });

    effect(() => {
      const members = this._members();
      const selectedId = this.uiState.selectedId();
      if (!selectedId && members.length > 0) {
        this.uiState.selectMember(members[0]!.id);
      }
    });
  }

  selectMember(id: string): void {
    this.uiState.selectMember(id);
  }

  async updateMember(dto: UpdateLwMemberDto): Promise<void> {
    const actorUid = this._currentUid();
    const actor = this.currentMember();
    const target = this._members().find(member => member.id === dto.id) ?? null;

    const authorization = this.rolePolicy.authorizeUpdate({
      actorUid,
      actor,
      target,
      nextRole: dto.role,
      hasOwner: this.hasOwner(),
    });

    if (!authorization.allowed) {
      this.uiState.setActionError(authorization.message ?? '현재 요청을 처리할 수 없습니다.');
      console.warn('[ShowcaseMemberDirectory] updateMember:blocked', {
        reason: authorization.reason,
        actorUid,
        actorRole: actor?.role ?? null,
        targetId: target?.id ?? null,
        targetRole: target?.role ?? null,
        nextRole: dto.role,
        bootstrappingOwner: authorization.bootstrappingOwner,
      });
      return;
    }

    this.uiState.setActionError(null);

    try {
      await this.repository.updateMember(dto);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.uiState.setActionError(`멤버 업데이트 실패: ${message}`);
    }
  }

  async createMember(dto: CreateDirectoryMemberDto): Promise<string> {
    try {
      const uid = await this.repository.createMember({
        ...dto,
        loginId: dto.loginId || dto.displayName.toLowerCase().replace(/\s+/g, ''),
      });
      return uid;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.uiState.setActionError(`멤버 등록 실패: ${message}`);
      throw error;
    }
  }
}