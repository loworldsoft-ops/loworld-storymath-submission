import '@angular/compiler';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed, getTestBed } from '@angular/core/testing';
import { BrowserTestingModule, platformBrowserTesting } from '@angular/platform-browser/testing';
import { beforeEach } from 'vitest';

getTestBed().initTestEnvironment(BrowserTestingModule, platformBrowserTesting());

// 앱이 zone 없이 돈다. 시험도 같은 방식으로 돌려야 변화 감지가 같은 때에 일어난다.
beforeEach(() => {
  TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
});
