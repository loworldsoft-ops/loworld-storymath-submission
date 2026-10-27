/**
 * [LoworldUI] 스킬도감(Skill Codex) 고유 단락 스토리(Paragraph Story) 데이터베이스
 *
 * 각 스킬마다 기원(Origin), 체득/각성(Awakening), 실전 발동(Cast),
 * 그리고 기승전결(起承轉結) 4단락의 완성도 높은 서사를 보유합니다.
 */

import type { SkillParagraphStory } from '../models/story-skill-narrative-base.model';
import { MARTIAL_SKILL_PARAGRAPH_STORIES } from './chronicle-skill-paragraph-stories.data';

export const SKILL_PARAGRAPH_STORIES: Record<string, SkillParagraphStory> = {
  // ── 전사 (Warrior) ──
  'sword-wind': {
    skillId: 'sword-wind',
    originStory: '태고의 무림 검존이 북풍한설을 가르며 깨우친 비전으로, 검끝에서 소용돌이치는 기운을 응축하여 사방을 베어내는 회전 검기다.',
    awakeningPassage: '검을 쥔 손목의 회전 반경과 단전의 기운이 완벽히 일치하는 순간, 공기가 거세게 울리며 투명한 바람의 칼날이 손끝을 감쌌다.',
    castNarrative: '검신을 축으로 폭풍 같은 회오리 검기를 격발하자, 사방을 포위하던 적들이 비명을 지르며 공중으로 솟구쳤다.',
    phases: [
      {
        phase: 'intro',
        badge: '起',
        label: '기(起) · 검풍의 전승',
        title: '바람을 가르는 태고의 검결',
        content: '수백 년 전 사라진 북풍검파의 비급 사본이 눈앞에 펼쳐졌다. 오래된 양피지 속에는 바람의 흐름을 베어내는 검로의 형상이 선명하게 살아 숨 쉬고 있었다.',
      },
      {
        phase: 'development',
        badge: '承',
        label: '承(승) · 기운의 와류',
        title: '단전과 검신의 공명',
        content: '호흡을 정돈하고 하단전에 잠들어 있던 기운을 끌어올려 검날로 뿜어냈다. 회전축을 따라 감겨 올라가는 바람의 칼날이 점차 거대한 회오리를 이루며 귓가를 때렸다.',
      },
      {
        phase: 'twist',
        badge: '轉',
        label: '전(轉) · 찰나의 개안',
        title: '바람과 하나 되는 순간',
        content: '적의 살기가 코앞까지 닥친 위기의 찰나, 망설임이 사라지고 검풍의 진결이 뇌리에 번개처럼 내리꽂혔다. "검이 바람이요, 바람이 곧 검이다!"',
      },
      {
        phase: 'conclusion',
        badge: '結',
        label: '결(結) · 멸천의 폭풍',
        title: '사방을 평정한 참격',
        content: '완성된 검풍을 휘두르자 맹렬한 진공의 칼날들이 사방으로 뻗어나가 적들의 진형을 일거에 분쇄했다. 잔풍이 가라앉은 전장에는 고요한 승리만이 맴돌았다.',
      },
    ],
  },

  'mighty-blow': {
    skillId: 'mighty-blow',
    originStory: '대지의 거인을 무너뜨렸다는 태산맹격의 비결. 온몸의 체중과 내공을 무기의 한 점에 집중시켜 바위마저 박살내는 필살의 강타다.',
    awakeningPassage: '발끝에서부터 허리를 거쳐 어깨로 이어지는 힘의 선이 단 한 치의 오차도 없이 병장기로 쏟아져 들어가는 이치를 터득했다.',
    castNarrative: '무기를 들어 올려 대지를 부술 듯 내리찍자, 굉음과 함께 지면이 쩍 갈라지며 충격파가 적들을 강타했다.',
    phases: [
      {
        phase: 'intro',
        badge: '起',
        label: '기(起) · 맹격의 각인',
        title: '바위를 쪼개는 중압의 비결',
        content: '거친 철판에 새겨진 태산의 형상. 단 한 번의 타격으로 거대한 요수를 즉사시켰다는 맹격의 비급이 손끝에서 묵직한 맥동을 전해왔다.',
      },
      {
        phase: 'development',
        badge: '承',
        label: '承(승) · 중력의 가속',
        title: '근육과 기운의 응축',
        content: '체내의 모든 근섬유가 긴장하며 힘을 축적했다. 무거운 병장기가 허공을 가르는 궤적마다 지면을 뒤흔들 듯한 중압감이 실리기 시작했다.',
      },
      {
        phase: 'twist',
        badge: '轉',
        label: '전(轉) · 벽을 깨부수다',
        title: '단 한 점으로 모이는 파괴력',
        content: '수없이 허공을 내리치던 중, 힘을 분산시키지 않고 타격점의 단 1촌에 모든 파괴력을 집중시키는 비결을 단숨에 깨우쳤다.',
      },
      {
        phase: 'conclusion',
        badge: '結',
        label: '결(結) · 지반의 붕괴',
        title: '대지를 진동시키는 일격',
        content: '맹격을 맞은 지반이 거대한 분화구처럼 함몰되었고, 적의 견고한 방패는 가루가 되어 흩어졌다. 진정한 완력의 공포가 전장을 지배했다.',
      },
    ],
  },

  'iron-wall': {
    skillId: 'iron-wall',
    originStory: '천 길 낭떠러지에서 떨어지는 낙석도 튕겨낸다는 금강불괴 계통의 방어 비기. 내공으로 체표면에 철벽의 막을 형성한다.',
    awakeningPassage: '기운을 피부 표면의 모공 하나하나로 고르게 분산시켜 찰나의 순간 강철보다 단단한 기갑(氣甲)으로 굳히는 호흡을 완성했다.',
    castNarrative: '철벽의 기운이 온몸을 휘감으며 적들의 날카로운 화살과 칼날을 경쾌한 쇳소리와 함께 모조리 튕겨냈다.',
    phases: [
      {
        phase: 'intro',
        badge: '起',
        label: '기(起) · 철벽의 고서',
        title: '불괴의 기운을 담은 방패',
        content: '고대 수호 기사단의 방어 비술이 담긴 양피지. 어떠한 맹공에도 물러서지 않는 불굴의 방어 진결이 은은한 금빛을 뿜어냈다.',
      },
      {
        phase: 'development',
        badge: '承',
        label: '承(승) · 기갑의 형성',
        title: '체표면을 덮는 호신강기',
        content: '호흡을 가다듬고 내공을 전신의 혈도로 뿜어냈다. 피부 표면이 푸른빛의 강철처럼 단단해지며 주변의 살기를 밀어냈다.',
      },
      {
        phase: 'twist',
        badge: '轉',
        label: '전(轉) · 충격의 흡수',
        title: '반탄지기의 묘리',
        content: '단순히 막아내는 것을 넘어 적의 충격을 받아 단전으로 흘려보낸 뒤 튕겨내는 반탄의 오의를 비로소 개안했다.',
      },
      {
        phase: 'conclusion',
        badge: '結',
        label: '결(結) · 난공불락',
        title: '흔들리지 않는 수호신',
        content: '철벽을 전개하자 쏟아지는 빗발 같은 칼날들이 쇳소리만을 남긴 채 모조리 부러져 나갔다. 완벽한 수호의 결계가 완성되었다.',
      },
    ],
  },

  // ── 마법사 (Sorceress) ──
  'fireball': {
    skillId: 'fireball',
    originStory: '화염계 원소의 정수를 구체 형태로 초압축하여 투척하는 마법학의 걸작. 작렬하는 폭발력은 성채의 성문마저 녹여버린다.',
    awakeningPassage: '손바닥 중앙에 흩어지려는 불꽃의 분자들을 회전시키며 극도의 고밀도 플라즈마 구체로 묶어두는 마나 제어식을 확립했다.',
    castNarrative: '붉게 타오르는 화염구가 허공을 가르며 날아가 적진 한가운데서 폭발하자, 거대한 버섯구름과 화염 폭풍이 전장을 뒤덮었다.',
    phases: [
      {
        phase: 'intro',
        badge: '起',
        label: '기(起) · 홍련의 고서',
        title: '타오르는 불꽃의 계약',
        content: '작열하는 룬 문자로 기록된 원초의 화염학 서책. 붉은 불꽃의 정령들이 책장 사이로 춤추며 영혼의 마나 회로를 자극했다.',
      },
      {
        phase: 'development',
        badge: '承',
        label: '承(승) · 화염의 응축',
        title: '손끝에 맺히는 작은 태양',
        content: '주변의 열기를 빨아들이며 마나를 집중시켰다. 손바닥 위에서 일렁이던 작은 불꽃이 순식간에 눈부신 진홍빛 화염구로 팽창했다.',
      },
      {
        phase: 'twist',
        badge: '轉',
        label: '전(轉) · 연쇄 폭발의 공식',
        title: '임계점을 넘어서는 마력',
        content: '마나 핵의 회전 속도를 극대화하여 불꽃이 외부로 새어나가지 않도록 임계점 직전까지 억누르는 고차원 제어식을 완성했다.',
      },
      {
        phase: 'conclusion',
        badge: '結',
        label: '결(結) · 초토화의 열기',
        title: '전장을 집어삼킨 화염폭풍',
        content: '던져진 화염구가 적의 중심부에서 대폭발을 일으켰다. 대지가 녹아내리고 타오르는 불길 속에서 적들은 잿더미로 화했다.',
      },
    ],
  },

  'frost-nova': {
    skillId: 'frost-nova',
    originStory: '극빙의 설산 꼭대기에서 불어오는 절대영도의 냉기를 방사형으로 폭발시키는 수빙계 마법. 적들의 피와 발걸음을 즉시 얼어붙게 만든다.',
    awakeningPassage: '주변 공간의 열 에너지를 순식간에 진공 상태로 빨아들여 체감 온도를 영하 백 도로 떨어뜨리는 빙결 공식을 체득했다.',
    castNarrative: '발을 구르는 순간 지면을 타고 푸른 서리의 파동이 360도로 터져 나가며 쇄도하던 적들을 고스란히 얼음 조각상으로 굳혀버렸다.',
    phases: [
      {
        phase: 'intro',
        badge: '起',
        label: '기(起) · 빙혼의 결정',
        title: '만년빙하의 숨결',
        content: '만년빙하의 핵에서 채취한 서리 결정 속에 새겨진 냉기 주문. 서책을 만지는 것만으로도 손끝이 새하얗게 얼어붙을 듯했다.',
      },
      {
        phase: 'development',
        badge: '承',
        label: '承(승) · 냉기의 파동',
        title: '공간을 얼리는 마나의 결정화',
        content: '호흡을 내뱉자 하얀 입김이 얼음 가루가 되어 흩날렸다. 체내의 푸른 마나가 발끝을 통해 대지로 스며들며 냉기의 파동을 준비했다.',
      },
      {
        phase: 'twist',
        badge: '轉',
        label: '전(轉) · 절대영도의 순간',
        title: '시간마저 멈추는 한기',
        content: '쇄도하는 적들의 움직임을 보며 망설임 없이 냉기를 역방향으로 팽창시켰다. 찰나의 순간 주변의 모든 열역학적 움직임이 정지했다.',
      },
      {
        phase: 'conclusion',
        badge: '結',
        label: '결(結) · 빙결의 결계',
        title: '조각상으로 굳어진 적들',
        content: '퍼져나간 서리 폭발에 휩쓸린 적들이 칼을 든 채 그대로 얼어붙었다. 맑은 얼음 결정이 부서지며 전장의 흐름이 완전히 차단되었다.',
      },
    ],
  },

  'chain-lightning': {
    skillId: 'chain-lightning',
    originStory: '뇌운의 번개를 소환하여 표적에서 표적으로 끝없이 튕기게 만드는 뇌전마법의 극의. 다수의 군중을 마비시키고 분쇄한다.',
    awakeningPassage: '마나의 극성을 양극과 음극으로 분리하여 번개가 스스로 가장 전도율이 높은 적의 심장으로 유도되도록 전도 경로를 설계했다.',
    castNarrative: '손가락 끝에서 푸른 뇌전 줄기가 뻗어나가 첫 번째 표적을 꿰뚫은 뒤, 지그재그로 번쩍이며 십여 명의 적들을 순식간에 감전시켰다.',
    phases: [
      {
        phase: 'intro',
        badge: '起',
        label: '기(起) · 뇌신의 서판',
        title: '하늘에서 훔쳐 온 번개의 비결',
        content: '벼락 맞은 대추나무에 새겨진 고대 뇌전 비문. 푸른 전격이 글자 위를 타고 흐르며 영혼을 짜릿하게 자극했다.',
      },
      {
        phase: 'development',
        badge: '承',
        label: '承(승) · 전하의 축적',
        title: '손가락 끝에 머무는 전격',
        content: '대기 중의 자유 전하를 마나로 끌어모았다. 머리칼이 곤두서고 손끝에서 타닥타닥 푸른 스파크가 맹렬하게 튀기 시작했다.',
      },
      {
        phase: 'twist',
        badge: '轉',
        label: '전(轉) · 연쇄의 궤적',
        title: '끝없이 이어지는 유도 회로',
        content: '번개를 하나의 목표에 묶어두지 않고, 적과 적 사이의 생체 전류를 다리로 삼아 무한히 도약시키는 연쇄 공식을 깨달았다.',
      },
      {
        phase: 'conclusion',
        badge: '結',
        label: '결(結) · 뇌천의 심판',
        title: '전장을 밝히는 푸른 섬광',
        content: '격발된 번개가 적들의 사이를 종횡무진 튕겨 다니며 파멸의 빛을 뿜어냈다. 연쇄 타격을 맞은 적들이 마비된 채 쓰러졌다.',
      },
    ],
  },

  // ── 궁수 (Archer) ──
  'multishot': {
    skillId: 'multishot',
    originStory: '시위를 한 번 당겨 수십 발의 영력 화살을 부채꼴로 쏟아붓는 궁술의 비의. 밀려드는 적의 군세를 단숨에 제압하는 광역 요격술이다.',
    awakeningPassage: '시위를 당기는 손가락의 미세한 떨림과 마나의 분광 현상을 결합하여, 실물 화살 하나로부터 무수한 마력 화살을 복제하는 요결을 익혔다.',
    castNarrative: '팽팽하게 당겨진 활시위를 놓자 허공이 찢어지는 소리와 함께 수십 발의 빛 화살이 비처럼 쏟아져 적진을 벌집으로 만들었다.',
    phases: [
      {
        phase: 'intro',
        badge: '起',
        label: '기(起) · 풍운궁의 전설',
        title: '하늘을 뒤덮는 화살비의 전승',
        content: '고대 엘프 명궁들이 수호탑을 지킬 때 펼쳤다는 다발 사격의 비결. 한 번의 사격으로 일개 소대를 궤멸시켰다는 기록이 눈에 들어왔다.',
      },
      {
        phase: 'development',
        badge: '承',
        label: '承(승) · 분광의 조준',
        title: '마나로 벼려낸 화살의 깃',
        content: '시위를 당기며 화살촉에 마나를 불어넣었다. 하나의 화살촉이 빛을 굴절시키며 허공에 수십 개의 화살 잔상을 만들어냈다.',
      },
      {
        phase: 'twist',
        badge: '轉',
        label: '전(轉) · 사방 요격의 궤적',
        title: '사각지대를 지우는 탄도',
        content: '부채꼴로 퍼져나가는 화살들의 각도를 완벽히 계산하여 적들의 도주 경로 전체를 덮어버리는 최적의 발사 각도를 찾아냈다.',
      },
      {
        phase: 'conclusion',
        badge: '結',
        label: '결(結) · 섬멸의 뇌우',
        title: '빗발치는 빛의 세례',
        content: '시위에서 뿜어져 나온 화살의 장막이 적의 진영 위로 내리꽂혔다. 전열을 갖추려던 적들이 일제히 무너지며 승패가 결정되었다.',
      },
    ],
  },

  // ── 객사/사령술사 (Necromancer) ──
  'raise-skeleton': {
    skillId: 'raise-skeleton',
    originStory: '망자의 유골에 저승의 영혼을 결속시켜 충직한 뼈의 군단으로 일으켜 세우는 강령술의 기초이자 불멸의 비술.',
    awakeningPassage: '죽음의 냉기와 마나를 결속시켜 흩어진 뼈마디를 조립하고 영혼의 푸른 안광을 깃들게 하는 심연의 영창을 체화했다.',
    castNarrative: '지면을 향해 손을 뻗자 흙먼지를 털어내며 날카로운 검과 방패를 든 해골 전사가 솟구쳐 올라 적을 향해 돌진했다.',
    phases: [
      {
        phase: 'intro',
        badge: '起',
        label: '기(起) · 사령의 흑서',
        title: '죽음을 지배하는 금단의 서약',
        content: '검은 가죽으로 장정된 사령술사의 비전서. 망자들의 원혼을 달래며 육신을 일으키는 영혼 소환의 공식이 푸른빛을 뿜어냈다.',
      },
      {
        phase: 'development',
        badge: '承',
        label: '承(승) · 유골의 공명',
        title: '대지에 잠든 뼈마디의 부름',
        content: '영혼의 주파수를 저승의 파동에 맞추고 대지를 두드렸다. 지하 깊은 곳에 묻혀 있던 오래된 전사의 유골이 딸깍거리며 반응했다.',
      },
      {
        phase: 'twist',
        badge: '轉',
        label: '전(轉) · 영혼의 결속',
        title: '해골의 안와에 타오르는 푸른 불꽃',
        content: '단순한 꼭두각시가 아닌, 자율적으로 주인을 호위하며 검을 휘두를 수 있는 지능형 사령 결속술을 완성했다.',
      },
      {
        phase: 'conclusion',
        badge: '結',
        label: '결(結) · 불멸의 군세',
        title: '전장에 일어선 충직한 수호자',
        content: '완벽히 부활한 해골 병사가 굳건한 방패벽을 치며 적의 공격을 온몸으로 막아냈다. 죽음마저 아군이 된 순간이었다.',
      },
    ],
  },

  // ── 성기사 (Paladin) ──
  'holy-bolt': {
    skillId: 'holy-bolt',
    originStory: '빛의 신앙을 벼려내어 언데드와 악마의 사악한 기운을 즉각 정화하고 아군의 상처를 어루만지는 성기사의 신성 탄환.',
    awakeningPassage: '마음속의 공포와 불신을 지우고 절대적인 신념으로 신성력을 집중시키자 눈이 멀 듯한 황금빛 구체가 가슴 앞에서 솟아올랐다.',
    castNarrative: '발사된 성광의 광선이 어둠의 괴수를 꿰뚫자 사악한 육신이 하얗게 불타며 비명을 질렀고, 주변은 성스러운 평온을 되찾았다.',
    phases: [
      {
        phase: 'intro',
        badge: '起',
        label: '기(起) · 광명의 성서',
        title: '어둠을 사르는 정화의 맹세',
        content: '빛의 기사단이 전수해 준 금박 성서. 더러운 마기를 태우고 생명을 치유하는 성스러운 빛의 찬송가가 마음을 정화했다.',
      },
      {
        phase: 'development',
        badge: '承',
        label: '承(승) · 신념의 응집',
        title: '가슴속에서 타오르는 신성력',
        content: '경건한 기도를 올리며 온몸의 마나를 순결한 신성력으로 정제했다. 손끝에 모인 빛줄기가 점차 태양처럼 눈부시게 빛났다.',
      },
      {
        phase: 'twist',
        badge: '轉',
        label: '전(轉) · 절대 정화의 궤적',
        title: '사악함을 심판하는 직선',
        content: '빛의 파장을 악의 기운에만 반응하도록 조율하여, 아군에게는 따스한 축복을, 적에게는 가혹한 파멸을 안기는 양면성을 부여했다.',
      },
      {
        phase: 'conclusion',
        badge: '結',
        label: '결(結) · 암흑의 소멸',
        title: '어둠을 찢어발긴 성스러운 섬광',
        content: '격발된 성광이 적의 심장을 관통하며 뿜어져 나온 광휘가 전장의 모든 음침한 안개를 걷어냈다. 정의의 빛이 우뚝 섰다.',
      },
    ],
  },

  'blessed-hammer': {
    skillId: 'blessed-hammer',
    originStory: '빛의 망치를 회전하는 나선 궤적으로 소환하여 전방위의 적을 타격하는 성기사 최고의 비기.',
    awakeningPassage: '황금빛 망치를 소환한 뒤 이를 축으로 신성 회오리를 일으켜 적의 방어구를 무시하고 영혼을 강타하는 궤적을 완성했다.',
    castNarrative: '회전하는 빛의 망치가 나선을 그리며 허공을 가르자, 사방에서 달려들던 적들이 망치에 부딪혀 추풍낙엽처럼 날아갔다.',
    phases: [
      {
        phase: 'intro',
        badge: '起',
        label: '기(起) · 수호자의 망치',
        title: '성소를 지키던 황금빛 비전',
        content: '수천 년 전 대성당을 수호하던 팔라딘들의 신성 망치 소환술. 허공에 그려진 룬 문자에서 찬란한 금빛이 뿜어져 나왔다.',
      },
      {
        phase: 'development',
        badge: '承',
        label: '承(승) · 나선의 궤도',
        title: '점차 확장되는 회전력',
        content: '신성력을 집중하여 황금 망치의 형상을 빚어냈다. 망치가 몸 주변을 빙빙 돌며 점점 더 넓은 반경으로 뻗어나가기 시작했다.',
      },
      {
        phase: 'twist',
        badge: '轉',
        label: '전(轉) · 공간 관통의 원리',
        title: '물리적 한계를 뛰어넘는 성격',
        content: '망치가 물질적 방패를 통과하여 적의 본체에 신성 충격을 고스란히 전달하는 차원 침투의 비결을 터득했다.',
      },
      {
        phase: 'conclusion',
        badge: '結',
        label: '결(結) · 천벌의 소용돌이',
        title: '전장을 휩쓴 황금빛 나선',
        content: '사방으로 뻗어 나간 축복의 망치가 적들을 사정없이 분쇄했다. 빛의 나선이 머문 자리에는 완전한 승리만이 남았다.',
      },
    ],
  },

  // ── 암살자 (Assassin) ──
  'tiger-strike': {
    skillId: 'tiger-strike',
    originStory: '백호의 기운을 주먹과 손톱에 세 번 응축하여 마지막 일격에 산천을 뒤흔드는 폭발력을 쏟아내는 암살 비기.',
    awakeningPassage: '1타에 표식을 남기고, 2타에 내공을 주입하며, 3타에 전력을 폭발시키는 삼단계 연환충의 진결을 온몸으로 체득했다.',
    castNarrative: '호랑이의 포효와 함께 세 번의 연타가 적의 흉복부에 적중하자, 축적된 기폭력이 내부에서 터지며 적을 산산조각 냈다.',
    phases: [
      {
        phase: 'intro',
        badge: '起',
        label: '기(起) · 백호의 비결',
        title: '맹수의 발톱을 벼리는 암살서',
        content: '그림자 문파의 어둠 속에서 전해져 내려온 호랑이 일격의 두루마리. 살기를 억누르고 기운을 맹수처럼 벼려내는 요결이 적혀 있었다.',
      },
      {
        phase: 'development',
        badge: '承',
        label: '承(승) · 기운의 중첩',
        title: '손가락 끝에 머무는 백호의 포효',
        content: '기운을 세 겹으로 겹쳐 손끝에 둘렀다. 주먹을 쥘 때마다 공기가 찢어지는 파열음과 함께 맹렬한 투기가 차올랐다.',
      },
      {
        phase: 'twist',
        badge: '轉',
        label: '전(轉) · 폭쇄의 방아쇠',
        title: '내경을 폭발시키는 혈도 타격',
        content: '단순한 외상이 아닌, 적의 체내로 침투한 기운이 시간차를 두고 중심부에서 일제히 폭발하도록 방아쇠를 심는 오의를 완성했다.',
      },
      {
        phase: 'conclusion',
        badge: '結',
        label: '결(結) · 맹호출림',
        title: '폭발하는 삼단 맹타',
        content: '눈 깜짝할 사이에 쏟아진 연타와 함께 거대한 충격파가 터져 나왔다. 적은 반격할 엄두조차 내지 못한 채 꺾여 쓰러졌다.',
      },
    ],
  },

  // ── 무협 도감 전용 스킬 (Wuxia Codex Bundle) ──
  'wuxia_skill_cheonma_step': {
    skillId: 'wuxia_skill_cheonma_step',
    originStory: '천마신공의 정수가 담긴 궁극의 보법. 그림자를 분신으로 남겨 적의 시선을 묶어두고 자신은 이미 적의 등 뒤로 도약하는 공간 전이의 절기다.',
    awakeningPassage: '발끝에 칠흑의 마기를 실어 공간의 결을 비틀자, 허공에 칠흑의 잔영이 맺히며 신형이 바람보다 빠르게 이동했다.',
    castNarrative: '천마환생보를 펼쳐 찰나에 적의 사각지대로 돌아선 뒤 묵직한 일격을 가하자, 적은 잔영을 공격하다 허무하게 무너져 내렸다.',
    phases: [
      {
        phase: 'intro',
        badge: '起',
        label: '기(起) · 묵야의 보결',
        title: '그림자를 밟고 달리는 마도 보법',
        content: '천마가 십만대산을 횡단할 때 남겼다는 환생보의 족적. 어둠 속에서 공간을 접어 달리는 기이한 보법의 비밀이 드러났다.',
      },
      {
        phase: 'development',
        badge: '承',
        label: '承(승) · 분신의 투영',
        title: '허공에 새겨지는 칠흑의 잔상',
        content: '단전에 응축된 마기를 발바닥의 용천혈로 뿜어냈다. 발을 내딛는 자리마다 실제 육신과 똑같은 마기의 잔영이 허공에 맺혔다.',
      },
      {
        phase: 'twist',
        badge: '轉',
        label: '전(轉) · 공간의 왜곡',
        title: '시선을 훔치는 신비의 궤적',
        content: '적의 살기가 잔영을 향하는 찰나, 몸을 비틀어 차원의 틈새를 미끄러지듯 적의 등 뒤 심장 부근으로 단숨에 침투하는 묘리를 깨달았다.',
      },
      {
        phase: 'conclusion',
        badge: '結',
        label: '결(結) · 귀신도 모를 도약',
        title: '사각을 찌른 완벽한 침투',
        content: '환생보의 완성으로 적의 호위망을 마치 유령처럼 통과했다. 허공을 허우적대던 적의 목덜미에 차가운 승부의 결말이 내려앉았다.',
      },
    ],
  },

  'wuxia_skill_cheonma_strike': {
    skillId: 'wuxia_skill_cheonma_strike',
    originStory: '고대 순양의 룬과 천마의 흑마기가 융합되어 대지를 가르는 칠흑의 검기를 뿜어내는 멸천의 검학.',
    awakeningPassage: '검신에 룬의 불꽃을 점화하고 단전의 마기를 불어넣자 검끝에서 칠흑과 백은의 광채가 소용돌이치며 허공을 갈랐다.',
    castNarrative: '멸천검결의 종장을 휘두르자 십 리 밖까지 울리는 파천의 굉음과 함께 적들의 무기와 방어선이 일격에 소멸했다.',
    phases: [
      {
        phase: 'intro',
        badge: '起',
        label: '기(起) · 파천의 검보',
        title: '하늘을 베어버릴 칠흑의 멸천검',
        content: '천마의 피로 쓰인 멸천검결의 제1장. 순양의 고대 룬 문자와 마기가 공명하며 검신 전체를 불태울 듯 뜨거운 열기를 토해냈다.',
      },
      {
        phase: 'development',
        badge: '承',
        label: '承(승) · 음양의 융합',
        title: '룬의 불꽃과 마기의 결합',
        content: '상극이라 여겨졌던 고대 룬의 신성한 불꽃과 단전의 마기를 하나의 검선으로 벼려냈다. 검날 주변의 공간이 일그러지기 시작했다.',
      },
      {
        phase: 'twist',
        badge: '轉',
        label: '전(轉) · 일검파천의 진의',
        title: '만물을 무(無)로 돌리는 검로',
        content: '검을 휘두르는 것이 아니라, 검끝으로 적이 디딘 공간의 인과를 지워버리는 멸천의 궁극적 진리를 단숨에 관통했다.',
      },
      {
        phase: 'conclusion',
        badge: '結',
        label: '결(結) · 천지가 갈라지다',
        title: '대지를 가른 칠흑의 검기',
        content: '멸천검결이 작렬하자 대지가 수십 장 깊이로 갈라지며 적의 군세가 일거에 분쇄되었다. 천하를 호령할 패도의 검학이 강림했다.',
      },
    ],
  },

  'wuxia_skill_plum_sword': {
    skillId: 'wuxia_skill_plum_sword',
    originStory: '화산파의 으뜸 비전 검법. 검을 휘두를 때마다 허공에 분분히 휘날리는 매화 꽃잎 형상의 검기가 사방의 적을 베어낸다.',
    awakeningPassage: '맑고 고요한 심상 속에 만개한 매화나무를 떠올리며 검끝을 떨치자, 눈부시게 붉고 향기로운 검기가 꽃잎처럼 사방으로 흩날렸다.',
    castNarrative: '이십사수매화검법의 검망이 전장을 뒤덮자 수천 장의 꽃잎 검기가 적들의 급소를 빈틈없이 꿰뚫으며 승리를 쟁취했다.',
    phases: [
      {
        phase: 'intro',
        badge: '起',
        label: '기(起) · 화산의 설경',
        title: '눈 덮인 매화가지에서 피어난 검결',
        content: '화산파의 백 년 묵은 검결초목. 삭풍 속에서도 꿋꿋이 붉은 꽃망울을 터뜨리는 매화의 기상이 정갈한 검선으로 담겨 있었다.',
      },
      {
        phase: 'development',
        badge: '承',
        label: '承(승) · 분분한 낙화',
        title: '허공을 채우는 매화검기',
        content: '자하진기를 끌어올려 검끝으로 스물네 번의 연환을 그렸다. 허공에 붉은 매화 꽃잎들이 환상처럼 피어나며 아름다운 검망을 형성했다.',
      },
      {
        phase: 'twist',
        badge: '轉',
        label: '전(轉) · 꽃잎 속의 살기',
        title: '아름다움 뒤에 감춰진 서릿발',
        content: '유려하고 부드러운 꽃잎 하나하나가 실은 강철도 단숨에 절단하는 극상의 암경(暗勁)임을 깨닫고 검로를 완성했다.',
      },
      {
        phase: 'conclusion',
        badge: '結',
        label: '결(結) · 만개한 매화의 숲',
        title: '적을 뒤덮은 환상의 검망',
        content: '온 전장이 휘날리는 매화 꽃잎으로 물들었다. 적들은 그 화려한 장관에 넋을 잃은 채 무기를 떨어뜨리며 무릎을 꿇었다.',
      },
    ],
  },

  'wuxia_skill_golden_shield': {
    skillId: 'wuxia_skill_golden_shield',
    originStory: '소림 나한의 불괴지신 호신강기. 체내에 황금빛 종 형태의 기운을 둘러 어떠한 사악한 공격도 튕겨내는 절대방어의 절학.',
    awakeningPassage: '선도(禪道)의 깊은 명상 속에서 잡념을 비우고 금강역사의 신력을 몸에 두르자, 은은한 범종 소리와 함께 황금 종이 체외에 현현했다.',
    castNarrative: '금강부동신법을 격발하자 적들의 모든 맹공이 황금빛 강기에 부딪혀 맑은 종소리를 내며 산산조각 났다.',
    phases: [
      {
        phase: 'intro',
        badge: '起',
        label: '기(起) · 나한의 범종',
        title: '천년 소림의 불괴지신 비전',
        content: '소림 장경각 깊숙한 곳에서 전수받은 금강부동의 경문. 부처의 가피와 불굴의 의지로 몸을 황금처럼 굳히는 비결이었다.',
      },
      {
        phase: 'development',
        badge: '承',
        label: '承(승) · 황금의 강기',
        title: '몸을 감싸는 성스러운 기벽',
        content: '정심가(靜心歌)를 외우며 단전의 진기를 사지로 뿜어냈다. 피부가 은은한 황금빛으로 물들며 허공에 거대한 범종의 윤곽이 드러났다.',
      },
      {
        phase: 'twist',
        badge: '轉',
        label: '전(轉) · 부동의 심상',
        title: '태산도 흔들지 못할 평정심',
        content: '외부의 어떤 충격과 고통에도 영혼이 동요하지 않을 때 비로소 진정한 불괴의 방어막이 완성됨을 깨달았다.',
      },
      {
        phase: 'conclusion',
        badge: '結',
        label: '결(結) · 금강의 현현',
        title: '모든 악을 튕겨내는 절대결계',
        content: '적들의 거센 칼날이 황금 종에 부딪히며 은은한 뎅- 소리와 함께 튕겨 나갔다. 티끌 하나 다치지 않은 완벽한 방어가 완성되었다.',
      },
    ],
  },
};

