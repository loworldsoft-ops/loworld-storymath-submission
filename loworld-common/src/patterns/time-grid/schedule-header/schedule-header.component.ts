import { LwButtonComponent } from '../../../ui/form/button/button.component';
import { LwInputComponent } from '../../../ui/form/input/input.component';
import { Component, input, output, computed, signal, ElementRef, viewChild, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CalendarView, ViewOption } from '../../../services/models/schedule.model';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'lw-schedule-header',
  standalone: true,
  imports: [FormsModule, LwButtonComponent, LwInputComponent],
  templateUrl: './schedule-header.component.html',
  styleUrl: './schedule-header.component.scss',
})
export class LwScheduleHeaderComponent {
  headerTitle = input.required<string>();
  currentView = input.required<CalendarView>();
  searchQuery = input('');
  filteredEventCount = input(0);
  viewOptions = input<ViewOption[]>([
    { value: 'day', label: '일', labelFull: '일간 보기' },
    { value: 'week', label: '주', labelFull: '주간 보기' },
    { value: 'month', label: '월', labelFull: '월간 보기' },
    { value: 'year', label: '연', labelFull: '연간 보기' },
    { value: 'agenda', label: '목록', labelFull: '목록 보기' },
  ]);
  searchPlaceholder = input('일정 검색');
  isMobile = input(false);

  searchQueryChange = output<string>();
  changeView = output<CalendarView>();
  navigatePrev = output<void>();
  navigateNext = output<void>();
  goToToday = output<void>();

  private searchInputRef = viewChild<ElementRef<HTMLInputElement>>('searchInput');

  mobileViewOpen = signal(false);
  mobileSearchOpen = signal(false);

  currentViewLabel = computed(() => {
    const opt = this.viewOptions().find(v => v.value === this.currentView());
    return opt?.labelFull ?? '';
  });

  selectMobileView(view: CalendarView): void {
    this.changeView.emit(view);
    this.mobileViewOpen.set(false);
  }

  clearSearch(): void {
    this.searchQueryChange.emit('');
    this.searchInputRef()?.nativeElement.focus();
  }

  onSearchEscape(): void {
    if (this.searchQuery().trim().length > 0) {
      this.searchQueryChange.emit('');
    } else {
      this.searchInputRef()?.nativeElement.blur();
    }
  }
}
