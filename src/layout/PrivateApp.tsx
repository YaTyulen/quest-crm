import { Sidebar } from "../components"
import AppRouter from "../router/AppRouter"


const PrivateApp = () => {
  return (
    <div className="private-layout">
        {/** Сайдбар и тип того, а в содержательной части - роутер */}
        <Sidebar/>
        <AppRouter/>

    </div>
    
  )
}

export default PrivateApp