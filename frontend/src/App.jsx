import { Routes, Route } from 'react-router-dom';
import Header from './layout/Header';

import StationPage from './pages/StationPage';
import RoutePage from './pages/RoutePage';
//import FavoritesPage from './pages/FavoritesPage';
import AboutPage from './pages/AboutPage';

export default function App() {
  return (
    <>
      <Header />

      <Routes>
        <Route path="/" element={<StationPage />} />
        <Route path="/station" element={<StationPage />} />
        <Route path="/route" element={<RoutePage />} />
        {/*<Route path="/favorites" element={<FavoritesPage />} />*/}
        <Route path="/about" element={<AboutPage />} />
      </Routes>
    </>
  );
}
