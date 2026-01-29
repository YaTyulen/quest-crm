import React from 'react';
import './TableClients.scss';
import { formatDate } from '../../utils/formatDate';
import { useClientsData } from '../../hooks/useClientsData';

export const TableClients: React.FC = () => {
  const { clients } = useClientsData()

  return (
    <div className="table-container">
      <table className="table-template">
        <thead>
          <tr>
            <th>Имя</th>
            <th>Телефон</th>
            <th>Квест</th>
            <th>Дата</th>
            <th>Игроки</th>
            <th>Стоимость</th>
            <th>Наличные</th>
            <th>Комментарий</th>
          </tr>
        </thead>
        <tbody>
          {clients.map((client) => (
            <tr key={client.id}>
              <td>
                <div className="client-name">{client.name}</div>
              </td>
              <td>
                <a href={`tel:${client.phone}`} className="phone-link">
                  {client.phone}
                </a>
              </td>
              <td>
                <span className="quest-badge">{client.quest}</span>
              </td>
              <td className="date-cell">
                {formatDate(Number(client.data) / 1000)}
              </td>
              <td className="count-cell">
                <span className="count-badge">{client.count}</span>
              </td>
              <td className="price-cell">
                {client.piece.toLocaleString('ru-RU')} ₽
              </td>
              <td className={client.isCash === 'true' ? 'cash-yes' : 'cash-no'}>
                {client.isCash === 'true' ? 'Да' : 'Нет'}
              </td>
              <td className="note-cell">
                {client.note || <span className="no-note">—</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};