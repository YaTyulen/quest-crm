import { Route, Routes } from "react-router-dom"
import Home from "../pages/Home/Home"
import Analytics from "../pages/Analytics/Analytics"
import FormPage from "../pages/FormPage/FormPage"
//import { TableClients } from "../components"
import { ClientsList } from "../pages/ClientsList/ClientsList"
import { ScheduleGrid } from "../pages/Schedule/ScheduleGrid"
import { MySchedule } from "../components/MySchedule/MySchedule"


const AppRouter = () => {
  return (
    <Routes>
        <Route path={`/${import.meta.env.VITE_BASE_URL}`} element={<Home />} />
        <Route path={`/${import.meta.env.VITE_BASE_URL}/home`} element={<Home />} />
        <Route path={`/${import.meta.env.VITE_BASE_URL}/clients`} element={<ClientsList />} />
        <Route path={`/${import.meta.env.VITE_BASE_URL}/analytics`} element={<Analytics />} />
        <Route path={`/${import.meta.env.VITE_BASE_URL}/create`} element={<FormPage />} />
        <Route path={`/${import.meta.env.VITE_BASE_URL}/timetable`} element={<ScheduleGrid />}/>
        <Route path={`/${import.meta.env.VITE_BASE_URL}/myschedule`} element={<MySchedule />} />
    </Routes>
  );
};

export default AppRouter;
