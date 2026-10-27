// 새 앱 저장소를 만든다. 공장의 입구다.
//   node conventions/create-app.mjs <id> "<이름>" [만들 곳(기본: 공통 저장소의 옆 폴더)]
// 만들자마자 규칙 검사와 타입 검사를 통과한다. 화면 하나와 로직 하나가 들어 있고, 거기서부터 채운다.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sync } from './sync-template.mjs';

const [id, title, where] = process.argv.slice(2);
if (!id || !/^[a-z][a-z0-9-]*$/.test(id) || !title) {
  console.error('쓰는 법: node conventions/create-app.mjs <id: 소문자와 -> "<이름>"');
  process.exit(1);
}
const HERE = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(where ?? path.join(HERE, '../..'), `loworld-app-${id}`);
if (fs.existsSync(root)) { console.error(`이미 있다: ${root}`); process.exit(1); }
const pascal = id.replace(/(^|-)([a-z0-9])/g, (_, __, c) => c.toUpperCase());
const write = (f, t) => { fs.mkdirSync(path.dirname(path.join(root, f)), { recursive: true }); fs.writeFileSync(path.join(root, f), t); };

write('package.json', JSON.stringify({ name: `@loworld/app-${id}`, version: '0.0.0', private: true, description: `${title} 앱. 공통 컴포넌트를 조합한 화면과 로직만 있다. 스타일과 자체 컴포넌트는 없다.`, type: 'module', exports: { '.': './src/index.ts' } }, null, 2) + '\n');
write('README.md', `# loworld-app-${id}\n\n${title} 앱이다. 지켜야 할 것과 구조는 \`CLAUDE.md\`에 있다.\n`);
write('src/index.ts', `// 밖으로는 선언서만 내보낸다. 화면은 선언서가 늦게 불러온다.\nexport { manifest } from './manifest';\n`);
write('src/manifest.ts', `import type { LwAppManifest } from '@loworld/common/os';

/**
 * 이 앱의 선언서다. 앱은 자기가 어디서 뜨는지 모른다.
 * 쇼케이스는 이것을 받아 OS 화면에 띄우고, 단독 실행(standalone/)은 이것만으로 전체 화면에 띄운다.
 */
export const manifest: LwAppManifest = {
  id: '${id}',
  homeTab: '${id}',
  domain: {
    id: '${id}',
    label: '${title}',
    icon: 'folder',
    look: { shortLabel: '${title}' },
    launchGroup: { id: '${id}', title: '${title}' },
    launchItems: [{ appId: 'loworld-${id}.app', group: '${id}', tab: '${id}', label: '${title}', icon: 'folder', audience: 'authenticated' }],
    catalog: [],
  },
  windowTabs: [
    {
      tab: '${id}',
      window: { title: '${title}', icon: 'folder', size: 'wide' },
      loadComponent: () => import('./screens/home/home.screen').then((m) => m.${pascal}HomeScreen),
      wrapInScrollPage: false,
      resolveInputs: () => ({}),
    },
  ],
};
`);
write(`src/logic/${id}-workspace.ts`, `import { Injectable, computed, signal } from '@angular/core';
import type { LwTableColumn } from '@loworld/common/ui';

export interface ${pascal}Item {
  readonly id: string;
  readonly name: string;
  readonly note: string;
}

/**
 * ${title} 화면의 상태와 규칙이다. 화면이 어떻게 생겼는지는 모른다.
 * 자료를 저장소에서 읽어야 하면 공통의 포트(LW_DATABASE_PORT 등)를 주입해 쓴다. Firebase를 직접 가져오지 않는다.
 */
@Injectable()
export class ${pascal}Workspace {
  readonly items = signal<${pascal}Item[]>([
    { id: '1', name: '첫 항목', note: '여기서부터 채운다' },
    { id: '2', name: '둘째 항목', note: '표와 상세가 공통 부품이다' },
  ]);
  readonly selectedId = signal<string | null>(null);
  readonly selected = computed(() => this.items().find((item) => item.id === this.selectedId()) ?? null);

  readonly columns: readonly LwTableColumn[] = [
    { key: 'name', label: '이름', width: 'fill' },
    { key: 'note', label: '설명' },
  ];

  select(item: ${pascal}Item): void {
    this.selectedId.set(item.id);
  }
}
`);
write('src/screens/home/home.screen.ts', `import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LwScreen } from '@loworld/common/os';
import { LwWorkbenchComponent } from '@loworld/common/patterns';
import { LwCardComponent, LwDataTableComponent, LwStackComponent, LwTextComponent } from '@loworld/common/ui';
import { ${pascal}Workspace } from '../../logic/${id}-workspace';

@Component({
  selector: 'scr-${id}-home',
  templateUrl: './home.screen.html',
  imports: [LwCardComponent, LwDataTableComponent, LwStackComponent, LwTextComponent, LwWorkbenchComponent],
  hostDirectives: [LwScreen],
  providers: [${pascal}Workspace],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ${pascal}HomeScreen {
  protected readonly workspace = inject(${pascal}Workspace);
}
`);
write('src/screens/home/home.screen.html', `<lw-workbench [nav]="false" [aside]="!!workspace.selected()">
  <lw-stack lwWorkbenchHeader gap="none">
    <lw-text variant="heading">${title}</lw-text>
    <lw-text variant="caption" tone="muted">공통 부품으로 조합한 화면</lw-text>
  </lw-stack>

  <lw-data-table [columns]="workspace.columns" [rows]="workspace.items()" [selectable]="true" [selectedKey]="workspace.selectedId()" (rowSelect)="workspace.select($event)" />

  @if (workspace.selected(); as item) {
    <lw-card lwWorkbenchAside>
      <lw-stack gap="xs">
        <lw-text variant="subheading">{{ item.name }}</lw-text>
        <lw-text tone="muted">{{ item.note }}</lw-text>
      </lw-stack>
    </lw-card>
  }
</lw-workbench>
`);
sync(root);
console.log(`만들었다: ${root}
다음:
  cd ${path.relative(process.cwd(), root)} && npm install && npm run verify && npm run typecheck && npm run serve
쇼케이스에 보이려면 loworld-overview/src/registry/apps.ts에 선언서를 한 줄 넣는다.`);
