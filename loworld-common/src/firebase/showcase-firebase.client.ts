import { initializeApp, deleteApp, getApp, getApps, type FirebaseApp } from 'firebase/app';
import { browserLocalPersistence, browserSessionPersistence, connectAuthEmulator, getAuth, setPersistence, createUserWithEmailAndPassword, type Auth } from 'firebase/auth';
import { connectFirestoreEmulator, initializeFirestore, setLogLevel, type Firestore } from 'firebase/firestore';

/**
 * Firebase 프로젝트의 설정. 공통은 어느 프로젝트에 붙는지 모른다.
 * 띄우는 쪽(쇼케이스, 단독 실행)이 부팅 전에 `configureLwFirebase`로 넣는다.
 */
export interface LwFirebaseConfig {
  readonly apiKey: string;
  readonly authDomain: string;
  readonly projectId: string;
  readonly appId: string;
  readonly storageBucket?: string;
  readonly messagingSenderId?: string;
  readonly measurementId?: string;
  /** 로컬 에뮬레이터에 붙일 때만 적는다. */
  readonly emulator?: { readonly authUrl: string; readonly firestoreHost: string; readonly firestorePort: number };
}

let firebaseConfig: LwFirebaseConfig | null = null;

export function configureLwFirebase(config: LwFirebaseConfig): void {
  firebaseConfig = config;
}

function requireConfig(): LwFirebaseConfig {
  if (!firebaseConfig) {
    throw new Error('Firebase 설정이 없다. 부팅 전에 configureLwFirebase()를 부른다.');
  }
  return firebaseConfig;
}

function firebaseOptions(): Omit<LwFirebaseConfig, 'emulator'> {
  const { emulator: _emulator, ...options } = requireConfig();
  return options;
}

setLogLevel('error');

let firebaseApp: FirebaseApp | null = null;
let firebaseAuth: Auth | null = null;
let firestoreDb: Firestore | null = null;

export function safeEmailLocalPart(loginId: string): string {
  // If it's ASCII only and matches email local part rules, return lowercase
  if (/^[a-zA-Z0-9_\-\.]+$/.test(loginId)) {
    return loginId.toLowerCase();
  }
  // Convert non-ASCII string (like Korean) to safe hex bytes
  const hex = Array.from(new TextEncoder().encode(loginId))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  return `encoded-${hex}`;
}

export async function createShowcaseAuthUserWithoutSigningOut(email: string, password: string): Promise<string> {
  const secondaryAppName = `Secondary-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
  const secondaryApp = initializeApp(firebaseOptions(), secondaryAppName);
  const secondaryAuth = getAuth(secondaryApp);
  const emulator = requireConfig().emulator;
  if (emulator) connectAuthEmulator(secondaryAuth, emulator.authUrl, { disableWarnings: true });
  try {
    const credential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    return credential.user.uid;
  } finally {
    await deleteApp(secondaryApp);
  }
}

export function getShowcaseFirebaseApp(): FirebaseApp {
  if (firebaseApp) {
    return firebaseApp;
  }

  firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseOptions());
  return firebaseApp;
}

export function getShowcaseFirebaseAuth(): Auth {
  if (firebaseAuth) {
    return firebaseAuth;
  }

  firebaseAuth = getAuth(getShowcaseFirebaseApp());
  const emulator = requireConfig().emulator;
  if (emulator) connectAuthEmulator(firebaseAuth, emulator.authUrl, { disableWarnings: true });
  return firebaseAuth;
}

export function getShowcaseFirestore(): Firestore {
  if (firestoreDb) {
    return firestoreDb;
  }

  // ignoreUndefinedProperties: optional 필드(certificationId·completedAt 등)가 undefined여도
  // setDoc이 거부하지 않도록 한다. (room 시드 실패 → "전체 과제 0" 원인 제거)
  // experimentalForceLongPolling: 브라우저/네트워크가 QUIC(HTTP/3) 기반 WebChannel 스트리밍 연결 시
  // net::ERR_QUIC_PROTOCOL_ERROR.QUIC_TOO_MANY_RTOS 및 400 (Bad Request) 오류를 내며 끊어지는 현상을 방지하기 위해
  // HTTP 롱폴링(Long-Polling) 연결 방식을 강제 적용합니다. (docs/2026-08-06/firestore-quic-protocol-error-resolution-plan.md)
  firestoreDb = initializeFirestore(getShowcaseFirebaseApp(), {
    ignoreUndefinedProperties: true,
    experimentalForceLongPolling: true,
  });
  const emulator = requireConfig().emulator;
  if (emulator) connectFirestoreEmulator(firestoreDb, emulator.firestoreHost, emulator.firestorePort);
  return firestoreDb;
}

export async function applyShowcaseAuthPersistence(rememberMe: boolean | undefined): Promise<void> {
  const auth = getShowcaseFirebaseAuth();
  await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
}