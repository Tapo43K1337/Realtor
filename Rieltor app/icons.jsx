/* global React */
// Icon set — outlined, 24px, stroke-based. Matches iOS aesthetic.

const I = {};

const sw = (path, p = {}) => (
  <svg width={p.s || 22} height={p.s || 22} viewBox="0 0 24 24" fill="none"
    stroke={p.c || 'currentColor'} strokeWidth={p.w || 1.6}
    strokeLinecap="round" strokeLinejoin="round" style={p.style}>
    {path}
  </svg>
);

I.search = (p) => sw(<><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></>, p);
I.close  = (p) => sw(<path d="M6 6l12 12M18 6L6 18"/>, p);
I.back   = (p) => sw(<path d="M15 5l-7 7 7 7"/>, p);
I.chev   = (p) => sw(<path d="M9 5l7 7-7 7"/>, p);
I.chevDown = (p) => sw(<path d="M5 9l7 7 7-7"/>, p);
I.menu   = (p) => sw(<><circle cx="5" cy="12" r="1.2" fill="currentColor"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/><circle cx="19" cy="12" r="1.2" fill="currentColor"/></>, p);
I.heart  = (p) => sw(<path d="M12 20s-7-4.5-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.5-7 10-7 10z"/>, p);
I.heartFill = (p) => (
  <svg width={p?.s || 22} height={p?.s || 22} viewBox="0 0 24 24" fill={p?.c || 'currentColor'} stroke={p?.c || 'currentColor'} strokeWidth="1.2" strokeLinejoin="round">
    <path d="M12 20s-7-4.5-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.5-7 10-7 10z"/>
  </svg>
);
I.share  = (p) => sw(<><path d="M12 4v12"/><path d="M7 9l5-5 5 5"/><path d="M5 16v3a1 1 0 001 1h12a1 1 0 001-1v-3"/></>, p);
I.map    = (p) => sw(<><path d="M9 4l-5 2v14l5-2 6 2 5-2V4l-5 2-6-2z"/><path d="M9 4v14M15 6v14"/></>, p);
I.pin    = (p) => sw(<><path d="M12 22s7-7 7-12a7 7 0 10-14 0c0 5 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/></>, p);
I.home   = (p) => sw(<><path d="M3 11l9-7 9 7"/><path d="M5 10v9a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1v-9"/></>, p);
I.user   = (p) => sw(<><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7"/></>, p);
I.bed    = (p) => sw(<><path d="M3 18v-7h18v7"/><path d="M3 18v2M21 18v2"/><path d="M3 14h18"/><circle cx="7" cy="11" r="2"/></>, p);
I.bath   = (p) => sw(<><path d="M4 12h16v3a4 4 0 01-4 4H8a4 4 0 01-4-4v-3z"/><path d="M6 12V6a2 2 0 012-2h0a2 2 0 012 2v1"/><path d="M4 19l-1 2M20 19l1 2"/></>, p);
I.area   = (p) => sw(<><path d="M4 4h6M4 4v6M20 20h-6M20 20v-6"/><path d="M4 4l16 16"/></>, p);
I.floor  = (p) => sw(<><path d="M4 20h16"/><path d="M4 20V8h6v12"/><path d="M10 14h10v6"/></>, p);
I.car    = (p) => sw(<><path d="M5 11l1.5-4a2 2 0 012-1.4h7a2 2 0 012 1.4L19 11"/><path d="M3 11h18v6h-3v-2H6v2H3v-6z"/><circle cx="7" cy="14" r="1"/><circle cx="17" cy="14" r="1"/></>, p);
I.tag    = (p) => sw(<><path d="M3 12V4h8l10 10-8 8L3 12z"/><circle cx="8" cy="8" r="1.4"/></>, p);
I.filter = (p) => sw(<><path d="M4 6h16M7 12h10M10 18h4"/></>, p);
I.slider = (p) => sw(<><path d="M4 7h16M4 12h16M4 17h16"/><circle cx="9" cy="7" r="2" fill="#fff"/><circle cx="15" cy="12" r="2" fill="#fff"/><circle cx="7" cy="17" r="2" fill="#fff"/></>, p);
I.send   = (p) => sw(<><path d="M21 3L11 14"/><path d="M21 3l-7 18-3-8-8-3 18-7z"/></>, p);
I.phone  = (p) => sw(<path d="M5 4h3l2 5-2 1a11 11 0 006 6l1-2 5 2v3a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z"/>, p);
I.chat   = (p) => sw(<><path d="M21 12a8 8 0 11-3-6.2L21 5l-1 4a8 8 0 011 3z"/></>, p);
I.plus   = (p) => sw(<><path d="M12 5v14M5 12h14"/></>, p);
I.dots   = (p) => sw(<><circle cx="5" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="19" cy="12" r="1" fill="currentColor"/></>, p);
I.eye    = (p) => sw(<><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></>, p);
I.star   = (p) => sw(<path d="M12 3l2.6 5.4 5.9.8-4.3 4.2 1 5.9L12 16.6l-5.2 2.7 1-5.9L3.5 9.2l5.9-.8L12 3z" fill="currentColor" stroke="none"/>, p);
I.starOutline = (p) => sw(<path d="M12 3l2.6 5.4 5.9.8-4.3 4.2 1 5.9L12 16.6l-5.2 2.7 1-5.9L3.5 9.2l5.9-.8L12 3z"/>, p);
I.check  = (p) => sw(<path d="M5 12l5 5L20 6"/>, p);
I.calendar = (p) => sw(<><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></>, p);
I.bell   = (p) => sw(<><path d="M6 16V11a6 6 0 0112 0v5l2 2H4l2-2z"/><path d="M10 20a2 2 0 004 0"/></>, p);
I.expand = (p) => sw(<><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></>, p);
I.balcony = (p) => sw(<><path d="M3 21h18"/><path d="M5 21V11h14v10"/><path d="M5 14h14M5 17h14"/><path d="M9 11V4h6v7"/></>, p);
I.elev = (p) => sw(<><rect x="4" y="3" width="16" height="18" rx="1"/><path d="M12 3v18"/><path d="M7 9l1.5-2 1.5 2M7 15l1.5 2 1.5-2"/><path d="M14 9l1.5-2 1.5 2M14 15l1.5 2 1.5-2"/></>, p);
I.flame = (p) => sw(<path d="M12 3s4 4 4 8a4 4 0 01-8 0c0-2 1-3 1-3s-1 4 2 4 3-3 1-6c0 0 0-2 0-3z"/>, p);
I.shield = (p) => sw(<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z"/>, p);
I.trend = (p) => sw(<><path d="M3 17l6-6 4 4 8-9"/><path d="M14 6h7v7"/></>, p);
I.layers = (p) => sw(<><path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M3 13l9 5 9-5M3 18l9 5 9-5"/></>, p);
I.compass = (p) => sw(<><circle cx="12" cy="12" r="9"/><path d="M15 9l-2 6-4 1 2-6 4-1z" fill="currentColor" stroke="none"/></>, p);

window.I = I;
