import Authorization from "../pages/Authorization/Authorization"

interface PublicAppProps {
    setAuth: (value: boolean) => void
}

const PublicApp = ({setAuth}: PublicAppProps) => {
  return (
    
    <Authorization setAuth={setAuth}/>
  )
}

export default PublicApp