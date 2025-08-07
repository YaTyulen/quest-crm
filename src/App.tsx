// import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
import { useState } from 'react'
import './App.scss'
import PrivateApp from './layout/PrivateApp'
import PublicApp from './layout/PublicApp'

function App() {
  const [isAuth, setAuth] = useState<boolean>(true)

  return (
    isAuth ? <PrivateApp/> : <PublicApp setAuth={setAuth}/>
  )
}

export default App
