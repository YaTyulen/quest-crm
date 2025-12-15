// import HomeSvg from '../../assets/home.svg';
// import ListSvg from '../../assets/list.svg'
// import ChartSvg from '../../assets/chart.svg'
import LogoutSvg from '../../assets/logout.svg'
import TimeTableSvg from '../../assets/timetable.svg';

import './Sidebar.scss';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { signInSlice } from '../../store/slices';
import { useAppDispatch } from '../../hooks/reduxHooks';

export const Sidebar = () => {
    const navigate = useNavigate();
    const { signOut } = useAuth();
    const { setIsAuth } = signInSlice.actions;
    const dispatch = useAppDispatch();


    const logout = async () => {
        await signOut();
        navigate('/');
        dispatch(setIsAuth(false))
    }

  return (
    <div className="sidebar">
        <ul className='sidebar__links'>
            {/* <li className='sidebar__item' title='Главная' onClick={() => navigate('/home')}>
                <HomeSvg />
            </li>
            <li className='sidebar__item' title='Список игр' onClick={() => navigate('/cliets')}>
                <ListSvg/>
            </li> */}
            <li className='sidebar__item' title='Расписание' onClick={() => navigate('/timetable')}>
                <TimeTableSvg/>
            </li>
            <li className='sidebar__item' title='Моё Расписание' onClick={() => navigate('/myschedule')}>
                <TimeTableSvg/>
            </li>
            {/* <li className='sidebar__item' title='Аналитика' onClick={() => navigate('/analitics')}>
                <ChartSvg/>
            </li> */}
        </ul>
        <ul className='sidebar__links'>
            <li className='sidebar__item' onClick={() => logout()}>
                <LogoutSvg/>
            </li>
        </ul>
    </div>
  );
};
