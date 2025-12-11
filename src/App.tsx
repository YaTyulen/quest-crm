import './App.scss'
import PrivateApp from './layout/PrivateApp'
import PublicApp from './layout/PublicApp'
import { useAppSelector } from './hooks/reduxHooks'

function App() {
  const { isAuth } = useAppSelector((state) => state.signIn);

  return (
    isAuth ? <PrivateApp/> : <PublicApp/>
  )
}

export default App
