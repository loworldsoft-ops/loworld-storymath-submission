import type { PlanFunctionalSpec, PlanItemStatus, PlanProject, PlanWbsNode, PlanWbsNodeKind } from '../models/strategy.model';

export type PlanMainView = 'guide' | 'pillar' | 'wbs' | 'specs';

/** 기능정의서 탭용 — WBS에서 spec이 있는 노드만 평면화 */
export interface PlanSpecListEntry {
  wbsNodeId: string;
  wbsPath: string;
  nodeKind: PlanWbsNodeKind;
  status?: PlanItemStatus;
  spec: PlanFunctionalSpec;
}

export interface PlanWbsValidationIssue {
  projectId: string;
  code: string;
  message: string;
}

export interface FlatWbsRow {
  node: PlanWbsNode;
  depth: number;
  hasChildren: boolean;
  expanded: boolean;
}

function nodeMatchesQuery(node: PlanWbsNode, q: string): boolean {
  if (node.title.toLowerCase().includes(q)) {
    return true;
  }
  if (node.spec?.id.toLowerCase().includes(q)) {
    return true;
  }
  if (node.spec?.title.toLowerCase().includes(q)) {
    return true;
  }
  return false;
}

function collectMatchingIds(nodes: readonly PlanWbsNode[], q: string): Set<string> {
  const matches = new Set<string>();

  const walk = (list: readonly PlanWbsNode[]): boolean => {
    let subtreeMatch = false;
    for (const node of list) {
      const childMatch = node.children?.length ? walk(node.children) : false;
      const selfMatch = nodeMatchesQuery(node, q);
      if (selfMatch || childMatch) {
        matches.add(node.id);
        subtreeMatch = true;
      }
    }
    return subtreeMatch;
  };

  walk(nodes);
  return matches;
}

function flattenVisible(
  nodes: readonly PlanWbsNode[],
  depth: number,
  collapsedIds: ReadonlySet<string>,
  visibleIds: ReadonlySet<string> | null,
  out: FlatWbsRow[],
): void {
  for (const node of nodes) {
    if (visibleIds && !visibleIds.has(node.id)) {
      continue;
    }
    const children = node.children ?? [];
    const hasChildren = children.length > 0;
    const expanded = hasChildren && !collapsedIds.has(node.id);
    out.push({ node, depth, hasChildren, expanded });
    if (expanded) {
      flattenVisible(children, depth + 1, collapsedIds, visibleIds, out);
    }
  }
}

export function flattenWbsNodes(
  nodes: readonly PlanWbsNode[],
  collapsedIds: ReadonlySet<string>,
  filterQuery?: string,
): FlatWbsRow[] {
  const q = filterQuery?.trim().toLowerCase();
  const visibleIds = q ? collectMatchingIds(nodes, q) : null;
  const rows: FlatWbsRow[] = [];
  flattenVisible(nodes, 0, collapsedIds, visibleIds, rows);
  return rows;
}

export function findWbsNodeById(nodes: readonly PlanWbsNode[], id: string): PlanWbsNode | null {
  for (const node of nodes) {
    if (node.id === id) {
      return node;
    }
    if (node.children?.length) {
      const found = findWbsNodeById(node.children, id);
      if (found) {
        return found;
      }
    }
  }
  return null;
}

function collectWbsNodes(nodes: readonly PlanWbsNode[], out: PlanWbsNode[]): void {
  for (const node of nodes) {
    out.push(node);
    if (node.children?.length) {
      collectWbsNodes(node.children, out);
    }
  }
}

export function validatePlanWbsIntegrity(projects: readonly PlanProject[]): PlanWbsValidationIssue[] {
  const issues: PlanWbsValidationIssue[] = [];

  for (const project of projects) {
    const itemIds = new Set(project.pillars.flatMap((pillar) => pillar.items.map((item) => item.id)));
    const wbsNodes: PlanWbsNode[] = [];
    if (project.wbs?.length) {
      collectWbsNodes(project.wbs, wbsNodes);
    }
    const wbsIds = new Set(wbsNodes.map((node) => node.id));
    const specIds = new Set<string>();

    for (const node of wbsNodes) {
      if (node.spec) {
        if (specIds.has(node.spec.id)) {
          issues.push({
            projectId: project.id,
            code: 'DUPLICATE_SPEC_ID',
            message: `중복 spec.id: ${node.spec.id}`,
          });
        }
        specIds.add(node.spec.id);
      }

      if (node.linkedItemIds?.length) {
        for (const itemId of node.linkedItemIds) {
          if (!itemIds.has(itemId)) {
            issues.push({
              projectId: project.id,
              code: 'MISSING_LINKED_ITEM',
              message: `linkedItemIds '${itemId}' 없음 (노드 ${node.id})`,
            });
          }
        }
      }
    }

    for (const pillar of project.pillars) {
      for (const item of pillar.items) {
        if (item.wbsNodeId && !wbsIds.has(item.wbsNodeId)) {
          issues.push({
            projectId: project.id,
            code: 'MISSING_WBS_NODE',
            message: `wbsNodeId '${item.wbsNodeId}' 없음 (항목 ${item.id})`,
          });
        }
      }
    }
  }

  return issues;
}

export function collectPlanSpecEntries(
  nodes: readonly PlanWbsNode[],
  parentPath = '',
): PlanSpecListEntry[] {
  const out: PlanSpecListEntry[] = [];
  for (const node of nodes) {
    const pathLabel = parentPath ? `${parentPath} › ${node.title}` : node.title;
    if (node.spec) {
      out.push({
        wbsNodeId: node.id,
        wbsPath: pathLabel,
        nodeKind: node.nodeKind,
        status: node.status,
        spec: node.spec,
      });
    }
    if (node.children?.length) {
      out.push(...collectPlanSpecEntries(node.children, pathLabel));
    }
  }
  return out;
}

export function findWbsNodeIdBySpecId(nodes: readonly PlanWbsNode[], specId: string): string | null {
  for (const entry of collectPlanSpecEntries(nodes)) {
    if (entry.spec.id === specId) {
      return entry.wbsNodeId;
    }
  }
  return null;
}

export function firstSpecListEntry(nodes: readonly PlanWbsNode[]): PlanSpecListEntry | null {
  const entries = collectPlanSpecEntries(nodes);
  return entries[0] ?? null;
}

export function firstSelectableWbsNodeId(nodes: readonly PlanWbsNode[]): string | null {
  for (const node of nodes) {
    if (node.spec || node.nodeKind === 'feature' || node.nodeKind === 'deliverable') {
      return node.id;
    }
    if (node.children?.length) {
      const nested = firstSelectableWbsNodeId(node.children);
      if (nested) {
        return nested;
      }
    }
  }
  return nodes[0]?.id ?? null;
}
