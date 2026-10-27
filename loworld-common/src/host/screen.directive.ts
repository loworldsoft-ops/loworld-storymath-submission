import { Directive } from '@angular/core';

/**
 * 앱 저장소의 화면에 붙인다(`hostDirectives: [LwScreen]`).
 * 화면은 공통 컴포넌트를 조합할 뿐 자기 상자를 갖지 않는다. 그래서 화면의 요소는 배치에서 빠지고,
 * 안에 놓인 공통 컴포넌트가 창의 자리를 그대로 차지한다. 앱에는 스타일이 없으므로 이 일을 공통이 한다.
 */
@Directive({
  selector: '[lwScreen]',
  standalone: true,
  host: { 'data-lw-screen': '', '[style.display]': '"contents"' },
})
export class LwScreen {}
