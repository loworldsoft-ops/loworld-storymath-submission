import { deleteDoc, doc, getDoc, setDoc, type Firestore } from 'firebase/firestore';

/**
 * 로그인 아이디로 이메일을 찾는 색인이다(`memberLoginIds/{로그인 아이디}`).
 * 로그인하기 전에 아이디를 이메일로 바꿔야 하는데, 그러려고 회원 목록(`members`)을 누구나 읽게 열어 둘 수는 없다.
 * 이 색인은 문서 하나를 아이디로 집어 읽는 것만 되고 목록은 읽지 못한다(보안 규칙). 들어 있는 것은 이메일과 uid뿐이다.
 */
const COLLECTION = 'memberLoginIds';
const keyOf = (loginId: string) => loginId.trim().toLowerCase();

export async function readLoginIndex(firestore: Firestore, loginId: string): Promise<string | null> {
  const key = keyOf(loginId);
  if (!key || key.includes('/')) return null;
  try {
    const snapshot = await getDoc(doc(firestore, COLLECTION, key));
    const email = snapshot.exists() ? (snapshot.data() as { email?: string }).email : undefined;
    return email || null;
  } catch (error) {
    console.warn('[readLoginIndex] 로그인 아이디 색인을 읽지 못했습니다:', error);
    return null;
  }
}


/** 회원 문서를 만들거나 고칠 때 함께 부른다. 색인을 쓰지 못해도 회원 문서의 저장은 실패로 치지 않는다. */
export async function writeLoginIndex(firestore: Firestore, loginId: string | undefined, email: string | undefined, uid: string): Promise<void> {
  const key = keyOf(loginId ?? '');
  if (!key || key.includes('/') || !email) return;
  try {
    // 이미 맞게 들어 있으면 쓰지 않는다. 읽기는 누구나 되고 싸다.
    const current = await getDoc(doc(firestore, COLLECTION, key));
    if (current.exists() && (current.data() as { email?: string; uid?: string }).email === email && (current.data() as { uid?: string }).uid === uid) return;
    await setDoc(doc(firestore, COLLECTION, key), { email, uid });
  } catch (error) {
    console.warn('로그인 아이디 색인을 쓰지 못했다:', error);
  }
}

export async function removeLoginIndex(firestore: Firestore, loginId: string | undefined): Promise<void> {
  const key = keyOf(loginId ?? '');
  if (!key || key.includes('/')) return;
  try {
    await deleteDoc(doc(firestore, COLLECTION, key));
  } catch (error) {
    console.warn('로그인 아이디 색인을 지우지 못했다:', error);
  }
}
