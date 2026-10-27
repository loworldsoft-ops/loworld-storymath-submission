import { ComponentMeta } from '../../services/models/os.types';

export const DX_CATALOG: ComponentMeta[] = [
  {
    id: 'lw-component-vessel',
    name: '컴포넌트 조합 그릇',
    englishName: 'ComponentVessel',
    selector: 'lw-component-vessel',
    domain: 'develop',
    category: 'layout',
    description: '여러 컴포넌트를 하나의 반응형 화면에 유기적으로 배치하고(Split, Grid, Overlay), 메뉴 클릭으로 실시간 로드 및 결합 상태 흐름을 검증할 수 있는 디벨로퍼 샌드박스 전용 그릇(Vessel) 셸입니다.',
    usedIn: [{ app: 'loworld-develop', role: '다중 컴포넌트 통합 샌드박스', feature: '상태 연계 및 레이아웃 결합 시뮬레이션', direct: true }],
    inputs: [
      { name: 'menuItems', type: 'LwVesselMenuItem[]' },
      { name: 'config', type: 'LwVesselConfig' }
    ],
    outputs: [
      { name: 'actionEvent', type: 'LwActionEvent<any>' }
    ]
  },
  {
    id: 'lw-chatbot',
    name: '챗봇 패널',
    englishName: 'Chatbot',
    selector: 'lw-chatbot',
    domain: 'develop',
    category: 'view',
    description: '인터랙티브 가상 챗봇 컴포넌트. 아바타, 타이핑 인디케이터, 추천 질문 칩, 입력 필드가 포함된 글래스모피즘 기반 프리미엄 대화 UI입니다.',
    usedIn: [{ app: 'loworld-develop', role: '가상 AI 대화 셸', feature: '대화 및 액션 트리거', direct: true }],
    inputs: [
      { name: 'data', type: 'ChatbotVm' }
    ],
    outputs: [
      { name: 'actionEvent', type: 'LwActionEvent<any>' }
    ]
  },
];

export const DEVELOP_CATALOG = DX_CATALOG;
