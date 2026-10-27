import type { CompanionEvent, ReaderSlot, StoryPack } from './narrative.model';
import { resolveTuning } from './narrative-tuning';

/** 화를 마칠 때 동행 중인 동료가 성향을 보고 걱정하거나 떠난다 */
export function settleCompanions(slot: ReaderSlot, pack: StoryPack): { slot: ReaderSlot; events: readonly CompanionEvent[] } {
  const tuning = resolveTuning(pack.tuning);
  const alignment = slot.alignment ?? 0;
  let nextSlot = slot;
  const events: CompanionEvent[] = [];

  for (const memberId of slot.party ?? []) {
    const member = pack.cast[memberId];
    if (!member || !member.lean) continue;

    const against = member.lean === 'merciful' ? -alignment : alignment;
    if (against >= tuning.companionLeave) {
      const party = (nextSlot.party ?? []).filter((id) => id !== memberId);
      const flags = [...new Set([...nextSlot.flags, `left:${memberId}`])];
      const romance = nextSlot.romance?.targetId === memberId ? undefined : nextSlot.romance;
      nextSlot = { ...nextSlot, party, flags, romance };
      events.push({ memberId, kind: 'leave' });
    } else if (against >= tuning.companionWarn && !nextSlot.flags.includes(`warned:${memberId}`)) {
      const flags = [...new Set([...nextSlot.flags, `warned:${memberId}`])];
      nextSlot = { ...nextSlot, flags };
      events.push({ memberId, kind: 'warn' });
    }
  }

  return { slot: nextSlot, events };
}
