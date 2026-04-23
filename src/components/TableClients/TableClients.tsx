import React, { useEffect } from 'react';
import './TableClients.scss';
import { formatDate } from '../../utils/formatDate';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { recordClientSlice } from '../../store/slices';
import type { Client } from '../../types/client';
import { BASE_PATH } from '../../constants';

interface TableClientsProps {
  clients: Client[];
  variant: 'upcoming' | 'completed';
}

export const TableClients: React.FC<TableClientsProps> = ({ clients, variant }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { clearRecordClient } = recordClientSlice.actions;

  useEffect(() => {
    dispatch(clearRecordClient());
  }, []);

  const handleEdit = (id: string) => {
    navigate(`/${BASE_PATH}/edit/${id}`);
  };

  if (variant === 'upcoming') {
    return (
      <div className="table-container">
        <table className="table-template table-template--upcoming">
          <thead>
            <tr>
              <th></th>
              <th>Квест</th>
              <th>Дата</th>
              <th>Оператор</th>
              <th>Актёр</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr key={client.id}>
                <td>
                  <button className="edit-btn" onClick={() => handleEdit(client.id)}>✏</button>
                </td>
                <td data-label="Квест">
                  <span className="quest-badge">{client.quest}</span>
                </td>
                <td data-label="Дата" className="date-cell">
                  {formatDate(Number(client.data) / 1000)}
                </td>
                <td data-label="Оператор">{client.admin || '—'}</td>
                <td data-label="Актёр">{client.actor || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="table-template">
        <thead>
          <tr>
            <th></th>
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
            <tr key={client.id} className={!client.piece ? 'row--incomplete' : ''}>
              <td>
                <button className="edit-btn" onClick={() => handleEdit(client.id)}>✏</button>
              </td>
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
