import { Directive, ElementRef, OnInit, AfterViewInit, OnDestroy, inject, effect, input } from '@angular/core';
import { LwHeightAnalyzerService, LwHeightRole } from './lw-height-analyzer.service';

@Directive({
  selector: '[lwHeightTarget]',
  standalone: true
})
export class LwHeightTargetDirective implements OnInit, AfterViewInit, OnDestroy {
  private readonly elementRef = inject(ElementRef);
  private readonly analyzerService = inject(LwHeightAnalyzerService);

  // 1) 연산 그룹 식별자 (동일한 부모와 자식들은 같은 그룹 ID를 공유해야 함)
  readonly groupId = input.required<string>({ alias: 'lwHeightGroup' });

  // 2) 고유 식별자 (Content 역할일 때 필수)
  readonly id = input<string>(`lw-height-${Math.random().toString(36).substring(2, 9)}`, { alias: 'lwHeightId' });

  // 3) 엘리먼트의 레이아웃 역할
  readonly role = input.required<LwHeightRole>({ alias: 'lwHeightRole' });

  // 4) 보정 오프셋 (px 단위 여백)
  readonly offset = input<number>(0, { alias: 'lwHeightOffset' });

  // 5) 계산된 높이를 적용할 방식 ('style' - inline height 직접 적용, 'var' - CSS 변수 주입)
  readonly applyType = input<'style' | 'var'>('style');

  // 6) CSS 변수 주입 시 사용할 변수명
  readonly cssVarName = input<string>('--lw-calculated-height');

  // 7) 자바스크립트로 브라우저 창(Viewport) 높이 측정을 강제화할 것인지 여부
  readonly useWindowHeight = input<boolean>(false, { alias: 'lwUseWindowHeight' });

  constructor() {
    // Injection Context 내에서 effect 선언하여 리액티브하게 높이 변화를 추적하고 스타일을 대입합니다.
    effect(() => {
      const role = this.role();
      const id = this.id();

      if (role === 'content') {
        const heightSignal = this.analyzerService.getHeightSignal(id);
        if (heightSignal) {
          const height = heightSignal();
          this.applyCalculatedHeight(height);
        }
      }
    });
  }

  ngOnInit(): void {
    // 컴포넌트 라이프사이클 마운트 시 서비스에 요소 등록 (useWindowHeight 정보 동반 전달)
    this.analyzerService.register(
      this.groupId(),
      this.id(),
      this.elementRef,
      this.role(),
      this.offset(),
      this.useWindowHeight()
    );
  }

  ngAfterViewInit(): void {
    this.analyzerService.recalculateGroup(this.groupId());
  }

  ngOnDestroy(): void {
    // 컴포넌트 소멸 시 서비스 관찰 대상에서 해제
    this.analyzerService.unregister(this.groupId(), this.id());
  }

  /**
   * 계산된 높이를 DOM 스타일에 실시간 반영
   */
  private applyCalculatedHeight(height: number): void {
    const el = this.elementRef.nativeElement;
    if (height > 0) {
      if (this.applyType() === 'style') {
        el.style.height = `${height}px`;
      } else {
        el.style.setProperty(this.cssVarName(), `${height}px`);
      }
    } else {
      if (this.applyType() === 'style') {
        el.style.removeProperty('height');
      } else {
        el.style.removeProperty(this.cssVarName());
      }
    }
  }
}
