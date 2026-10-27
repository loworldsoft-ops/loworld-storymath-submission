import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { collection, deleteDoc, doc, onSnapshot, orderBy, query, setDoc } from 'firebase/firestore';
import type { GeoLocation, HwShellConfig, Stage, UserRole } from '../../services/models/curriculum.model';
import type { LwMemberRole } from '../../services/models/member.model';
import { CES_COUNTRY_CENTERS, CES_STAGE_TITLES, createCESStages } from '../../services/models/curriculum.model';
import { getShowcaseFirestore } from '../showcase-firebase.client';

/** 채번 규칙 (방 번호 / 수료증 번호) */
export interface StudyProgramNumbering {
  roomPrefix: string;
  roomPad: number;
  certPrefix: string;
  certRandomDigits: number;
}

/** `studyPrograms/{id}` 도큐먼트 스키마 — 셸 설정·채번·역할 매핑을 1개 문서로 통합 */
export interface StudyProgramDoc {
  id: string;
  appTitle: string;
  config: HwShellConfig;
  numbering: StudyProgramNumbering;
  defaults: { groupId: string; issuedByAdminId: string };
  roleMap: Record<UserRole, LwMemberRole>;
  active?: boolean;
}

/** DB 미존재/오프라인 시 사용하는 폴백 기본값 (라이브러리 상수 기반) */
const DEFAULT_CES_PROGRAM: StudyProgramDoc = {
  id: 'ces',
  appTitle: 'CES Mission',
  config: {
    mentorLabel: '멘토',
    loginLabel: '기독교 에센스 로그인',
    mapViewTitle: 'CES 선교지도',
    searchPlaceholder: '멘토/멘티 이름, 방 번호 검색...',
    completedLabel: '수료',
    certSectionTitle: '기독교 에센스 수료 현황',
    certEmptyText: '12과정을 모두 완료하면 교회 전자수료증이 발급됩니다.',
    certRequestBtnText: '수료 요청 (운영진 검토)',
    emptySelectionText: '좌측 목록에서 교육 방을 선택하세요.',
    listTabLabel: '교육 방',
    mapTabLabel: '선교지도',
    moreTabLabel: '더보기',
    totalStages: 12,
    statusLabels: {
      pending: '승인 대기',
      active: '교육 진행중',
      review: '수료 검토중',
      completed: '수료 완료',
      suspended: '중단',
    },
    stageTitles: CES_STAGE_TITLES as Record<number, string>,
  },
  numbering: { roomPrefix: 'CES-2026-', roomPad: 3, certPrefix: 'CES-2026-', certRandomDigits: 6 },
  defaults: { groupId: 'KR', issuedByAdminId: 'admin1' },
  roleMap: { ADMIN: 'ADMIN', GROUP_MENTOR: 'MANAGER', MENTOR: 'MANAGER', MENTEE: 'VIEWER' },
  active: true,
};

/**
 * hw-demo(CES Mission)의 **설정·커리큘럼·지역·채번·역할매핑**을 Firestore에서 읽어오는 로더.
 *
 * - `studyPrograms/{id}`          → 셸 설정/타이틀/채번/역할매핑
 * - `studyPrograms/{id}/stages/*` → 커리큘럼(단계 정의)
 * - `studyRegions/{groupId}`      → 지도 좌표
 *
 * DB가 우선이며, 문서가 없거나 구독 실패 시 라이브러리 상수(`DEFAULT_CES_PROGRAM` 등)를
 * 폴백으로 사용한다. 프로그램 문서가 없으면 최초 1회 기본값을 시드한다.
 */
@Injectable({ providedIn: 'root' })
export class StudyProgramService {
  private readonly destroyRef = inject(DestroyRef);
  private readonly fs = getShowcaseFirestore();
  private readonly programId = 'ces';
  private seeded = false;

  private readonly _program = signal<StudyProgramDoc>(DEFAULT_CES_PROGRAM);
  private readonly _stages = signal<Stage[]>(createCESStages());
  private readonly _regions = signal<Record<string, GeoLocation>>(CES_COUNTRY_CENTERS);

  readonly program = this._program.asReadonly();
  readonly stages = this._stages.asReadonly();
  readonly regions = this._regions.asReadonly();
  /** 코드 순으로 정렬된 나라 목록 (셸 입력용) */
  readonly regionList = computed<GeoLocation[]>(() =>
    Object.values(this._regions()).sort((a, b) => a.countryCode.localeCompare(b.countryCode)),
  );
  readonly config = computed<HwShellConfig>(() => this._program().config);
  readonly appTitle = computed(() => this._program().appTitle);

