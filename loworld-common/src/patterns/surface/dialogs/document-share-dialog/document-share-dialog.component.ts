import { DestroyRef, inject, Component, ChangeDetectionStrategy, input, output, signal } from '@angular/core';
import { safeTimeout } from '../../../../services/utils/lifecycle-timer.util';
import { LwModalComponent } from '../../../../ui/overlay/modal/modal.component';
import { LwButtonComponent } from '../../../../ui/form/button/button.component';
import { LwInputComponent } from '../../../../ui/form/input/input.component';
import { LwFormFieldComponent } from '../../../../ui/form/form-field/form-field.component';

/**
 * 문서의 링크 공유 및 권한 설정을 제어하는 모달 다이얼로그 컴포넌트입니다.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'lw-document-share-dialog',
  standalone: true,
  imports: [LwModalComponent, LwButtonComponent, LwInputComponent, LwFormFieldComponent],
  templateUrl: './document-share-dialog.component.html',
  styleUrl: './document-share-dialog.component.scss',
})
export class LwDocumentShareDialogComponent {
  protected readonly destroyRef = inject(DestroyRef);
  readonly noteId = input.required<string>();
  readonly close = output();
  readonly save = output<{ noteId: string; isPublic: boolean; password?: string }>();
  readonly shareUrl = input<string>('');

  readonly isPublic = signal(false);
  readonly sharePassword = signal('');
  readonly copied = signal(false);

  copyLink(): void {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(this.shareUrl());
    }
    this.copied.set(true);
    safeTimeout(this.destroyRef, () => this.copied.set(false), 2000);
  }

  saveShare(): void {
    this.save.emit({
      noteId: this.noteId(),
      isPublic: this.isPublic(),
      password: this.sharePassword() || undefined,
    });
    this.close.emit();
  }
}
