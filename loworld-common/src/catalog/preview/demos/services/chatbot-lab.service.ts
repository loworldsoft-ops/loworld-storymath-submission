import { Injectable, signal } from '@angular/core';
import type { ChatbotVm, ChatbotMessageVm } from '../../../../patterns/lib/assistant/chatbot/chatbot.model';
import type { LwActionEvent } from '../../../../services/models/action-event.model';

export interface ChatbotLabOptions {
  onEasterEggGold?: (goldAmount: number) => void;
}

@Injectable({ providedIn: 'root' })
export class DevelopChatbotLabService {
  readonly chatbotPresetId = signal<string>('developer');
  readonly chatbotState = signal<ChatbotVm>({
    botName: 'Loworld DevBot',
    botAvatarUrl: null,
    isOnline: true,
    isTyping: false,
    messages: [
      {
        id: 'msg_welcome',
        sender: 'bot',
        content: '안녕하세요! Loworld UI 개발자 챗봇입니다. 무엇을 도와드릴까요?',
        timestamp: new Date(),
      },
    ],
    suggestions: [
      '컴포넌트 설계 원칙이 뭐야?',
      'OnPush 변경 감지란?',
      '골드 100 지급해줘',
    ],
    placeholder: '메시지를 입력하세요...',
  });
  readonly chatbotEventLog = signal<string[]>([]);

  onChatbotPresetChange(preset: string): void {
    this.chatbotPresetId.set(preset);
    this.resetChatbotState();
  }

  resetChatbotState(): void {
    const preset = this.chatbotPresetId();
    let botName = 'Loworld DevBot';
    let content = '안녕하세요! Loworld UI 개발자 챗봇입니다. 무엇을 도와드릴까요?';
    let suggestions = [
      '컴포넌트 설계 원칙이 뭐야?',
      'OnPush 변경 감지란?',
      '골드 100 지급해줘',
    ];

    if (preset === 'customer_support') {
      botName = 'CS 서포터';
      content = '안녕하세요! Loworld UI 상점 및 서비스 문의 채널입니다. 결제 혹은 이용 중 겪으신 불편을 말씀해주세요.';
      suggestions = [
        '가방 슬롯 늘리는 방법은?',
        '상점에서 장비가 안사져요',
        '환불 정책이 어떻게 되나요?',
      ];
    } else if (preset === 'glitch_ai') {
      botName = '⚠️ SYSTEM ERROR AI';
      content = '경고: 시스템 과부하 상태입니다. 인가되지 않은 프로세스는 즉시 세션을 종료하십시오.';
      suggestions = [
        '시스템 리셋',
        '코어 온도 체크',
        '누가 널 만들었어?',
      ];
    }

    this.chatbotState.set({
      botName,
      botAvatarUrl: null,
      isOnline: true,
      isTyping: false,
      messages: [
        {
          id: 'msg_init_' + Date.now(),
          sender: 'bot',
          content,
          timestamp: new Date(),
        },
      ],
      suggestions,
      placeholder: preset === 'glitch_ai' ? '명령어를 입력하십시오...' : '메시지를 입력하세요...',
    });

    this.chatbotEventLog.update(log => [
      `[시스템] 챗봇 시나리오가 '${preset}' 모드로 리셋되었습니다.`,
      ...log,
    ]);
  }

