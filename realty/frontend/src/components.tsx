import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { IconBack, IconHome, IconSearch, IconMap, IconHeart, IconUser, IconDashboard } from './icons';
import { useSession } from './session';

export function Header({
  title, sub, onBack, right, over,
}: {
  title?: string; sub?: string; onBack?: () => void; right?: ReactNode; over?: boolean;
}) {
  const navigate = useNavigate();
  return (
    <header className={`tg-head ${over ? 'over' : ''}`}>
      <button className="tg-back" onClick={onBack ?? (() => navigate(-1))} aria-label="back">
        <IconBack/>
      </button>
      <div className="tg-title">
        {title}
        {sub && <span className="sub">{sub}</span>}
      </div>
      <div style={{ minWidth: 34 }}>{right}</div>
    </header>
  );
}

export function BottomTabs() {
  const navigate = useNavigate();
  const loc = useLocation();
  const { session } = useSession();
  const isRealtor = session?.user.role === 'realtor';

  const tabs = [
    { to: '/', label: 'Огляд', icon: <IconHome/>, key: 'home' },
    { to: '/map', label: 'Карта', icon: <IconMap/>, key: 'map' },
    { to: '/favorites', label: 'Обране', icon: <IconHeart/>, key: 'fav' },
    isRealtor
      ? { to: '/dashboard', label: 'Кабінет', icon: <IconDashboard/>, key: 'dash' }
      : { to: '/profile', label: 'Профіль', icon: <IconUser/>, key: 'prof' },
  ];

  return (
    <nav className="tg-tabs">
      {tabs.map((t) => {
        const active =
          t.to === '/' ? loc.pathname === '/' : loc.pathname.startsWith(t.to);
        return (
          <button key={t.key} className={`tg-tab ${active ? 'active' : ''}`} onClick={() => navigate(t.to)}>
            {t.icon}
            <span>{t.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

export function Toast({ msg, onDone }: { msg: string; onDone: () => void }) {
  useEffect(() => {
    const id = setTimeout(onDone, 2400);
    return () => clearTimeout(id);
  }, [onDone]);
  return <div className="toast">{msg}</div>;
}

let toastSetter: ((s: string) => void) | null = null;

export function ToastHost() {
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    toastSetter = setMsg;
    return () => { toastSetter = null; };
  }, []);
  if (!msg) return null;
  return <Toast msg={msg} onDone={() => setMsg(null)}/>;
}

export function showToast(msg: string) {
  toastSetter?.(msg);
}

export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title?: string; children: ReactNode }) {
  if (!open) return null;
  return (
    <>
      <div className="sheet-backdrop" onClick={onClose}/>
      <div className="sheet">
        <div className="sheet-handle"/>
        <div className="sheet-h">
          <div className="t">{title}</div>
          <button className="x" onClick={onClose}>Закрити</button>
        </div>
        <div className="sheet-body">{children}</div>
      </div>
    </>
  );
}

export function Loading() {
  return <div className="center-state"><div className="t">Завантаження…</div></div>;
}

export function Empty({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="center-state">
      <div className="t">{title}</div>
      {sub && <div>{sub}</div>}
    </div>
  );
}
