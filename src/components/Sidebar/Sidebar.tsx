import HomeSvg from '../../assets/home.svg';
import ListSvg from '../../assets/list.svg'
import ChartSvg from '../../assets/chart.svg'
import LogoutSvg from '../../assets/logout.svg'

import './Sidebar.scss'

export const Sidebar = () => {
  return (
    <div className="sidebar">
        <ul className='sidebar__links'>
            <li className='sidebar__item' title='Главная'>
                <HomeSvg />
            </li>
            <li className='sidebar__item' title='Список игр'>
                <ListSvg/>
                
            </li>
            <li className='sidebar__item' title='Аналитика'>
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
