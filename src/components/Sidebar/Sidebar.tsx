import HomeSvg from '../../assets/home.svg';
import ListSvg from '../../assets/list.svg'
import ChartSvg from '../../assets/chart.svg'
import LogoutSvg from '../../assets/logout.svg'
import TimeTableSvg from '../../assets/timetable.svg';
import UsersSvg from '../../assets/users.svg'
import MySchedulesSvg from '../../assets/my-schedules.svg'

import './Sidebar.scss';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { signInSlice } from '../../store/slices';
import { useAppDispatch, useAppSelector } from '../../hooks/reduxHooks';
import { BASE_PATH } from '../../constants';
import { useEffect, useState } from 'react';
import { getPendingRequests } from '../../utils/scheduleChangeRequests';
import type { ScheduleChangeRequest } from '../../types/scheduleChangeRequest';

export const Sidebar = () => {
    const [changeRequests, setChangeRequests] = useState<ScheduleChangeRequest[]>([]);
    const navigate = useNavigate();
    const { signOut } = useAuth();
    const { setIsAuth } = signInSlice.actions;
    const { role } = useAppSelector((state) => state.signIn);
    const dispatch = useAppDispatch();

    const logout = async () => {
        await signOut();
        navigate('/');
        dispatch(setIsAuth(false))
    }

    useEffect(() => {
        if (role !== 'admin') return;
        getPendingRequests()
          .then(setChangeRequests)
          .catch(console.error);
      }, [role]);

  return (
    <div className="sidebar">
        <ul className='sidebar__links'>
            <li className={changeRequests.length ? 'sidebar__item sidebar__item--baige' : 'sidebar__item'} title='Главная' onClick={() => navigate(`/${BASE_PATH}/home`)}>
                <HomeSvg />
            </li>
            {role === 'admin' && <li className='sidebar__item' title='Список игр' onClick={() => navigate(`/${BASE_PATH}/clients`)}>
                <ListSvg/>
            </li>}
            {role === 'admin' && <li className='sidebar__item' title='Пользователи' onClick={() => navigate(`/${BASE_PATH}/users`)}>
                <UsersSvg/>
            </li>}

            <li className='sidebar__item' title='Расписание' onClick={() => navigate(`/${BASE_PATH}/timetable`)}>
                <TimeTableSvg/>
            </li>
            <li className='sidebar__item' title='Моё Расписание' onClick={() => navigate(`/${BASE_PATH}/myschedule`)}>
                <MySchedulesSvg/>
            </li>
            {role === 'admin' && <li className='sidebar__item' title='Аналитика' onClick={() => navigate(`/${BASE_PATH}/analytics`)}>
                <ChartSvg/>
            </li>}
            
        </ul>
        <ul className='sidebar__links'>
            <li className='sidebar__item' onClick={() => logout()}>
                <LogoutSvg/>
            </li>
        </ul>
    </div>
  );
};
