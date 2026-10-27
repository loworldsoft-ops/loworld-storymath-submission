import { Injectable, computed, inject, signal, DestroyRef } from '@angular/core';
import { LW_ACCOUNT_LOGIN_BRIDGE } from '../../services/tokens/member-login-bridge.token';
import { LW_STORAGE_PORT } from '../../services/ports/storage.port';
import { type Certification, type CertMapMarker, type CreateMemberDto, type CreateRoomDto, type CreateStageDto, type GeoLocation, type CurriculumRoom, type HwShellConfig, type HwUserProfile, type StageNumber, type UserRole } from '../../services/models/curriculum.model';
import { type LoginSubmitPayload } from '../../services/models/auth.model';
import { buildCurriculumMapMarkers } from '../../services/utils/curriculum-map-markers';
import { countryFlagEmoji } from '../../services/utils/country-flags';
import { type LwMember, type LwMemberRole } from '../../services/models/member.model';
import { collection, deleteDoc, doc, getDocs, onSnapshot, setDoc } from 'firebase/firestore';
import { getShowcaseFirestore, createShowcaseAuthUserWithoutSigningOut, safeEmailLocalPart } from '../showcase-firebase.client';
import { LW_MEMBER_DIRECTORY_PORT } from '../../services/ports/member-directory.port';
import { StudyRegistrationService } from './curriculum-registration.service';
import { StudyProgramService } from './curriculum-program.service';

export interface ShowcaseStudyMember {
  id: string;
  name?: string;
  displayName?: string;
  role?: UserRole | string;
  contactPhone?: string;
  phone?: string;
  groupId?: string;
  country?: string;
  city?: string;
  seed?: boolean;
  avatarUrl?: string;
  updatedAt?: string;
  createdAt?: string;
  email?: string;
  status?: string;
}

/**
 * Single Responsibility: Showcase Homework Demo 비즈니스 로직, 스토어 및 데이터 소스 동기화 분리
 */
@Injectable({ providedIn: 'root' })
export class ShowcaseCurriculumDemoService {
  private readonly destroyRef = inject(DestroyRef);
  private readonly storage = inject(LW_STORAGE_PORT);
  private readonly directoryService = inject(LW_MEMBER_DIRECTORY_PORT);
  private readonly studyRegistration = inject(StudyRegistrationService);
  private readonly studyProgram = inject(StudyProgramService);
  private readonly memberLoginBridge = inject(LW_ACCOUNT_LOGIN_BRIDGE);

  /** 스터디 멤버 목록 — Firestore `studyMembers` 컬렉션 구독값 */
  readonly studyMembers = signal<ShowcaseStudyMember[]>([]);

  /** "학습 시작하기"로 스플래시를 넘긴 적이 있는지(로그인 상태에서만 넘길 수 있음) */
  readonly showHwDemoSplash = signal<boolean>(true);
  readonly showHwMobileDemoSplash = signal<boolean>(true);

  /**
   * 스플래시 노출 여부
   */
  readonly hwDemoSplashVisible = computed(() => !this.memberLoginBridge.accountView() || this.showHwDemoSplash());
  readonly hwMobileDemoSplashVisible = computed(() => !this.memberLoginBridge.accountView() || this.showHwMobileDemoSplash());

  /** 로그인 완료 시 스플래시에 표기할 환영 인사용 이름 */
  readonly hwSplashDisplayName = computed(() => this.memberLoginBridge.accountView()?.displayName ?? null);

  /** hw-demo / hw-mobile-demo 스플래시에 내장된 로그인 폼 상태 */
  readonly hwSplashLoginError = signal<string | null>(null);
  readonly hwSplashLoginSubmitting = computed(() => this.memberLoginBridge.submitting());

  readonly hwRooms = signal<CurriculumRoom[]>([]);
  readonly hwCertifications = signal<Record<string, Certification>>({});
  readonly hwEventLog = signal<string[]>([]);
  readonly hwMemberFeedback = signal<{ status: 'success' | 'error'; message: string; at: number } | null>(null);

