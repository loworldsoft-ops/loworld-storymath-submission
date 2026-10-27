import { Injectable } from '@angular/core';
import type { ComponentMeta, OverviewIconId } from '../../services/models/os.types';

type DomainId = ComponentMeta['domain'];

const DOMAIN_LABELS: Record<DomainId, string> = {
  note: 'Note',
  calendar: 'Calendar',
  'homework': 'Homework',
  'novel': 'Novel',
  curriculum: 'Curriculum',
  story: 'Story',
  plan: 'Plan',
  develop: 'Develop',
  common: 'Common',
  db: 'Database',
  showcase: 'Showcase',
};

const DOMAIN_ICONS: Record<DomainId, OverviewIconId> = {
  note: 'note',
  calendar: 'calendar',
  'homework': 'study',
  'novel': 'book',
  curriculum: 'study',
  story: 'book',
  db: 'database',
  plan: 'folder',
  develop: 'builder',
  common: 'tools',
  showcase: 'builder',
};

@Injectable({ providedIn: 'root' })
export class DomainPresentationService {
  getDomainLabel(domain: DomainId): string {
    return DOMAIN_LABELS[domain];
  }

  getDomainIcon(domain: DomainId): OverviewIconId {
    return DOMAIN_ICONS[domain];
  }
}