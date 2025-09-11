import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import type firebase from 'firebase/compat/app';

import './TableClients.scss';
import { formatDate } from '../../utils/formatDate';

type Client = {
  id: string;
  name: string;
  phone: string;
  quest: string;
  data: string;
  count: number;
  piece: number;
  isCash: string;
  note: string;
};

export const TableClients: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'clients'));
        console.log(querySnapshot);

        const clientsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Client[];

        setClients(clientsData);
      } catch (error) {
        console.error('Ошибка при загрузке клиентов:', error);
      }
    };

    fetchClients();
  }, []);

  return (
    <table
      className='table-template'
      border={1}
      cellPadding={8}
      cellSpacing={0}
    >
      <thead>
        <tr>
          <th>Имя</th>
          <th>Телефон</th>
          <th>Квест</th>
          <th>Дата</th>
          <th>Количество игроков</th>
          <th>Стоимость</th>
          <th>Наличные?</th>
          <th>Комментарий</th>
        </tr>
      </thead>
      <tbody>
        {clients.map((client) => (
          <tr key={client.id}>
            <td>{client.name}</td>
            <td>{client.phone}</td>
            <td>{client.quest}</td>
            <td>{formatDate(Number(client.data))}</td>
            <td>{client.count}</td>
            <td>{client.piece}</td>
            <td>{client.isCash === 'true' ? 'Да' : 'Нет'}</td>
            <td>{client.note}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
