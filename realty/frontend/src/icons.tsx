import type { SVGProps } from 'react';

const base = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

export const IconHome = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/></svg>
);
export const IconSearch = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
);
export const IconMap = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14"/><path d="M15 6v14"/></svg>
);
export const IconHeart = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
);
export const IconHeartFilled = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} fill="currentColor" {...p}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
);
export const IconUser = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a7 7 0 0 1 14 0v1"/></svg>
);
export const IconBack = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}><path d="M15 18l-6-6 6-6"/></svg>
);
export const IconShare = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}><path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7"/><path d="M16 6l-4-4-4 4"/><path d="M12 2v14"/></svg>
);
export const IconPlus = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}><path d="M12 5v14M5 12h14"/></svg>
);
export const IconClose = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}><path d="M18 6L6 18M6 6l12 12"/></svg>
);
export const IconFilter = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}><path d="M3 6h18M6 12h12M10 18h4"/></svg>
);
export const IconPhone = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
);
export const IconTelegram = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}><path d="M22 3L2 11l7 2 2 7 3-4 5 4 3-17z"/></svg>
);
export const IconCalendar = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>
);
export const IconCheck = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}><path d="M20 6L9 17l-5-5"/></svg>
);
export const IconDashboard = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>
);
export const IconImage = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/></svg>
);
export const IconBed = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}><path d="M3 18v-7a2 2 0 0 1 2-2h11a4 4 0 0 1 4 4v5"/><path d="M3 14h18"/></svg>
);
export const IconArea = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}><path d="M4 4h6v6M14 14h6v6M4 14v6h6M14 4h6v6"/></svg>
);
export const IconFloor = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}><path d="M3 7h18M3 12h18M3 17h18"/></svg>
);
export const IconPin = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}><path d="M12 22s8-7.5 8-13a8 8 0 1 0-16 0c0 5.5 8 13 8 13z"/><circle cx="12" cy="9" r="3"/></svg>
);
export const IconTrash = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
);
