import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TableClients } from '../../components';
import { Button } from '../../components/ui-kit';
import { useClientsData } from '../../hooks/useClientsData';
import './ClientsList.scss';
import { BASE_PATH } from '../../constants';

export const ClientsList = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed'>('upcoming');
  const { upcoming, completed, loading } = useClientsData();

  return (
    <div className="clients-page">
      <div className="clients-page__header">
        <Button onClick={() => navigate(`/${BASE_PATH}/create`)}>Добавить запись</Button>
        <div className="clients-page__tabs">
          <button
            className={`clients-page__tab${activeTab === 'upcoming' ? ' clients-page__tab--active' : ''}`}
            onClick={() => setActiveTab('upcoming')}
          >
            Предстоящие
          </button>
          <button
            className={`clients-page__tab${activeTab === 'completed' ? ' clients-page__tab--active' : ''}`}
            onClick={() => setActiveTab('completed')}
          >
            Прошедшие
          </button>
        </div>
      </div>
      {loading ? (
        <p>Загрузка...</p>
      ) : (
        <TableClients
          clients={activeTab === 'upcoming' ? upcoming : completed}
          variant={activeTab}
        />
      )}
    </div>
  );
};
