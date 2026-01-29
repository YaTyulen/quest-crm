import { Route, Routes } from "react-router-dom"
import Home from "../pages/Home/Home"
import Analytics from "../pages/Analytics/Analytics"
import FormPage from "../pages/FormPage/FormPage"
import { ClientsList } from "../pages/ClientsList/ClientsList"
import { ScheduleGrid } from "../pages/Schedule/ScheduleGrid"
import { MySchedule } from "../components/MySchedule/MySchedule"
import { BASE_PATH } from "../constants"


const AppRouter = () => {
  return (
    <Routes>
        <Route path={`/${BASE_PATH}`} element={<Home />} />
        <Route path={`/${BASE_PATH}/home`} element={<Home />} />
        <Route path={`/${BASE_PATH}/clients`} element={<ClientsList />} />
        <Route path={`/${BASE_PATH}/analytics`} element={<Analytics />} />
        <Route path={`/${BASE_PATH}/create`} element={<FormPage />} />
        <Route path={`/${BASE_PATH}/timetable`} element={<ScheduleGrid />}/>
        <Route path={`/${BASE_PATH}/myschedule`} element={<MySchedule />} />
    </Routes>
  );
};

export default AppRouter;
