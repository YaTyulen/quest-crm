import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import HomeSvg from '../../assets/home.svg';
import UsersSvg from '../../assets/users.svg';
import QuestsSvg from '../../assets/quest-key.svg';
import ScheduleSvg from '../../assets/schedule-team.svg';
import BookingsSvg from '../../assets/list.svg';
import QuestGridSvg from '../../assets/calendar.svg';
import LogoSvg from '../../assets/logo.svg';
import { useAuth } from '../../hooks/useAuth';
import { BASE_PATH } from '../../constants';
import { canManage, systemRoleLabels } from '../../utils/permissions';
import './Sidebar.scss';

export const Sidebar = () => {
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem('quest-sidebar-collapsed') === 'true'; }
    catch { return false; }
  });
  const toggle = () => {
    setCollapsed(!collapsed);
    try { localStorage.setItem('quest-sidebar-collapsed', String(!collapsed)); }
    catch { /* Keep navigation usable without storage. */ }
  };
  const items = [
    { path: 'home', label: 'Главная', Icon: HomeSvg },
    { path: 'quest-grid', label: 'Сетка квеста', Icon: QuestGridSvg },
    ...(canManage(user?.systemRole) ? [
      { path: 'bookings', label: 'Бронирования', Icon: BookingsSvg },
      { path: 'users', label: 'Пользователи', Icon: UsersSvg },
      { path: 'quests', label: 'Квесты', Icon: QuestsSvg },
      { path: 'notifications', label: 'Уведомления', Icon: NotificationIcon },
    ] : []),
    { path: 'timetable', label: 'Расписание', Icon: ScheduleSvg },
  ];
  const name = user?.name?.trim() || 'Мой профиль';
  const initials = name.split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase();
  return <aside className={`sidebar${collapsed ? ' sidebar--collapsed' : ''}`} aria-label="Боковая панель">
    <NavLink className="sidebar__brand" to={`/${BASE_PATH}/home`} aria-label="Quest CRM — главная" title="Quest CRM">
      <span className="sidebar__logo" aria-hidden="true"><LogoSvg /></span>
      <span className="sidebar__brand-name">Quest CRM</span>
    </NavLink>
    <button className="sidebar__toggle" onClick={toggle} aria-expanded={!collapsed} aria-controls="sidebar-navigation" aria-label={collapsed ? 'Развернуть сайдбар' : 'Свернуть сайдбар'} title={collapsed ? 'Развернуть сайдбар' : 'Свернуть сайдбар'}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6" /></svg>
    </button>
    <nav id="sidebar-navigation" className="sidebar__navigation" aria-label="Основная навигация">
      <ul className="sidebar__links">{items.map(({ path, label, Icon }) => <li key={path}>
        <NavLink to={`/${BASE_PATH}/${path}`} title={label} aria-label={label} className={({ isActive }) => `sidebar__link${isActive ? ' sidebar__link--active' : ''}`}>
          <span className="sidebar__icon" aria-hidden="true"><Icon /></span><span className="sidebar__label">{label}</span>
        </NavLink>
      </li>)}</ul>
    </nav>
    <NavLink to={`/${BASE_PATH}/profile`} title="Мой профиль" aria-label="Мой профиль" className={({ isActive }) => `sidebar__profile${isActive ? ' sidebar__profile--active' : ''}`}>
      <span className="sidebar__avatar" aria-hidden="true">{initials}</span>
      <span className="sidebar__profile-info"><span className="sidebar__name">{name}</span><span className="sidebar__role">{user && systemRoleLabels[user.systemRole]}</span></span>
      <span className="sidebar__profile-arrow" aria-hidden="true">›</span>
    </NavLink>
  </aside>;
};

function NotificationIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8a6 6 0 0 0-12 0c0 7-2 8-2 8h16s-2-1-2-8M10 20a2 2 0 0 0 4 0" />
  </g></svg>;
}
