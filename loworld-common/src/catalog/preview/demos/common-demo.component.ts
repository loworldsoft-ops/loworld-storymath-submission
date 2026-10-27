import { LwUiFeedbackService } from '../../../services/services/lw-ui-feedback.service';
import { ChangeDetectionStrategy, Component, inject, input, signal, computed } from '@angular/core';
import { CommonModule, UpperCasePipe } from '@angular/common';
import { ComponentMeta } from '../../../services/models/os.types';
import { LwBadgeComponent } from '../../../ui/data-display/badge/badge.component';
import { LwProgressBarComponent } from '../../../ui/data-display/progress-bar/progress-bar.component';
import { LwAvatarComponent } from '../../../ui/data-display/avatar/avatar.component';
import { LwChipComponent } from '../../../ui/data-display/chip/chip.component';
import { LwSearchInputComponent } from '../../../ui/form/search-input/search-input.component';
import { LwButtonComponent } from '../../../ui/form/button/button.component';
import { LwCheckboxComponent } from '../../../ui/form/checkbox/checkbox.component';
import { LwAppIconComponent } from '../../../ui/data-display/app-icon/app-icon.component';
import { LwListComponent } from '../../../ui/list/list.component';
import { LwListItemComponent } from '../../../ui/list/list-item.component';
import { LwListHeaderComponent } from '../../../ui/list/list-header.component';
import { LwGridComponent } from '../../../ui/layout/grid/grid.component';
import { LwInformationalBadgeComponent } from '../../../ui/data-display/informational-badge/informational-badge.component';
import { LwUnifiedListItemComponent } from '../../../ui/list/unified-list-item/unified-list-item.component';
import { LwEmptyStateComponent } from '../../../ui/data-display/empty-state/empty-state.component';
import { LwFabComponent } from '../../../ui/navigation/fab/fab.component';
import { LwTitlebarFrameComponent } from '../../../ui/navigation/titlebar/titlebar.component';
import { LwSelectableListComponent } from '../../../ui/list/selectable-list/selectable-list.component';
import { LwCardComponent } from '../../../ui/data-display/card/card.component';
import { LwUnifiedCardItemComponent } from '../../../ui/data-display/unified-card-item/unified-card-item.component';
import { LwTooltipComponent } from '../../../ui/overlay/tooltip/tooltip.component';
import { LwTooltipDirective } from '../../../ui/overlay/tooltip/tooltip.directive';
import { LwModalComponent } from '../../../ui/overlay/modal/modal.component';
import { type LwModalVariant, type LwModalSize, type LwModalTone, type LwModalWindowStyle } from '../../../ui/overlay/modal/modal.types';
import { type LwTooltipPlacement, type LwTooltipVariant, type LwTooltipSize } from '../../../services/tokens/tooltip.tokens';
import { DEMO_MODAL_FORM_FIELDS, DEMO_MODAL_SELECTION_ITEMS, DEMO_MODAL_WIZARD_STEPS, DEMO_MODAL_SETTINGS_TABS, SAMPLE_CARD_ITEM, SELECTABLE_DEMO_ITEMS } from './common-demo.data';
import { LwDocsArticlePageComponent } from '../../../patterns/collection/docs/article-page/docs-article-page.component';
import { LwDocsPdfModalComponent } from '../../../patterns/collection/docs/pdf-modal/lw-docs-pdf-modal.component';
import { LwSectionHeaderComponent } from '../../../ui/data-display/section-header/section-header.component';
import type { DocArticle, DocNavNode, DocPdfItem } from '../../../patterns/collection/docs/docs.models';
import type { LwMetricSummary } from '../../../patterns/collection/analytics/analytics.models';
import { LwModelDetailDrawerComponent } from '../../../patterns/collection/console/credentials/lw-model-detail-drawer.component';
import { LwConsoleProfileModalComponent } from '../../../patterns/collection/console/profile/lw-console-profile-modal.component';
import { LwConsoleShellComponent } from '../../../patterns/collection/console/shell/lw-console-shell.component';
import type { ConsoleGroup, ConsoleModel, ConsoleUser, OrgRole, RbacRoleMatrixRow } from '../../../patterns/collection/console/console.models';
import { LwPipelineStepperComponent } from '../../../patterns/collection/pipeline/pipeline-stepper.component';
import type { LwPipelineStepItem } from '../../../patterns/collection/pipeline/pipeline.models';
import { LwPromptDiffViewerComponent } from '../../../patterns/collection/prompt/prompt-diff-viewer.component';
import { LwRbacPermissionMatrixComponent } from '../../../patterns/collection/rbac/lw-rbac-permission-matrix.component';
import { LwWorkflowCanvasComponent } from '../../../patterns/collection/workflow/workflow-canvas.component';
import type { LwWorkflowEdge, LwWorkflowNode } from '../../../patterns/collection/workflow/workflow.models';
import { LwDialogHostComponent } from '../../../ui/overlay/dialog/lw-dialog-host.component';
import { LwSnackbarHostComponent } from '../../../ui/overlay/snackbar/lw-snackbar-host.component';
import { LwSnackbarComponent } from '../../../ui/overlay/snackbar/lw-snackbar.component';
import { LwDocsArticleViewerComponent } from '../../../patterns/collection/docs/article-viewer/lw-docs-article-viewer.component';
import { LwDocsNavTreeComponent } from '../../../patterns/collection/docs/nav-tree/lw-docs-nav-tree.component';
import { LwOnThisPageTocComponent } from '../../../patterns/collection/docs/toc/lw-on-this-page-toc.component';
import { LwConsoleSidebarComponent } from '../../../patterns/collection/console/shell/sidebar/lw-console-sidebar.component';
import { LwSideMenuSectionComponent } from '../../../ui/navigation/side-menu/side-menu-section.component';
import { LwMenuItemComponent } from '../../../ui/overlay/menu/menu-item.component';
import { LwColorPickerComponent } from '../../../ui/form/color-picker/color-picker.component';
import { LwSheetTitleComponent } from '../../../ui/overlay/sheet-title/sheet-title.component';
import { LwFilterableListShellComponent } from '../../../ui/list/filterable-list-shell/filterable-list-shell.component';
import { LwWorkflowNodeComponent } from '../../../patterns/collection/workflow/workflow-node.component';
import { LwComponentVesselComponent } from '../../../patterns/collection/panels/component-vessel/component-vessel.component';
import { EventLogComponent } from '../../../ui/feedback/event-log/event-log.component';
import { LwSpinnerComponent } from '../../../ui/feedback/spinner/spinner.component';
import { LwMarkedTextComponent } from '../../../ui/typography/marked-text/marked-text.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'lw-common-demo',
  standalone: true,
  imports: [
    CommonModule, UpperCasePipe,
    LwButtonComponent, LwCheckboxComponent, LwBadgeComponent, LwProgressBarComponent,
    LwAvatarComponent, LwChipComponent, LwSearchInputComponent, LwCardComponent,
    LwUnifiedCardItemComponent, LwModalComponent, LwTooltipComponent, LwTooltipDirective,
    LwAppIconComponent, LwListComponent, LwListItemComponent, LwListHeaderComponent,
    LwGridComponent, LwInformationalBadgeComponent, LwUnifiedListItemComponent,
    LwEmptyStateComponent, LwFabComponent, LwTitlebarFrameComponent, LwSelectableListComponent,
    LwDocsArticlePageComponent, LwDocsPdfModalComponent, LwSectionHeaderComponent,
    LwModelDetailDrawerComponent, LwConsoleProfileModalComponent,
    LwConsoleShellComponent, LwPipelineStepperComponent, LwPromptDiffViewerComponent,
    LwRbacPermissionMatrixComponent, LwWorkflowCanvasComponent,
    LwDialogHostComponent, LwSnackbarHostComponent,
    LwSnackbarComponent, LwDocsArticleViewerComponent, LwDocsNavTreeComponent,
    LwOnThisPageTocComponent, LwConsoleSidebarComponent, LwSideMenuSectionComponent,
    LwMenuItemComponent, LwColorPickerComponent, LwSheetTitleComponent,
    LwFilterableListShellComponent, LwWorkflowNodeComponent, LwComponentVesselComponent,
    EventLogComponent, LwSpinnerComponent, LwMarkedTextComponent,
  ],
  templateUrl: './common-demo.component.html',
  styleUrl: './common-demo.component.scss',
})
export class CommonDemoComponent {
  readonly comp = input.required<ComponentMeta>();
  private readonly feedbackService = inject(LwUiFeedbackService);

