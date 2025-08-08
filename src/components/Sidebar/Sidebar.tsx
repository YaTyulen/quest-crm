import HomeSvg from '../../assets/home.svg';
import ListSvg from '../../assets/list.svg'
import ChartSvg from '../../assets/chart.svg'
import LogoutSvg from '../../assets/logout.svg'

import './Sidebar.scss'
import { useNavigate } from 'react-router-dom';

export const Sidebar = () => {
    const navigate = useNavigate()
  return (
    <div className="sidebar">
        <ul className='sidebar__links'>
            <li className='sidebar__item' title='Главная' onClick={() => navigate('/home')}>
                <HomeSvg />
            </li>
            <li className='sidebar__item' title='Список игр' onClick={() => navigate('/cliets')}>
                <ListSvg/>
            </li>
            <li className='sidebar__item' title='Аналитика' onClick={() => navigate('/analitics')}>
                <ChartSvg/>
            </li>
        </ul>
        <ul className='sidebar__links'>
            <li className='sidebar__item'>
                <LogoutSvg/>
            </li>
        </ul>
    </div>
  )
}
