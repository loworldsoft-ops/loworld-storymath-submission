import { ChangeDetectionStrategy, Component, input, output, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LwBottomSheetComponent } from '../../../../ui/overlay/bottom-sheet/bottom-sheet.component';
import { LwActionEvent } from '../../../../services/models/action-event.model';
import { LwScreenRatioService } from '../../../../services/base/lw-screen-ratio.service';

/**
 * 하단에서 펼쳐지는 인터랙티브 바텀시트 컨테이너 컴포넌트입니다.
 */
@Component({
  selector: 'lw-panel-bottom-sheet',
  standalone: true,
  imports: [
    CommonModule, 
    LwBottomSheetComponent,
  ],
  templateUrl: './panel-bottom-sheet.component.html',
  styleUrl: './panel-bottom-sheet.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwPanelBottomSheetComponent {
  private readonly screenRatio = inject(LwScreenRatioService, { optional: true });
  readonly isMobileScreen = computed<boolean>(() => this.screenRatio?.isMobile() ?? false);
  /** 바텀시트 개폐 상태 */
  readonly open = input<boolean>(false);

  /** 타이틀 및 키커 헤더 라벨 */
  readonly title = input<string>('');
  readonly kicker = input<string>('');

  /** 드로어 오버레이 상호작용 및 스타일 제어 */
  readonly backdropBlur = input<boolean>(true);
  readonly closeOnOverlay = input<boolean>(true);
  readonly scrollable = input<boolean>(true);

  /** 넓이 100% (최대 1100px) 전폭 확보 여부 */
  readonly fullWidth = input<boolean>(true);

  /** LwHeightAnalyzerService 연동 높이 연산 그룹 및 식별자 */
  readonly heightGroup = input<string>('panelBottomSheetViewport');
  readonly heightId = input<string>('panelBottomSheetContentHeight');
  readonly heightOffset = input<number>(48);
  readonly useWindowHeight = input<boolean>(true);

  /** 커스텀 최대 치수 오버라이드 (지정 시 시그널 수동 적용) */
  readonly customMaxHeight = input<number | string | null>(null);
  readonly customMaxWidth = input<number | string | null>(null);

  /** 내용 높이 기반 동적 크기 및 자동 전체화면 여부 */
  readonly contentDrivenHeight = input<boolean>(true);
  readonly autoFullscreenThreshold = input<number>(0.85);
  readonly initialSnap = input<any | null>(null);

  /** 모바일 화면 여부에 따른 적응형 fullWidth 해석 (데스크탑에서는 전폭 도킹 강제 해제) */
  readonly effectiveFullWidth = computed<boolean>(() => {
    return this.isMobileScreen() ? this.fullWidth() : false;
  });

  /** 데스크탑 및 모바일에 최적화된 최대 너비 계산 */
  readonly effectiveMaxWidth = computed<number | string | null>(() => {
    const custom = this.customMaxWidth();
    if (custom !== null && custom !== undefined) return custom;
    return this.isMobileScreen() ? null : 1180;
  });

  /** 바텀시트 닫기 이벤트 */
  readonly close = output<void>();

  /** 패널 액션 디스패치 채널 */
  readonly actionEvent = output<LwActionEvent<any>>();

  protected readonly containerStyle = computed(() => {
    const style: Record<string, string> = {};
    const maxH = this.customMaxHeight();
    const maxW = this.customMaxWidth();

    if (maxH !== null && maxH !== undefined) {
      style['max-height'] = typeof maxH === 'number' ? `${maxH}px` : maxH;
    } else {
      style['max-height'] = '100%';
    }
    if (maxW !== null && maxW !== undefined) {
      style['max-width'] = typeof maxW === 'number' ? `${maxW}px` : maxW;
    }
    return style;
  });

  protected onClose(): void {
    this.close.emit();
  }
}
