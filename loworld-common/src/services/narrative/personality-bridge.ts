import { PERSONALITY_SPECTRUM_COORDINATES_DATA } from '../data/personality-spectrum-coordinates.data';
import type { StoryCard, StoryPack, StoryTrait } from './narrative.model';

/**
 * 팩의 성품 속성에 기존 성품 카드의 이름, 한 줄 설명, 좌표를 채운다.
 * 팩에는 카드의 id만 적는다. 카드의 원본은 `personality-spectrum-coordinates.data.ts`다(작품을 넘어 쓰는 도감, W9 T4).
 * 공명(narrative-resonance)이 인물의 본성 카드 좌표를 읽도록, 팩의 성품 속성과 인물의 본성에 나오는 카드를 `cards`에 모은다.
 */
export function enrichPackWithPersonalityCards(pack: StoryPack): StoryPack {
  const cards = new Map(PERSONALITY_SPECTRUM_COORDINATES_DATA.map((card) => [card.id, card]));
  const traits: Record<string, StoryTrait> = {};
  for (const trait of Object.values(pack.traits)) {
    const card = trait.kind === 'personality' ? cards.get(trait.id) : undefined;
    traits[trait.id] = card
      ? {
          ...trait,
          name: trait.name || card.name,
          description: trait.description || card.motto || card.title,
          x: trait.x ?? card.x,
          y: trait.y ?? card.y,
          tags: trait.tags.length ? trait.tags : [card.subcategory],
        }
      : trait;
  }
  const used = new Set<string>([
    ...Object.values(traits).filter((trait) => trait.kind === 'personality').map((trait) => trait.id),
    ...Object.values(pack.cast ?? {}).flatMap((member) => member.nature ?? []),
  ]);
  const known: Record<string, StoryCard> = { ...(pack.cards ?? {}) };
  for (const id of used) {
    const trait = traits[id];
    const card = cards.get(id);
    const x = trait?.x ?? card?.x;
    const y = trait?.y ?? card?.y;
    if (typeof x === 'number' && typeof y === 'number' && !known[id]) known[id] = { id, name: trait?.name || card?.name || id, x, y };
  }
  return { ...pack, traits, cards: known };
}