  protected readonly lastResult = signal<string | null>(null);
  protected readonly sampleReadingSegments = [
    { text: '옛날 옛적 ', state: 'past' as const },
    { text: '깊은 숲속에 ', state: 'now' as const },
    { text: '호랑이가 살았습니다.', state: 'ahead' as const },
  ];

  protected readonly demoNavNodes: readonly DocNavNode[] = [
    { type: 'page', name: '시작하기', url: '/intro' },
    { type: 'page', name: '컴포넌트 가이드', url: '/components' },
  ];
  protected readonly demoColor = signal('#3b82f6');

  protected readonly demoDocArticle: DocArticle = {
    path: '/intro',
    title: '시작하기',
    desc: 'Loworld 디자인 시스템 가이드입니다.',
    html: '<p>시스템의 기본 원칙과 규격을 설명합니다.</p>',
    toc: [{ id: 'overview', text: '개요', depth: 2 }],
  };
  protected readonly demoPdfItems: readonly DocPdfItem[] = [
    { key: 'p1', label: '시작하기 문서', group: '일반' },
  ];
  protected readonly demoPdfModalOpen = signal(false);

  protected readonly demoProfileModalOpen = signal(false);
  protected readonly demoConsoleUser: ConsoleUser = {
    name: '관리자',
    email: 'admin@loworld.io',
    roleLabel: '최고 관리자',
  };
  protected readonly demoConsoleGroup: ConsoleGroup = {
    id: 'g1',
    name: '기본 워크스페이스',
    path: '/root',
    count: 5,
    role: 'admin',
  };
  protected readonly demoConsoleModel: ConsoleModel = {
    idx: 0,
    provider: 'OpenAI',
    name: 'GPT-4o',
    id: 'gpt-4o',
    type: 'LLM',
    key: 'registered',
    keyName: 'default-key',
    enabled: true,
    deprecated: null,
    ctx: 128000,
    maxOut: 4096,
    scope: ['workspace', 'playground'],
    price: [5, 15],
  };
  protected readonly demoPipelineSteps: readonly LwPipelineStepItem[] = [
    {
      id: 's1',
      stage: 'ingest',
      title: '문서 수집',
      description: 'PDF 및 웹 문서 추출 완료',
      status: 'completed',
    },
    {
      id: 's2',
      stage: 'chunk',
      title: '단락 분할 (Chunking)',
      description: '의미론적 청킹 및 토큰 계산 중',
      status: 'running',
    },
  ];
  protected readonly demoPromptOld = 'You are a helpful AI assistant. Answer briefly.';
  protected readonly demoPromptNew = 'You are an expert AI assistant specialized in Angular. Answer with detailed code examples.';
  protected readonly demoRbacRoles: readonly OrgRole[] = [
    { id: 'admin', name: '관리자', desc: '전체 설정 및 삭제 권한', tone: 'danger' },
    { id: 'member', name: '멤버', desc: '일반 조회 및 편집 권한', tone: 'neutral' },
  ];
  protected readonly demoRbacMatrix: readonly RbacRoleMatrixRow[] = [
    { domain: 'docs', domainLabel: '문서', owner: true, admin: true, manager: true, member: true },
    { domain: 'billing', domainLabel: '결제', owner: true, admin: true, manager: false, member: false },
  ];
  protected readonly demoWorkflowNodes: readonly LwWorkflowNode[] = [
    {
      id: 'n1',
      type: 'start',
      title: '사용자 입력',
      position: { x: 40, y: 40 },
      inputs: [],
      outputs: [{ id: 'out1', label: '쿼리' }],
    },
    {
      id: 'n2',
      type: 'llm',
      title: 'LLM 생성기',
      position: { x: 320, y: 40 },
      inputs: [{ id: 'in1', label: '프롬프트' }],
      outputs: [{ id: 'out2', label: '응답' }],
    },
  ];
  protected readonly demoWorkflowEdges: readonly LwWorkflowEdge[] = [
    {
      id: 'e1',
      sourceNodeId: 'n1',
      sourcePortId: 'out1',
      targetNodeId: 'n2',
      targetPortId: 'in1',
    },
  ];

