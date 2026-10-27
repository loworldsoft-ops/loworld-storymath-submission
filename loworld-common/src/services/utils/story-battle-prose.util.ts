import type { BattleSkill } from '../models/battle.model';
import type { BattleEnemy } from '../models/battle.model';
import type { BattleProseEntry } from '../models/story-battle-vm.model';
import type { BattleAllyCombatant } from '../models/story-battle-runtime.model';

export interface BattleOpeningProseContext {
  allies: BattleAllyCombatant[];
  enemies: BattleEnemy[];
}

export interface BattleCounterProsePart {
  enemyName: string;
  damage: number;
  skillName?: string;
  manaSpent?: number;
}

export interface BattleAiAllyProsePart {
  allyName: string;
  targetName: string;
  damage: number;
  skillName?: string;
  manaSpent?: number;
}

export interface BattleTurnStatusAppliedPart {
  kind: 'buff' | 'debuff';
  targetName: string;
  label: string;
  durationTurns: number;
}

export interface BattleTurnProseContext {
  turnNumber: number;
  playerName: string;
  skill: BattleSkill;
  isHeal: boolean;
  isCrit: boolean;
  damage?: number;
  healAmount?: number;
  targetEnemy?: BattleEnemy;
  targetWasDefeated?: boolean;
  /** buff/debuff 스킬로 상태 효과를 부여한 경우의 서사용 컨텍스트 */
  statusApplied?: BattleTurnStatusAppliedPart;
  counterParts: BattleCounterProsePart[];
  aiParts: BattleAiAllyProsePart[];
  outcomePhase: 'ongoing' | 'victory' | 'defeat';
  nextEntryId: () => string;
}

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function entryId(nextEntryId: () => string): string {
  return nextEntryId();
}

function narration(
  turnNumber: number,
  text: string,
  nextEntryId: () => string,
  tone: BattleProseEntry['tone'] = 'neutral',
): BattleProseEntry {
  return {
    id: entryId(nextEntryId),
    turnNumber,
    kind: 'narration',
    text,
    speakerSide: 'narrator',
    tone,
  };
}

function dialogue(
  turnNumber: number,
  speakerName: string,
  line: string,
  speakerSide: 'ally' | 'enemy',
  nextEntryId: () => string,
  tone: BattleProseEntry['tone'] = 'neutral',
): BattleProseEntry {
  return {
    id: entryId(nextEntryId),
    turnNumber,
    kind: 'dialogue',
    speakerName,
    speakerSide,
    text: line,
    tone,
  };
}

function systemLine(
  turnNumber: number,
  text: string,
  nextEntryId: () => string,
  tone: BattleProseEntry['tone'] = 'neutral',
): BattleProseEntry {
  return {
    id: entryId(nextEntryId),
    turnNumber,
    kind: 'system',
    text,
    speakerSide: 'narrator',
    tone,
  };
}

/** 전투 개시 prose */
export function buildBattleOpeningProse(
  context: BattleOpeningProseContext,
  nextEntryId: () => string,
): BattleProseEntry[] {
  const player = context.allies.find((entry) => entry.isPlayerControlled) ?? context.allies[0];
  const enemyNames = context.enemies.map((entry) => entry.name).join(', ');
  const turnNumber = 0;
  const entries: BattleProseEntry[] = [];

  if (context.enemies.length === 1) {
    entries.push(narration(
      turnNumber,
      pick([
        `공기가 순간 무거워졌다. ${context.enemies[0].name}이(가) 어둠 속에서 모습을 드러냈다.`,
        `${context.enemies[0].name}의 그림자가 바닥을 길게 가로지르며, 전투의 숨결이 가까워졌다.`,
        `침묵이 깨지는 순간, ${context.enemies[0].name}이(가) 날카로운 기세를 풍겼다.`,
      ]),
      nextEntryId,
    ));
  } else {
    entries.push(narration(
      turnNumber,
      pick([
        `${enemyNames}—${context.enemies.length}마리의 적이 동시에 포진을 갖췄다.`,
        `사방에서 들려오는 발소리. ${enemyNames}이(가) 포위망을 좁혀 왔다.`,
      ]),
      nextEntryId,
    ));
  }

  if (player) {
    entries.push(dialogue(
      turnNumber,
      player.name,
      pick([
        '「…각오는 끝났어.」',
        '「오늘은 여기서 끝내겠다.」',
        '「물러설 생각은 없어.」',
      ]),
      'ally',
      nextEntryId,
    ));
  }

  if (context.allies.length > 1) {
    const companion = context.allies.find((entry) => !entry.isPlayerControlled);
    if (companion) {
      entries.push(dialogue(
        turnNumber,
        companion.name,
        pick([
          '「내 뒤는 맡겨.」',
          '「함께라면 충분해.」',
          '「서두르자—적의 기세가 심상치 않아.」',
        ]),
        'ally',
        nextEntryId,
      ));
    }
  }

  return entries;
}

