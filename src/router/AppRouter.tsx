import { Navigate, Route, Routes } from 'react-router-dom';
import Home from '../pages/Home/Home';
import ProfilePage from '../pages/ProfilePage/ProfilePage';
import Analytics from '../pages/Analytics/Analytics';
import FormPage from '../pages/FormPage/FormPage';
import { ClientsList } from '../pages/ClientsList/ClientsList';
import { ScheduleGrid } from '../pages/Schedule/ScheduleGrid';
import UsersPage from '../pages/UsersPage/UsersPage';
import QuestsPage from '../pages/QuestsPage/QuestsPage';
import BookingsPage from '../pages/Bookings/BookingsPage';
import NotificationsPage from '../pages/NotificationsPage/NotificationsPage';
import QuestGridPage from '../pages/Bookings/QuestGridPage';
import EditPage from '../pages/EditPage/EditPage';
import PrivateRoute from './PrivateRoute';
import { BASE_PATH } from '../constants';


const AppRouter = () => {
  return (
    <Routes>
      <Route path={`/${BASE_PATH}`} element={<Navigate to={`/${BASE_PATH}/home`} replace />} />
      <Route path={`/${BASE_PATH}/home`} element={<Home />} />
      <Route path={`/${BASE_PATH}/profile`} element={<ProfilePage />} />
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
      <Route path={`/${BASE_PATH}/quests`} element={<PrivateRoute allowedRoles={["admin"]}><QuestsPage /></PrivateRoute>} />
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
      <Route path={`/${BASE_PATH}/myschedule`} element={<Navigate to={`/${BASE_PATH}/timetable`} replace />} />
      <Route path={`/${BASE_PATH}/bookings`} element={<PrivateRoute allowedRoles={['admin']}><BookingsPage /></PrivateRoute>} />
      <Route path={`/${BASE_PATH}/notifications`} element={<PrivateRoute allowedRoles={['admin']}><NotificationsPage /></PrivateRoute>} />
      <Route path={`/${BASE_PATH}/quest-grid`} element={<QuestGridPage />} />
      <Route path="*" element={<Navigate to={`/${BASE_PATH}/home`} replace />} />
    </Routes>
  );
};

export default AppRouter;
