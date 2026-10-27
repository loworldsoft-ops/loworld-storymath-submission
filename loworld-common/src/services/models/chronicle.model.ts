export type ChronicleCategory = 'all' | 'story' | 'loot' | 'battle' | 'skill';

export interface ChronicleEntry {
  id: string;
  title: string;
  summary: string;
  createdAt: string;
  category: 'story' | 'loot' | 'battle' | 'skill';
  details?: string;
  locationName?: string;
  chapterNumber?: number;
  badge?: string;
}

export interface NarrativeInspectorChronicleSubTabVm {
  id: ChronicleCategory;
  label: string;
  icon: string;
  description: string;
}

export const DEFAULT_NARRATIVE_INSPECTOR_CHRONICLE_SUB_TABS: readonly NarrativeInspectorChronicleSubTabVm[] = [
  { id: 'all', label: '전체 로그', icon: '🌐', description: '모든 연대기 서사 기록' },
  { id: 'story', label: '스토리', icon: '📜', description: '메인 퀘스트 및 챕터 진척' },
  { id: 'battle', label: '전투', icon: '⚔️', description: '토벌 및 보스 격파 이력' },
  { id: 'loot', label: '전리품', icon: '💎', description: '아이템 및 룬 획득 로그' },
  { id: 'skill', label: '수련', icon: '⚡', description: '스킬 습득 및 경지 돌파' },
] as const;

export const DEFAULT_CHRONICLE_ENTRIES: readonly ChronicleEntry[] = [
  {
    id: 'chronicle-d2-1',
    title: '자매단 야영지 도착',
    summary: '안개 낀 로그 캠프에 도착하여 대장장이 찰시 및 카샤와 첫 만남을 가졌다.',
    details: '동부로 향하던 방랑자의 궤적을 쫓아 도착한 야영지는 악마들의 습격으로 황폐해져 있었다. 자매단의 지도자 아카라가 악의 소굴 정화를 간청했다.',
    createdAt: '2026-08-18T10:00:00Z',
    category: 'story',
    locationName: '로그 캠프',
    chapterNumber: 1,
    badge: '메인 퀘스트',
  },
  {
    id: 'chronicle-d2-2',
    title: '악의 소굴 정화 및 첫 스킬 개화',
    summary: '피의 황무지 지하에 도사린 불타는 시체 군단을 소멸시키고 스킬 포인트를 얻었다.',
    details: '동굴 깊은 곳에서 불꽃을 내뿜는 시체 불꽃(Corpsefire)을 처치하고 악의 소굴을 완전히 정화했다. 아카라의 축복으로 내면의 잠재력이 깨어났다.',
    createdAt: '2026-08-18T11:30:00Z',
    category: 'battle',
    locationName: '악의 소굴',
    chapterNumber: 1,
    badge: '토벌 성공',
  },
  {
    id: 'chronicle-d2-3',
    title: '기본 화염 마법 및 검풍 입문',
    summary: '마법 수련을 통해 기초 전투 기술을 체득하고 위력을 강화했다.',
    details: '마나 순환로를 정렬하여 화염구(Fire Ball) 시전 숙련도를 1성 단계로 끌어올렸다.',
    createdAt: '2026-08-18T12:15:00Z',
    category: 'skill',
    locationName: '수련장',
    chapterNumber: 1,
    badge: '스킬 습득',
  },
  {
    id: 'chronicle-d2-4',
    title: '매장지 매리스 처치 및 핏빛 까마귀의 몰락',
    summary: '타락한 로그 지휘관 블러드 레이븐을 안식으로 인도하고 용병 영입 권한을 얻었다.',
    details: '카샤의 정예 전사였으나 안다리엘의 저주에 타락했던 블러드 레이븐을 매장지 묘비 아래에서 처치했다. 카샤가 궁수 자매를 파티원으로 지원해주었다.',
    createdAt: '2026-08-18T14:00:00Z',
    category: 'story',
    locationName: '매장지',
    chapterNumber: 1,
    badge: '영웅 안식',
  },
  {
    id: 'chronicle-d2-5',
    title: '잊혀진 탑 지하 백작부인(카운테스) 토벌',
    summary: '피의 성채 지하 5층을 돌파하고 룬스톤 전리품을 획득했다.',
    details: '피의 웅덩이에서 백작부인을 처치하고 탈(Tal), 에드(Eth), 엘(El) 룬을 노획했다. 룬워드 장비 제작의 발판을 마련했다.',
    createdAt: '2026-08-18T16:20:00Z',
    category: 'battle',
    locationName: '잊혀진 탑 5층',
    chapterNumber: 1,
    badge: '보스 격퇴',
  },
  {
    id: 'chronicle-d2-6',
    title: '고대 룬워드 「스텔스(잠행)」 합성 완료',
    summary: '호라드릭 큐브의 원리로 2홈 갑옷에 룬을 각인하여 기동성을 대폭 향상시켰다.',
    details: '탈 룬과 에드 룬을 퀼 아머에 차례로 결합하여 [잠행] 룬워드를 완성했다. 이동속도와 시전속도가 비약적으로 증가했다.',
    createdAt: '2026-08-18T17:00:00Z',
    category: 'loot',
    locationName: '찰시의 대장간',
    chapterNumber: 1,
    badge: '룬워드 제작',
  },
  {
    id: 'chronicle-d2-7',
    title: '트리스트럼 구출 및 데커드 케인 동행',
    summary: '불타는 고대 도시 트리스트럼에서 현자 데커드 케인을 구출했다.',
    details: '이니프스의 고목에서 얻은 두루마리로 케언 스톤의 포털을 열었다. 구출된 케인은 호라드림의 마지막 지혜를 전수하며 무상 감정을 약속했다.',
    createdAt: '2026-08-18T18:45:00Z',
    category: 'story',
    locationName: '트리스트럼',
    chapterNumber: 1,
    badge: '현자 합류',
  },
  {
    id: 'chronicle-d2-8',
    title: '대성당 지하 묘지 안다리엘 결전 및 격파',
    summary: '고뇌의 여왕 안다리엘을 격파하고 동부 무역로 개척의 길을 열었다.',
    details: '독안개와 불타는 시체들로 가득 찬 묘지 최하층에서 안다리엘과의 치열한 혈투 끝에 승리했다. 로그 캠프 주민들이 해방의 축제를 열었다.',
    createdAt: '2026-08-18T20:30:00Z',
    category: 'battle',
    locationName: '대성당 카타콤 4층',
    chapterNumber: 1,
    badge: '액트 I 클리어',
  },
] as const;