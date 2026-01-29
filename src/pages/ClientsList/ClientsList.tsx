import { useNavigate } from "react-router-dom"
import { TableClients } from "../../components"
import { Button } from "../../components/ui-kit"

import './ClientsList.scss'
import { BASE_PATH } from "../../constants"

export const ClientsList = () => {
  const navigate = useNavigate()
  return (
    <div className="clients-page">
        <Button onClick={() => navigate(`/${BASE_PATH}/create`)}>Добавить запись</Button>
        <TableClients/>
    </div>
  )
}
