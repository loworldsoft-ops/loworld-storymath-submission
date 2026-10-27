import { ComponentMeta } from '../../services/models/os.types';

export const DIRECTORY_CATALOG: ComponentMeta[] = [
  {
    id: 'lw-selectable-list',
    name: 'SelectableList',
    selector: 'lw-selectable-list',
    domain: 'common',
    category: 'view',
    description: '선택형 리스트 프리미티브. member-shell에서 member-list-item 템플릿과 함께 사용.',
    usedIn: [{ app: 'loworld-db', role: '목록', feature: '멤버 CRUD', direct: false }],
    inputs: [
      { name: 'items', type: 'readonly T[]' },
      { name: 'selectedId', type: 'string | null' },
      { name: 'itemTemplate', type: 'TemplateRef' },
    ],
    outputs: [{ name: 'actionEvent', type: 'LwActionEvent<LwListSelectPayload>' }],
  },
  {
    id: 'lw-account-row',
    name: 'MemberListItem',
    selector: 'lw-account-row',
    domain: 'db',
    category: 'view',
    description: '단일 멤버 행. 역할 뱃지·편집/삭제.',
    usedIn: [{ app: 'loworld-db', role: '목록 아이템', feature: '멤버 CRUD', direct: false }],
    inputs: [
      { name: 'member', type: 'LwMember' },
      { name: 'selected', type: 'boolean' },
      { name: 'canEdit', type: 'boolean' },
      { name: 'canDelete', type: 'boolean' },
    ],
    outputs: [
      { name: 'select', type: 'string' },
      { name: 'edit', type: 'LwMember' },
      { name: 'delete', type: 'LwMember' },
    ],
  },
  {
    id: 'lw-account-role-badge',
    name: 'MemberRoleBadge',
    selector: 'lw-account-role-badge',
    domain: 'db',
    category: 'view',
    description: '소유자/관리자/매니저/뷰어 역할 뱃지.',
    usedIn: [{ app: 'loworld-db', role: '표시', feature: '역할 구분', direct: false }],
    inputs: [{ name: 'role', type: 'LwMemberRole' }],
    outputs: [],
  },
];

export const DB_CATALOG = DIRECTORY_CATALOG;
