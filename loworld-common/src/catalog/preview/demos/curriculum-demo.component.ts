import { LwButtonComponent } from '../../../ui/form/button/button.component';
import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import type { ComponentMeta, OverviewThemeMode } from '../../../services/models/os.types';
import type { CurriculumRoom, Stage, Certification, StageNumber, CreateStageDto, RoomStatus } from '../../../services/models/curriculum.model';
import { createDefaultStages } from '../../../services/models/curriculum.model';
import { LwBadgeComponent } from '../../../ui/data-display/badge/badge.component';
import { LwCertificationPanelComponent, LwCertificationPanelComponent as LwStudyCertificationPanelComponent } from '../../../patterns/surface/panels/certification-panel/certification-panel.component';
import { LwStageProgressListComponent, LwStageProgressListComponent as LwStudyStageListComponent } from '../../../patterns/collection/lists/stage-progress-list/stage-progress-list.component';
import { LwClassroomCardComponent, LwClassroomCardComponent as LwStudyRoomCardComponent } from '../../../patterns/collection/items/classroom-card/classroom-card.component';
import { LwStepProgressComponent, LwStepProgressComponent as LwStudyStepProgressComponent } from '../../../patterns/collection/lists/step-progress/step-progress.component';
import { LwStageWorldMapComponent } from '../../../patterns/surface/spatial/stage-world-map/stage-world-map.component';
import { studyRoomStatusBadge } from '../../../services/utils/classroom-status-badge';
import { SAMPLE_HW_ROOMS, SAMPLE_HW_CERTIFICATIONS, SAMPLE_HW_MARKERS } from '../../../services/data/layout-sample-data';

const now = new Date().toISOString();

function makeStages(completedCount: number): Stage[] {
  return createDefaultStages().map((s, i) => ({
    ...s,
    completedAt: i < completedCount ? new Date(Date.now() - (completedCount - i) * 86400000).toISOString() : undefined,
  }));
}

const MOCK_ROOM_ACTIVE: CurriculumRoom = {
  id: 'room-1', roomNumber: 'R-001',
  mentorId: 'm1', mentorName: '김멘토',
  menteeId: 'u1', menteeName: '박학생',
  status: 'active', stages: makeStages(8),
  createdAt: now, updatedAt: now,
};

const MOCK_ROOM_COMPLETED: CurriculumRoom = {
  id: 'room-2', roomNumber: 'R-002',
  mentorId: 'm1', mentorName: '김멘토',
  menteeId: 'u2', menteeName: '이완료',
  status: 'completed', stages: makeStages(16),
  certificationId: 'cert-1',
  createdAt: now, updatedAt: now,
};

const MOCK_CERT: Certification = {
  id: 'cert-1', roomId: 'room-2',
  menteeName: '이완료', mentorName: '김멘토',
  completedAt: new Date(Date.now() - 14 * 86400000).toISOString(),
  issuedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
  certificateNumber: 'CES-2026-0042',
  issuedByAdminId: 'admin-1',
};

import { HW_MAP_RENDERER } from '../../../services/tokens/map-renderer.token';
import { LeafletMapRendererService } from './services/leaflet-map-renderer.service';

import { LwTitlebarFrameComponent } from '../../../ui/navigation/titlebar/titlebar.component';
import { LwUnifiedListItemComponent } from '../../../ui/list/unified-list-item/unified-list-item.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'lw-curriculum-demo',
  standalone: true,
  providers: [
    { provide: HW_MAP_RENDERER, useClass: LeafletMapRendererService },
  ],
  imports: [
    LwBadgeComponent,
    LwStepProgressComponent,
    LwStageProgressListComponent,
    LwClassroomCardComponent,
    LwCertificationPanelComponent,
    LwStageWorldMapComponent,
    LwButtonComponent,
    LwTitlebarFrameComponent,
    LwUnifiedListItemComponent,
  ],
  templateUrl: './curriculum-demo.component.html',
  styleUrl: './curriculum-demo.component.scss',
})
export class CurriculumDemoComponent {
  protected readonly studyRoomStatusBadge = studyRoomStatusBadge;
  protected readonly roomStatusSamples: readonly RoomStatus[] = [
    'active',
    'review',
    'completed',
    'pending',
    'suspended',
  ];

  readonly comp = input.required<ComponentMeta>();
  readonly themeMode = input<OverviewThemeMode>('light');
  readonly roomCardSel = signal(false);
  readonly canApprove  = signal(false);
  readonly certState   = signal<'none' | 'issued'>('none');

  readonly stages8  = makeStages(8);
  readonly stages16 = makeStages(16);
  readonly stages0  = makeStages(0);

  readonly activeRoom    = computed(() => MOCK_ROOM_ACTIVE);
  readonly completedRoom = computed(() => MOCK_ROOM_COMPLETED);
  readonly mockCert      = computed((): Certification | null => this.certState() === 'issued' ? MOCK_CERT : null);

  // ── Shell 샘플 데이터 ──
  readonly hwRooms          = signal<CurriculumRoom[]>([...SAMPLE_HW_ROOMS]);
  readonly hwCertifications = signal<Record<string, Certification>>({ ...SAMPLE_HW_CERTIFICATIONS });
  readonly hwMarkers        = SAMPLE_HW_MARKERS;

  hwToggleStage({ roomId, stageNumber }: { roomId: string; stageNumber: StageNumber }): void {
    this.hwRooms.update(rooms => rooms.map(r => {
      if (r.id !== roomId) return r;
      const stages = r.stages.map(s => s.number === stageNumber
        ? { ...s, completedAt: s.completedAt ? undefined : new Date().toISOString() }
        : s
      );
      return { ...r, stages, updatedAt: new Date().toISOString() };
    }));
  }

  hwRequestCert(roomId: string): void {
    this.hwRooms.update(rooms => rooms.map(r =>
      r.id === roomId ? { ...r, status: 'review' as const, updatedAt: new Date().toISOString() } : r
    ));
  }

  hwCreateStage(dto: CreateStageDto): void {
    this.hwRooms.update(rooms =>
      rooms.map(r => {
        if (r.id !== dto.roomId) return r;
        const maxNum = r.stages.reduce((m, s) => Math.max(m, s.number), 0);
        const newStage = {
          number:     maxNum + 1,
          title:      dto.title,
          contentUrl: dto.contentUrl,
        };
        return { ...r, stages: [...r.stages, newStage], updatedAt: new Date().toISOString() };
      }),
    );
  }

  hwApproveCert(roomId: string): void {
    const room = this.hwRooms().find(r => r.id === roomId);
    if (!room) return;
    const cert: Certification = {
      id: 'cert-' + roomId, roomId,
      menteeName: room.menteeName, mentorName: room.mentorName,
      completedAt: new Date().toISOString(), issuedAt: new Date().toISOString(),
      certificateNumber: 'CES-2026-' + String(Math.floor(Math.random() * 999999)).padStart(6, '0'),
      issuedByAdminId: 'admin1',
    };
    this.hwCertifications.update(m => ({ ...m, [roomId]: cert }));
    this.hwRooms.update(rooms => rooms.map(r =>
      r.id === roomId ? { ...r, status: 'completed' as const, certificationId: cert.id, updatedAt: new Date().toISOString() } : r
    ));
  }

  protected noop(): void {}
}
