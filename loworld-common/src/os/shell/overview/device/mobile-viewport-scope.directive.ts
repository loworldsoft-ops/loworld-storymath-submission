import { Directive, ElementRef, effect, inject, input } from '@angular/core';
import { LwPresentationControlFacade } from '../../../../services/services/lw-presentation-control.facade';
import { LwResponsiveService } from '../../../../services/services/lw-responsive.service';
import { LwScopedViewport, provideScopedViewport } from '../../../../services/viewport/lw-viewport-context';
import { LwScreenRatioService } from '../../../../services/base/lw-screen-ratio.service';

/**
 * 모바일 OS가 그려지는 화면 영역에 붙인다.
 *
 * 값이 true(시뮬레이터)이면 이 요소를 가상 뷰포트로 제공한다. 안에 놓인 컴포넌트는
 * 브라우저 창이 아니라 이 요소의 크기를 기준으로 화면 정보를 받는다.
 * false(실제 모바일 화면)이면 바깥 뷰포트를 그대로 전한다.
 */
@Directive({
  selector: '[appMobileViewportScope]',
  standalone: true,
  // 뷰포트를 다시 제공하는 곳에서는 그 값을 읽는 서비스도 함께 제공해야 화면 기준 답이 나온다.
  providers: [provideScopedViewport(), LwResponsiveService, LwScreenRatioService, LwPresentationControlFacade],
})
export class MobileViewportScopeDirective {
  private readonly viewport = inject(LwScopedViewport);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** 시뮬레이터로 보여 주는 중인가 */
  readonly simulated = input.required<boolean>({ alias: 'appMobileViewportScope' });

  constructor() {
    effect(() => {
      if (this.simulated()) this.viewport.simulate(this.host.nativeElement);
      else this.viewport.release();
    });
  }
}
