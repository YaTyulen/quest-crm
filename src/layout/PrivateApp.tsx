import { Sidebar } from "../components"
import AppRouter from "../router/AppRouter"


const PrivateApp = () => {
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