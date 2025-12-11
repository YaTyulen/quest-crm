// components/ScheduleGrid/UserAvailabilityModal.tsx
import React from 'react';
import './UserAvailabilityModal.css';
import type { AvailabilityInfo } from '../../types/schedule';

interface UserAvailabilityModalProps {
  date: string;
  time: string;
  availableUsers: AvailabilityInfo[];
  onClose: () => void;
}

export const UserAvailabilityModal: React.FC<UserAvailabilityModalProps> = ({
  date,
  time,
  availableUsers,
  onClose
}) => {
  const formattedDate = new Date(date).toLocaleDateString('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{formattedDate} в {time}</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          {availableUsers.length > 0 ? (
            <>
              <p className="available-title">
                Могут взять игру ({availableUsers.length}):
              </p>
              <ul className="user-list">
                {availableUsers.map(user => (
                  <li key={user.userId} className="user-item">
                    <span className="user-name">{user.userName}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="no-users-message">
              В это время нет доступных сотрудников
            </p>
          )}
        </div>
      </div>
    </div>
  );
};  