/**
 * 스킬 ID를 기반으로 도감 고유 단락 스토리를 조회 (없을 경우 기본 대체 스토리 생성)
 */
export function getSkillParagraphStory(skillId: string, fallbackName?: string): SkillParagraphStory {
  if (MARTIAL_SKILL_PARAGRAPH_STORIES[skillId]) {
    return MARTIAL_SKILL_PARAGRAPH_STORIES[skillId];
  }
  if (SKILL_PARAGRAPH_STORIES[skillId]) {
    return SKILL_PARAGRAPH_STORIES[skillId];
  }

  const name = fallbackName || skillId;
  return {
    skillId,
    originStory: `오랜 세월 도감 깊은 곳에 봉인되어 있던 [${name}]의 비전 비급이다.`,
    awakeningPassage: `단전과 마나 회로가 공명하며 [${name}]의 심오한 이치가 손끝에 맺히기 시작했다.`,
    castNarrative: `망설임 없이 [${name}]을(를) 격발하자, 압도적인 위력의 일격이 적의 방어선을 꿰뚫었다.`,
    phases: [
      {
        phase: 'intro',
        badge: '起',
        label: '기(起) · 비전의 발견',
        title: `[${name}] 비급의 개방`,
        content: `우연한 기연으로 도감에 기록된 [${name}]의 비결을 손에 넣었다. 책장을 넘기자 오래된 심법의 기운이 온몸을 휘감았다.`,
      },
      {
        phase: 'development',
        badge: '承',
        label: '承(승) · 기맥의 연마',
        title: `초식의 운행과 호흡`,
        content: `비급에 적힌 혈도와 마나 경로를 따라 차분히 기운을 순환시켰다. 손끝에서부터 [${name}]의 진정한 위력이 조금씩 형태를 갖추어 갔다.`,
      },
      {
        phase: 'twist',
        badge: '轉',
        label: '전(轉) · 일격의 개안',
        title: `오의의 돌파`,
        content: `수련 중 맞닥뜨린 한계를 뚫고, [${name}]의 핵심 원리를 단숨에 깨우쳤다. "초식의 흐름이 완전히 손에 잡힌다!"`,
      },
      {
        phase: 'conclusion',
        badge: '結',
        label: '결(結) · 실전의 결실',
        title: `적을 제압하는 절기`,
        content: `완성된 [${name}]을 실전에서 전개하자, 적들은 미처 반응하지 못하고 무너져 내렸다. 하나의 위대한 무학이 온전히 완성되었다.`,
      },
    ],
  };
}
