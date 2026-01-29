import React, { useEffect } from 'react';
import './TableClients.scss';
import { formatDate } from '../../utils/formatDate';
import { useClientsData } from '../../hooks/useClientsData';
import { useDispatch } from 'react-redux';
import { recordClientSlice } from '../../store/slices';

export const TableClients: React.FC = () => {
  const { clients } = useClientsData()
  const dispatch = useDispatch();
  const { clearRecordClient } = recordClientSlice.actions;

  useEffect(() => {
    dispatch(clearRecordClient()) // очищаем хранилище
  }, [])

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
              <td data-label="Имя">
                <div className="client-name">{client.name}</div>
              </td>

              <td data-label="Телефон">
                <a href={`tel:${client.phone}`} className="phone-link">
                  {client.phone}
                </a>
              </td>

              <td data-label="Квест">
                <span className="quest-badge">{client.quest}</span>
              </td>

              <td data-label="Дата" className="date-cell">
                {formatDate(Number(client.data) / 1000)}
              </td>

              <td data-label="Игроки" className="count-cell">
                <span className="count-badge">{client.count}</span>
              </td>

              <td data-label="Стоимость" className="price-cell">
                {client.piece.toLocaleString('ru-RU')} ₽
              </td>

              <td
                data-label="Наличные"
                className={client.isCash === 'true' ? 'cash-yes' : 'cash-no'}
              >
                {client.isCash === 'true' ? 'Да' : 'Нет'}
              </td>

              <td data-label="Комментарий" className="note-cell">
                {client.note || <span className="no-note">—</span>}
              </td>
            </tr>
          ))}
        </tbody>

      </table>
    </div>
  );
};