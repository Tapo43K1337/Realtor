// Lightweight wrapper around Telegram WebApp SDK.

type Tg = {
  initData: string;
  initDataUnsafe: any;
  colorScheme: 'light' | 'dark';
  themeParams: Record<string, string>;
  ready(): void;
  expand(): void;
  close(): void;
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