  constructor() {
    this.initFirestoreSubscriptions();
  }

  private initFirestoreSubscriptions(): void {
    const unsubProgram = onSnapshot(
      doc(this.fs, 'studyPrograms', this.programId),
      snap => {
        if (snap.exists()) {
          this._program.set(snap.data() as StudyProgramDoc);
        } else {
          this.seedDefaults();
        }
      },
      err => console.warn('[StudyProgram] program subscription error:', err),
    );

    const stagesQuery = query(
      collection(this.fs, `studyPrograms/${this.programId}/stages`),
      orderBy('number'),
    );
    const unsubStages = onSnapshot(
      stagesQuery,
      snap => {
        if (!snap.empty) {
          this._stages.set(snap.docs.map(d => d.data() as Stage));
        }
      },
      err => console.warn('[StudyProgram] stages subscription error:', err),
    );

    const unsubRegions = onSnapshot(
      collection(this.fs, 'studyRegions'),
      snap => {
        if (!snap.empty) {
          const map: Record<string, GeoLocation> = {};
          snap.docs.forEach(d => (map[d.id] = d.data() as GeoLocation));
          this._regions.set(map);
        }
      },
      err => console.warn('[StudyProgram] regions subscription error:', err),
    );

    this.destroyRef.onDestroy(() => {
      unsubProgram();
      unsubStages();
      unsubRegions();
    });
  }

  /** 프로그램 문서가 없으면 라이브러리 기본값으로 1회 시드 (콘솔에서 편집 가능하도록 DB에 적재) */
  private seedDefaults(): void {
    if (this.seeded) {
      return;
    }
    this.seeded = true;
    // 정본은 관리자만 쓸 수 있다(보안 규칙). 관리자가 아니면 쓰지 못하고, 그때는 메모리의 기본값으로 계속 간다.
    const write = (path: string, id: string, data: Record<string, unknown>) =>
      void setDoc(doc(this.fs, path, id), data, { merge: true }).catch(() => undefined);
    write('studyPrograms', this.programId, { ...DEFAULT_CES_PROGRAM, updatedAt: new Date().toISOString() });
    createCESStages().forEach(stage => write(`studyPrograms/${this.programId}/stages`, String(stage.number), { ...stage }));
    Object.entries(CES_COUNTRY_CENTERS).forEach(([groupId, geo]) => write('studyRegions', groupId, { groupId, ...geo }));
  }

  /** 현재 커리큘럼 단계 사본 (방 생성 시 사용) */
  currentStages(): Stage[] {
    return this._stages().map(stage => ({ ...stage }));
  }

  /** 방 번호 채번 (예: CES-2026-001) */
  buildRoomNumber(seq: number): string {
    const n = this._program().numbering;
    return `${n.roomPrefix}${String(seq).padStart(n.roomPad, '0')}`;
  }

  /** 수료증 번호 채번 (예: CES-2026-123456) */
  buildCertNumber(): string {
    const n = this._program().numbering;
    const max = Math.pow(10, n.certRandomDigits);
    return `${n.certPrefix}${String(Math.floor(Math.random() * max)).padStart(n.certRandomDigits, '0')}`;
  }

  /** 스터디 역할 → 전역 회원 역할 매핑 */
  mapRole(role: UserRole): LwMemberRole {
    return this._program().roleMap[role] ?? 'VIEWER';
  }

  /** 기본 그룹/발급 관리자 등 고정값 */
  get defaults(): { groupId: string; issuedByAdminId: string } {
    return this._program().defaults;
  }

  /** 나라(국가/지역) 등록·수정 — studyRegions/{countryCode} 문서에 저장 */
  upsertRegion(geo: GeoLocation): Promise<void> {
    const code = geo.countryCode.trim().toUpperCase();
    return setDoc(
      doc(this.fs, 'studyRegions', code),
      { groupId: code, ...geo, countryCode: code, updatedAt: new Date().toISOString() },
      { merge: true },
    );
  }

  /** 나라(국가/지역) 삭제 — studyRegions/{countryCode} 문서 제거 */
  deleteRegion(countryCode: string): Promise<void> {
    return deleteDoc(doc(this.fs, 'studyRegions', countryCode.trim().toUpperCase()));
  }
}
