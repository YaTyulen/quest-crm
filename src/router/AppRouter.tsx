import { Link, Route, Routes } from "react-router-dom"
import Home from "../pages/Home/Home"
import About from "../pages/About/About"
import FormPage from "../pages/FormPage/FormPage"
import { TableClients } from "../components"
import { ClientsList } from "../pages/ClientsList/ClientsList"


const AppRouter = () => {
  return (
    <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/cliets" element={<ClientsList />} />
        <Route path="/analitics" element={<About />} />
        <Route path="/create" element={<FormPage />} />
    </Routes>
  )
}

export default AppRouter