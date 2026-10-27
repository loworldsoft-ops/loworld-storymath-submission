import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';

/** 클립보드에 글을 넣는다. 앱은 브라우저 전역을 직접 쓰지 못하므로 이것을 거친다. */
@Injectable({ providedIn: 'root' })
export class LwClipboard {
  private readonly doc = inject(DOCUMENT);

  /** 넣었으면 true. 클립보드를 쓸 수 없는 환경이거나 거부되면 false. */
  async copy(text: string): Promise<boolean> {
    const clipboard = this.doc.defaultView?.navigator.clipboard;
    if (!clipboard) return false;
    try {
      await clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }
}
