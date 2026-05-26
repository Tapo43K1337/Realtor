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

  // Mirror Telegram's safe-area / content-safe-area insets into CSS variables so
  // fixed UI (tab bar, sticky CTAs, gallery close button) doesn't end up under
  // Telegram's bottom chrome when the Mini App is launched via the "Open" button.
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
    }
  };
  applyInsets();
  tg.onEvent?.('safeAreaChanged', applyInsets);
  tg.onEvent?.('contentSafeAreaChanged', applyInsets);
  tg.onEvent?.('viewportChanged', applyInsets);
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

export function getInitData(): string {
  return tg?.initData ?? '';
}
