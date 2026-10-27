import { ComponentMeta } from '../../services/models/os.types';

export const CURRICULUM_CATALOG: ComponentMeta[] = [
  {
    id: 'lw-badge',
    name: 'Study room status badge',
    selector: 'lw-badge',
    domain: 'curriculum',
    category: 'view',
    description: 'studyRoomStatusBadge() + lw-badge로 수료 방 상태를 표시합니다.',
    usedIn: [{ app: 'loworld-study', role: '상태 배지', feature: '진행 상태 표시', direct: false }],
    inputs: [{ name: 'status', type: 'RoomStatus' }],
    outputs: [],
  },
];
