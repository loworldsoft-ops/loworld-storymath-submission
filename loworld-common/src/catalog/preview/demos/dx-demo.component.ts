import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LwButtonComponent } from '../../../ui/form/button/button.component';
import { LwCardComponent } from '../../../ui/data-display/card/card.component';
import type { ComponentMeta } from '../../../services/models/os.types';
import { DxDemoChatbotSectionComponent } from './dx-demo-chatbot-section.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'lw-dx-demo',
  standalone: true,
  imports: [
    CommonModule,
    LwButtonComponent,
    LwCardComponent,
    DxDemoChatbotSectionComponent,
  ],
  templateUrl: './dx-demo.component.html',
  styleUrl: './dx-demo.component.scss',
})
export class DxDemoComponent {
  readonly comp = input.required<ComponentMeta>();
  protected readonly playerGold = signal<number>(50);
  protected readonly isFullscreenActive = signal<boolean>(false);
  protected readonly fullscreenMode = signal<'theater' | 'native' | null>(null);

  protected toggleTheaterMode(): void {
    this.fullscreenMode.set(this.fullscreenMode() === 'theater' ? null : 'theater');
    this.isFullscreenActive.set(this.fullscreenMode() !== null);
  }

  protected toggleNativeFullscreen(frame: HTMLElement): void {
    if (!document.fullscreenElement) {
      frame.requestFullscreen?.().catch(() => {});
      this.fullscreenMode.set('native');
      this.isFullscreenActive.set(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      this.fullscreenMode.set(null);
      this.isFullscreenActive.set(false);
    }
  }

  protected exitFullscreen(): void {
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    }
    this.fullscreenMode.set(null);
    this.isFullscreenActive.set(false);
  }

  protected onEasterEggGoldAwarded(amount: number): void {
    this.playerGold.update((g) => g + amount);
  }
}
