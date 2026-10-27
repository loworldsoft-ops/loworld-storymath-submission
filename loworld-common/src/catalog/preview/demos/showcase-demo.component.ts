import { LwButtonComponent } from '../../../ui/form/button/button.component';
import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { ComponentMeta, OverviewThemeMode } from '../../../services/models/os.types';
import { ComponentTileGridComponent } from '../../component-tile-grid/component-tile-grid.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'lw-showcase-demo',
  standalone: true,
  imports: [ComponentTileGridComponent, LwButtonComponent],
  templateUrl: './showcase-demo.component.html',
  styleUrl: './showcase-demo.component.scss'
})
export class ShowcaseDemoComponent {
  comp = input.required<ComponentMeta>();
  themeMode = input<OverviewThemeMode>('dark');

  protected readonly selectedEventMessage = signal<string>('');

  protected onComponentSelect(id: string): void {
    this.selectedEventMessage.set(`componentSelect.emit("${id}")`);
  }

  // 데모 렌더링을 위한 임시 테스트 컴포넌트 목록
  protected readonly mockComponents: readonly ComponentMeta[] = [
    {
      id: 'lw-tile-grid-demo-1',
      name: 'Button Element',
      englishName: 'Button Element',
      selector: 'lw-button',
      domain: 'note',
      category: 'buttons',
      description: '기본 액션을 지원하는 표준 버튼 컴포넌트입니다.',
      inputs: [{ name: 'label', type: 'string' }],
      outputs: [{ name: 'click', type: 'void' }]
    },
    {
      id: 'lw-tile-grid-demo-2',
      name: 'Input Box',
      englishName: 'Input Box',
      selector: 'lw-input',
      domain: 'calendar',
      category: 'forms',
      description: '텍스트 입력을 지원하는 데이터 필드 폼 요소입니다.',
      inputs: [{ name: 'placeholder', type: 'string' }],
      outputs: [{ name: 'valueChange', type: 'string' }]
    },
    {
      id: 'lw-tile-grid-demo-3',
      name: 'Taskbar Shell',
      englishName: 'Taskbar Shell',
      selector: 'app-taskbar',
      domain: 'showcase',
      category: 'layout',
      description: '가상 OS의 하단 작업 표시줄 레이아웃 셸입니다.',
      inputs: [],
      outputs: []
    }
  ];
}
