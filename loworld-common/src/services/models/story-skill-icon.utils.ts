import { STORY_SKILL_ICON_DATASET_BASE, STORY_SKILL_ICON_MEDIA_BY_ID } from './story-skill-icon-paths.generated';

export const STORY_SKILL_ICON_NAMESPACE = 'story-skill' as const;
export const STORY_SKILL_ICON_PREFIX = `${STORY_SKILL_ICON_NAMESPACE}:` as const;

export function toStorySkillAssetId(skillId: string): string {
  return `skill-${skillId}`;
}

export function isStorySkillIconName(value: string | null | undefined): boolean {
  return !!value && (value.startsWith(STORY_SKILL_ICON_PREFIX) || value.startsWith('novel-skill:'));
}

export function toStorySkillIconName(skillId: string): string {
  return `${STORY_SKILL_ICON_PREFIX}${skillId}`;
}

const SKILL_ID_FALLBACK_ALIASES: Record<string, string> = {
  whirlwind: 'sword-wind',
  bash: 'mighty-blow',
  'leap-attack': 'leap-strike',
  shout: 'iron-wall',
  'dragon-flight': 'flash-strike',
};

function resolveStorySkillIconRelativePath(skillId: string): string {
  const assetId = toStorySkillAssetId(skillId);
  const media = STORY_SKILL_ICON_MEDIA_BY_ID[assetId];
  if (media?.path) {
    return media.path;
  }
  const aliasId = SKILL_ID_FALLBACK_ALIASES[skillId];
  if (aliasId) {
    const aliasAssetId = toStorySkillAssetId(aliasId);
    const aliasMedia = STORY_SKILL_ICON_MEDIA_BY_ID[aliasAssetId];
    if (aliasMedia?.path) {
      return aliasMedia.path;
    }
  }
  return `png/${assetId}.png`;
}

/** Absolute URL path for a skill icon mask PNG. */
export function resolveStorySkillIconMediaUrl(skillId: string, base: string = STORY_SKILL_ICON_DATASET_BASE): string {
  return `${base}/${resolveStorySkillIconRelativePath(skillId)}`;
}

/** Returns the content-relative path (e.g. 'novel/skill-icons/png/skill-fireball.png') for use with StoryContentHandle.assetUrl */
export function toContentStorySkillAssetPath(skillId: string): string {
  return `novel/skill-icons/${resolveStorySkillIconRelativePath(skillId)}`;
}

/** Alias for codex `<img>` preview (same URL as mask source). */
export function resolveStorySkillIconPreviewUrl(skillId: string, base: string = STORY_SKILL_ICON_DATASET_BASE): string {
  return resolveStorySkillIconMediaUrl(skillId, base);
}

export function isStorySkillIconRaster(skillId: string): boolean {
  const assetId = toStorySkillAssetId(skillId);
  const kind = STORY_SKILL_ICON_MEDIA_BY_ID[assetId]?.kind;
  return kind !== 'vector';
}

