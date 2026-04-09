import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav>
      <Link to="/">Главная</Link> | 
      <Link to="/station">По станции</Link> | 
      <Link to="/route">Маршрут</Link> | 
      <Link to="/about">О сайте</Link>
    </nav>
  );
}