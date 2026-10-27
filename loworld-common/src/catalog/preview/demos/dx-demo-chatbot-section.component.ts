import { Component, ChangeDetectionStrategy, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LwChatbotComponent } from '../../../patterns/lib/assistant/chatbot/chatbot.component';
import { LwButtonComponent } from '../../../ui/form/button/button.component';
import { LwSelectComponent } from '../../../ui/form/select/select.component';
import type { LwActionEvent } from '../../../services/models/action-event.model';
import { DevelopChatbotLabService } from './services/chatbot-lab.service';

/**
 * Single Responsibility: Develop 데모 내 LwChatbot 컴포넌트 시뮬레이션 및 프리셋 UI 전담 프리젠터
 */
@Component({
  selector: 'lw-dx-demo-chatbot-section',
  standalone: true,
  imports: [CommonModule, LwChatbotComponent, LwButtonComponent, LwSelectComponent],
  templateUrl: './dx-demo-chatbot-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DxDemoChatbotSectionComponent {
  private readonly chatbotLab = inject(DevelopChatbotLabService);

  readonly playerGold = input<number>(1000);
  readonly easterEggGoldAwarded = output<number>();

  protected readonly chatbotPresetId = this.chatbotLab.chatbotPresetId;
  protected readonly chatbotState = this.chatbotLab.chatbotState;
  protected readonly chatbotEventLog = this.chatbotLab.chatbotEventLog;

  onChatbotPresetChange(preset: string): void {
    this.chatbotLab.onChatbotPresetChange(preset);
  }

  resetChatbotState(): void {
    this.chatbotLab.resetChatbotState();
  }

  onChatbotActionEvent(event: LwActionEvent<any>): void {
    this.chatbotLab.onChatbotActionEvent(event, {
      onEasterEggGold: (goldAmount: number) => {
        this.easterEggGoldAwarded.emit(goldAmount);
      },
    });
  }
}

export const DevelopDemoChatbotSectionComponent = DxDemoChatbotSectionComponent;
