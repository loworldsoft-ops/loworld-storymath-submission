import { LwButtonComponent } from '../../../../ui/form/button/button.component';
import { LwCheckboxComponent } from '../../../../ui/form/checkbox/checkbox.component';
import { LwInputComponent } from '../../../../ui/form/input/input.component';
import { Component, input, output, signal, ElementRef, inject, HostListener, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { CalendarInfo } from '../../../../services/models/schedule.model';
import { safeTimeout } from '../../../../services/utils/lifecycle-timer.util';
import { LwScheduleItemMenuComponent } from '../schedule-item-menu/schedule-item-menu.component';

/**
 * 일정 타임라인 내의 개별 일정 항목과 수행 액션을 표시하는 행 컴포넌트입니다.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'lw-schedule-action-row',
  standalone: true,
  imports: [LwScheduleItemMenuComponent, LwButtonComponent, LwInputComponent, LwCheckboxComponent],
  templateUrl: './schedule-list-item.component.html',
  styleUrl: './schedule-list-item.component.scss',
})
export class LwScheduleActionRowComponent {
  protected readonly destroyRef = inject(DestroyRef);
  calendar = input.required<CalendarInfo>();
  checked = input(true);
toggle = output<void>();
  rename = output<string>();
  changeColor = output<string>();
  deleteCalendar = output<void>();

  private elementRef = inject(ElementRef);
  isMenuOpen = signal(false);
  isRenaming = signal(false);
  copiedUrl = signal(false);
  draftName = signal('');
  colorPalette = ['#3b82f6', '#ef4444', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4', '#f97316', '#6366f1', '#84cc16', '#e11d48', '#64748b', '#4285F4', '#2dd4bf', '#a855f7'];

  
  @HostListener('document:mousedown', ['$event'])
  onDocumentClick(e: MouseEvent) {
    if (this.isMenuOpen() && !this.elementRef.nativeElement.contains(e.target)) {
      this.isMenuOpen.set(false);
    }
  }

  toggleMenu(e: MouseEvent): void {
    e.stopPropagation();
    this.isMenuOpen.update(v => !v);
  }

  startRename(): void {
    this.draftName.set(this.calendar().name);
    this.isMenuOpen.set(false);
    this.isRenaming.set(true);
  }

  onDraftInput(e: Event): void {
    this.draftName.set((e.target as HTMLInputElement).value);
  }

  commitRename(): void {
    const next = this.draftName().trim();
    if (next && next !== this.calendar().name) {
      this.rename.emit(next);
    }
    this.isRenaming.set(false);
  }

  cancelRename(): void {
    this.isRenaming.set(false);
  }

  onColorChange(color: string): void {
    this.changeColor.emit(color);
    this.isMenuOpen.set(false);
  }

  copySubscriptionUrl(): void {
    const url = this.calendar().iCalUrl;
    if (!url) return;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(url);
    }
    this.copiedUrl.set(true);
    safeTimeout(this.destroyRef, () => this.copiedUrl.set(false), 2000);
  }

  onDelete(): void {
    this.deleteCalendar.emit();
    this.isMenuOpen.set(false);
  }
}