/** 턴 행동 prose */
export function buildBattleTurnProse(context: BattleTurnProseContext): BattleProseEntry[] {
  const {
    turnNumber,
    playerName,
    skill,
    isHeal,
    isCrit,
    damage,
    healAmount,
    targetEnemy,
    targetWasDefeated,
    statusApplied,
    counterParts,
    aiParts,
    outcomePhase,
    nextEntryId,
  } = context;

  const entries: BattleProseEntry[] = [];

  if (isHeal && healAmount) {
    entries.push(narration(
      turnNumber,
      pick([
        `${playerName}은(는) 숨을 고르며 ${skill.name}의 기운을 불어넣었다.`,
        `잠시 눈을 감은 ${playerName}의 손끝에서 온기가 번져 나왔다.`,
      ]),
      nextEntryId,
    ));
    entries.push(dialogue(
      turnNumber,
      playerName,
      pick([
        '「…아직은 넘어질 수 없어.」',
        '「조금만 더—버텨야 해.」',
        '「숨을 고르자. 아직 끝이 아니야.」',
      ]),
      'ally',
      nextEntryId,
    ));
    entries.push(narration(
      turnNumber,
      `[${skill.name}] 스킬 효과로 마력이 상처를 메우며 체력 ${healAmount}만큼 회복되었다.`,
      nextEntryId,
      'success',
    ));
    return entries;
  }

  if (statusApplied) {
    if (statusApplied.kind === 'buff') {
      entries.push(narration(
        turnNumber,
        pick([
          `${playerName}은(는) ${skill.name}을 펼쳐 스스로에게 보호의 결계를 둘렀다.`,
          `${playerName}의 몸 주위로 ${skill.name}의 기운이 감돌며 방벽을 이루었다.`,
        ]),
        nextEntryId,
        'success',
      ));
      entries.push(narration(
        turnNumber,
        `${statusApplied.label} 효과가 ${statusApplied.durationTurns}턴간 유지된다.`,
        nextEntryId,
        'success',
      ));
    } else {
      entries.push(narration(
        turnNumber,
        pick([
          `${playerName}의 ${skill.name}이(가) ${statusApplied.targetName}을(를) 옥죄는 저주로 뒤덮었다.`,
          `${skill.name}의 그림자가 ${statusApplied.targetName}의 발밑에서 스며올라 옭아맸다.`,
        ]),
        nextEntryId,
      ));
      entries.push(dialogue(
        turnNumber,
        statusApplied.targetName,
        pick(['「이…게 무슨…!」', '「몸이… 무거워진다…!」', '「크윽…!」']),
        'enemy',
        nextEntryId,
      ));
      entries.push(narration(
        turnNumber,
        `${statusApplied.label} 효과가 ${statusApplied.durationTurns}턴간 지속된다.`,
        nextEntryId,
      ));
    }
  }

  if (targetEnemy && damage !== undefined) {
    entries.push(narration(
      turnNumber,
      pick([
        `${playerName}의 ${skill.name}이(가) ${targetEnemy.name}을(를) 향해 내달렸다.`,
        `${playerName}은(는) ${skill.name}으로 ${targetEnemy.name}의 허를 찔렀다.`,
        `한순간의 침묵 뒤, ${playerName}의 ${skill.name}이(가) 공기를 가르며 ${targetEnemy.name}에게 닿았다.`,
      ]),
      nextEntryId,
    ));

    if (isCrit) {
      entries.push(dialogue(
        turnNumber,
        playerName,
        pick(['「거기!」', '「빈틈이다!」', '「끝내주마!」']),
        'ally',
        nextEntryId,
        'success',
      ));
    }

    entries.push(narration(
      turnNumber,
      isCrit
        ? `치명적인 일격이 ${targetEnemy.name}의 몸을 관통했다. ${damage}의 피해.`
        : `${targetEnemy.name}의 갑주가 ${damage}의 충격을 받아들였다.`,
      nextEntryId,
      isCrit ? 'success' : 'neutral',
    ));

    entries.push(dialogue(
      turnNumber,
      targetEnemy.name,
      targetWasDefeated
        ? pick(['「크…윽…!」', '「이…럴… 수가…」', '「…」'])
        : pick(['「끼익…!」', '「감히…!」', '「윽…!」']),
      'enemy',
      nextEntryId,
      targetWasDefeated ? 'danger' : 'neutral',
    ));

    if (targetWasDefeated) {
      entries.push(narration(
        turnNumber,
        `${targetEnemy.name}이(가) 힘없이 무릎을 꿇더니, 마침내 바닥에 쓰러졌다.`,
        nextEntryId,
        'success',
      ));
    }
  }

  for (const counter of counterParts) {
    if (counter.damage <= 0) {
      continue;
    }
    entries.push(narration(
      turnNumber,
      counter.skillName
        ? `${counter.enemyName}이(가) [${counter.skillName}]${counter.manaSpent ? ` (MP ${counter.manaSpent})` : ''}(으)로 ${counter.damage}의 피해를 주었다.`
        : `${counter.enemyName}이(가) 날카로운 반격으로 되돌려줬다. ${counter.damage}의 피해.`,
      nextEntryId,
      'danger',
    ));
    entries.push(dialogue(
      turnNumber,
      counter.enemyName,
      pick(['「도망칠 생각 마!」', '「대가를 치러주마!」', '「겁쟁이!」']),
      'enemy',
      nextEntryId,
      'danger',
    ));
  }

  for (const ai of aiParts) {
    entries.push(narration(
      turnNumber,
      ai.skillName
        ? `${ai.allyName}이(가) [${ai.skillName}]${ai.manaSpent ? ` (MP ${ai.manaSpent})` : ''}(으)로 ${ai.targetName}에게 ${ai.damage}의 피해.`
        : `${ai.allyName}이(가) 틈을 노려 ${ai.targetName}에게 공격을 가했다. ${ai.damage}의 피해.`,
      nextEntryId,
    ));
    entries.push(dialogue(
      turnNumber,
      ai.allyName,
      pick(['「내가 막아볼게!」', '「놓치지 않아!」', '「여기는 내가 처리할게!」']),
      'ally',
      nextEntryId,
    ));
  }

  if (outcomePhase === 'victory') {
    entries.push(systemLine(turnNumber, '— 전투 승리 —', nextEntryId, 'success'));
    entries.push(narration(
      turnNumber,
      pick([
        '마지막 적의 기세가 사그라들자, 전장에 짧은 정적이 내려앉았다.',
        '승리의 숨결이 가슴을 채우고, 검 끝에 맺힌 피가 바닥으로 떨어졌다.',
      ]),
      nextEntryId,
      'success',
    ));
  } else if (outcomePhase === 'defeat') {
    entries.push(systemLine(turnNumber, '— 전투 패배 —', nextEntryId, 'danger'));
    entries.push(narration(
      turnNumber,
      `${playerName}의 시야가 흐려지며, 무릎이 먼저 바닥을 짚었다.`,
      nextEntryId,
      'danger',
    ));
    entries.push(dialogue(
      turnNumber,
      playerName,
      pick(['「…미안…」', '「아직… 부족했나…」', '「…」']),
      'ally',
      nextEntryId,
      'danger',
    ));
  }

  return entries;
}

/** 단일 prose entry → 씬 본문(paragraph) 한 줄 */
export function battleProseEntryToNarrativeLine(entry: BattleProseEntry): string {
  if (entry.kind === 'dialogue' && entry.speakerName) {
    return `${entry.speakerName} ${entry.text}`;
  }
  return entry.text;
}

/** prose entries → 씬 paragraphs에 append할 본문 줄 배열 */
export function battleProseEntriesToNarrativeLines(entries: BattleProseEntry[]): string[] {
  return entries.map(battleProseEntryToNarrativeLine);
}

/** prose entries → 한 줄 요약 (currentNarrative / timeline) */
export function summarizeBattleProseEntries(entries: BattleProseEntry[]): string {
  if (entries.length === 0) {
    return '';
  }
  return entries.map((entry) => {
    if (entry.kind === 'dialogue' && entry.speakerName) {
      return `${entry.speakerName} ${entry.text}`;
    }
    return entry.text;
  }).join(' ');
}

/** 턴 prose만 추출 (마지막 턴) */
export function latestTurnProseSummary(entries: BattleProseEntry[], turnNumber: number): string {
  const turnEntries = entries.filter((entry) => entry.turnNumber === turnNumber);
  return summarizeBattleProseEntries(turnEntries);
}
