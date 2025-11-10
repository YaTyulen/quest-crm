import { useNavigate } from "react-router-dom"
import { TableClients } from "../../components"
import { Button } from "../../components/ui-kit"

import './ClientsList.scss'

export const ClientsList = () => {
  const navigate = useNavigate()
  return (
    <div className="clients-page">
        <Button onClick={() => navigate('/create')}>Добавить запись</Button>
        <TableClients/>
    </div>
  )
}
