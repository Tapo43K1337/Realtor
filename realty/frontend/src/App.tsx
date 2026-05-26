import { useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { SessionProvider, useSession, applyTelegramTheme } from './session';
import { BottomTabs, Loading, ToastHost } from './components';
import { FeedScreen } from './screens/Feed';
import { DetailScreen } from './screens/Detail';
import { GalleryScreen } from './screens/Gallery';
import { FiltersScreen } from './screens/Filters';
import { MapScreen } from './screens/Map';
import { FavoritesScreen } from './screens/Favorites';
import { ProfileScreen } from './screens/Profile';
import { DashboardScreen } from './screens/Dashboard';
import { PropertyEditScreen } from './screens/PropertyEdit';
import { LeadsScreen } from './screens/Leads';
import { BookViewingScreen } from './screens/BookViewing';
import { tg } from './tg';

function Shell() {
  const { loading, session } = useSession();
  const loc = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    applyTelegramTheme();
  }, []);

  // Telegram BackButton sync
  useEffect(() => {
    if (!tg) return;
    if (loc.pathname === '/' || loc.pathname === '/map' || loc.pathname === '/favorites'
        || loc.pathname === '/profile' || loc.pathname === '/dashboard') {
      tg.BackButton.hide();
    } else {
      tg.BackButton.show();
    }
    const onBack = () => navigate(-1);
    tg.BackButton.onClick(onBack);
    return () => { tg?.BackButton.offClick(onBack); };
  }, [loc.pathname, navigate]);

  // Deep-link: ?start=property_42 — open property
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const start = params.get('start') ?? params.get('tgWebAppStartParam');
    if (start?.startsWith('property_')) {
      const id = start.replace('property_', '');
      navigate(`/property/${id}`, { replace: true });
    }
  }, [navigate]);

  if (loading) return <Loading/>;
  const role = session?.user.role;

  const showTabs = !['/gallery', '/book', '/edit', '/filters'].some((p) => loc.pathname.startsWith(p));

  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<FeedScreen/>}/>
        <Route path="/property/:id" element={<DetailScreen/>}/>
        <Route path="/property/:id/gallery" element={<GalleryScreen/>}/>
        <Route path="/filters" element={<FiltersScreen/>}/>
        <Route path="/map" element={<MapScreen/>}/>
        <Route path="/favorites" element={<FavoritesScreen/>}/>
        <Route path="/profile" element={<ProfileScreen/>}/>
        <Route path="/book/:propertyId" element={<BookViewingScreen/>}/>
        {role === 'realtor' && <>
          <Route path="/dashboard" element={<DashboardScreen/>}/>
          <Route path="/edit/new" element={<PropertyEditScreen/>}/>
          <Route path="/edit/:id" element={<PropertyEditScreen/>}/>
          <Route path="/leads" element={<LeadsScreen/>}/>
        </>}
      </Routes>
      {showTabs && <BottomTabs/>}
      <ToastHost/>
    </div>
  );
}

export function App() {
  return (
    <SessionProvider>
      <Shell/>
    </SessionProvider>
  );
}
