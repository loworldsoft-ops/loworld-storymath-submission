export function isBrowserFullscreen(doc: Document | null | undefined): boolean {
  if (!doc) return false;
  const d = doc as any;
  return !!(
    d.fullscreenElement ??
    d.webkitFullscreenElement ??
    d.mozFullScreenElement ??
    d.msFullscreenElement
  );
}

export async function toggleBrowserFullscreen(doc: Document | null | undefined): Promise<void> {
  if (!doc) return;
  try {
    const isCurrently = isBrowserFullscreen(doc);
    const d = doc as any;
    if (!isCurrently) {
      const el = doc.documentElement as any;
      if (el?.requestFullscreen) {
        await el.requestFullscreen();
      } else if (el?.webkitRequestFullscreen) {
        await el.webkitRequestFullscreen();
      } else if (el?.mozRequestFullScreen) {
        await el.mozRequestFullScreen();
      } else if (el?.msRequestFullscreen) {
        await el.msRequestFullscreen();
      }
    } else {
      if (d.exitFullscreen) {
        await d.exitFullscreen();
      } else if (d.webkitExitFullscreen) {
        await d.webkitExitFullscreen();
      } else if (d.mozCancelFullScreen) {
        await d.mozCancelFullScreen();
      } else if (d.msExitFullscreen) {
        await d.msExitFullscreen();
      }
    }
  } catch (err) {
    console.warn('전체 화면 전환 실패:', err);
  }
}
