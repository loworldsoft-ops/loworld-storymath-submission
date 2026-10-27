import { injectTheme } from '../../../../../services/theme/lw-theme.util';
import { LwButtonComponent } from '../../../../../ui/form/button/button.component';
import { LwInputComponent } from '../../../../../ui/form/input/input.component';
import { LwSelectComponent } from '../../../../../ui/form/select/select.component';
import { LwCardComponent } from '../../../../../ui/data-display/card/card.component';
import { SlicePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import type { CreateLwMemberDto, LwMember, LwMemberRole, UpdateLwMemberDto } from '../../../../../services/models/member.model';
import { LW_MEMBER_ROLES, LW_MEMBER_ROLE_LABELS } from '../../../../../services/models/member.model';
import { LwUiFeedbackService } from '../../../../../services/services/lw-ui-feedback.service';
import { LwListActionId } from '../../../../../ui/list/list-action.ids';
import type { LwListSelectPayload } from '../../../../../ui/list/list-action.ids';
import { LwSelectableListComponent } from '../../../../../ui/list/selectable-list/selectable-list.component';
import type { LwActionEvent } from '../../../../../services/models/action-event.model';
import { LwAccountRowComponent } from '../../../../collection/items/member-list-item/member-list-item.component';
import { LwAccountRoleBadgeComponent } from '../../../../../ui/data-display/badge/member-role-badge.component';
import { LwModalComponent } from '../../../../../ui/overlay/modal/modal.component';
import { type LwModalFormField } from '../../../../../ui/overlay/modal/modal.types';

/**
 * 멤버 디렉터리 및 계정 관리를 위한 디렉터리 셸 컴포넌트입니다.
 */
@Component({
  selector: 'lw-directory-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-lw-product]': "'account'",
    '[attr.data-lw-theme]': 'resolvedTheme()',
  },
  imports: [SlicePipe,
    LwSelectableListComponent,
    LwAccountRowComponent,
    LwAccountRoleBadgeComponent,
    LwModalComponent, LwButtonComponent, LwInputComponent, LwSelectComponent, LwCardComponent],
  templateUrl: './directory-shell.component.html',
  styleUrl: './directory-shell.component.scss',
})
export class LwDirectoryShellComponent {
  // 셸의 기반 클래스에서 상속받던 것 가운데 쓰는 것만 직접 갖는다.
  private readonly themeContext = injectTheme();
  readonly resolvedTheme = this.themeContext.resolvedTheme;
  readonly isDark = this.themeContext.isDark;

  private readonly ui = inject(LwUiFeedbackService);

  protected readonly roles = LW_MEMBER_ROLES;
  protected readonly roleLabels = LW_MEMBER_ROLE_LABELS;


  readonly members = input.required<LwMember[]>();
  readonly selectedMemberId = input<string | null>(null);
  readonly searchQuery = input('');
  readonly roleFilter = input<'all' | LwMemberRole>('all');
  readonly isMobile = input(false);
  readonly canCreate = input(false);
  readonly canUpdate = input(false);
  readonly canDelete = input(false);
  readonly title = input('멤버 관리');

  readonly searchQueryChange = output<string>();
  readonly roleFilterChange = output<'all' | LwMemberRole>();
  readonly selectMember = output<string>();
  readonly createMember = output<CreateLwMemberDto>();
  readonly updateMember = output<UpdateLwMemberDto>();
  readonly deleteMember = output<string>();

