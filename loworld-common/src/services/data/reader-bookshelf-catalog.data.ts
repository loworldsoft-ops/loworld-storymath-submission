import type { BookshelfBookItem } from '../models/story-reader.model';

/** 리더 앱 책장(Bookshelf) 도서 카탈로그 */
export const READER_BOOKSHELF_CATALOG: readonly BookshelfBookItem[] = [
  {
    id: 'wuxia-1',
    title: '청운의 잡역',
    subtitle: '靑雲之雜役',
    genre: '무협 · 회귀',
    summary: '스무 해 전 청운문의 잡역방이었다. 그리고 그는 아직, 아무것도 아니었다. 전생의 기억과 함께 시작하는 인생 2회차 무협 서사.',
    episodeCount: 13,
    isCompleted: true,
    isAvailable: true,
    badge: '시험판',
  },
  {
    id: 'wuxia-2',
    title: '청운잡역기',
    subtitle: '靑雲雜役記',
    genre: '무협 · 회귀',
    summary: '스무 해 전으로 돌아온 잡역이, 전생에 버렸던 사람들과 밥을 먹고 말을 섞으며, 그들의 마음이 맺힌 구슬로 강해진다. 그리고 전생에 그들을 태워 죽인 불을 막는다.',
    episodeCount: 24,
    isCompleted: true,
    isAvailable: true,
    badge: '새 이야기',
  },
  {
    id: 'fantasy-1',
    title: '천마의 서고',
    subtitle: '天魔之書庫',
    genre: '판타지 · 무협',
    summary: '금지된 서고의 문이 열리고, 잊혀진 마도의 구결이 빛을 발하기 시작했다.',
    episodeCount: 0,
    isCompleted: false,
    isAvailable: false,
    badge: '준비 중',
  },
  {
    id: 'fusion-1',
    title: '환생자의 장부',
    subtitle: '還生者之帳簿',
    genre: '퓨전 · 경제',
    summary: '천하를 뒤흔드는 것은 검만이 아니다. 상단의 장부를 쥐고 시작하는 새로운 패업.',
    episodeCount: 0,
    isCompleted: false,
    isAvailable: false,
    badge: '준비 중',
  },
];