  onChatbotActionEvent(event: LwActionEvent<any>, options?: ChatbotLabOptions): void {
    const timestampStr = new Date().toLocaleTimeString();
    this.chatbotEventLog.update(log => [
      `[${timestampStr}] Action [${event.actionId}] 수신 | payload: ${JSON.stringify(event.payload)}`,
      ...log,
    ]);

    if (event.actionId === 'CHATBOT_SEND_MESSAGE' || event.actionId === 'CHATBOT_SUGGESTION_CLICKED') {
      const text = event.actionId === 'CHATBOT_SEND_MESSAGE'
        ? (event.payload.content as string)
        : (event.payload.text as string);

      // 1. 사용자 메시지 추가
      const userMsg: ChatbotMessageVm = {
        id: 'msg_user_' + Date.now(),
        sender: 'user',
        content: text,
        timestamp: new Date(),
        status: 'sent',
      };

      this.chatbotState.update(state => ({
        ...state,
        messages: [...state.messages, userMsg],
        isTyping: true,
      }));

      // 2. 모킹 응답 딜레이 (1초)
      setTimeout(() => {
        const currentPreset = this.chatbotPresetId();
        let reply = '요청하신 정보에 대한 답변을 찾지 못했습니다.';

        // 재화 지급 히든 이스터에그
        if (text.includes('골드') && text.includes('지급')) {
          const matched = text.match(/\d+/);
          const goldAmount = matched ? parseInt(matched[0], 10) : 100;
          if (options?.onEasterEggGold) {
            options.onEasterEggGold(goldAmount);
          }
          reply = `💰 치트 코드가 감지되었습니다. 가상 지갑에 ${goldAmount} Gold가 즉시 주입되었습니다!`;
        } else {
          // 프리셋별 응답 분기
          if (currentPreset === 'developer') {
            if (text.includes('설계 원칙')) {
              reply = 'Loworld UI 샌드박스의 핵심 원칙은 OnPush 변경 감지, 단일 LwActionEvent 채널, SRP(단일 책임), Signals 기반 반응형 데이터 제어입니다.';
            } else if (text.includes('OnPush')) {
              reply = 'OnPush 전략은 부모에게서 전달받는 Input 참조값이 바뀔 때만 Angular의 뷰 렌더링을 갱신하므로 불필요한 반복 렌더링 루프를 방지합니다. Signals의 update/set을 통해 참조값을 완전히 갈아끼워야 합니다.';
            } else {
              reply = `'${text}'에 대해 분석한 결과, Loworld 샌드박스에서 완벽히 시뮬레이션할 수 있는 기술 스펙에 부합합니다. 추가적으로 구현하고 싶은 스펙이 있다면 말씀해주세요!`;
            }
          } else if (currentPreset === 'customer_support') {
            if (text.includes('가방') || text.includes('슬롯')) {
              reply = '가방 슬롯은 상점 상단 제어판에서 직접 늘리거나, 게임 플레이 중 획득한 골드로 상점 패널을 통해 인벤토리를 확장할 수 있습니다.';
            } else if (text.includes('안사져요')) {
              reply = '아이템 가격에 비해 보유 골드가 부족하거나 가방 슬롯이 꽉 찬 경우 구매가 차단됩니다. 제어판에서 골드를 늘려보세요!';
            } else {
              reply = '기록된 고객님의 계정 상태를 분석 중입니다. 추가적인 연동 에러의 경우 개발 셸 피드백에 남겨주시기 바랍니다.';
            }
          } else if (currentPreset === 'glitch_ai') {
            if (text.includes('리셋')) {
              reply = '⚠️ CORE SYSTEM REBOOT... 세션 안정성이 100%로 회복되었습니다.';
              setTimeout(() => this.resetChatbotState(), 500);
            } else if (text.includes('온도')) {
              reply = '🔥 WARNING: 메인보드 온도 94°C 도달. 냉각 장치 임계치 초과.';
            } else {
              reply = '🚨 ERROR CODE 0x7B: 부적절한 쿼리가 탐색되었습니다. 호스트의 메모리 덤프를 시작합니다...';
            }
          }
        }

        const botMsg: ChatbotMessageVm = {
          id: 'msg_bot_' + Date.now(),
          sender: 'bot',
          content: reply,
          timestamp: new Date(),
        };

        this.chatbotState.update(state => ({
          ...state,
          messages: [...state.messages, botMsg],
          isTyping: false,
        }));

        this.chatbotEventLog.update(log => [
          `[${new Date().toLocaleTimeString()}] 챗봇 응답 발송 완료`,
          ...log,
        ]);
      }, 1000);
    } else if (event.actionId === 'CHATBOT_RESET') {
      this.resetChatbotState();
    }
  }
}
