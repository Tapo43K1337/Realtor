import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import type { Property } from '../types';
import { IconClose } from '../icons';

export function GalleryScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [p, setP] = useState<Property | null>(null);
  const [idx, setIdx] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  useEffect(() => {
    api.getProperty(Number(id)).then((r) => setP(r.property)).catch(() => setP(null));
  }, [id]);

  // While the gallery is open, hide the bottom tab bar so the photo gets the
  // full screen. Restored when this component unmounts.
  useEffect(() => {
    const cls = 'gallery-open';
    document.body.classList.add(cls);
    return () => document.body.classList.remove(cls);
  }, []);

  if (!p) return null;
  if (p.photos.length === 0) {
    return (
      <div className="gallery-overlay">
        <div className="top">
          <button className="close" onClick={() => navigate(-1)}><IconClose/></button>
          <div>Немає фото</div>
          <div style={{ width: 34 }}/>
        </div>
      </div>
    );
  }

  const next = () => setIdx((i) => (i + 1) % p.photos.length);
  const prev = () => setIdx((i) => (i - 1 + p.photos.length) % p.photos.length);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null || touchStartY.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    touchStartX.current = null;
    touchStartY.current = null;
    // Horizontal swipe wins only if it's clearly more horizontal than vertical
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx < 0) next();
      else prev();
    }
  };

  const ph = p.photos[idx];
  return (
    <div className="gallery-overlay">
      <div className="top">
        <button className="close" onClick={() => navigate(-1)} aria-label="close"><IconClose/></button>
        <div style={{ fontSize: 13 }}>{idx + 1} / {p.photos.length}</div>
        <div style={{ width: 34 }}/>
      </div>
      <div
        className="image-area"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* Tap zones: left half = prev, right half = next */}
        <div className="tap-zone left" onClick={prev} aria-label="previous photo"/>
        <div className="tap-zone right" onClick={next} aria-label="next photo"/>
        <img src={ph.url} alt=""/>
      </div>
      <div className="thumbs">
        {p.photos.map((ph2, i) => (
          <img key={ph2.id}
               src={ph2.thumb_url ?? ph2.url}
               onClick={() => setIdx(i)}
               style={{
                 width: 64, height: 64, objectFit: 'cover', borderRadius: 8, flexShrink: 0,
                 opacity: i === idx ? 1 : 0.55, border: i === idx ? '1.5px solid #fff' : 'none',
               }}
               alt=""
          />
        ))}
      </div>
    </div>
  );
}
