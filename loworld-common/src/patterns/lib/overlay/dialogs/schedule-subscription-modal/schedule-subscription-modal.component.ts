import { safeTimeout } from '../../../../../services/utils/lifecycle-timer.util';
import { Component, computed, effect, input, output, signal, ChangeDetectionStrategy, inject, DestroyRef } from '@angular/core';
import { LwModalComponent } from '../../../../../ui/overlay/modal/modal.component';
import { LwButtonComponent } from '../../../../../ui/form/button/button.component';
import { LwCardComponent } from '../../../../../ui/data-display/card/card.component';
import { LwInputComponent } from '../../../../../ui/form/input/input.component';
import { LwFormFieldComponent } from '../../../../../ui/form/form-field/form-field.component';
import { SubscriptionProvider, SubscriptionRequest } from '../../../../../services/models/schedule.model';

const DEFAULT_PROVIDERS: SubscriptionProvider[] = [
  {
    key: 'google', label: 'Google Calendar', color: '#4285F4',
    sampleUrl: 'https://calendar.google.com/calendar/ical/...basic.ics',
    guideSteps: [
      'Google Calendar를 웹 브라우저에서 엽니다.',
      '좌측 사이드바에서 구독할 캘린더의 ⋮ 버튼을 클릭합니다.',
      '"설정 및 공유"를 선택합니다.',
      '"iCal 형식의 비공개 주소" 또는 "공개 주소"를 복사합니다.',
    ],
  },
  {
    key: 'naver', label: '네이버 캘린더', color: '#03C75A',
    sampleUrl: 'https://calendar.naver.com/ical/myCalendar',
    guideSteps: [
      '네이버 캘린더 웹 버전에 접속합니다.',
      '설정 > 캘린더 관리로 이동합니다.',
      '구독할 캘린더를 선택하고 "iCal 주소 복사"를 클릭합니다.',
    ],
  },
  {
    key: 'kakao', label: '카카오 캘린더', color: '#FEE500',
    sampleUrl: 'https://calendar.kakao.com/ical/example',
    guideSteps: [
      '카카오 캘린더 웹 버전에 접속합니다.',
      '설정에서 "외부 캘린더 연동"을 선택합니다.',
      'iCal URL을 복사합니다.',
    ],
  },
  {
    key: 'apple', label: 'Apple Calendar', color: '#333333',
    sampleUrl: 'https://p123-caldav.icloud.com/published/2/example',
    guideSteps: [
      'macOS에서 캘린더 앱을 엽니다.',
      '공유할 캘린더를 우클릭하고 "공유 설정"을 선택합니다.',
      '"공개 캘린더"를 체크하고 URL을 복사합니다.',
    ],
  },
];

const COLOR_PALETTE = [
  '#3b82f6', '#ef4444', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4', '#f97316', '#6366f1', '#84cc16', '#e11d48', '#64748b', '#4285F4', '#2dd4bf', '#a855f7'
];

type ModalStep = 'select' | 'form' | 'guide' | 'success';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'lw-schedule-subscription-dialog',
  standalone: true,
  imports: [LwModalComponent, LwButtonComponent, LwCardComponent, LwInputComponent, LwFormFieldComponent],
  templateUrl: './schedule-subscription-modal.component.html',
  styleUrl: './schedule-subscription-modal.component.scss',
})
export class LwScheduleSubscriptionDialogComponent {
  private readonly destroyRef = inject(DestroyRef);
  isOpen = input(false);
  readonly stepTitle = computed(() => {
    switch (this.step()) {
      case 'select': return '캘린더 구독';
      case 'form': return '구독 정보 입력';
      case 'guide': return `${this.selectedProvider()?.label || ''} 가이드`;
      case 'success': return '구독 완료';
      default: return '캘린더 구독';
    }
  });
  providers = input<SubscriptionProvider[]>(DEFAULT_PROVIDERS);

  subscribe = output<SubscriptionRequest>();
  cancel = output<void>();

  step = signal<ModalStep>('select');
  selectedProvider = signal<SubscriptionProvider | null>(null);
  urlValue = signal('');
  urlError = signal(false);
  nameValue = signal('');
  selectedColor = signal('#3b82f6');
  guideSampleCopied = signal(false);

  colorPalette = COLOR_PALETTE;

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        this.resetState();
      }
    });
  }

  allProviders = () => this.providers();

  selectProvider(p: SubscriptionProvider): void {
    this.selectedProvider.set(p);
    this.selectedColor.set(p.color);
    this.nameValue.set(p.label);
    this.urlValue.set('');
    this.urlError.set(false);
    this.step.set('form');
  }

  selectDirect(): void {
    this.selectedProvider.set(null);
    this.selectedColor.set('#3b82f6');
    this.nameValue.set('');
    this.urlValue.set('');
    this.urlError.set(false);
    this.step.set('form');
  }

  onUrlInput(e: Event): void {
    this.urlValue.set((e.target as HTMLInputElement).value);
    this.urlError.set(false);
  }

  onNameInput(e: Event): void {
    this.nameValue.set((e.target as HTMLInputElement).value);
  }

  copyGuideSampleUrl(): void {
    const sampleUrl = this.selectedProvider()?.sampleUrl;
    if (!sampleUrl) return;
    navigator.clipboard.writeText(sampleUrl);
    this.guideSampleCopied.set(true);
    safeTimeout(this.destroyRef, () => this.guideSampleCopied.set(false), 2000);
  }

  onSubmit(): void {
    const url = this.urlValue().trim();
    if (!url) { this.urlError.set(true); return; }
    try { new URL(url); } catch { this.urlError.set(true); return; }

    this.subscribe.emit({
      url,
      name: this.nameValue().trim() || this.selectedProvider()?.label || '새 구독 캘린더',
      color: this.selectedColor(),
      provider: this.selectedProvider()?.key || 'ical',
    });
    this.step.set('success');
  }

  /** Reset state when modal opens — called via effect or parent */
  resetState(): void {
    this.step.set('select');
    this.selectedProvider.set(null);
    this.urlValue.set('');
    this.urlError.set(false);
    this.nameValue.set('');
    this.selectedColor.set('#3b82f6');
    this.guideSampleCopied.set(false);
  }
}
