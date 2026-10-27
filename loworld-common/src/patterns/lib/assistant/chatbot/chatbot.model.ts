export interface ChatbotMessageVm {
  id: string;
  sender: 'user' | 'bot' | 'system';
  content: string;
  timestamp: Date;
  /** 시각을 이미 글자로 갖고 있으면 넣는다. 있으면 `timestamp` 대신 이것을 그대로 보인다. */
  timeLabel?: string;
  status?: 'sending' | 'sent' | 'failed';
}

export interface ChatbotVm {
  botName: string;
  botAvatarUrl?: string | null;
  isOnline: boolean;
  isTyping: boolean;
  messages: ChatbotMessageVm[];
  suggestions: string[];
  placeholder?: string;
}
