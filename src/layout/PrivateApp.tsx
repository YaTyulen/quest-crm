import { useEffect } from "react";
import { Sidebar } from "../components"
import AppRouter from "../router/AppRouter"
import { useNavigate } from "react-router-dom";
import { BASE_PATH } from "../constants";


const PrivateApp = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // срабатывает только при reload
    if (performance.getEntriesByType('navigation')[0]?.type === 'reload') {
      navigate(`/${BASE_PATH}/home`, { replace: true });
    }
  }, []);


  return (
    <div className="private-layout">
        {/** Сайдбар и тип того, а в содержательной части - роутер */}
        <Sidebar/>
        <div className="page-container">
          <AppRouter/>
        </div>
        

    </div>
    
  )
}

export default PrivateApp