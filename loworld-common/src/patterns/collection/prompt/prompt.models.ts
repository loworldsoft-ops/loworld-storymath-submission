export interface LwPromptDiffSegment {
  readonly type: 'equal' | 'added' | 'removed';
  readonly text: string;
}
