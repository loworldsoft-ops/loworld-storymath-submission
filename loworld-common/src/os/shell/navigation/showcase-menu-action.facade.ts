import { Injectable, inject, type WritableSignal } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class ShowcaseMenuActionFacade {
  private readonly router = inject(Router);

  selectNoteComponent(selectedMenu: WritableSignal<string>, id: string): void {
    this.navigateToComponent(selectedMenu, 'components', id);
  }

  selectShowcaseComponent(selectedMenu: WritableSignal<string>, id: string): void {
    this.navigateToComponent(selectedMenu, 'showcase-components', id);
  }

  private navigateToComponent(selectedMenu: WritableSignal<string>, routeTab: string, id: string): void {
    selectedMenu.set(id);
    const prefix = this.router.url.startsWith('/overview') ? '/overview' : '';
    void this.router.navigate([`${prefix}/${routeTab}`, id]);
  }
}