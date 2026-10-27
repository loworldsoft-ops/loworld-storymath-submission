import { ComponentMeta } from '../services/models/os.types';
import { DOCUMENT_CATALOG } from './apps/document-catalog';
import { SCHEDULE_CATALOG } from './apps/schedule-catalog';
import { CURRICULUM_CATALOG } from './apps/curriculum-catalog';
import { DIRECTORY_CATALOG } from './apps/directory-catalog';
import { STORY_CATALOG } from './apps/story-catalog';
import { STRATEGY_CATALOG } from './apps/strategy-catalog';
import { DX_CATALOG } from './apps/dx-catalog';
import { SHOWCASE_CATALOG } from './apps/showcase-catalog';

import { COMMON_CATALOG } from './common-catalog';
import { ORG_CATALOG } from './apps/org-catalog';
import { CONSOLE_CATALOG } from './apps/console-catalog';
import { MANUAL_CATALOG } from './apps/manual-catalog';
import { GENERATED_CATALOG } from './generated-catalog';

export const ALL_CATALOG: ComponentMeta[] = [
  ...COMMON_CATALOG,
  ...DOCUMENT_CATALOG,
  ...SCHEDULE_CATALOG,
  ...CURRICULUM_CATALOG,
  ...STORY_CATALOG,
  ...DIRECTORY_CATALOG,
  ...STRATEGY_CATALOG,
  ...DX_CATALOG,
  ...SHOWCASE_CATALOG,
  ...ORG_CATALOG,
  ...CONSOLE_CATALOG,
  ...MANUAL_CATALOG,
  // 손으로 올리지 않은 공통 컴포넌트. conventions/generate-catalog.mjs가 채운다.
  ...GENERATED_CATALOG,
];