  protected noop(): void {}

  // ── Unified Modal (lw-modal) Demo States ──
  protected readonly demoModalOpen = signal(false);
  protected readonly demoModalVariant = signal<LwModalVariant>('confirm');
  protected readonly demoModalSize = signal<LwModalSize>('md');
  protected readonly demoModalTone = signal<LwModalTone>('danger');
  protected readonly demoModalWindowStyle = signal<LwModalWindowStyle>('os-desktop');
  protected readonly demoModalWindowControls = signal<boolean>(true);
  protected readonly demoModalAllowMaximize = signal<boolean>(true);
  protected readonly demoModalDraggable = signal<boolean>(true);
  protected readonly demoModalGlassmorphism = signal<boolean>(true);
  protected readonly demoModalLightBackground = signal<boolean>(true);

  protected readonly demoModalFormFields = DEMO_MODAL_FORM_FIELDS;
  protected readonly demoModalSelectionItems = DEMO_MODAL_SELECTION_ITEMS;
  protected readonly demoModalWizardSteps = DEMO_MODAL_WIZARD_STEPS;
  protected readonly demoModalSettingsTabs = DEMO_MODAL_SETTINGS_TABS;

  protected readonly resolvedDemoModalTitle = computed(() => {
    switch (this.demoModalVariant()) {
      case 'confirm': return '영구 삭제 확인 (Confirm)';
      case 'form': return '계정 및 권한 등록 (Form)';
      case 'selection': return '대상 폴더 선택 (Selection)';
      case 'wizard': return '외부 서비스 연동 마법사 (Wizard)';
      case 'settings': return '통합 환경설정 (Settings)';
      case 'custom': return '커스텀 슬롯 프로젝션 (Custom)';
    }
  });

