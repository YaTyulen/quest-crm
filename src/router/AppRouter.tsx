import { Route, Routes } from 'react-router-dom';
import Home from '../pages/Home/Home';
import Analytics from '../pages/Analytics/Analytics';
import FormPage from '../pages/FormPage/FormPage';
import { ClientsList } from '../pages/ClientsList/ClientsList';
import { ScheduleGrid } from '../pages/Schedule/ScheduleGrid';
import { MySchedule } from '../components/MySchedule/MySchedule';
import UsersPage from '../pages/UsersPage/UsersPage';
import EditPage from '../pages/EditPage/EditPage';
import PrivateRoute from './PrivateRoute';
import { BASE_PATH } from '../constants';


const AppRouter = () => {
  return (
    <Routes>
      <Route path={`/${BASE_PATH}`} element={<Home />} />
      <Route path={`/${BASE_PATH}/home`} element={<Home />} />
      <Route
        path={`/${BASE_PATH}/clients`}
        element={
          <PrivateRoute allowedRoles={['admin']}>
            <ClientsList />
          </PrivateRoute>
        }
      />
      <Route
        path={`/${BASE_PATH}/analytics`}
        element={
          <PrivateRoute allowedRoles={['admin']}>
            <Analytics />
          </PrivateRoute>
        }
      />
      <Route
        path={`/${BASE_PATH}/users`}
        element={
          <PrivateRoute allowedRoles={['admin']}>
            <UsersPage />
          </PrivateRoute>
        }
      />
      <Route path={`/${BASE_PATH}/create`} element={<FormPage />} />
      <Route
        path={`/${BASE_PATH}/edit/:id`}
        element={
          <PrivateRoute allowedRoles={['admin']}>
            <EditPage />
          </PrivateRoute>
        }
      />
      <Route path={`/${BASE_PATH}/timetable`} element={<ScheduleGrid />} />
      <Route path={`/${BASE_PATH}/myschedule`} element={<MySchedule />} />
    </Routes>
  );
};

export default AppRouter;
