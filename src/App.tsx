// import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
import { useState } from 'react'
import './App.css'
import PrivateApp from './layout/PrivateApp'
import PublicApp from './layout/PublicApp'

function App() {
  const [isAuth, setAuth] = useState<boolean>(false)

  return (
    isAuth ? <PrivateApp/> : <PublicApp/>
  )
}

export default App
