import { ComponentMeta } from '../../services/models/os.types';

export const ORG_CATALOG: ComponentMeta[] = [
  {
    id: 'lw-group-tree',
    name: 'GroupOrganizationTree',
    selector: 'app-group-tree',
    domain: 'common',
    category: 'view',
    description: '3계층(루트 조직 ➔ 부서/그룹 ➔ 워크스페이스) 계층형 조직 탐색기.',
    usedIn: [{ app: 'loworld-group', role: '조직 트리 탐색', feature: '그룹 네비게이션', direct: false }],
    inputs: [
      { name: 'nodes', type: 'OrganizationNode[]' },
      { name: 'selectedId', type: 'string | null' },
    ],
    outputs: [
      { name: 'nodeSelect', type: 'string' },
    ],
  },
  {
    id: 'lw-group-rbac-matrix',
    name: 'GroupRbacMatrix',
    selector: 'app-group-rbac-matrix',
    domain: 'common',
    category: 'view',
    description: '7대 기능 도메인 x 4대 액션(CRUD) 역할·권한 제어 매트릭스 인스펙터.',
    usedIn: [{ app: 'loworld-group', role: 'RBAC 권한 제어', feature: '권한 매트릭스', direct: false }],
    inputs: [
      { name: 'role', type: 'GroupMemberRole' },
      { name: 'member', type: 'GroupMemberItem | null' },
    ],
    outputs: [
      { name: 'permissionChange', type: 'Record<string, any>' },
    ],
  },
];

export const GROUP_CATALOG = ORG_CATALOG;