  readonly showCreate = signal(false);
  readonly showEdit = signal(false);
  readonly mobileDetailOpen = signal(false);
  readonly editingMember = signal<LwMember | null>(null);
  readonly filteredMembers = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const rf = this.roleFilter();
    return this.members().filter(m => {
      if (rf !== 'all' && m.role !== rf) return false;
      if (!q) return true;
      const hay = `${m.loginId ?? ''} ${m.displayName} ${m.email ?? ''} ${m.phone ?? ''}`.toLowerCase();
      return hay.includes(q);
    });
  });

  readonly selectedMember = computed(() => {
    const id = this.selectedMemberId();
    if (!id) return null;
    return this.members().find(m => m.id === id) ?? null;
  });

  protected readonly trackMember = (m: LwMember) => m.id;

  onSelectMember(id: string): void {
    this.selectMember.emit(id);
    if (this.isMobile()) {
      this.mobileDetailOpen.set(true);
    }
  }

  closeMobileDetail(): void {
    this.mobileDetailOpen.set(false);
  }

  onMemberListAction(event: LwActionEvent<LwListSelectPayload>): void {
    if (event.actionId === LwListActionId.ITEM_SELECT) {
      this.onSelectMember(event.payload.id);
    }
  }

  onSearch(ev: Event): void {
    const el = ev.target as HTMLInputElement;
    this.searchQueryChange.emit(el.value);
  }

  onRoleFilter(ev: Event): void {
    const v = (ev.target as HTMLSelectElement).value;
    if (v === 'all') {
      this.roleFilterChange.emit('all');
      return;
    }
    this.roleFilterChange.emit(v as LwMemberRole);
  }

  openCreate(): void {
    this.showCreate.set(true);
  }

  openEdit(m: LwMember): void {
    this.editingMember.set(m);
    this.showEdit.set(true);
  }

  closeEdit(): void {
    this.showEdit.set(false);
    this.editingMember.set(null);
  }

  async openDelete(m: LwMember): Promise<void> {
    const ok = await this.ui.confirm({
      title: '멤버 삭제',
      message: `${m.displayName} 님을 목록에서 삭제할까요?`,
      detail: '이 작업은 되돌릴 수 없습니다.',
      confirmLabel: '삭제',
      tone: 'danger',
    });
    if (ok) {
      this.deleteMember.emit(m.id);
    }
  }

  protected readonly createFields: LwModalFormField[] = [
    { id: 'displayName', label: '이름', type: 'text', required: true },
    { id: 'loginId', label: '로그인 ID', type: 'text' },
    { id: 'email', label: '이메일', type: 'email' },
    { id: 'phone', label: '전화번호', type: 'text' },
    {
      id: 'role',
      label: '권한',
      type: 'select',
      value: 'VIEWER',
      options: LW_MEMBER_ROLES.map(r => ({ label: LW_MEMBER_ROLE_LABELS[r], value: r })),
    },
  ];

  protected readonly editFields = computed<LwModalFormField[]>(() => {
    const m = this.editingMember();
    if (!m) return [];
    return [
      { id: 'displayName', label: '이름', type: 'text', value: m.displayName, required: true },
      { id: 'loginId', label: '로그인 ID', type: 'text', value: m.loginId ?? '' },
      { id: 'email', label: '이메일', type: 'email', value: m.email ?? '' },
      { id: 'phone', label: '전화번호', type: 'text', value: m.phone ?? '' },
      {
        id: 'role',
        label: '권한',
        type: 'select',
        value: m.role,
        options: LW_MEMBER_ROLES.map(r => ({ label: LW_MEMBER_ROLE_LABELS[r], value: r })),
      },
    ];
  });

  onSaveCreate(formValues: Record<string, any>): void {
    const dto: CreateLwMemberDto = {
      displayName: formValues['displayName'] || '',
      loginId: formValues['loginId'] || undefined,
      email: formValues['email'] || undefined,
      phone: formValues['phone'] || undefined,
      role: (formValues['role'] as LwMemberRole) || 'VIEWER',
    };
    this.createMember.emit(dto);
    this.showCreate.set(false);
  }

  onSaveEdit(formValues: Record<string, any>): void {
    const m = this.editingMember();
    if (!m) return;
    const dto: UpdateLwMemberDto = {
      id: m.id,
      displayName: formValues['displayName'] || m.displayName,
      loginId: formValues['loginId'] || undefined,
      email: formValues['email'] || undefined,
      phone: formValues['phone'] || undefined,
      role: (formValues['role'] as LwMemberRole) || m.role,
      status: m.status,
    };
    this.updateMember.emit(dto);
    this.closeEdit();
  }
}

export { LwDirectoryShellComponent as LwDbShellComponent };