  /** 과정 안내(커리큘럼) — 전체 12과정 */
  readonly hwCurriculum = computed(() => this.studyProgram.currentStages());

  get appTitle(): string { return this.studyProgram.appTitle(); }
  get shellConfig(): HwShellConfig { return this.studyProgram.config(); }

  readonly availablePortalMembers = computed<LwMember[]>(() => {
    return this.directoryService.members().filter(m => (m as LwMember & { seed?: boolean }).seed !== true);
  });

  readonly hwMentees = computed<HwUserProfile[]>(() => {
    return this.studyMembers()
      .filter(m => m.role === 'MENTEE' && m.seed !== true)
      .map(m => ({
        id: m.id,
        role: 'MENTEE' as UserRole,
        name: m.name || m.displayName || '',
        contactPhone: m.contactPhone || m.phone,
        groupId: m.groupId || undefined,
      }));
  });

  readonly hwMentors = computed<HwUserProfile[]>(() => {
    return this.studyMembers()
      .filter(m => (m.role === 'MENTOR' || m.role === 'GROUP_MENTOR' || m.role === 'ADMIN') && m.seed !== true)
      .map(m => ({
        id: m.id,
        role: m.role as UserRole,
        name: m.name || m.displayName || '',
        contactPhone: m.contactPhone || m.phone,
        groupId: m.groupId || undefined,
      }));
  });

  readonly hwUnassignedMentees = computed<HwUserProfile[]>(() => {
    const assignedIds = new Set(
      this.hwRooms().map(r => r.menteeId).filter((id): id is string => !!id),
    );
    return this.hwMentees().filter(m => !assignedIds.has(m.id));
  });

  readonly hwMapAllMarkers = computed<CertMapMarker[]>(() =>
    buildCurriculumMapMarkers(this.hwRooms(), {
      getCertificationForRoom: id => this.hwCertifications()[id],
      getMenteeCountry: id => this.studyMembers().find(m => m.id === id)?.groupId || undefined,
      regions: this.studyProgram.regions(),
    }),
  );

  readonly hwCertCount = computed(() => Object.keys(this.hwCertifications()).length);
  readonly hwCompletedCount = computed(() => this.hwRooms().filter(r => r.status === 'completed').length);
  readonly hwActiveCount = computed(() => this.hwRooms().filter(r => r.status === 'active').length);
  readonly hwRegions = computed<GeoLocation[]>(() => this.studyProgram.regionList());

  private demoMentorsSeeded = false;

  constructor() {
    this.initSubscriptions();
  }

