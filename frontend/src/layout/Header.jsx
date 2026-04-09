import { NavLink } from 'react-router-dom';

export default function Header() {
  const navItems = [
    { to: '/', label: 'По станции' },
    { to: '/route', label: 'Маршрут' },
    { to: '/about', label: 'О сайте' }
  ];

  return (
    <header className="header">
      <div className="header-brand">
        <div className="header-title">Прибывалка.Электрички</div>
        <div className="header-subtitle">Расписание пригородных поездов</div>
      </div>

      <nav className="nav" aria-label="Основная навигация">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