  protected readonly resolvedDemoModalDesc = computed(() => {
    switch (this.demoModalVariant()) {
      case 'confirm': return '데이터를 영구 삭제하기 전에 확인합니다.';
      case 'form': return '동적 폼 필드를 통한 사용자 입력을 수집합니다.';
      case 'selection': return '문서를 보관할 대상 위치를 지정하세요.';
      case 'wizard': return '단계별 안내 및 진행 인디케이터를 제공합니다.';
      case 'settings': return '탭형 인터페이스로 다양한 카테고리를 분할 구성합니다.';
      case 'custom': return '어떤 자유 UI도 자식 슬롯으로 투영할 수 있습니다.';
    }
  });

  protected readonly demoModalMessage = computed(() => {
    return '정말로 [볼카노스] 캐릭터 데이터를 영구 삭제하시겠습니까?';
  });

  protected readonly demoModalDetail = computed(() => {
    return '삭제된 캐릭터의 착용 장비 및 D2R 룬워드 보관함 기록은 복구할 수 없습니다.';
  });

  protected onDemoModalConfirm(): void {
    this.lastResult.set('[lw-modal:confirm] 확인 버튼 클릭 (Confirmed)');
    this.feedbackService.showSuccess('확인 액션이 실행되었습니다.');
  }

  protected onDemoModalCancel(): void {
    this.lastResult.set('[lw-modal:confirm] 취소 버튼 클릭 (Cancelled)');
    this.feedbackService.showInfo('취소되었습니다.');
  }

