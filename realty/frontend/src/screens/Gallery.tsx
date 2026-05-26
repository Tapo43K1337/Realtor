import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import type { Property } from '../types';
import { IconClose } from '../icons';

export function GalleryScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [p, setP] = useState<Property | null>(null);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    api.getProperty(Number(id)).then((r) => setP(r.property)).catch(() => setP(null));
  }, [id]);

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

  const ph = p.photos[idx];
  return (
    <div className="gallery-overlay">
      <div className="top">
        <button className="close" onClick={() => navigate(-1)}><IconClose/></button>
        <div style={{ fontSize: 13 }}>{idx + 1} / {p.photos.length}</div>
        <div style={{ width: 34 }}/>
      </div>
      <div className="image-area" onClick={() => setIdx((i) => (i + 1) % p.photos.length)}>
        <img src={ph.url} alt=""/>
      </div>
      <div style={{ display: 'flex', gap: 6, padding: '8px 12px env(safe-area-inset-bottom)', overflowX: 'auto' }}>
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
