import { LwButtonComponent } from '../../../ui/form/button/button.component';
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import type { ComponentMeta, OverviewThemeMode } from '../../../services/models/os.types';
import type { CreateLwMemberDto, LwMember, UpdateLwMemberDto } from '../../../services/models/member.model';
import { LwDirectoryShellComponent } from '../../../patterns/lib/chrome/shells/directory-shell/directory-shell.component';
import { LwAccountRowComponent } from '../../../patterns/collection/items/member-list-item/member-list-item.component';
import { LwAccountRoleBadgeComponent } from '../../../ui/data-display/badge/member-role-badge.component';
import { LwSelectableListComponent } from '../../../ui/list/selectable-list/selectable-list.component';
import { LwModalComponent } from '../../../ui/overlay/modal/modal.component';
import { LW_MEMBER_DIRECTORY_PORT } from '../../../services/ports/member-directory.port';

const SAMPLE: LwMember = {
  id: 'demo-1',
  loginId: 'honggildong',
  displayName: '홍길동',
  email: 'hong@example.com',
  password: 'demo1234',
  role: 'MANAGER',
  status: 'active',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'lw-directory-demo',
  standalone: true,
  imports: [
    LwDirectoryShellComponent,
    LwSelectableListComponent,
    LwAccountRowComponent,
    LwAccountRoleBadgeComponent,
    LwModalComponent,
    LwButtonComponent,
  ],
  templateUrl: './directory-demo.component.html',
  styleUrl: './directory-demo.component.scss',
})
export class DirectoryDemoComponent {
  readonly comp = input.required<ComponentMeta>();
  readonly themeMode = input<OverviewThemeMode>('light');
  private readonly directory = inject(LW_MEMBER_DIRECTORY_PORT);
  private readonly localList = signal<LwMember[]>([
    SAMPLE,
    { ...SAMPLE, id: 'demo-2', loginId: 'kimyounghee', displayName: '김영희', password: 'viewer1234', role: 'VIEWER' },
  ]);
  private readonly hasRemoteMembers = computed(() => this.directory.members().length > 0);

  readonly listDemo = computed<LwMember[]>(() => {
    const members = this.directory.members();
    return members.length > 0 ? members : this.localList();
  });
  readonly selectedList = signal<string | null>(null);

  readonly showForm = signal(false);
  readonly formMode = signal<'create' | 'edit'>('create');
  readonly editTarget = signal<LwMember | null>(null);
  readonly showDel = signal(false);

  noop(): void {}

  onListSelect(id: string): void {
    this.selectedList.set(id);
    this.directory.selectMember(id);
  }

  openFormCreate(): void {
    this.formMode.set('create');
    this.editTarget.set(null);
    this.showForm.set(true);
  }

  openFormEdit(m?: LwMember): void {
    const target = m ?? this.listDemo().find(x => x.id === this.selectedList());
    if (!target) return;
    this.formMode.set('edit');
    this.editTarget.set(target);
    this.showForm.set(true);
  }

  onSave(dto: CreateLwMemberDto | UpdateLwMemberDto): void {
    if (this.hasRemoteMembers()) {
      this.showForm.set(false);
      return;
    }

    if ('id' in dto) {
      this.localList.update(list =>
        list.map(m => (m.id === dto.id ? { ...m, ...dto, updatedAt: new Date().toISOString() } : m)),
      );
    } else {
      const now = new Date().toISOString();
      const m: LwMember = {
        id: crypto.randomUUID(),
        loginId: dto.loginId,
        displayName: dto.displayName,
        email: dto.email,
        phone: dto.phone,
        password: dto.password,
        role: dto.role,
        status: 'active',
        createdAt: now,
        updatedAt: now,
      };
      this.localList.update(list => [...list, m]);
    }
    this.showForm.set(false);
  }

  openDel(): void {
    this.showDel.set(true);
  }

  onConfirmDel(): void {
    const id = this.selectedList();
    if (!id || this.hasRemoteMembers()) return;
    this.localList.update(list => {
      const next = list.filter(m => m.id !== id);
      this.selectedList.set(next[0]?.id ?? null);
      return next;
    });
    this.showDel.set(false);
  }

  onDeleteShell(id: string): void {
    if (this.hasRemoteMembers()) return;
    this.localList.update(list => {
      const next = list.filter(m => m.id !== id);
      if (this.selectedList() === id) {
        this.selectedList.set(next[0]?.id ?? null);
      }
      return next;
    });
  }

  onDeleteMember(m: LwMember): void {
    if (this.hasRemoteMembers()) return;
    this.localList.update(list => {
      const next = list.filter(x => x.id !== m.id);
      if (this.selectedList() === m.id) {
        this.selectedList.set(next[0]?.id ?? null);
      }
      return next;
    });
  }
}

export const DbDemoComponent = DirectoryDemoComponent;
