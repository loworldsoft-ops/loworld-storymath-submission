import { LwAvatarComponent } from '../../../../ui/data-display/avatar/avatar.component';
import { LwButtonComponent } from '../../../../ui/form/button/button.component';
import { LwTextareaComponent } from '../../../../ui/form/textarea/textarea.component';
import { Component, input, output, signal, effect, ElementRef, viewChild, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LwUIBehaviorDirective } from '../../../../services/base/lw-ui-behavior.directive';
import { LwColorBehaviorDirective } from '../../../../services/base/lw-color-behavior.directive';
import { LwActionEvent } from '../../../../services/models/action-event.model';
import { ChatbotVm } from './chatbot.model';

@Component({
  selector: 'lw-chatbot',
  standalone: true,
  imports: [CommonModule, LwAvatarComponent, LwButtonComponent, LwTextareaComponent],
  templateUrl: './chatbot.component.html',
  styleUrl: './chatbot.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [
    { directive: LwUIBehaviorDirective, inputs: ['disabled', 'visible'] },
    { directive: LwColorBehaviorDirective, inputs: ['color'] }
  ]
})
export class LwChatbotComponent {
  // 얇은 인터페이스 기반의 데이터 입력
  readonly data = input.required<ChatbotVm>();
  
  // 단일 액션 이벤트 방출
  readonly actionEvent = output<LwActionEvent<any>>();

  // 스크롤 컨테이너 엘리먼트 참조
  private readonly scrollContainer = viewChild<ElementRef<HTMLDivElement>>('scrollContainer');

  // 로컬 입력값 상태
  protected readonly inputText = signal<string>('');

  constructor() {
// 메시지 목록이 변경될 때마다 하단으로 자동 스크롤
    effect(() => {
      const messages = this.data().messages;
      const isTyping = this.data().isTyping;
      // 메시지 개수나 타이핑 상태가 바뀔 때 스크롤 트리거
      if (messages.length || isTyping) {
        // DOM 갱신 직후 스크롤하기 위해 microtask 스케줄링
        setTimeout(() => this.scrollToBottom(), 50);
      }
    });
  }

  // 메시지 전송 처리
  protected sendMessage(): void {
    const text = this.inputText().trim();
    if (!text || this.data().isTyping) return;

    this.actionEvent.emit({
      actionId: 'CHATBOT_SEND_MESSAGE',
      payload: { content: text },
      source: 'lw-chatbot'
    });

    // 입력 필드 초기화
    this.inputText.set('');
  }

  // 엔터 키 입력 시 전송
  protected onKeyDown(event: KeyboardEvent): void {
    if (event.isComposing) {
      return;
    }
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  // 추천 칩 클릭 처리
  protected onSuggestionClick(suggestion: string): void {
    if (this.data().isTyping) return;

    this.actionEvent.emit({
      actionId: 'CHATBOT_SUGGESTION_CLICKED',
      payload: { text: suggestion },
      source: 'lw-chatbot'
    });
  }

  // 대화 리셋 클릭 처리
  protected resetChat(): void {
    this.actionEvent.emit({
      actionId: 'CHATBOT_RESET',
      payload: undefined,
      source: 'lw-chatbot'
    });
  }

  // 하단 스크롤 구현
  private scrollToBottom(): void {
    const container = this.scrollContainer()?.nativeElement;
    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      });
    }
  }
}
