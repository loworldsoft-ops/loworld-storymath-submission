import { STORY_PARTY_ICON_DATASET_BASE, STORY_PARTY_ICON_MEDIA_BY_ID } from './story-party-icon-paths.generated';

export const STORY_PARTY_ICON_NAMESPACE = 'story-party' as const;
export const STORY_PARTY_ICON_PREFIX = `${STORY_PARTY_ICON_NAMESPACE}:` as const;

export function toStoryPartyAssetId(memberId: string): string {
  return memberId.startsWith('party-') ? memberId : `party-${memberId}`;
}

export function isStoryPartyIconName(value: string | null | undefined): boolean {
  return !!value && (value.startsWith(STORY_PARTY_ICON_PREFIX) || value.startsWith('novel-party:'));
}

export function toStoryPartyIconName(memberId: string): string {
  return `${STORY_PARTY_ICON_PREFIX}${memberId}`;
}

function resolveStoryPartyIconRelativePath(memberId: string): string {
  const assetId = toStoryPartyAssetId(memberId);
  const media = STORY_PARTY_ICON_MEDIA_BY_ID[assetId];
  if (media?.path) {
    return media.path;
  }
  if (assetId === 'party-iron_blacksmith') {
    return 'png/party-blacksmith_hwang.png';
  }
  return `png/${assetId}.png`;
}

/** Absolute URL path for a party member icon PNG. */
export function resolveStoryPartyIconMediaUrl(memberId: string, base: string = STORY_PARTY_ICON_DATASET_BASE): string {
  return `${base}/${resolveStoryPartyIconRelativePath(memberId)}`;
}

/** Returns the content-relative path (e.g. 'novel/party-icons/png/party-wanderer.png') for use with StoryContentHandle.assetUrl */
export function toContentStoryPartyAssetPath(memberId: string): string {
  return `novel/party-icons/${resolveStoryPartyIconRelativePath(memberId)}`;
}

export function isStoryPartyIconRaster(memberId: string): boolean {
  const assetId = toStoryPartyAssetId(memberId);
  const kind = STORY_PARTY_ICON_MEDIA_BY_ID[assetId]?.kind;
  return kind !== 'vector';
}
