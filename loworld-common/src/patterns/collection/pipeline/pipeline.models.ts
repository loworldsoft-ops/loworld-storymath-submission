export type LwPipelineStage = 'ingest' | 'parse' | 'chunk' | 'embed' | 'index' | 'verify';

export interface LwPipelineStepItem {
  readonly id: string;
  readonly stage: LwPipelineStage;
  readonly title: string;
  readonly description: string;
  readonly status: 'pending' | 'running' | 'completed' | 'failed';
  readonly processedCount?: number;
  readonly totalCount?: number;
  readonly durationMs?: number;
}

export interface LwDocumentChunk {
  readonly id: string;
  readonly index: number;
  readonly documentTitle: string;
  readonly content: string;
  readonly tokenCount: number;
  readonly charCount: number;
  readonly embeddingModel: string;
  readonly similarityScore?: number;
  readonly metadata: Readonly<Record<string, string | number>>;
}
