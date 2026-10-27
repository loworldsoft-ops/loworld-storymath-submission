/**
 * loworld-ui Global Design Tokens
 *
 * 3-level CSS variable hierarchy:
 *   Level 1: Global tokens (this file's defaults)
 *   Level 2: Component tokens (each component's own defaults)
 *   Level 3: Instance overrides (consumer app CSS)
 */

/** Color presets available for common components. */
export type LwColor =
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'neutral'
  | 'info'
  | 'purple'
  | 'story'
  | 'novel';

/** Size presets. */
export type LwSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/** Badge variant presets. */
export type LwBadgeVariant = 'filled' | 'outlined' | 'subtle' | 'neutral' | 'solid';

/** Badge tone presets. */
export type LwBadgeTone = LwColor | (string & {});

/** Badge size presets. */
export type LwBadgeSize = 'xs' | 'sm' | 'md' | 'lg';

/** Progress bar variant presets. */
export type LwProgressVariant = 'bar' | 'gradient';

/** Card variant presets. */
export type LwCardVariant = 'flat' | 'outlined' | 'elevated' | 'glass' | 'accent' | 'filled';

/** Card layout presets. */
export type LwCardLayout = 'stack' | 'row' | 'tile' | 'custom';

/** Card elevation presets. */
export type LwCardElevation = 'none' | 'sm' | 'md' | 'lg';

/**
 * Semantic color map — used by components internally
 * to resolve CSS classes from LwColor input.
 */
export const LW_COLOR_MAP: Record<LwColor, { bg: string; text: string; border: string; subtleBg: string }> = {
  primary: {
    bg:       'var(--lw-color-primary, #3b82f6)',
    text:     'var(--lw-color-on-primary, #ffffff)',
    border:   'var(--lw-color-primary, #3b82f6)',
    subtleBg: 'var(--lw-color-primary-subtle, rgba(59,130,246,0.10))',
  },
  success: {
    bg:       'var(--lw-color-success, #22c55e)',
    text:     'var(--lw-color-on-success, #ffffff)',
    border:   'var(--lw-color-success, #22c55e)',
    subtleBg: 'var(--lw-color-success-subtle, rgba(34,197,94,0.10))',
  },
  warning: {
    bg:       'var(--lw-color-warning, #f59e0b)',
    text:     'var(--lw-color-on-warning, #ffffff)',
    border:   'var(--lw-color-warning, #f59e0b)',
    subtleBg: 'var(--lw-color-warning-subtle, rgba(245,158,11,0.10))',
  },
  danger: {
    bg:       'var(--lw-color-danger, #ef4444)',
    text:     'var(--lw-color-on-danger, #ffffff)',
    border:   'var(--lw-color-danger, #ef4444)',
    subtleBg: 'var(--lw-color-danger-subtle, rgba(239,68,68,0.10))',
  },
  neutral: {
    bg:       'var(--lw-color-neutral, #64748b)',
    text:     'var(--lw-color-on-neutral, #0f172a)',
    border:   'var(--lw-color-neutral-border, rgba(203, 213, 225, 0.85))',
    subtleBg: 'var(--lw-color-neutral-subtle, rgba(241, 245, 249, 0.95))',
  },
  info: {
    bg:       'var(--lw-color-info, #0ea5e9)',
    text:     'var(--lw-color-on-info, #ffffff)',
    border:   'var(--lw-color-info, #0ea5e9)',
    subtleBg: 'var(--lw-color-info-subtle, rgba(14,165,233,0.10))',
  },
  purple: {
    bg:       'var(--lw-color-purple, #8b5cf6)',
    text:     'var(--lw-color-on-purple, #ffffff)',
    border:   'var(--lw-color-purple, #8b5cf6)',
    subtleBg: 'var(--lw-color-purple-subtle, rgba(139,92,246,0.10))',
  },
  story: {
    bg:       'var(--lw-color-amber, #d97706)',
    text:     'var(--lw-color-on-amber, #ffffff)',
    border:   'var(--lw-color-amber, #d97706)',
    subtleBg: 'var(--lw-color-amber-subtle, rgba(217,119,6,0.10))',
  },
  ['novel']: {
    bg:       'var(--lw-color-amber, #d97706)',
    text:     'var(--lw-color-on-amber, #ffffff)',
    border:   'var(--lw-color-amber, #d97706)',
    subtleBg: 'var(--lw-color-amber-subtle, rgba(217,119,6,0.10))',
  },
};
