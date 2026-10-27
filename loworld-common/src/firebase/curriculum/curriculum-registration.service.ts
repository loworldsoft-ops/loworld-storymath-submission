import { Injectable, inject } from '@angular/core';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { CurriculumRoom, UserRole } from '../../services/models/curriculum.model';
import { getShowcaseFirestore, safeEmailLocalPart } from '../showcase-firebase.client';
import { LW_MEMBER_DIRECTORY_PORT } from '../../services/ports/member-directory.port';
import { StudyProgramService } from './curriculum-program.service';

/** 스터디 멤버(멘토/멘티) 등록 입력 */
export interface RegisterStudyMemberInput {
  /** 표시 이름 */
  name: string;
  /** 스터디 역할 */
  role: UserRole;
  /** 연락처 */
  contactPhone?: string;
  /** 연동할 포털 회원 ID (생략 시 신규 생성) */
  memberId?: string;
  /** 담당 멘토 ID (MENTEE일 때만 사용) */
  mentorId?: string;
  /** 담당 멘토 이름 */
  mentorName?: string;
  /** 배정 수업 나라 국가코드 (MENTOR/MENTEE의 groupId) */
  groupId?: string;
  /** 로그인 ID (한글/영문 가능) */
  loginId?: string;
  /** 현재 총 학습방 개수 (MENTEE 등록 시 방 번호 생성용) */
  existingRoomCount?: number;
}

export interface RegisterStudyMemberResult {
  /** 등록된 studyMembers 도큐먼트 ID(= 포털 members.uid) */
  memberId: string;
  /** MENTEE 학습방 자동 생성 여부 */
  roomCreated: boolean;
  /** 생성된 학습방 번호(생성된 경우) */
  roomNumber?: string;
}

/**
 * 멘토/멘티 등록의 단일 진입 로직.
 *
 * `hw-demo`(셸 멤버 등록)와 `db-console`(스터디 등록 폼)이 동일한 규칙으로
 * Firestore `studyMembers`(필요 시 `members`/`rooms`)에 기록하도록 공유한다.
 *
 * 규칙:
 *  - `memberId`가 있으면 해당 포털 uid를 그대로 `studyMembers` Doc ID로 사용.
 *  - 없으면 전역 `members`에 신규 회원을 만들고(역할 매핑) 그 uid를 사용.
 *  - 역할이 `MENTEE`면 `rooms/{room-uid}` 학습방을 자동 생성.
 */
@Injectable({ providedIn: 'root' })
export class StudyRegistrationService {
  private readonly directory = inject(LW_MEMBER_DIRECTORY_PORT);
  private readonly program = inject(StudyProgramService);

  async registerStudyMember(input: RegisterStudyMemberInput): Promise<RegisterStudyMemberResult> {
    const fsDb = getShowcaseFirestore();

    // 1) 포털 회원 uid 확보 (지정 없으면 전역 회원 신규 생성)
    let memberId = input.memberId;
    if (!memberId) {
      memberId = await this.directory.createMember({
        displayName: input.name,
        role: this.program.mapRole(input.role),
        phone: input.contactPhone,
        loginId: input.loginId,
      });
    } else {
      // If memberId is provided (e.g. from newly created Auth user), we must ensure
      // a portal member document exists in Firestore under the same ID!
      const memberRef = doc(fsDb, 'members', memberId);
      const memberSnap = await getDoc(memberRef);
      if (!memberSnap.exists()) {
        const resolvedEmail = input.loginId ? `${safeEmailLocalPart(input.loginId.trim())}@example.com` : '';
        await this.directory.createMember({
          uid: memberId,
          displayName: input.name,
          role: this.program.mapRole(input.role),
          phone: input.contactPhone,
          loginId: input.loginId,
          email: resolvedEmail,
        });
      }
    }

    // 2) studyMembers 등록 (Doc ID = 포털 uid)
    const now = new Date().toISOString();
    await setDoc(
      doc(fsDb, 'studyMembers', memberId),
      {
        id: memberId,
        role: input.role,
        name: input.name,
        contactPhone: input.contactPhone || '',
        groupId: input.groupId || '',
        createdAt: now,
        updatedAt: now,
      },
      { merge: true },
    );

    // 3) MENTEE이고 담당 멘토가 지정된 경우에만 학습방(pending) 생성
    let roomCreated = false;
    let roomNumber: string | undefined;
    if (input.role === 'MENTEE' && input.mentorId) {
      const nextNum = (input.existingRoomCount ?? 0) + 1;
      roomNumber = this.program.buildRoomNumber(nextNum);
      const roomId = `room-${memberId}`;
      await setDoc(doc(fsDb, 'rooms', roomId), this.buildCesRoom({
        id: roomId,
        roomNumber,
        menteeName: input.name,
        menteeId: memberId,
        mentorId: input.mentorId,
        mentorName: input.mentorName || '',
        groupId: input.groupId,
      }));
      roomCreated = true;
    }

    return { memberId, roomCreated, roomNumber };
  }

  /** `app.ts`의 makeRoom과 동일 규칙으로 CES 학습방 도큐먼트를 만든다. */
  private buildCesRoom(input: { id: string; roomNumber: string; menteeName: string; menteeId: string; mentorId: string; mentorName: string; status?: CurriculumRoom['status']; groupId?: string }): CurriculumRoom {
    const now = new Date().toISOString();
    return {
      id: input.id,
      roomNumber: input.roomNumber,
      mentorId: input.mentorId,
      mentorName: input.mentorName,
      menteeId: input.menteeId,
      menteeName: input.menteeName,
      groupId: input.groupId || this.program.defaults.groupId,
      // 등록 시 멘토 동시 지정은 '시작 전'(pending), 멘티 지정(즉시 시작)은 'active'
      status: input.status ?? 'pending',
      createdAt: now,
      updatedAt: now,
      stages: this.program.currentStages(),
    };
  }

  /**
   * 멘토가 미배정 멘티를 자신(또는 지정 멘토)에게 배정한다.
   * 지정 = 수업 시작으로 간주하여 `rooms/room-{menteeId}` 학습방을 `active`(진행 중)로 생성한다.
   */
  async assignMenteeToMentor(input: {
    menteeId: string;
    menteeName: string;
    mentorId: string;
    mentorName: string;
    existingRoomCount?: number;
    groupId?: string;
  }): Promise<{ roomId: string; roomNumber: string }> {
    const fsDb = getShowcaseFirestore();
    const nextNum = (input.existingRoomCount ?? 0) + 1;
    const roomNumber = this.program.buildRoomNumber(nextNum);
    const roomId = `room-${input.menteeId}`;
    await setDoc(doc(fsDb, 'rooms', roomId), this.buildCesRoom({
      id: roomId,
      roomNumber,
      menteeName: input.menteeName,
      menteeId: input.menteeId,
      mentorId: input.mentorId,
      mentorName: input.mentorName,
      status: 'active',
      groupId: input.groupId,
    }));
    return { roomId, roomNumber };
  }
}