  private initSubscriptions(): void {
    const fsDb = getShowcaseFirestore();

    const unsubStudyMembers = onSnapshot(collection(fsDb, 'studyMembers'), (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      this.studyMembers.set(list);
    }, err => {
      console.warn('[Showcase] studyMembers subscription error:', err);
      this.studyMembers.set([]);
    });

    const unsubRooms = onSnapshot(collection(fsDb, 'rooms'), (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CurriculumRoom));
      this.hwRooms.set(list);
    }, err => {
      console.warn('[Showcase] rooms subscription error:', err);
    });

    const unsubCertifications = onSnapshot(collection(fsDb, 'certifications'), (snapshot) => {
      const map: Record<string, Certification> = {};
      snapshot.docs.forEach(doc => {
        const cert = doc.data() as Certification;
        if (cert.roomId) {
          map[cert.roomId] = { ...cert, id: doc.id };
        }
      });
      this.hwCertifications.set(map);
    }, err => {
      console.warn('[Showcase] certifications subscription error:', err);
    });

    this.destroyRef.onDestroy(() => {
      unsubStudyMembers();
      unsubRooms();
      unsubCertifications();
    });
  }

  setHwMemberFeedback(status: 'success' | 'error', message: string): void {
    this.hwMemberFeedback.set({ status, message, at: Date.now() });
  }

  hwLog(msg: string): void {
    this.hwEventLog.update(l => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...l.slice(0, 49)]);
  }

  async hwSplashLogin(payload: LoginSubmitPayload): Promise<void> {
    this.hwSplashLoginError.set(null);
    try {
      await this.memberLoginBridge.loginInModal(payload);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '';
      if (message === 'FIREBASE_AUTH_NOT_ENABLED') {
        this.hwSplashLoginError.set('Firebase Authentication의 Email/Password 로그인이 아직 활성화되지 않았습니다.');
        return;
      }
      if (message === 'FIRESTORE_PERMISSION_DENIED') {
        this.hwSplashLoginError.set('Firestore 보안 규칙 때문에 멤버 프로필을 읽지 못했습니다.');
        return;
      }
      if (message === 'MEMBER_APP_UNAVAILABLE') {
        this.hwSplashLoginError.set('Loworld Member 앱(4304)에 연결할 수 없습니다.');
        return;
      }
      this.hwSplashLoginError.set('아이디/이메일 또는 비밀번호가 올바르지 않습니다.');
    }
  }

  private makeRoom(overrides: Partial<CurriculumRoom> & Pick<CurriculumRoom, 'id' | 'roomNumber' | 'mentorName' | 'menteeName' | 'menteeId' | 'status'> & { _complete?: number }): CurriculumRoom {
    const completedCount = overrides._complete ?? 0;
    const stages = this.studyProgram.currentStages().map((s, i) => ({
      ...s,
      completedAt: i < completedCount ? new Date(Date.now() - (completedCount - i) * 86400000).toISOString() : undefined,
    }));
    return {
      mentorId: 'm1',
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      stages,
      ...overrides,
    };
  }

  hwToggleStage({ roomId, stageNumber, completed, completedAt, memo }: { roomId: string; stageNumber: StageNumber; completed: boolean; completedAt: string | null; memo: string | null }): void {
    const room = this.hwRooms().find(r => r.id === roomId);
    if (!room) return;
    if (room.status === 'pending') {
      this.hwLog('toggleStage 차단: 수업 시작 전 (' + roomId + ')');
      return;
    }
    const stages = room.stages.map(s => s.number === stageNumber
      ? (completed
          ? { ...s, completedAt: completedAt ?? new Date().toISOString(), completionMemo: memo ?? undefined }
          : { ...s, completedAt: undefined, completionMemo: undefined })
      : s
    );
    const updatedRoom = { ...room, stages, updatedAt: new Date().toISOString() };

    const fsDb = getShowcaseFirestore();
    setDoc(doc(fsDb, 'rooms', roomId), updatedRoom, { merge: true }).then(() => {
      this.hwLog('toggleStage: ' + stageNumber + (completed ? ' 완료' : ' 취소'));
    }).catch(err => {
      console.error('[Showcase] Failed to update stage in Firestore:', err);
    });
  }

  hwStartClass(roomId: string): void {
    const room = this.hwRooms().find(r => r.id === roomId);
    if (!room || room.status !== 'pending') return;
    const updatedRoom = { ...room, status: 'active' as const, updatedAt: new Date().toISOString() };

    const fsDb = getShowcaseFirestore();
    setDoc(doc(fsDb, 'rooms', roomId), updatedRoom, { merge: true }).then(() => {
      this.hwLog('startClass: ' + roomId + ' → 진행중');
      this.setHwMemberFeedback('success', room.menteeName + ' 수업을 시작했습니다.');
    }).catch(err => {
      console.error('[Showcase] Failed to start class in Firestore:', err);
      this.setHwMemberFeedback('error', '수업 시작 실패: ' + this.hwMemberErrorMessage(err));
    });
  }

  hwRequestCert(roomId: string): void {
    const room = this.hwRooms().find(r => r.id === roomId);
    if (!room) return;
    const updatedRoom = { ...room, status: 'review' as const, updatedAt: new Date().toISOString() };

    const fsDb = getShowcaseFirestore();
    setDoc(doc(fsDb, 'rooms', roomId), updatedRoom, { merge: true }).then(() => {
      this.hwLog('requestCert: ' + roomId);
    }).catch(err => {
      console.error('[Showcase] Failed to request cert in Firestore:', err);
    });
  }

  hwApproveCert(roomId: string): void {
    const room = this.hwRooms().find(r => r.id === roomId);
    if (!room) return;
    const cert: Certification = {
      id: 'cert-' + roomId, roomId,
      menteeName: room.menteeName, mentorName: room.mentorName,
      completedAt: new Date().toISOString(), issuedAt: new Date().toISOString(),
      certificateNumber: this.studyProgram.buildCertNumber(),
      issuedByAdminId: this.studyProgram.defaults.issuedByAdminId,
    };

    const fsDb = getShowcaseFirestore();
    const batch = [
      setDoc(doc(fsDb, 'certifications', cert.id), cert),
      setDoc(doc(fsDb, 'rooms', roomId), {
        ...room,
        status: 'completed' as const,
        certificationId: cert.id,
        updatedAt: new Date().toISOString()
      }, { merge: true })
    ];

    Promise.all(batch).then(() => {
      this.hwLog('approveCert: ' + roomId + ' → ' + cert.certificateNumber);
    }).catch(err => {
      console.error('[Showcase] Failed to approve cert in Firestore:', err);
    });
  }

  hwDownloadCert(certId: string): void {
    this.hwLog('downloadCert: ' + certId);
  }

  hwMemoClick({ roomId, stageNumber }: { roomId: string; stageNumber: StageNumber }): void {
    this.hwLog('memoClick: room=' + roomId + ' stage=' + stageNumber);
  }

  hwGetCompletedStages(room: CurriculumRoom): number {
    return room.stages.filter(s => !!s.completedAt).length;
  }

  hwGetStatusLabel(status: string): string {
    const map: Record<string, string> = {
      active: '진행중', pending: '대기', completed: '수료', review: '검토중', suspended: '중단',
    };
    return map[status] ?? status;
  }

  hwCreateStage(dto: CreateStageDto): void {
    const room = this.hwRooms().find(r => r.id === dto.roomId);
    if (!room) return;
    const maxNum = room.stages.reduce((m, s) => Math.max(m, s.number), 0);
    const newStage = {
      number: maxNum + 1,
      title: dto.title,
      contentUrl: dto.contentUrl,
    };
    const updatedRoom = {
      ...room,
      stages: [...room.stages, newStage],
      updatedAt: new Date().toISOString()
    };

    const fsDb = getShowcaseFirestore();
    setDoc(doc(fsDb, 'rooms', dto.roomId), updatedRoom, { merge: true }).then(() => {
      this.hwLog('createStage: ' + dto.title + ' → ' + dto.roomId);
    }).catch(err => {
      console.error('[Showcase] Failed to add stage in Firestore:', err);
    });
  }

  hwMemberErrorMessage(err: unknown): string {
    const code = (err as { code?: string } | null)?.code;
    if (code === 'permission-denied') {
      return 'Firestore 보안 규칙에 의해 저장이 거부되었습니다. (members 읽기 / studyMembers 쓰기 권한 확인 필요)';
    }
    if (code === 'unavailable') {
      return 'Firestore 연결을 사용할 수 없습니다. 네트워크 상태를 확인하세요.';
    }
    return (err as { message?: string } | null)?.message ?? '알 수 없는 오류';
  }

  hwCreateMember(dto: CreateMemberDto): void {
    const isPortalRole = ['OWNER', 'ADMIN', 'MANAGER', 'VIEWER'].includes(dto.role);
    const resolvedEmail = dto.email?.trim() || (dto.loginId ? `${safeEmailLocalPart(dto.loginId.trim())}@example.com` : '');

    const createProfile = (uid?: string) => {
      if (isPortalRole) {
        this.directoryService.createMember({
          uid,
          displayName: dto.name,
          role: dto.role as LwMemberRole,
          phone: dto.contactPhone,
          email: resolvedEmail,
          loginId: dto.loginId
        }).then((createdUid) => {
          this.hwLog('✓ 포털 멤버 등록: ' + dto.name + ' (' + dto.role + ')');
          const studyRole = this.mapPortalRoleToStudyRole(dto.role);
          this.bindPortalMemberToStudyRoster({
            id: createdUid,
            role: studyRole,
            name: dto.name,
            contactPhone: dto.contactPhone,
            groupId: dto.groupId,
          });

          this.setHwMemberFeedback(
            'success',
            `${dto.name} 등록 완료 (멤버 관리에 ${this.hwStudyRoleLabel(studyRole)}로 반영됨)`,
          );
        }).catch(err => {
          console.error('[Showcase] Failed to create portal member:', err);
          const msg = this.hwMemberErrorMessage(err);
          this.hwLog('✗ 포털 멤버 등록 실패: ' + msg);
          this.setHwMemberFeedback('error', '등록 실패: ' + msg);
        });
      } else {
        const fsDb = getShowcaseFirestore();
        const optimisticId = uid || dto.memberId || doc(collection(fsDb, 'members')).id;
        this.addOptimisticStudyMember({
          id: optimisticId,
          role: dto.role as UserRole,
          name: dto.name,
          contactPhone: dto.contactPhone,
          groupId: dto.groupId,
        });

        this.studyRegistration.registerStudyMember({
          name: dto.name,
          role: dto.role as UserRole,
          contactPhone: dto.contactPhone,
          memberId: optimisticId,
          mentorId: dto.mentorId,
          mentorName: dto.mentorName,
          groupId: dto.groupId,
          loginId: dto.loginId,
          existingRoomCount: this.hwRooms().length,
        }).then(({ roomCreated, roomNumber }) => {
          this.hwLog('✓ 스터디 멤버 등록: ' + dto.name + ' (' + dto.role + ')');
          if (roomCreated) {
            this.hwLog('✓ 학습방 자동 생성: ' + roomNumber + ' / ' + dto.name);
          }
          this.setHwMemberFeedback('success', `${dto.name} 등록 완료`);
        }).catch(err => {
          this.removeOptimisticStudyMember(optimisticId);
          console.error('[Showcase] Failed to create and register member:', err);
          const msg = this.hwMemberErrorMessage(err);
          this.hwLog('✗ 스터디 멤버 등록 실패: ' + msg);
          this.setHwMemberFeedback('error', '등록 실패: ' + msg);
        });
      }
    };

    if (dto.password && resolvedEmail) {
      this.hwLog('⌛ Firebase Auth 계정 생성 중...');
      createShowcaseAuthUserWithoutSigningOut(resolvedEmail, dto.password)
        .then((uid) => {
          this.hwLog('✓ Firebase Auth 계정 생성 성공: ' + resolvedEmail);
          createProfile(uid);
        })
        .catch(err => {
          console.error('[Showcase] Auth account creation failed:', err);
          this.hwLog('✗ Auth 계정 생성 실패: ' + (err.message || String(err)));
          this.setHwMemberFeedback('error', '등록 실패 (Auth 계정 생성 오류): ' + (err.message || String(err)));
        });
    } else {
      createProfile();
    }
  }

  hwUpsertRegion(geo: GeoLocation): void {
    this.studyProgram.upsertRegion(geo)
      .then(() => {
        this.hwLog('✓ 나라 저장: ' + geo.countryNameKo + ' (' + geo.countryCode + ')');
        this.setHwMemberFeedback('success', `${geo.countryNameKo} 나라 저장 완료`);
      })
      .catch(err => {
        const msg = this.hwMemberErrorMessage(err);
        this.hwLog('✗ 나라 저장 실패: ' + msg);
        this.setHwMemberFeedback('error', '나라 저장 실패: ' + msg);
      });
  }

  hwDeleteRegion(countryCode: string): void {
    this.studyProgram.deleteRegion(countryCode)
      .then(() => {
        this.hwLog('✓ 나라 삭제: ' + countryCode);
        this.setHwMemberFeedback('success', `${countryCode} 나라 삭제됨`);
      })
      .catch(err => {
        const msg = this.hwMemberErrorMessage(err);
        this.hwLog('✗ 나라 삭제 실패: ' + msg);
        this.setHwMemberFeedback('error', '나라 삭제 실패: ' + msg);
      });
  }

  private addOptimisticStudyMember(entry: { id: string; role: UserRole; name: string; contactPhone?: string; groupId?: string }): void {
    const now = new Date().toISOString();
    this.studyMembers.update(list => {
      if (list.some(m => m.id === entry.id)) return list;
      return [
        { id: entry.id, role: entry.role, name: entry.name, contactPhone: entry.contactPhone, groupId: entry.groupId, createdAt: now, updatedAt: now },
        ...list,
      ];
    });
  }

  private removeOptimisticStudyMember(id: string): void {
    this.studyMembers.update(list => list.filter(m => m.id !== id));
  }

  private mapPortalRoleToStudyRole(portalRole: string): UserRole {
    switch (portalRole) {
      case 'OWNER':
      case 'ADMIN':
        return 'ADMIN';
      case 'MANAGER':
        return 'MENTOR';
      case 'VIEWER':
      default:
        return 'MENTEE';
    }
  }

  private hwStudyRoleLabel(role: UserRole): string {
    switch (role) {
      case 'ADMIN': return '관리자';
      case 'GROUP_MENTOR': return '그룹 멘토';
      case 'MENTOR': return '멘토';
      case 'MENTEE': return '멘티';
      default: return role;
    }
  }

  private bindPortalMemberToStudyRoster(entry: { id: string; role: UserRole; name: string; contactPhone?: string; groupId?: string }): void {
    this.addOptimisticStudyMember(entry);

    const fsDb = getShowcaseFirestore();
    const now = new Date().toISOString();
    setDoc(
      doc(fsDb, 'studyMembers', entry.id),
      {
        id: entry.id,
        role: entry.role,
        name: entry.name,
        contactPhone: entry.contactPhone || '',
        groupId: entry.groupId || '',
        createdAt: now,
        updatedAt: now,
      },
      { merge: true },
    ).catch(err => {
      this.removeOptimisticStudyMember(entry.id);
      console.error('[Showcase] Failed to bind portal member to study roster:', err);
      const msg = this.hwMemberErrorMessage(err);
      this.hwLog('✗ 멤버 관리 반영 실패: ' + msg);
      this.setHwMemberFeedback('error', '멤버 관리 반영 실패: ' + msg);
    });
  }

  hwDeleteMember(memberId: string): void {
    const fsDb = getShowcaseFirestore();
    const target = [...this.hwMentors(), ...this.hwMentees()].find(m => m.id === memberId);
    const label = target?.name ?? memberId;

    const previousStudyMembers = this.studyMembers();
    this.studyMembers.update(list => list.filter(m => m.id !== memberId));

    const removeMember = async () => {
      await deleteDoc(doc(fsDb, 'studyMembers', memberId));
      const roomId = `room-${memberId}`;
      if (this.hwRooms().some(r => r.id === roomId)) {
        await deleteDoc(doc(fsDb, 'rooms', roomId));
        this.hwLog('✓ 연결된 학습방 해제: ' + roomId);
      }
      this.hwLog('✓ 멤버 해제: ' + label);
    };
    removeMember()
      .then(() => this.setHwMemberFeedback('success', `${label} 해제됨`))
      .catch(err => {
        this.studyMembers.set(previousStudyMembers);
        console.error('[Showcase] Failed to delete study member:', err);
        const msg = this.hwMemberErrorMessage(err);
        this.hwLog('✗ 멤버 해제 실패: ' + msg);
        this.setHwMemberFeedback('error', '해제 실패: ' + msg);
      });
  }

  hwSetMemberCountry({ memberId, groupId }: { memberId: string; groupId: string }): void {
    const fsDb = getShowcaseFirestore();
    const target = [...this.hwMentors(), ...this.hwMentees()].find(m => m.id === memberId);
    const label = target?.name ?? memberId;
    const now = new Date().toISOString();
    const sync = async () => {
      await setDoc(doc(fsDb, 'studyMembers', memberId), { groupId, updatedAt: now }, { merge: true });
      const roomId = `room-${memberId}`;
      if (this.hwRooms().some(r => r.id === roomId)) {
        await setDoc(doc(fsDb, 'rooms', roomId), { groupId, updatedAt: now }, { merge: true });
      }
    };
    sync()
      .then(() => {
        const flag = countryFlagEmoji(groupId);
        this.hwLog(`✓ 나라 지정: ${label} → ${groupId ? flag + ' ' + groupId : '미지정'}`);
        this.setHwMemberFeedback('success', `${label} 나라 ${groupId ? '지정' : '해제'} 완료`);
      })
      .catch(err => {
        console.error('[Showcase] Failed to set member country:', err);
        const msg = this.hwMemberErrorMessage(err);
        this.hwLog('✗ 나라 지정 실패: ' + msg);
        this.setHwMemberFeedback('error', '나라 지정 실패: ' + msg);
      });
  }

  hwCreateRoom(dto: CreateRoomDto): void {
    const fsDb = getShowcaseFirestore();
    const roomId = `room-${Date.now()}`;
    const newRoom = this.makeRoom({
      id: roomId,
      roomNumber: dto.roomNumber,
      mentorName: dto.mentorName,
      mentorId: dto.mentorId || '',
      menteeName: dto.menteeName,
      menteeId: dto.menteeId || `u-${Date.now()}`,
      groupId: dto.groupId || 'KR',
      status: dto.status || 'active',
      _complete: 0,
    });
    setDoc(doc(fsDb, 'rooms', roomId), newRoom).then(() => {
      this.hwLog('✓ 학습방 등록: ' + dto.roomNumber + ' / ' + dto.menteeName);
    }).catch(err => {
      console.error('[Showcase] Failed to create room in Firestore:', err);
      this.hwLog('✗ 학습방 등록 실패: ' + this.hwMemberErrorMessage(err));
    });
  }

  hwAssignMentee(payload: { menteeId: string; menteeName: string; mentorId: string; mentorName: string; groupId?: string }): void {
    const existing = this.hwRooms().find(r => r.menteeId === payload.menteeId);
    if (existing) {
      const fsDb = getShowcaseFirestore();
      const patch: Record<string, unknown> = {
        mentorId: payload.mentorId,
        mentorName: payload.mentorName,
        updatedAt: new Date().toISOString(),
      };
      if (payload.groupId) patch['groupId'] = payload.groupId;
      void setDoc(
        doc(fsDb, 'rooms', existing.id),
        patch,
        { merge: true },
      )
        .then(() => {
          this.hwMemberFeedback.set({
            status: 'success',
            message: `${payload.menteeName} 멘티의 담당 멘토를 ${payload.mentorName}(으)로 변경했습니다.`,
            at: Date.now(),
          });
        })
        .catch((err: unknown) => {
          this.hwMemberFeedback.set({
            status: 'error',
            message: `멘토 재배정 실패: ${err instanceof Error ? err.message : String(err)}`,
            at: Date.now(),
          });
        });
      return;
    }
    void this.studyRegistration
      .assignMenteeToMentor({
        menteeId: payload.menteeId,
        menteeName: payload.menteeName,
        mentorId: payload.mentorId,
        mentorName: payload.mentorName,
        groupId: payload.groupId,
        existingRoomCount: this.hwRooms().length,
      })
      .then(() => {
        this.hwMemberFeedback.set({
          status: 'success',
          message: `${payload.menteeName} 멘티를 ${payload.mentorName} 멘토에게 지정하고 수업을 시작했습니다.`,
          at: Date.now(),
        });
      })
      .catch((err: unknown) => {
        this.hwMemberFeedback.set({
          status: 'error',
          message: `멘티 지정 실패: ${err instanceof Error ? err.message : String(err)}`,
          at: Date.now(),
        });
      });
  }
}
