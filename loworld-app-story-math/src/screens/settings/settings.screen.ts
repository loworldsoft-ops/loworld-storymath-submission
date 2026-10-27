import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LwScreen } from '@loworld/common/os';
import { LW_SPEECH_AUTO, LW_SPEECH_ENGINE_PORT, type LwSpeechEngineChoice } from '@loworld/common/services';
import {
  LwButtonComponent,
  LwCardComponent,
  LwGridComponent,
  LwIconComponent,
  LwSlideSwitchComponent,
  LwStackComponent,
  LwTextComponent,
} from '@loworld/common/ui';
import { StoryMathPlay, type StoryMathSettings } from '../../logic/story-math-play';

type ToggleKey = 'autoPlay' | 'listenEnabled' | 'showText' | 'narrator' | 'highlight' | 'continueNext' | 'autoListen' | 'ordinal';
type ChoiceKey = 'rate' | 'pause' | 'voiceTries';

/** 켜고 끄는 설정 한 줄 */
interface ToggleItem {
  readonly kind: 'toggle';
  readonly key: ToggleKey;
  readonly title: string;
  readonly caption: string;
}

/** 여럿 가운데 고르는 설정 한 줄 */
interface ChoiceItem {
  readonly kind: 'choice';
  readonly key: ChoiceKey;
  readonly title: string;
  readonly caption: string;
  readonly options: readonly { readonly value: StoryMathSettings[ChoiceKey]; readonly label: string }[];
}

/**
 * 설정: 듣기, 진행, 답하기, 화면, 소리 엔진, 기록.
 * 설정 줄은 목록(sections)으로 그린다. 줄의 모양이 켜기·끄기와 고르기 두 가지뿐이라, 설정을 더할 때 목록에 한 줄만 더한다.
 */
@Component({
  selector: 'scr-story-math-settings',
  templateUrl: './settings.screen.html',
  hostDirectives: [LwScreen],
  imports: [
    LwButtonComponent,
    LwCardComponent,
    LwGridComponent,
    LwIconComponent,
    LwSlideSwitchComponent,
    LwStackComponent,
    LwTextComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StoryMathSettingsScreen {
  protected readonly play = inject(StoryMathPlay);
  protected readonly engines = inject(LW_SPEECH_ENGINE_PORT);
  protected readonly auto = LW_SPEECH_AUTO;
  /** 읽기와 듣기는 엔진을 따로 고른다. 두 카드의 모양이 같아 목록으로 그린다 */
  protected readonly engineSections = [
    { kind: 'speak', title: '읽어 주는 목소리', choice: this.engines.speak },
    { kind: 'listen', title: '알아듣는 엔진', choice: this.engines.listen },
  ] as const;

  protected readonly sections: readonly { readonly title: string; readonly items: readonly (ToggleItem | ChoiceItem)[] }[] = [
    {
      title: '듣기',
      items: [
        {
          kind: 'choice',
          key: 'rate',
          title: '읽는 빠르기',
          caption: '이야기와 문제를 읽어 주는 빠르기',
          options: [
            { value: 'slower', label: '아주 느리게' },
            { value: 'slow', label: '느리게' },
            { value: 'normal', label: '보통' },
            { value: 'fast', label: '빠르게' },
            { value: 'faster', label: '아주 빠르게' },
          ],
        },
        { kind: 'toggle', key: 'narrator', title: '이야기꾼의 인사와 마무리', caption: '앱을 열 때 인사하고, 퀘스트 끝에 다음 이야기를 알려 줘요' },
        { kind: 'toggle', key: 'highlight', title: '읽는 곳 밝히기', caption: '지금 읽는 낱말에 불을 켜요(엔진이 읽는 자리를 알려 줄 때)' },
        {
          kind: 'choice',
          key: 'pause',
          title: '문단 사이 쉼',
          caption: '자동 진행에서 문단과 풀이 뒤에 잠깐 쉬어요',
          options: [
            { value: 'none', label: '없음' },
            { value: 'short', label: '짧게' },
            { value: 'long', label: '길게' },
          ],
        },
      ],
    },
    {
      title: '진행',
      items: [
        { kind: 'toggle', key: 'autoPlay', title: '자동 진행', caption: '다 읽으면 저절로 다음으로 가요. 운전 중에는 켜 두세요' },
        { kind: 'toggle', key: 'continueNext', title: '다음 단원 이어 듣기', caption: '퀘스트를 마치면 잠깐 쉬고 다음 단원을 시작해요. 긴 운전에 좋아요' },
      ],
    },
    {
      title: '답하기',
      items: [
        { kind: 'toggle', key: 'listenEnabled', title: '말로 답하기', caption: '끄면 버튼으로만 답해요' },
        { kind: 'toggle', key: 'autoListen', title: '문제를 읽고 바로 듣기', caption: '끄면 "말로 답하기"를 눌러야 들어요' },
        {
          kind: 'choice',
          key: 'voiceTries',
          title: '말로 답할 기회',
          caption: '못 알아들으면 다시 묻는 횟수예요. 다 쓰면 버튼을 기다려요',
          options: [
            { value: 1, label: '1번' },
            { value: 2, label: '2번' },
            { value: 3, label: '3번' },
          ],
        },
        { kind: 'toggle', key: 'ordinal', title: '"첫째" "둘째"로 답하기', caption: '보기의 말 대신 자리로 답해도 알아들어요' },
      ],
    },
    {
      title: '화면',
      items: [{ kind: 'toggle', key: 'showText', title: '글 보이기', caption: '끄면 이야기와 풀이를 소리로만 들려줘요' }],
    },
  ];

  constructor() {
    // 엔진은 그사이 바뀔 수 있다(설치, 권한). 설정을 열 때마다 셸에게 다시 묻는다.
    this.engines.refresh();
  }

  protected isOn(key: ToggleKey): boolean {
    return this.play.settings()[key];
  }

  protected isPicked(key: ChoiceKey, value: StoryMathSettings[ChoiceKey]): boolean {
    return this.play.settings()[key] === value;
  }

  protected pick(key: ChoiceKey, value: StoryMathSettings[ChoiceKey]): void {
    // 목록의 값은 그 칸의 값만 있다(sections). 칸마다 값의 형이 달라 여기서 한 번 넓힌다.
    this.play.set(key, value as never);
  }

  /** 말로 답하기의 설명은 듣기가 없는 기기에서 다르다 */
  protected captionOf(item: ToggleItem | ChoiceItem): string {
    if (item.key === 'listenEnabled' && !this.play.canListen) return '이 기기에서는 들을 수 없어 버튼으로만 답해요';
    return item.caption;
  }

  protected engineNow(choice: LwSpeechEngineChoice): string {
    const active = choice.options.find((o) => o.id === choice.active);
    if (!active) return '이 기기에서 쓸 수 있는 엔진이 없어요';
    if (choice.selected !== LW_SPEECH_AUTO && choice.selected !== choice.active) return `고른 것을 쓸 수 없어 지금은 ${active.label}`;
    return `지금: ${active.label}`;
  }
}
