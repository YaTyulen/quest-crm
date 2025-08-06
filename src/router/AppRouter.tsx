import { Link, Route, Routes } from "react-router-dom"
import Home from "../pages/Home/Home"
import About from "../pages/About/About"


const AppRouter = () => {
  return (
    <>
        <div>

        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
        </Routes>
        </div>

        
    </>
    
  )
}

export default AppRouter