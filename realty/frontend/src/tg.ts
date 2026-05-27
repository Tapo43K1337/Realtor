// Lightweight wrapper around Telegram WebApp SDK.

type Inset = { top: number; bottom: number; left: number; right: number };

type Tg = {
  initData: string;
  initDataUnsafe: any;
  colorScheme: 'light' | 'dark';
  themeParams: Record<string, string>;
  viewportHeight?: number;
  viewportStableHeight?: number;
  safeAreaInset?: Inset;
  contentSafeAreaInset?: Inset;
  ready(): void;
  expand(): void;
  close(): void;
  onEvent?(event: string, cb: () => void): void;
  offEvent?(event: string, cb: () => void): void;
  HapticFeedback: {
    impactOccurred(s: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'): void;
    notificationOccurred(s: 'error' | 'success' | 'warning'): void;
    selectionChanged(): void;
  };
  BackButton: { show(): void; hide(): void; onClick(cb: () => void): void; offClick(cb: () => void): void };
  MainButton: any;
  openTelegramLink(url: string): void;
  openLink(url: string): void;
  shareToStory?: (mediaUrl: string, opts?: any) => void;
  shareMessage?: (msgId: string, cb?: (sent: boolean) => void) => void;
  disableVerticalSwipes?: () => void;
  enableVerticalSwipes?: () => void;
  showAlert(text: string, cb?: () => void): void;
  showConfirm(text: string, cb: (ok: boolean) => void): void;
  showPopup(opts: any, cb?: (id: string) => void): void;
};

declare global {
  interface Window {
    Telegram?: { WebApp: Tg };
  }
}

export const tg: Tg | null = window.Telegram?.WebApp ?? null;

export function tgReady() {
  if (!tg) return;
  tg.ready();
  tg.expand();

  // Stop Telegram from intercepting downward swipes to minimize/close the app.
  // Our screens have their own pull/scroll gestures (bottom sheet on Detail,
  // map pan, lists) that otherwise compete with Telegram's swipe-to-close.
  try { tg.disableVerticalSwipes?.(); } catch { /* older clients */ }

  // Mark that we're running inside Telegram so CSS can add breathing room above
  // and below Telegram's chrome (back/close pill, ⌄ + ⋯ menu, bottom panel).
  document.body.classList.add('in-telegram');

  // Mirror Telegram's safe-area / content-safe-area insets into CSS variables.
  // On older Telegram clients (<8.0) these properties are undefined; we fall
  // back to a sensible default so the WebApp header isn't crammed up against
  // the Telegram chrome.
  const FALLBACK_TOP = 44;   // approx. height of Telegram's top floating pill
  const FALLBACK_BOTTOM = 0; // bottom chrome is only present in some modes
  const applyInsets = () => {
    const root = document.documentElement;
    const sa = tg.safeAreaInset;
    const csa = tg.contentSafeAreaInset;
    if (sa) {
      root.style.setProperty('--tg-safe-top', `${sa.top}px`);
      root.style.setProperty('--tg-safe-bottom', `${sa.bottom}px`);
    }
    if (csa) {
      root.style.setProperty('--tg-content-top', `${csa.top}px`);
      root.style.setProperty('--tg-content-bottom', `${csa.bottom}px`);
    } else {
      // No content-safe-area API available — assume the floating chrome is there
      root.style.setProperty('--tg-content-top', `${FALLBACK_TOP}px`);
      root.style.setProperty('--tg-content-bottom', `${FALLBACK_BOTTOM}px`);
    }
  };
  applyInsets();
  tg.onEvent?.('safeAreaChanged', applyInsets);
  tg.onEvent?.('contentSafeAreaChanged', applyInsets);
  tg.onEvent?.('viewportChanged', applyInsets);
  tg.onEvent?.('fullscreenChanged', applyInsets);
}

export function tgConfirm(text: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (!tg) {
      resolve(window.confirm(text));
      return;
    }
    tg.showConfirm(text, (ok) => resolve(ok));
  });
}

/** Show a custom popup with up to 3 buttons. Resolves to the id of the button clicked,
 *  or null if the user dismissed the popup (e.g. tapped outside) — distinguishing
 *  "Cancel" from "no choice" so callers can avoid destructive defaults. */
export function tgPopup(opts: {
  title?: string;
  message: string;
  buttons: { id: string; type?: 'default' | 'ok' | 'close' | 'cancel' | 'destructive'; text?: string }[];
}): Promise<string | null> {
  return new Promise((resolve) => {
    if (!tg) {
      // Fallback: confirm-style prompt listing options
      const labels = opts.buttons.map((b, i) => `${i + 1}) ${b.text || b.id}`).join('\n');
      const raw = window.prompt(`${opts.message}\n${labels}\n\nВведіть номер:`);
      const n = Number(raw);
      if (!raw || !Number.isFinite(n) || n < 1 || n > opts.buttons.length) {
        resolve(null);
      } else {
        resolve(opts.buttons[n - 1].id);
      }
      return;
    }
    try {
      tg.showPopup(opts, (id?: string) => resolve(id ?? null));
    } catch {
      resolve(null);
    }
  });
}

export function tgAlert(text: string): Promise<void> {
  return new Promise((resolve) => {
    if (!tg) {
      window.alert(text);
      resolve();
      return;
    }
    tg.showAlert(text, () => resolve());
  });
}

export function tgHaptic(kind: 'success' | 'error' | 'warning' | 'tap' = 'tap') {
  if (!tg) return;
  try {
    if (kind === 'tap') tg.HapticFeedback.impactOccurred('light');
    else tg.HapticFeedback.notificationOccurred(kind);
  } catch { /* ignore */ }
}

export function openTelegramChat(username: string, text?: string) {
  const u = username.replace(/^@/, '');
  const url = text
    ? `https://t.me/${u}?text=${encodeURIComponent(text)}`
    : `https://t.me/${u}`;
  if (tg) tg.openTelegramLink(url);
  else window.open(url, '_blank');
}

export function shareViaTelegram(url: string, text: string) {
  const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
  if (tg) tg.openTelegramLink(shareUrl);
  else window.open(shareUrl, '_blank');
}

/** Share a pre-prepared inline message via Telegram's native picker. Returns true
 *  if shareMessage is supported and was invoked; false if not available (caller
 *  should fall back to shareViaTelegram with a plain link). */
export function shareMessage(preparedId: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (!tg?.shareMessage) {
      resolve(false);
      return;
    }
    try {
      tg.shareMessage(preparedId, (sent) => resolve(sent !== false));
    } catch {
      resolve(false);
    }
  });
}

export function getInitData(): string {
  return tg?.initData ?? '';
}