  protected onDemoModalFormSubmit(val: Record<string, any>): void {
    const serialized = JSON.stringify(val);
    this.lastResult.set(`[lw-modal:form] 제출 성공: ${serialized}`);
    this.feedbackService.showSuccess(`폼 제출 완료: ${serialized}`);
  }

  protected onDemoModalItemSelect(id: string): void {
    this.lastResult.set(`[lw-modal:selection] 선택된 항목 ID: ${id}`);
    this.feedbackService.showSuccess(`항목 선택 완료: ${id}`);
  }

  protected onDemoModalStepChange(stepIdx: number): void {
    this.lastResult.set(`[lw-modal:wizard] 스텝 전환: ${stepIdx + 1}단계`);
  }

  protected onDemoModalWizardComplete(): void {
    this.lastResult.set('[lw-modal:wizard] 위저드 완료 (Completed)');
    this.feedbackService.showSuccess('위저드 전 과정이 성공적으로 완료되었습니다!');
  }

  protected onDemoModalTabChange(tabId: string): void {
    this.lastResult.set(`[lw-modal:settings] 탭 전환: ${tabId}`);
  }

  protected onDemoModalClose(): void {
    // modal closed
  }

  // ── Tooltip Demo States ──
  protected readonly demoTooltipPlacement = signal<LwTooltipPlacement>('top');
  protected readonly demoTooltipVariant = signal<LwTooltipVariant>('dark');
  protected readonly demoTooltipSize = signal<LwTooltipSize>('md');
  protected readonly demoTooltipWithTitle = signal(true);

  // Card demo state
  protected readonly cardSelected = signal(false);
  protected readonly sampleCardItem = SAMPLE_CARD_ITEM;

  // ── Button Demo States ──
  protected readonly buttonLoading = signal(false);
  protected readonly buttonDisabled = signal(false);
  protected readonly buttonClickCount = signal(0);
  protected readonly buttonLastAction = signal<string | null>(null);

  protected onButtonClick(label: string): void {
    this.buttonClickCount.update(c => c + 1);
    this.buttonLastAction.set(label);
    this.feedbackService.showInfo(`버튼 클릭: ${label}`);
  }

  protected onButtonActionEvent(event: any): void {
    this.buttonClickCount.update(c => c + 1);
    this.buttonLastAction.set(`ActionEvent: ${event.actionId}`);
    this.feedbackService.showSuccess(`[LwActionEvent] ${event.actionId} 디스패치 성공!`);
  }

  protected triggerDangerConfirm(): void {
    this.feedbackService.confirm({
      title: '삭제 확인',
      message: '정말로 삭제하시겠습니까?',
      detail: '이 작업은 되돌릴 수 없습니다.',
      confirmLabel: '삭제',
      tone: 'danger',
    }).then(ok => {
      this.lastResult.set(ok ? '삭제 승인됨' : '삭제 취소됨');
    });
  }

  protected triggerPrimaryConfirm(): void {
    this.feedbackService.confirm({
      title: '설정 저장',
      message: '변경된 설정을 적용하시겠습니까?',
      confirmLabel: '적용',
      tone: 'default',
    }).then(ok => {
      this.lastResult.set(ok ? '설정 적용됨' : '취소됨');
    });
  }

  protected triggerAlert(): void {
    this.feedbackService.alert({
      title: '시스템 안내',
      message: '시뮬레이션 알림 테스트입니다.',
    }).then(() => {
      this.lastResult.set('알림 확인됨');
    });
  }

  protected readonly selectableDemoItems = SELECTABLE_DEMO_ITEMS;
  protected readonly selectedListId = signal<string>('item-1');

  protected onSelectableListAction(event: any): void {
    if (event?.payload?.id) {
      this.selectedListId.set(event.payload.id);
      this.feedbackService.showInfo(`리스트 아이템 선택: ${event.payload.id}`);
    }
  }
}
