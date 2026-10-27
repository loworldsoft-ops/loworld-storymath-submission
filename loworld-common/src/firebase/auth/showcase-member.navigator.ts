import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ShowcaseMemberNavigator {
  goToAppMain(): void {
    const target = `${window.location.origin}/db-console`;
    window.location.assign(target);
  }
}